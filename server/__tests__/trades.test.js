const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Notification = require('../models/Notification');
const { generateToken } = require('../utils/jwt');

describe('Trades API - Propose Trade', () => {
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
    await Notification.deleteMany({});

    // Create test users
    user1 = await User.create({
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123',
      city: 'New York'
    });

    user2 = await User.create({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
      city: 'Los Angeles'
    });

    // Generate tokens
    user1Token = generateToken(user1._id);
    user2Token = generateToken(user2._id);

    // Create test books
    user1Book = await Book.create({
      owner: user1._id,
      title: 'User 1 Book',
      author: 'Author One',
      genre: 'Fiction',
      condition: 'Good',
      imageUrl: 'https://example.com/image1.jpg',
      isAvailable: true
    });

    user2Book = await Book.create({
      owner: user2._id,
      title: 'User 2 Book',
      author: 'Author Two',
      genre: 'Science',
      condition: 'Like New',
      imageUrl: 'https://example.com/image2.jpg',
      isAvailable: true
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
    await Trade.deleteMany({});
    await Notification.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/trades', () => {
    test('should create trade proposal with valid data', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('proposed');
      expect(response.body.data.proposer._id).toBe(user1._id.toString());
      expect(response.body.data.receiver._id).toBe(user2._id.toString());
      expect(response.body.data.requestedBook._id).toBe(user2Book._id.toString());
      expect(response.body.data.offeredBook._id).toBe(user1Book._id.toString());
      expect(response.body.message).toBe('Trade proposal created successfully');
    });

    test('should populate book and user data in response', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      expect(response.body.data.proposer.name).toBe('User One');
      expect(response.body.data.proposer.password).toBeUndefined();
      expect(response.body.data.receiver.name).toBe('User Two');
      expect(response.body.data.receiver.password).toBeUndefined();
      expect(response.body.data.requestedBook.title).toBe('User 2 Book');
      expect(response.body.data.offeredBook.title).toBe('User 1 Book');
    });

    test('should reject trade proposal without authentication', async () => {
      const response = await request(app)
        .post('/api/trades')
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should reject trade proposal with missing requestedBook', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          offeredBook: user1Book._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    test('should reject trade proposal with missing offeredBook', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    test('should reject trade proposal with invalid requestedBook ID format', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: 'invalid-id',
          offeredBook: user1Book._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_BOOK_ID');
    });

    test('should reject trade proposal with invalid offeredBook ID format', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: 'invalid-id'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_BOOK_ID');
    });

    test('should reject trade proposal with non-existent requestedBook', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: fakeId.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REQUESTED_BOOK_NOT_FOUND');
    });

    test('should reject trade proposal with non-existent offeredBook', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: fakeId.toString()
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('OFFERED_BOOK_NOT_FOUND');
    });

    test('should reject trade proposal when user does not own offered book (Req 8.2)', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user2Book._id.toString() // Trying to offer someone else's book
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_BOOK_OWNER');
      expect(response.body.error.message).toBe('You can only offer books that you own');
    });

    test('should reject trade proposal when user requests their own book (Req 8.4)', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user1Book._id.toString(), // Trying to request own book
          offeredBook: user1Book._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CANNOT_REQUEST_OWN_BOOK');
      expect(response.body.error.message).toBe('You cannot request your own book');
    });

    test('should reject trade proposal when requested book is not available', async () => {
      // Mark user2's book as unavailable
      await Book.findByIdAndUpdate(user2Book._id, { isAvailable: false });

      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REQUESTED_BOOK_UNAVAILABLE');
    });

    test('should reject trade proposal when offered book is not available', async () => {
      // Mark user1's book as unavailable
      await Book.findByIdAndUpdate(user1Book._id, { isAvailable: false });

      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('OFFERED_BOOK_UNAVAILABLE');
    });

    test('should set proposedAt timestamp when creating trade', async () => {
      const beforeTime = new Date();
      
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      const afterTime = new Date();
      const proposedAt = new Date(response.body.data.proposedAt);

      expect(proposedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(proposedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    test('should save trade to database', async () => {
      await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      const tradesInDb = await Trade.find({});
      expect(tradesInDb).toHaveLength(1);
      expect(tradesInDb[0].status).toBe('proposed');
      expect(tradesInDb[0].proposer.toString()).toBe(user1._id.toString());
      expect(tradesInDb[0].receiver.toString()).toBe(user2._id.toString());
    });

    test('should create notification for receiver when trade is proposed (Req 8.3)', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          requestedBook: user2Book._id.toString(),
          offeredBook: user1Book._id.toString()
        })
        .expect(201);

      // Check that notification was created
      const notifications = await Notification.find({ recipient: user2._id });
      expect(notifications).toHaveLength(1);
      
      const notification = notifications[0];
      expect(notification.type).toBe('trade_request');
      expect(notification.recipient.toString()).toBe(user2._id.toString());
      expect(notification.relatedTrade.toString()).toBe(response.body.data._id);
      expect(notification.relatedUser.toString()).toBe(user1._id.toString());
      expect(notification.message).toContain('User One');
      expect(notification.message).toContain('User 2 Book');
      expect(notification.isRead).toBe(false);
    });
  });

  describe('GET /api/trades', () => {
    let trade1, trade2, trade3;

    beforeEach(async () => {
      // Create multiple trades for testing
      // Trade 1: user1 proposes to user2
      trade1 = await Trade.create({
        proposer: user1._id,
        receiver: user2._id,
        requestedBook: user2Book._id,
        offeredBook: user1Book._id,
        status: 'proposed',
        proposedAt: new Date('2025-01-01')
      });

      // Create another book for user2
      const user2Book2 = await Book.create({
        owner: user2._id,
        title: 'User 2 Book 2',
        author: 'Author Two',
        genre: 'Mystery',
        condition: 'Good',
        imageUrl: 'https://example.com/image3.jpg',
        isAvailable: true
      });

      // Trade 2: user2 proposes to user1 (accepted)
      trade2 = await Trade.create({
        proposer: user2._id,
        receiver: user1._id,
        requestedBook: user1Book._id,
        offeredBook: user2Book2._id,
        status: 'accepted',
        proposedAt: new Date('2025-01-02'),
        respondedAt: new Date('2025-01-03')
      });

      // Create a third user and book for testing filtering
      const user3 = await User.create({
        name: 'User Three',
        email: 'user3@example.com',
        password: 'password123',
        city: 'Chicago'
      });

      const user3Book = await Book.create({
        owner: user3._id,
        title: 'User 3 Book',
        author: 'Author Three',
        genre: 'History',
        condition: 'Fair',
        imageUrl: 'https://example.com/image4.jpg',
        isAvailable: true
      });

      // Trade 3: user3 proposes to user2 (should not appear in user1's trades)
      trade3 = await Trade.create({
        proposer: user3._id,
        receiver: user2._id,
        requestedBook: user2Book._id,
        offeredBook: user3Book._id,
        status: 'declined',
        proposedAt: new Date('2025-01-04'),
        respondedAt: new Date('2025-01-05')
      });
    });

    test('should get all trades where user is proposer or receiver', async () => {
      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.count).toBe(2); // user1 is involved in trade1 and trade2
      expect(response.body.data).toHaveLength(2);
    });

    test('should populate book and user references', async () => {
      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const trade = response.body.data[0];
      expect(trade.proposer).toBeDefined();
      expect(trade.proposer.name).toBeDefined();
      expect(trade.proposer.password).toBeUndefined();
      expect(trade.receiver).toBeDefined();
      expect(trade.receiver.name).toBeDefined();
      expect(trade.receiver.password).toBeUndefined();
      expect(trade.requestedBook).toBeDefined();
      expect(trade.requestedBook.title).toBeDefined();
      expect(trade.offeredBook).toBeDefined();
      expect(trade.offeredBook.title).toBeDefined();
    });

    test('should sort trades by creation date descending', async () => {
      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      // trade2 was created after trade1, so it should come first
      const dates = response.body.data.map(t => new Date(t.createdAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    test('should filter trades by status when status query parameter provided', async () => {
      const response = await request(app)
        .get('/api/trades?status=proposed')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].status).toBe('proposed');
    });

    test('should filter trades by accepted status', async () => {
      const response = await request(app)
        .get('/api/trades?status=accepted')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].status).toBe('accepted');
    });

    test('should return empty array when no trades match status filter', async () => {
      const response = await request(app)
        .get('/api/trades?status=completed')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });

    test('should reject request with invalid status value', async () => {
      const response = await request(app)
        .get('/api/trades?status=invalid')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_STATUS');
      expect(response.body.error.message).toContain('Invalid status value');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/trades')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should return empty array when user has no trades', async () => {
      // Create a new user with no trades
      const user4 = await User.create({
        name: 'User Four',
        email: 'user4@example.com',
        password: 'password123',
        city: 'Boston'
      });
      const user4Token = generateToken(user4._id);

      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${user4Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });

    test('should include trades where user is proposer', async () => {
      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const proposedTrades = response.body.data.filter(
        t => t.proposer._id === user1._id.toString()
      );
      expect(proposedTrades.length).toBeGreaterThan(0);
    });

    test('should include trades where user is receiver', async () => {
      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const receivedTrades = response.body.data.filter(
        t => t.receiver._id === user1._id.toString()
      );
      expect(receivedTrades.length).toBeGreaterThan(0);
    });

    test('should not include trades where user is not involved', async () => {
      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // trade3 is between user3 and user2, should not appear for user1
      const trade3InResults = response.body.data.find(
        t => t._id === trade3._id.toString()
      );
      expect(trade3InResults).toBeUndefined();
    });
  });
});
