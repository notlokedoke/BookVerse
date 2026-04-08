const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { generateToken } = require('../utils/jwt');

/**
 * Trading Integration Tests
 * 
 * These tests cover the complete trading workflow from start to finish:
 * 1. Trade proposal and acceptance flow
 * 2. Messaging in accepted trades
 * 3. Trade completion
 * 
 * Task 156: Write integration tests for trading
 */

describe('Trading Integration - Complete Workflow', () => {
  let user1, user2, user1Token, user2Token;
  let user1Book, user2Book;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/bookverse_test');
    }
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Book.deleteMany({});
    await Trade.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});

    // Create test users
    user1 = await User.create({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123',
      city: 'New York'
    });

    user2 = await User.create({
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'password123',
      city: 'Los Angeles'
    });

    // Generate tokens
    user1Token = generateToken(user1._id);
    user2Token = generateToken(user2._id);

    // Create test books
    user1Book = await Book.create({
      owner: user1._id,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      genre: 'Classic Fiction',
      condition: 'Good',
      imageUrl: 'https://example.com/gatsby.jpg',
      isAvailable: true
    });

    user2Book = await Book.create({
      owner: user2._id,
      title: '1984',
      author: 'George Orwell',
      genre: 'Dystopian Fiction',
      condition: 'Like New',
      imageUrl: 'https://example.com/1984.jpg',
      isAvailable: true
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
    await Trade.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Complete Trade Workflow: Propose → Accept → Message → Complete', () => {
    test('should complete full trade lifecycle successfully', async () => {
      // Step 1: User1 proposes a trade to User2
      const proposeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      expect(proposeResponse.body.success).toBe(true);
      expect(proposeResponse.body.data.status).toBe('proposed');
      const tradeId = proposeResponse.body.data._id;

      // Verify notification was created for User2
      let notifications = await Notification.find({ recipient: user2._id });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('trade_request');

      // Step 2: User2 accepts the trade
      const acceptResponse = await request(app)
        .put(`/api/trades/${tradeId}/accept`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(acceptResponse.body.success).toBe(true);
      expect(acceptResponse.body.data.status).toBe('accepted');

      // Verify notification was created for User1
      notifications = await Notification.find({ recipient: user1._id });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('trade_accepted');

      // Step 3: User1 sends a message
      const message1Response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: tradeId,
          content: 'Hi! When would be a good time to meet for the exchange?'
        })
        .expect(201);

      expect(message1Response.body.success).toBe(true);
      expect(message1Response.body.data.content).toBe('Hi! When would be a good time to meet for the exchange?');

      // Verify notification was created for User2
      notifications = await Notification.find({ 
        recipient: user2._id,
        type: 'new_message'
      });
      expect(notifications).toHaveLength(1);

      // Step 4: User2 replies with a message
      const message2Response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          trade: tradeId,
          content: 'How about Saturday at 2pm at the Central Library?'
        })
        .expect(201);

      expect(message2Response.body.success).toBe(true);

      // Step 5: User1 sends another message
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: tradeId,
          content: 'Perfect! See you then.'
        })
        .expect(201);

      // Step 6: Verify all messages are retrievable in chronological order
      const messagesResponse = await request(app)
        .get(`/api/messages/trade/${tradeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(messagesResponse.body.success).toBe(true);
      expect(messagesResponse.body.data).toHaveLength(3);
      expect(messagesResponse.body.data[0].content).toBe('Hi! When would be a good time to meet for the exchange?');
      expect(messagesResponse.body.data[1].content).toBe('How about Saturday at 2pm at the Central Library?');
      expect(messagesResponse.body.data[2].content).toBe('Perfect! See you then.');

      // Step 7: User1 marks the trade as complete
      const completeResponse = await request(app)
        .put(`/api/trades/${tradeId}/complete`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(completeResponse.body.success).toBe(true);
      expect(completeResponse.body.data.status).toBe('completed');
      expect(completeResponse.body.data.ratingEnabled).toBe(true);

      // Verify notification was created for User2
      notifications = await Notification.find({ 
        recipient: user2._id,
        type: 'trade_completed'
      });
      expect(notifications).toHaveLength(1);

      // Step 8: Verify final trade state in database
      const finalTrade = await Trade.findById(tradeId);
      expect(finalTrade.status).toBe('completed');
      expect(finalTrade.proposedAt).toBeDefined();
      expect(finalTrade.respondedAt).toBeDefined();
      expect(finalTrade.completedAt).toBeDefined();
      expect(finalTrade.ratingEnabled).toBe(true);
    });
  });

  describe('Trade Proposal and Acceptance Flow', () => {
    test('should handle trade proposal with proper validation', async () => {
      // Propose trade
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.proposer._id).toBe(user1._id.toString());
      expect(response.body.data.receiver._id).toBe(user2._id.toString());
      expect(response.body.data.requestedBook._id).toBe(user2Book._id.toString());
      expect(response.body.data.offeredBook._id).toBe(user1Book._id.toString());
      expect(response.body.data.status).toBe('proposed');
    });

    test('should prevent proposing trade for own book', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user1Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CANNOT_REQUEST_OWN_BOOK');
    });

    test('should prevent offering book not owned by user', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user2Book._id.toString()
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_BOOK_OWNER');
    });

    test('should allow receiver to accept trade', async () => {
      // Create trade
      const proposeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      const tradeId = proposeResponse.body.data._id;

      // Accept trade
      const acceptResponse = await request(app)
        .put(`/api/trades/${tradeId}/accept`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(acceptResponse.body.success).toBe(true);
      expect(acceptResponse.body.data.status).toBe('accepted');
      expect(acceptResponse.body.data.respondedAt).toBeDefined();
    });

    test('should prevent proposer from accepting their own trade', async () => {
      // Create trade
      const proposeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      const tradeId = proposeResponse.body.data._id;

      // Try to accept own trade
      const acceptResponse = await request(app)
        .put(`/api/trades/${tradeId}/accept`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);

      expect(acceptResponse.body.success).toBe(false);
      expect(acceptResponse.body.error.code).toBe('NOT_AUTHORIZED');
    });

    test('should allow receiver to decline trade', async () => {
      // Create trade
      const proposeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      const tradeId = proposeResponse.body.data._id;

      // Decline trade
      const declineResponse = await request(app)
        .put(`/api/trades/${tradeId}/decline`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(declineResponse.body.success).toBe(true);
      expect(declineResponse.body.data.status).toBe('declined');
      expect(declineResponse.body.data.respondedAt).toBeDefined();
    });

    test('should create notifications for trade status changes', async () => {
      // Propose trade
      const proposeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      const tradeId = proposeResponse.body.data._id;

      // Check proposal notification
      let notifications = await Notification.find({ recipient: user2._id });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('trade_request');
      expect(notifications[0].relatedTrade.toString()).toBe(tradeId);

      // Accept trade
      await request(app)
        .put(`/api/trades/${tradeId}/accept`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      // Check acceptance notification
      notifications = await Notification.find({ recipient: user1._id });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('trade_accepted');
      expect(notifications[0].relatedTrade.toString()).toBe(tradeId);
    });
  });

  describe('Messaging in Accepted Trades', () => {
    let acceptedTradeId;

    beforeEach(async () => {
      // Create and accept a trade for messaging tests
      const proposeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      acceptedTradeId = proposeResponse.body.data._id;

      await request(app)
        .put(`/api/trades/${acceptedTradeId}/accept`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);
    });

    test('should allow both parties to send messages in accepted trade', async () => {
      // User1 sends message
      const message1Response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: acceptedTradeId,
          content: 'Hello from User1'
        })
        .expect(201);

      expect(message1Response.body.success).toBe(true);
      expect(message1Response.body.data.sender._id).toBe(user1._id.toString());

      // User2 sends message
      const message2Response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          trade: acceptedTradeId,
          content: 'Hello from User2'
        })
        .expect(201);

      expect(message2Response.body.success).toBe(true);
      expect(message2Response.body.data.sender._id).toBe(user2._id.toString());
    });

    test('should prevent messaging in non-accepted trades', async () => {
      // Create a proposed trade (not accepted)
      const proposeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      const proposedTradeId = proposeResponse.body.data._id;

      // Try to send message in proposed trade
      const messageResponse = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: proposedTradeId,
          content: 'This should fail'
        })
        .expect(400);

      expect(messageResponse.body.success).toBe(false);
      expect(messageResponse.body.error.code).toBe('INVALID_TRADE_STATUS');
    });

    test('should prevent non-participants from sending messages', async () => {
      // Create a third user
      const user3 = await User.create({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123',
        city: 'Chicago'
      });
      const user3Token = generateToken(user3._id);

      // Try to send message as non-participant
      const messageResponse = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user3Token}`)
        .send({
          trade: acceptedTradeId,
          content: 'This should fail'
        })
        .expect(403);

      expect(messageResponse.body.success).toBe(false);
      expect(messageResponse.body.error.code).toBe('NOT_AUTHORIZED');
    });

    test('should retrieve messages in chronological order', async () => {
      // Send multiple messages
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: acceptedTradeId,
          content: 'First message'
        })
        .expect(201);

      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          trade: acceptedTradeId,
          content: 'Second message'
        })
        .expect(201);

      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: acceptedTradeId,
          content: 'Third message'
        })
        .expect(201);

      // Retrieve messages
      const messagesResponse = await request(app)
        .get(`/api/messages/trade/${acceptedTradeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(messagesResponse.body.success).toBe(true);
      expect(messagesResponse.body.data).toHaveLength(3);
      expect(messagesResponse.body.data[0].content).toBe('First message');
      expect(messagesResponse.body.data[1].content).toBe('Second message');
      expect(messagesResponse.body.data[2].content).toBe('Third message');

      // Verify chronological order
      const time1 = new Date(messagesResponse.body.data[0].createdAt).getTime();
      const time2 = new Date(messagesResponse.body.data[1].createdAt).getTime();
      const time3 = new Date(messagesResponse.body.data[2].createdAt).getTime();
      expect(time1).toBeLessThan(time2);
      expect(time2).toBeLessThan(time3);
    });

    test('should create notifications when messages are sent', async () => {
      // User1 sends message
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: acceptedTradeId,
          content: 'Test message'
        })
        .expect(201);

      // Check notification for User2
      const notifications = await Notification.find({ 
        recipient: user2._id,
        type: 'new_message'
      });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].relatedTrade.toString()).toBe(acceptedTradeId);
      expect(notifications[0].relatedUser.toString()).toBe(user1._id.toString());
    });

    test('should validate message content length', async () => {
      // Try to send message exceeding 1000 characters
      const longContent = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: acceptedTradeId,
          content: longContent
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should allow both parties to view messages', async () => {
      // Send a message
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: acceptedTradeId,
          content: 'Test message'
        })
        .expect(201);

      // User1 retrieves messages
      const user1Response = await request(app)
        .get(`/api/messages/trade/${acceptedTradeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(user1Response.body.success).toBe(true);
      expect(user1Response.body.data).toHaveLength(1);

      // User2 retrieves messages
      const user2Response = await request(app)
        .get(`/api/messages/trade/${acceptedTradeId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user2Response.body.success).toBe(true);
      expect(user2Response.body.data).toHaveLength(1);
    });
  });

  describe('Trade Completion', () => {
    let acceptedTradeId;

    beforeEach(async () => {
      // Create and accept a trade for completion tests
      const proposeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      acceptedTradeId = proposeResponse.body.data._id;

      await request(app)
        .put(`/api/trades/${acceptedTradeId}/accept`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);
    });

    test('should allow proposer to complete trade', async () => {
      const response = await request(app)
        .put(`/api/trades/${acceptedTradeId}/complete`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.completedAt).toBeDefined();
      expect(response.body.data.ratingEnabled).toBe(true);
    });

    test('should allow receiver to complete trade', async () => {
      const response = await request(app)
        .put(`/api/trades/${acceptedTradeId}/complete`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.completedAt).toBeDefined();
      expect(response.body.data.ratingEnabled).toBe(true);
    });

    test('should prevent non-participants from completing trade', async () => {
      // Create a third user
      const user3 = await User.create({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123',
        city: 'Chicago'
      });
      const user3Token = generateToken(user3._id);

      const response = await request(app)
        .put(`/api/trades/${acceptedTradeId}/complete`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_AUTHORIZED');
    });

    test('should only allow completion of accepted trades', async () => {
      // Create a proposed trade (not accepted)
      const proposeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      const proposedTradeId = proposeResponse.body.data._id;

      // Try to complete proposed trade
      const response = await request(app)
        .put(`/api/trades/${proposedTradeId}/complete`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TRADE_STATUS');
    });

    test('should create notification when trade is completed', async () => {
      // User1 completes the trade
      await request(app)
        .put(`/api/trades/${acceptedTradeId}/complete`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Check notification for User2
      const notifications = await Notification.find({ 
        recipient: user2._id,
        type: 'trade_completed'
      });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].relatedTrade.toString()).toBe(acceptedTradeId);
      expect(notifications[0].relatedUser.toString()).toBe(user1._id.toString());
    });

    test('should enable rating after completion', async () => {
      await request(app)
        .put(`/api/trades/${acceptedTradeId}/complete`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verify in database
      const trade = await Trade.findById(acceptedTradeId);
      expect(trade.ratingEnabled).toBe(true);
    });

    test('should prevent completing already completed trade', async () => {
      // Complete trade first time
      await request(app)
        .put(`/api/trades/${acceptedTradeId}/complete`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Try to complete again
      const response = await request(app)
        .put(`/api/trades/${acceptedTradeId}/complete`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TRADE_STATUS');
    });

    test('should set completedAt timestamp', async () => {
      const beforeTime = new Date();

      const response = await request(app)
        .put(`/api/trades/${acceptedTradeId}/complete`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const afterTime = new Date();
      const completedAt = new Date(response.body.data.completedAt);

      expect(completedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(completedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid trade ID format', async () => {
      const response = await request(app)
        .put('/api/trades/invalid-id/accept')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle non-existent trade', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/trades/${fakeId}/accept`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TRADE_NOT_FOUND');
    });

    test('should require authentication for all trade operations', async () => {
      // Propose trade without auth
      const proposeResponse = await request(app)
        .post('/api/trades')
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(401);

      expect(proposeResponse.body.success).toBe(false);

      // Create a trade first
      const trade = await Trade.create({
        proposer: user1._id,
        receiver: user2._id,
        requestedBook: user2Book._id,
        offeredBook: user1Book._id,
        status: 'proposed'
      });

      // Accept without auth
      const acceptResponse = await request(app)
        .put(`/api/trades/${trade._id}/accept`)
        .expect(401);

      expect(acceptResponse.body.success).toBe(false);

      // Complete without auth
      await Trade.findByIdAndUpdate(trade._id, { status: 'accepted' });
      const completeResponse = await request(app)
        .put(`/api/trades/${trade._id}/complete`)
        .expect(401);

      expect(completeResponse.body.success).toBe(false);
    });

    test('should handle concurrent message sending', async () => {
      // Create and accept trade
      const proposeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      const tradeId = proposeResponse.body.data._id;

      await request(app)
        .put(`/api/trades/${tradeId}/accept`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      // Send multiple messages concurrently
      const messagePromises = [
        request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ trade: tradeId, content: 'Message 1' }),
        request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${user2Token}`)
          .send({ trade: tradeId, content: 'Message 2' }),
        request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ trade: tradeId, content: 'Message 3' })
      ];

      const responses = await Promise.all(messagePromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify all messages were saved
      const messages = await Message.find({ trade: tradeId });
      expect(messages).toHaveLength(3);
    });
  });
});
