const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Rating = require('../models/Rating');
const { generateToken } = require('../utils/jwt');
const connectDB = require('../config/database');

describe('Rating API Endpoints', () => {
  let testUser1, testUser2, testBook1, testBook2, testTrade;
  let token1, token2;

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    // Clean up database
    await Rating.deleteMany({});
    await Trade.deleteMany({});
    await Book.deleteMany({});
    await User.deleteMany({});

    // Create test users
    testUser1 = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      city: 'New York'
    });
    await testUser1.save();

    testUser2 = new User({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      city: 'Los Angeles'
    });
    await testUser2.save();

    // Generate tokens
    token1 = generateToken(testUser1._id.toString());
    token2 = generateToken(testUser2._id.toString());

    // Create test books
    testBook1 = new Book({
      owner: testUser1._id,
      title: 'Test Book 1',
      author: 'Author 1',
      genre: 'Fiction',
      condition: 'Good',
      imageUrl: 'http://example.com/image1.jpg'
    });
    await testBook1.save();

    testBook2 = new Book({
      owner: testUser2._id,
      title: 'Test Book 2',
      author: 'Author 2',
      genre: 'Non-Fiction',
      condition: 'Like New',
      imageUrl: 'http://example.com/image2.jpg'
    });
    await testBook2.save();

    // Create completed test trade
    testTrade = new Trade({
      proposer: testUser1._id,
      receiver: testUser2._id,
      requestedBook: testBook2._id,
      offeredBook: testBook1._id,
      status: 'completed',
      completedAt: new Date()
    });
    await testTrade.save();
  });

  afterEach(async () => {
    await Rating.deleteMany({});
    await Trade.deleteMany({});
    await Book.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/ratings', () => {
    describe('Success Cases', () => {
      test('should create rating with valid data (5 stars, no comment required)', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 5
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.stars).toBe(5);
        expect(response.body.data.rater._id).toBe(testUser1._id.toString());
        expect(response.body.data.ratedUser._id).toBe(testUser2._id.toString());
        expect(response.body.data.trade).toBeDefined();
        expect(response.body.message).toBe('Rating submitted successfully');
      });

      test('should create rating with 4 stars and optional comment', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 4,
            comment: 'Great trade experience!'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.stars).toBe(4);
        expect(response.body.data.comment).toBe('Great trade experience!');
      });

      test('should create rating with 3 stars and required comment', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token2}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 3,
            comment: 'Trade was okay, but book condition was not as described'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.stars).toBe(3);
        expect(response.body.data.comment).toBe('Trade was okay, but book condition was not as described');
        expect(response.body.data.rater._id).toBe(testUser2._id.toString());
        expect(response.body.data.ratedUser._id).toBe(testUser1._id.toString());
      });

      test('should create rating with 2 stars and required comment', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 2,
            comment: 'Poor communication and late delivery'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.stars).toBe(2);
        expect(response.body.data.comment).toBe('Poor communication and late delivery');
      });

      test('should create rating with 1 star and required comment', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 1,
            comment: 'Never showed up for the trade'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.stars).toBe(1);
        expect(response.body.data.comment).toBe('Never showed up for the trade');
      });

      test('should allow both users to rate the same trade', async () => {
        // User 1 rates User 2
        const response1 = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 5
          });

        expect(response1.status).toBe(201);
        expect(response1.body.data.rater._id).toBe(testUser1._id.toString());
        expect(response1.body.data.ratedUser._id).toBe(testUser2._id.toString());

        // User 2 rates User 1
        const response2 = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token2}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 4
          });

        expect(response2.status).toBe(201);
        expect(response2.body.data.rater._id).toBe(testUser2._id.toString());
        expect(response2.body.data.ratedUser._id).toBe(testUser1._id.toString());
      });

      test('should trim whitespace from comment', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 3,
            comment: '  Trade was okay  '
          });

        expect(response.status).toBe(201);
        expect(response.body.data.comment).toBe('Trade was okay');
      });
    });

    describe('Authentication', () => {
      test('should return 401 when no token provided', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .send({
            trade: testTrade._id.toString(),
            stars: 5
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });

      test('should return 401 when invalid token provided', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', 'Bearer invalid_token')
          .send({
            trade: testTrade._id.toString(),
            stars: 5
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Validation Errors', () => {
      test('should return 400 when trade ID is missing', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            stars: 5
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_TRADE_ID');
      });

      test('should return 400 when stars is missing', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString()
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_STARS');
      });

      test('should return 400 when stars is less than 1', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 0
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_STARS');
      });

      test('should return 400 when stars is greater than 5', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 6
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_STARS');
      });

      test('should return 400 when stars is not an integer', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 3.5
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_STARS');
      });

      test('should return 400 when comment is missing for 3 stars', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 3
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('COMMENT_REQUIRED');
      });

      test('should return 400 when comment is empty string for 2 stars', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 2,
            comment: '   '
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('COMMENT_REQUIRED');
      });

      test('should return 400 when trade ID format is invalid', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: 'invalid_id',
            stars: 5
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TRADE_ID');
      });
    });

    describe('Trade Validation', () => {
      test('should return 404 when trade does not exist', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: nonExistentId.toString(),
            stars: 5
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('TRADE_NOT_FOUND');
      });

      test('should return 400 when trade status is not completed', async () => {
        // Create a proposed trade
        const proposedTrade = new Trade({
          proposer: testUser1._id,
          receiver: testUser2._id,
          requestedBook: testBook2._id,
          offeredBook: testBook1._id,
          status: 'proposed'
        });
        await proposedTrade.save();

        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: proposedTrade._id.toString(),
            stars: 5
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('TRADE_NOT_COMPLETED');
        expect(response.body.error.message).toContain('proposed');
      });

      test('should return 400 when trade status is accepted', async () => {
        // Create an accepted trade
        const acceptedTrade = new Trade({
          proposer: testUser1._id,
          receiver: testUser2._id,
          requestedBook: testBook2._id,
          offeredBook: testBook1._id,
          status: 'accepted'
        });
        await acceptedTrade.save();

        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: acceptedTrade._id.toString(),
            stars: 5
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('TRADE_NOT_COMPLETED');
      });

      test('should return 400 when trade status is declined', async () => {
        // Create a declined trade
        const declinedTrade = new Trade({
          proposer: testUser1._id,
          receiver: testUser2._id,
          requestedBook: testBook2._id,
          offeredBook: testBook1._id,
          status: 'declined'
        });
        await declinedTrade.save();

        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: declinedTrade._id.toString(),
            stars: 5
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('TRADE_NOT_COMPLETED');
      });
    });

    describe('Authorization', () => {
      test('should return 403 when user is not part of the trade', async () => {
        // Create a third user
        const testUser3 = new User({
          name: 'Bob Johnson',
          email: 'bob@example.com',
          password: 'password123',
          city: 'Chicago'
        });
        await testUser3.save();
        const token3 = generateToken(testUser3._id.toString());

        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token3}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 5
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_AUTHORIZED');
      });
    });

    describe('Duplicate Rating Prevention', () => {
      test('should return 409 when user tries to rate the same trade twice', async () => {
        // First rating
        const response1 = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 5
          });

        expect(response1.status).toBe(201);

        // Attempt duplicate rating
        const response2 = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 4,
            comment: 'Different rating'
          });

        expect(response2.status).toBe(409);
        expect(response2.body.success).toBe(false);
        expect(response2.body.error.code).toBe('DUPLICATE_RATING');
      });

      test('should check for existing rating before creating new one', async () => {
        // Create rating directly in database
        const existingRating = new Rating({
          trade: testTrade._id,
          rater: testUser1._id,
          ratedUser: testUser2._id,
          stars: 5
        });
        await existingRating.save();

        // Attempt to create another rating via API
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 4
          });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('DUPLICATE_RATING');
      });
    });

    describe('Rated User Determination', () => {
      test('should rate receiver when proposer submits rating', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`) // Proposer
          .send({
            trade: testTrade._id.toString(),
            stars: 5
          });

        expect(response.status).toBe(201);
        expect(response.body.data.rater._id).toBe(testUser1._id.toString());
        expect(response.body.data.ratedUser._id).toBe(testUser2._id.toString());
      });

      test('should rate proposer when receiver submits rating', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token2}`) // Receiver
          .send({
            trade: testTrade._id.toString(),
            stars: 5
          });

        expect(response.status).toBe(201);
        expect(response.body.data.rater._id).toBe(testUser2._id.toString());
        expect(response.body.data.ratedUser._id).toBe(testUser1._id.toString());
      });
    });

    describe('Response Format', () => {
      test('should return populated rating data', async () => {
        const response = await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 5,
            comment: 'Excellent trade!'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data._id).toBeDefined();
        expect(response.body.data.rater).toBeDefined();
        expect(response.body.data.rater.name).toBe('John Doe');
        expect(response.body.data.rater.password).toBeUndefined();
        expect(response.body.data.ratedUser).toBeDefined();
        expect(response.body.data.ratedUser.name).toBe('Jane Smith');
        expect(response.body.data.ratedUser.password).toBeUndefined();
        expect(response.body.data.trade).toBeDefined();
        expect(response.body.data.createdAt).toBeDefined();
      });
    });
  });

  describe('GET /api/ratings/trade/:tradeId', () => {
    describe('Success Cases', () => {
      test('should get rating for a trade by authenticated user', async () => {
        // First create a rating
        await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 4,
            comment: 'Good trade'
          });

        // Then fetch it
        const response = await request(app)
          .get(`/api/ratings/trade/${testTrade._id.toString()}`)
          .set('Authorization', `Bearer ${token1}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.stars).toBe(4);
        expect(response.body.data.comment).toBe('Good trade');
        expect(response.body.data.rater._id).toBe(testUser1._id.toString());
        expect(response.body.data.ratedUser._id).toBe(testUser2._id.toString());
      });

      test('should return populated rating with user and trade data', async () => {
        // Create a rating
        await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token2}`)
          .send({
            trade: testTrade._id.toString(),
            stars: 5
          });

        // Fetch it
        const response = await request(app)
          .get(`/api/ratings/trade/${testTrade._id.toString()}`)
          .set('Authorization', `Bearer ${token2}`);

        expect(response.status).toBe(200);
        expect(response.body.data.rater).toBeDefined();
        expect(response.body.data.rater.name).toBe('Jane Smith');
        expect(response.body.data.rater.password).toBeUndefined();
        expect(response.body.data.ratedUser).toBeDefined();
        expect(response.body.data.ratedUser.name).toBe('John Doe');
        expect(response.body.data.trade).toBeDefined();
      });
    });

    describe('Error Cases', () => {
      test('should return 404 if rating not found', async () => {
        const response = await request(app)
          .get(`/api/ratings/trade/${testTrade._id.toString()}`)
          .set('Authorization', `Bearer ${token1}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('RATING_NOT_FOUND');
      });

      test('should return 400 for invalid trade ID format', async () => {
        const response = await request(app)
          .get('/api/ratings/trade/invalid-id')
          .set('Authorization', `Bearer ${token1}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_TRADE_ID');
      });

      test('should return 401 without authentication', async () => {
        const response = await request(app)
          .get(`/api/ratings/trade/${testTrade._id.toString()}`);

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Average Rating Calculation', () => {
    test('should update rated user average rating after first rating', async () => {
      // Submit first rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: testTrade._id.toString(),
          stars: 5
        });

      // Fetch updated user
      const updatedUser = await User.findById(testUser2._id);

      expect(updatedUser.averageRating).toBe(5);
      expect(updatedUser.ratingCount).toBe(1);
    });

    test('should calculate average rating correctly with multiple ratings', async () => {
      // Create additional trades for multiple ratings
      const testBook3 = new Book({
        owner: testUser1._id,
        title: 'Test Book 3',
        author: 'Author 3',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'http://example.com/image3.jpg'
      });
      await testBook3.save();

      const testBook4 = new Book({
        owner: testUser2._id,
        title: 'Test Book 4',
        author: 'Author 4',
        genre: 'Non-Fiction',
        condition: 'Like New',
        imageUrl: 'http://example.com/image4.jpg'
      });
      await testBook4.save();

      const testTrade2 = new Trade({
        proposer: testUser1._id,
        receiver: testUser2._id,
        requestedBook: testBook4._id,
        offeredBook: testBook3._id,
        status: 'completed',
        completedAt: new Date()
      });
      await testTrade2.save();

      // Submit first rating (5 stars)
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: testTrade._id.toString(),
          stars: 5
        });

      // Submit second rating (3 stars)
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: testTrade2._id.toString(),
          stars: 3,
          comment: 'Trade was okay'
        });

      // Fetch updated user
      const updatedUser = await User.findById(testUser2._id);

      // Average should be (5 + 3) / 2 = 4
      expect(updatedUser.averageRating).toBe(4);
      expect(updatedUser.ratingCount).toBe(2);
    });

    test('should calculate average rating with three ratings', async () => {
      // Create additional trades
      const testBook3 = new Book({
        owner: testUser1._id,
        title: 'Test Book 3',
        author: 'Author 3',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'http://example.com/image3.jpg'
      });
      await testBook3.save();

      const testBook4 = new Book({
        owner: testUser2._id,
        title: 'Test Book 4',
        author: 'Author 4',
        genre: 'Non-Fiction',
        condition: 'Like New',
        imageUrl: 'http://example.com/image4.jpg'
      });
      await testBook4.save();

      const testBook5 = new Book({
        owner: testUser1._id,
        title: 'Test Book 5',
        author: 'Author 5',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'http://example.com/image5.jpg'
      });
      await testBook5.save();

      const testBook6 = new Book({
        owner: testUser2._id,
        title: 'Test Book 6',
        author: 'Author 6',
        genre: 'Non-Fiction',
        condition: 'Like New',
        imageUrl: 'http://example.com/image6.jpg'
      });
      await testBook6.save();

      const testTrade2 = new Trade({
        proposer: testUser1._id,
        receiver: testUser2._id,
        requestedBook: testBook4._id,
        offeredBook: testBook3._id,
        status: 'completed',
        completedAt: new Date()
      });
      await testTrade2.save();

      const testTrade3 = new Trade({
        proposer: testUser1._id,
        receiver: testUser2._id,
        requestedBook: testBook6._id,
        offeredBook: testBook5._id,
        status: 'completed',
        completedAt: new Date()
      });
      await testTrade3.save();

      // Submit three ratings: 5, 4, 3
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: testTrade._id.toString(),
          stars: 5
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: testTrade2._id.toString(),
          stars: 4
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: testTrade3._id.toString(),
          stars: 3,
          comment: 'Trade was okay'
        });

      // Fetch updated user
      const updatedUser = await User.findById(testUser2._id);

      // Average should be (5 + 4 + 3) / 3 = 4
      expect(updatedUser.averageRating).toBe(4);
      expect(updatedUser.ratingCount).toBe(3);
    });

    test('should handle low ratings correctly in average calculation', async () => {
      // Create additional trade
      const testBook3 = new Book({
        owner: testUser1._id,
        title: 'Test Book 3',
        author: 'Author 3',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'http://example.com/image3.jpg'
      });
      await testBook3.save();

      const testBook4 = new Book({
        owner: testUser2._id,
        title: 'Test Book 4',
        author: 'Author 4',
        genre: 'Non-Fiction',
        condition: 'Like New',
        imageUrl: 'http://example.com/image4.jpg'
      });
      await testBook4.save();

      const testTrade2 = new Trade({
        proposer: testUser1._id,
        receiver: testUser2._id,
        requestedBook: testBook4._id,
        offeredBook: testBook3._id,
        status: 'completed',
        completedAt: new Date()
      });
      await testTrade2.save();

      // Submit ratings: 1 and 2
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: testTrade._id.toString(),
          stars: 1,
          comment: 'Very bad experience'
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: testTrade2._id.toString(),
          stars: 2,
          comment: 'Poor communication'
        });

      // Fetch updated user
      const updatedUser = await User.findById(testUser2._id);

      // Average should be (1 + 2) / 2 = 1.5
      expect(updatedUser.averageRating).toBe(1.5);
      expect(updatedUser.ratingCount).toBe(2);
    });

    test('should update different users independently', async () => {
      // User 1 rates User 2
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: testTrade._id.toString(),
          stars: 5
        });

      // User 2 rates User 1
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          trade: testTrade._id.toString(),
          stars: 3,
          comment: 'Trade was okay'
        });

      // Fetch both users
      const updatedUser1 = await User.findById(testUser1._id);
      const updatedUser2 = await User.findById(testUser2._id);

      // User 1 should have average of 3 (rated by User 2)
      expect(updatedUser1.averageRating).toBe(3);
      expect(updatedUser1.ratingCount).toBe(1);

      // User 2 should have average of 5 (rated by User 1)
      expect(updatedUser2.averageRating).toBe(5);
      expect(updatedUser2.ratingCount).toBe(1);
    });

    test('should start with zero rating for new users', async () => {
      // Check initial state
      const initialUser = await User.findById(testUser2._id);
      expect(initialUser.averageRating).toBe(0);
      expect(initialUser.ratingCount).toBe(0);
    });
  });
});
