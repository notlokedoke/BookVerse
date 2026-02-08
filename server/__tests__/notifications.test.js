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

  describe('PUT /api/notifications/:id/read', () => {
    test('should mark a notification as read', async () => {
      const notification = await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'You received a trade request',
        isRead: false
      });

      const response = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isRead).toBe(true);
      expect(response.body.data._id).toBe(notification._id.toString());

      // Verify in database
      const updated = await Notification.findById(notification._id);
      expect(updated.isRead).toBe(true);
    });

    test('should succeed when notification is already read (idempotent)', async () => {
      const notification = await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Already read notification',
        isRead: true
      });

      const response = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isRead).toBe(true);
    });

    test('should return 403 when notification belongs to another user', async () => {
      const notification = await Notification.create({
        recipient: user2._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user1._id,
        message: 'Notification for user2'
      });

      const response = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');

      // Verify notification was not modified
      const unchanged = await Notification.findById(notification._id);
      expect(unchanged.isRead).toBe(false);
    });

    test('should return 404 when notification does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    test('should return 400 for invalid notification ID format', async () => {
      const response = await request(app)
        .put('/api/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ID');
    });

    test('should fail without authentication', async () => {
      const notification = await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Test notification'
      });

      const response = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should return populated relatedUser and relatedTrade', async () => {
      const notification = await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Test notification'
      });

      const response = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Check relatedUser is populated without password
      expect(response.body.data.relatedUser).toBeDefined();
      expect(response.body.data.relatedUser._id).toBe(user2._id.toString());
      expect(response.body.data.relatedUser.name).toBe('Test User 2');
      expect(response.body.data.relatedUser.password).toBeUndefined();
      // Check relatedTrade is populated
      expect(response.body.data.relatedTrade).toBeDefined();
      expect(response.body.data.relatedTrade._id).toBe(trade._id.toString());
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    test('should mark all unread notifications as read', async () => {
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
        message: 'Already read notification',
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
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All notifications marked as read');
      expect(response.body.count).toBe(2); // Only 2 were unread

      // Verify all notifications are now read in database
      const notifications = await Notification.find({ recipient: user1._id });
      expect(notifications).toHaveLength(3);
      notifications.forEach(notif => {
        expect(notif.isRead).toBe(true);
      });
    });

    test('should return count of 0 when all notifications are already read', async () => {
      // Create only read notifications
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
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
    });

    test('should return count of 0 when user has no notifications', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
    });

    test('should only mark notifications for authenticated user', async () => {
      // Create notifications for user1
      await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Notification for user1',
        isRead: false
      });

      // Create notifications for user2
      const user2Notification = await Notification.create({
        recipient: user2._id,
        type: 'trade_accepted',
        relatedTrade: trade._id,
        relatedUser: user1._id,
        message: 'Notification for user2',
        isRead: false
      });

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1); // Only user1's notification

      // Verify user1's notification is read
      const user1Notif = await Notification.findOne({ recipient: user1._id });
      expect(user1Notif.isRead).toBe(true);

      // Verify user2's notification is still unread
      const user2Notif = await Notification.findById(user2Notification._id);
      expect(user2Notif.isRead).toBe(false);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should be idempotent - calling multiple times should work', async () => {
      await Notification.create({
        recipient: user1._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: user2._id,
        message: 'Test notification',
        isRead: false
      });

      // First call
      const response1 = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response1.body.count).toBe(1);

      // Second call - should return 0 since all are already read
      const response2 = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(response2.body.count).toBe(0);
    });
  });
});
