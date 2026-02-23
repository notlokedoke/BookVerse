const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Trade = require('../models/Trade');
const Book = require('../models/Book');
const { generateToken } = require('../utils/jwt');

describe('Notifications API - GET /api/notifications', () => {
  let user1, user2, user1Token, user2Token;
  let book1, book2, trade;

  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookverse-test';
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  });

  beforeEach(async () => {
    // Clear collections
    await Notification.deleteMany({});
    await Trade.deleteMany({});
    await Book.deleteMany({});
    await User.deleteMany({});

    // Create test users
    user1 = await User.create({
      name: 'Test User 1',
      email: 'testuser1@example.com',
      password: 'password123',
      city: 'New York'
    });

    user2 = await User.create({
      name: 'Test User 2',
      email: 'testuser2@example.com',
      password: 'password123',
      city: 'Los Angeles'
    });

    // Generate tokens
    user1Token = generateToken(user1._id);
    user2Token = generateToken(user2._id);

    // Create test books
    book1 = await Book.create({
      owner: user1._id,
      title: 'Test Book 1',
      author: 'Author 1',
      condition: 'Good',
      genre: 'Fiction',
      imageUrl: 'http://example.com/image1.jpg'
    });

    book2 = await Book.create({
      owner: user2._id,
      title: 'Test Book 2',
      author: 'Author 2',
      condition: 'Like New',
      genre: 'Non-Fiction',
      imageUrl: 'http://example.com/image2.jpg'
    });

    // Create test trade
    trade = await Trade.create({
      proposer: user1._id,
      receiver: user2._id,
      requestedBook: book2._id,
      offeredBook: book1._id,
      status: 'proposed'
    });
  });

  afterAll(async () => {
    // Clean up
    await Notification.deleteMany({});
    await Trade.deleteMany({});
    await Book.deleteMany({});
    await User.deleteMany({});
  });

  describe('GET /api/notifications', () => {
    test('should get all notifications for authenticated user', async () => {
      // Create notifications for user1
      await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'You received a trade request'
      });

      await Notification.create({
        recipient: user1._id,
        type: 'new_message',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'You have a new message'
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.unreadCount).toBe(2);
    });

    test('should sort notifications by creation date descending', async () => {
      // Create notifications with delays
      const notif1 = await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'First notification'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const notif2 = await Notification.create({
        recipient: user1._id,
        type: 'new_message',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Second notification'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const notif3 = await Notification.create({
        recipient: user1._id,
        type: 'trade_accepted',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Third notification'
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      
      // Verify descending order (newest first)
      expect(response.body.data[0].message).toBe('Third notification');
      expect(response.body.data[1].message).toBe('Second notification');
      expect(response.body.data[2].message).toBe('First notification');
    });

    test('should populate relatedUser without password', async () => {
      await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'You received a trade request'
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].relatedUser).toBeDefined();
      expect(response.body.data[0].relatedUser._id).toBe(user2._id.toString());
      expect(response.body.data[0].relatedUser.name).toBe('Test User 2');
      expect(response.body.data[0].relatedUser.password).toBeUndefined();
    });

    test('should populate relatedTrade', async () => {
      await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'You received a trade request'
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].relatedTrade).toBeDefined();
      expect(response.body.data[0].relatedTrade._id).toBe(trade._id.toString());
      expect(response.body.data[0].relatedTrade.status).toBe('proposed');
    });

    test('should calculate unread count correctly', async () => {
      // Create mix of read and unread notifications
      await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Unread notification 1',
        isRead: false
      });

      await Notification.create({
        recipient: user1._id,
        type: 'new_message',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Read notification',
        isRead: true
      });

      await Notification.create({
        recipient: user1._id,
        type: 'trade_accepted',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Unread notification 2',
        isRead: false
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.unreadCount).toBe(2);
    });

    test('should return empty array when no notifications exist', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.unreadCount).toBe(0);
    });

    test('should only return notifications for authenticated user', async () => {
      // Create notifications for user1
      await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Notification for user1'
      });

      // Create notifications for user2
      await Notification.create({
        recipient: user2._id,
        type: 'trade_accepted',
        relatedTrade: trade._id,
        relatedUser: user1._id,
        message: 'Notification for user2'
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].message).toBe('Notification for user1');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should handle all notification types', async () => {
      const notificationTypes = [
        'trade_request',
        'trade_accepted',
        'trade_declined',
        'trade_completed',
        'new_message'
      ];

      for (const type of notificationTypes) {
        await Notification.create({
          recipient: user1._id,
          type,
          relatedTrade: trade._id,
          relatedUser: user2._id,
          message: `Notification of type ${type}`
        });
      }

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      
      const types = response.body.data.map(n => n.type);
      expect(types).toEqual(expect.arrayContaining(notificationTypes));
    });

    test('should return unreadCount of 0 when all notifications are read', async () => {
      await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Read notification 1',
        isRead: true
      });

      await Notification.create({
        recipient: user1._id,
        type: 'new_message',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Read notification 2',
        isRead: true
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.unreadCount).toBe(0);
    });
  });
});
