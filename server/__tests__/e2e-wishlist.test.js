/**
 * End-to-End Wishlist Tests
 * 
 * Task 160: Perform end-to-end testing for wishlist
 * 
 * This test suite covers:
 * 1. Wishlist creation
 * 2. Viewing wishlist on profile
 * 3. Wishlist visibility to other users
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Wishlist = require('../models/Wishlist');
const connectDB = require('../config/database');
const { clearDatabase, generateRandomEmail, createTestUser } = require('./test-utils');

describe('E2E Wishlist Tests', () => {
  let userA, userAToken;
  let userB, userBToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await clearDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Set up User A
    userA = await createTestUser({
      name: 'User A',
      email: generateRandomEmail(),
      city: 'Austin'
    });
    userAToken = require('../utils/jwt').generateToken(userA._id);

    // Set up User B
    userB = await createTestUser({
      name: 'User B',
      email: generateRandomEmail(),
      city: 'Dallas'
    });
    userBToken = require('../utils/jwt').generateToken(userB._id);
  });

  test('should complete wishlist creation, viewing on profile, and visibility to other users', async () => {
    // -----------------------------------------------------
    // STEP 1: WISHLIST CREATION
    // -----------------------------------------------------
    console.log('Step 1: User A creating wishlist items...');
    const item1 = {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '9780547928227',
      notes: 'Must be a hardcover'
    };
    
    const createRes1 = await request(app)
      .post('/api/wishlist')
      .set('Authorization', `Bearer ${userAToken}`)
      .send(item1)
      .expect(201);

    expect(createRes1.body.success).toBe(true);
    expect(createRes1.body.data.title).toBe(item1.title);

    const item2 = {
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '9780441172719'
    };

    const createRes2 = await request(app)
      .post('/api/wishlist')
      .set('Authorization', `Bearer ${userAToken}`)
      .send(item2)
      .expect(201);

    expect(createRes2.body.success).toBe(true);

    // Verify it is saved in DB
    const dbItems = await Wishlist.find({ user: userA._id });
    expect(dbItems.length).toBe(2);

    // -----------------------------------------------------
    // STEP 2: VIEWING WISHLIST ON PROFILE (OWNER VIEW)
    // -----------------------------------------------------
    console.log('Step 2: User A viewing their own wishlist...');
    // Owner can view via authenticated endpoint
    const ownerViewRes = await request(app)
      .get('/api/wishlist')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    expect(ownerViewRes.body.success).toBe(true);
    expect(ownerViewRes.body.data.length).toBe(2);
    // Should be sorted by newest first (descending createdAt)
    expect(ownerViewRes.body.data[0].title).toBe(item2.title); // item2 created after item1
    expect(ownerViewRes.body.data[1].title).toBe(item1.title);

    // -----------------------------------------------------
    // STEP 3: WISHLIST VISIBILITY TO OTHER USERS
    // -----------------------------------------------------
    console.log('Step 3: User B viewing User A\'s wishlist...');
    // Other users view via public user endpoint
    const publicViewRes = await request(app)
      .get(`/api/wishlist/user/${userA._id}`)
      .expect(200);

    expect(publicViewRes.body.success).toBe(true);
    expect(publicViewRes.body.count).toBe(2);
    expect(publicViewRes.body.data.length).toBe(2);
    
    // Check populated user details
    expect(publicViewRes.body.data[0].user).toHaveProperty('name', 'User A');
    expect(publicViewRes.body.data[0].user).toHaveProperty('city', 'Austin');
    
    // Verify specific item fields
    const hobbitItem = publicViewRes.body.data.find(i => i.title === 'The Hobbit');
    expect(hobbitItem).toBeTruthy();
    expect(hobbitItem.author).toBe('J.R.R. Tolkien');
    expect(hobbitItem.isbn).toBe('9780547928227');
    expect(hobbitItem.notes).toBe('Must be a hardcover');

    console.log('✓ E2E Wishlist Tests completed successfully!');
  });
});
