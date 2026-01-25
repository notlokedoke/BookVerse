const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
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
  });
});
