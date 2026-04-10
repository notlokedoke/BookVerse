/**
 * End-to-End Trade Flow Tests
 * 
 * Task 159: Perform end-to-end testing for complete trade flow
 * 
 * This test suite covers the complete trade lifecycle:
 * 1. Propose trade
 * 2. Communicate (Messages)
 * 3. Complete trade
 * 4. Rate flow
 * 
 * It also thoroughly tests the notification interactions throughout these steps.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Notification = require('../models/Notification');
const connectDB = require('../config/database');
const { clearDatabase, generateRandomEmail, createTestUser, createTestBook, setupTestUsersAndBooks } = require('./test-utils');

describe('E2E Complete Trade Flow Tests', () => {
  let proposer, proposerToken, proposerBook;
  let receiver, receiverToken, receiverBook;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await clearDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Set up proposer
    proposer = await createTestUser({
      name: 'Proposer User',
      email: generateRandomEmail(),
      city: 'Seattle'
    });
    proposerToken = require('../utils/jwt').generateToken(proposer._id);
    proposerBook = await createTestBook(proposer._id, {
      title: 'Proposer Book',
      author: 'Author A',
      genre: 'Fiction',
      condition: 'Good'
    });

    // Set up receiver
    receiver = await createTestUser({
      name: 'Receiver User',
      email: generateRandomEmail(),
      city: 'Portland'
    });
    receiverToken = require('../utils/jwt').generateToken(receiver._id);
    receiverBook = await createTestBook(receiver._id, {
      title: 'Receiver Book',
      author: 'Author B',
      genre: 'Non-Fiction',
      condition: 'Like New'
    });
  });

  test('should complete the full trade lifecycle with notifications and ratings', async () => {
    // -----------------------------------------------------
    // STEP 1: PROPOSE TRADE
    // -----------------------------------------------------
    console.log('Step 1: Proposing trade...');
    const proposeResponse = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${proposerToken}`)
      .send({
        requestedBook: receiverBook._id.toString(),
        offeredBook: proposerBook._id.toString()
      })
      .expect(201);

    expect(proposeResponse.body.success).toBe(true);
    const tradeId = proposeResponse.body.data._id;

    // Verify Notification for Receiver: trade_request
    const receiverNotifs1 = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${receiverToken}`)
      .expect(200);

    expect(receiverNotifs1.body.success).toBe(true);
    const requestNotif = receiverNotifs1.body.data.find(n => n.type === 'trade_request');
    expect(requestNotif).toBeTruthy();
    expect(requestNotif.relatedTrade._id.toString()).toBe(tradeId);
    expect(requestNotif.isRead).toBe(false);

    // Receiver marks notification as read
    const readNotif1 = await request(app)
      .put(`/api/notifications/${requestNotif._id}/read`)
      .set('Authorization', `Bearer ${receiverToken}`)
      .expect(200);
    expect(readNotif1.body.data.isRead).toBe(true);

    // -----------------------------------------------------
    // STEP 2: RECEIVER ACCEPTS TRADE
    // -----------------------------------------------------
    console.log('Step 2: Accepting trade...');
    const acceptResponse = await request(app)
      .put(`/api/trades/${tradeId}/accept`)
      .set('Authorization', `Bearer ${receiverToken}`)
      .expect(200);

    expect(acceptResponse.body.success).toBe(true);
    expect(acceptResponse.body.data.status).toBe('accepted');

    // Verify Notification for Proposer: trade_accepted
    const proposerNotifs1 = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${proposerToken}`)
      .expect(200);

    const acceptNotif = proposerNotifs1.body.data.find(n => n.type === 'trade_accepted');
    expect(acceptNotif).toBeTruthy();
    expect(acceptNotif.relatedTrade._id.toString()).toBe(tradeId);
    
    // Proposer marks all notifications as read
    await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${proposerToken}`)
      .expect(200);

    // -----------------------------------------------------
    // STEP 3: COMMUNICATE (SEND MESSAGES)
    // -----------------------------------------------------
    console.log('Step 3: Communicating...');
    // Proposer sends a message
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${proposerToken}`)
      .send({
        trade: tradeId,
        content: 'Hi! Let us meet tomorrow at the central library.'
      })
      .expect(201);

    // Receiver should get a new_message notification
    const receiverNotifs2 = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${receiverToken}`)
      .expect(200);

    const messageNotif1 = receiverNotifs2.body.data.find(n => n.type === 'new_message');
    expect(messageNotif1).toBeTruthy();
    expect(messageNotif1.isRead).toBe(false);

    // Receiver replies
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${receiverToken}`)
      .send({
        trade: tradeId,
        content: 'Sounds good to me.'
      })
      .expect(201);

    // Proposer should get a new_message notification
    const proposerNotifs2 = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${proposerToken}`)
      .expect(200);

    const messageNotif2 = proposerNotifs2.body.data.find(n => n.type === 'new_message' && n.isRead === false);
    expect(messageNotif2).toBeTruthy();

    // -----------------------------------------------------
    // STEP 4: COMPLETE TRADE
    // -----------------------------------------------------
    console.log('Step 4: Completing trade...');
    // Proposer marks trade as complete
    const completeResponse = await request(app)
      .put(`/api/trades/${tradeId}/complete`)
      .set('Authorization', `Bearer ${proposerToken}`)
      .expect(200);

    expect(completeResponse.body.success).toBe(true);
    expect(completeResponse.body.data.status).toBe('completed');
    expect(completeResponse.body.data.ratingEnabled).toBe(true);

    // Receiver should get a trade_completed notification
    const receiverNotifs3 = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${receiverToken}`)
      .expect(200);

    const completeNotif = receiverNotifs3.body.data.find(n => n.type === 'trade_completed');
    expect(completeNotif).toBeTruthy();

    // -----------------------------------------------------
    // STEP 5: RATE FLOW
    // -----------------------------------------------------
    console.log('Step 5: Submitting ratings...');
    // Receiver rates Proposer
    const receiverRatingRes = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${receiverToken}`)
      .send({
        trade: tradeId,
        stars: 5,
        comment: 'Great trade! Very polite.'
      })
      .expect(201);

    expect(receiverRatingRes.body.success).toBe(true);

    // Proposer rates Receiver with a lower rating requiring a comment
    const proposerRatingRes = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${proposerToken}`)
      .send({
        trade: tradeId,
        stars: 3,
        comment: 'Book condition was slightly worse than described, but okay.'
      })
      .expect(201);

    expect(proposerRatingRes.body.success).toBe(true);

    // -----------------------------------------------------
    // STEP 6: VERIFY FINAL AVERAGES
    // -----------------------------------------------------
    console.log('Step 6: Verifying updated user ratings...');
    
    // Proposer received a 5-star rating from Receiver
    const proposerProfile = await request(app)
      .get(`/api/users/${proposer._id}`)
      .expect(200);
    expect(proposerProfile.body.data.averageRating).toBe(5);
    expect(proposerProfile.body.data.ratingCount).toBe(1);

    // Receiver received a 3-star rating from Proposer
    const receiverProfile = await request(app)
      .get(`/api/users/${receiver._id}`)
      .expect(200);
    expect(receiverProfile.body.data.averageRating).toBe(3);
    expect(receiverProfile.body.data.ratingCount).toBe(1);

    console.log('✓ E2E Complete Trade Flow completed successfully!');
  });
});
