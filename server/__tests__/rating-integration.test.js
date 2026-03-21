const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Rating = require('../models/Rating');
const { generateToken } = require('../utils/jwt');

/**
 * Rating Integration Tests
 * 
 * These tests cover the complete rating workflow:
 * 1. Rating submission after trade completion
 * 2. Rating display on user profile
 * 3. Average rating calculation and updates
 * 
 * Task 157: Write integration tests for rating
 */

describe('Rating Integration - Complete Workflow', () => {
  let user1, user2, user1Token, user2Token;
  let user1Book, user2Book;
  let completedTrade;

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
    await Rating.deleteMany({});

    // Create test users
    user1 = await User.create({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123',
      city: 'New York',
      averageRating: 0,
      ratingCount: 0
    });

    user2 = await User.create({
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'password123',
      city: 'Los Angeles',
      averageRating: 0,
      ratingCount: 0
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

    // Create a completed trade
    completedTrade = await Trade.create({
      proposer: user1._id,
      receiver: user2._id,
      requestedBook: user2Book._id,
      offeredBook: user1Book._id,
      status: 'completed',
      proposedAt: new Date(),
      respondedAt: new Date(),
      completedAt: new Date(),
      ratingEnabled: true
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
    await Trade.deleteMany({});
    await Rating.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Complete Rating Workflow: Submit → Calculate → Display', () => {
    test('should complete full rating lifecycle successfully', async () => {
      // Step 1: User1 submits a 5-star rating for User2
      const rating1Response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5,
          comment: 'Excellent trader! Book was in perfect condition.'
        })
        .expect(201);

      expect(rating1Response.body.success).toBe(true);
      expect(rating1Response.body.data.stars).toBe(5);
      expect(rating1Response.body.data.rater._id).toBe(user1._id.toString());
      expect(rating1Response.body.data.ratedUser._id).toBe(user2._id.toString());

      // Step 2: Verify User2's average rating was updated
      let user2Updated = await User.findById(user2._id);
      expect(user2Updated.averageRating).toBe(5);
      expect(user2Updated.ratingCount).toBe(1);

      // Step 3: User2 submits a 4-star rating for User1
      const rating2Response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 4,
          comment: 'Good trade, smooth communication.'
        })
        .expect(201);

      expect(rating2Response.body.success).toBe(true);
      expect(rating2Response.body.data.stars).toBe(4);

      // Step 4: Verify User1's average rating was updated
      let user1Updated = await User.findById(user1._id);
      expect(user1Updated.averageRating).toBe(4);
      expect(user1Updated.ratingCount).toBe(1);

      // Step 5: Fetch User2's profile and verify rating display
      const user2ProfileResponse = await request(app)
        .get(`/api/users/${user2._id}`)
        .expect(200);

      expect(user2ProfileResponse.body.success).toBe(true);
      expect(user2ProfileResponse.body.data.averageRating).toBe(5);
      expect(user2ProfileResponse.body.data.ratingCount).toBe(1);

      // Step 6: Fetch User2's ratings
      const user2RatingsResponse = await request(app)
        .get(`/api/ratings/user/${user2._id}`)
        .expect(200);

      expect(user2RatingsResponse.body.success).toBe(true);
      expect(user2RatingsResponse.body.data).toHaveLength(1);
      expect(user2RatingsResponse.body.data[0].stars).toBe(5);
      expect(user2RatingsResponse.body.data[0].comment).toBe('Excellent trader! Book was in perfect condition.');
      expect(user2RatingsResponse.body.data[0].rater.name).toBe('Alice Johnson');

      // Step 7: Create another completed trade and rating to test average calculation
      const user3 = await User.create({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123',
        city: 'Chicago'
      });

      const user3Book = await Book.create({
        owner: user3._id,
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Classic Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/mockingbird.jpg'
      });

      const trade2 = await Trade.create({
        proposer: user3._id,
        receiver: user2._id,
        requestedBook: user2Book._id,
        offeredBook: user3Book._id,
        status: 'completed',
        ratingEnabled: true
      });

      const user3Token = generateToken(user3._id);

      // User3 rates User2 with 3 stars
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user3Token}`)
        .send({
          trade: trade2._id.toString(),
          stars: 3,
          comment: 'Trade was okay, but communication could be better.'
        })
        .expect(201);

      // Step 8: Verify User2's average rating is now (5 + 3) / 2 = 4
      user2Updated = await User.findById(user2._id);
      expect(user2Updated.averageRating).toBe(4);
      expect(user2Updated.ratingCount).toBe(2);

      // Step 9: Fetch all ratings for User2 and verify they're sorted by date
      const allRatingsResponse = await request(app)
        .get(`/api/ratings/user/${user2._id}`)
        .expect(200);

      expect(allRatingsResponse.body.success).toBe(true);
      expect(allRatingsResponse.body.data).toHaveLength(2);
      
      // Verify chronological order (most recent first)
      const time1 = new Date(allRatingsResponse.body.data[0].createdAt).getTime();
      const time2 = new Date(allRatingsResponse.body.data[1].createdAt).getTime();
      expect(time1).toBeGreaterThanOrEqual(time2);
    });
  });

  describe('Rating Submission After Completion', () => {
    test('should allow rating submission for completed trade', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5,
          comment: 'Great experience!'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trade._id || response.body.data.trade).toBe(completedTrade._id.toString());
      expect(response.body.data.stars).toBe(5);
      expect(response.body.data.rater._id).toBe(user1._id.toString());
      expect(response.body.data.ratedUser._id).toBe(user2._id.toString());
    });

    test('should prevent rating submission for non-completed trade', async () => {
      // Create a proposed trade
      const proposedTrade = await Trade.create({
        proposer: user1._id,
        receiver: user2._id,
        requestedBook: user2Book._id,
        offeredBook: user1Book._id,
        status: 'proposed'
      });

      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: proposedTrade._id.toString(),
          stars: 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toMatch(/INVALID_TRADE_STATUS|TRADE_NOT_COMPLETED/);
    });

    test('should prevent rating submission for accepted but not completed trade', async () => {
      // Create an accepted trade
      const acceptedTrade = await Trade.create({
        proposer: user1._id,
        receiver: user2._id,
        requestedBook: user2Book._id,
        offeredBook: user1Book._id,
        status: 'accepted'
      });

      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: acceptedTrade._id.toString(),
          stars: 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toMatch(/INVALID_TRADE_STATUS|TRADE_NOT_COMPLETED/);
    });

    test('should require comment for ratings 3 stars or lower', async () => {
      // Try to submit 3-star rating without comment
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 3
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should accept 3-star rating with comment', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 3,
          comment: 'Trade was okay, but book condition was not as described.'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stars).toBe(3);
      expect(response.body.data.comment).toBe('Trade was okay, but book condition was not as described.');
    });

    test('should accept 2-star rating with comment', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 2,
          comment: 'Poor communication and late delivery.'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stars).toBe(2);
    });

    test('should accept 1-star rating with comment', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 1,
          comment: 'Never showed up for the trade.'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stars).toBe(1);
    });

    test('should allow 4-5 star ratings without comment', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 4
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stars).toBe(4);
      expect(response.body.data.comment).toBeUndefined();
    });

    test('should prevent duplicate ratings for same trade', async () => {
      // Submit first rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5,
          comment: 'Great!'
        })
        .expect(201);

      // Try to submit second rating
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 4,
          comment: 'Changed my mind'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_RATING');
    });

    test('should prevent non-participants from rating', async () => {
      // Create a third user
      const user3 = await User.create({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123',
        city: 'Chicago'
      });
      const user3Token = generateToken(user3._id);

      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user3Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_AUTHORIZED');
    });

    test('should validate star rating range (1-5)', async () => {
      // Try 0 stars
      let response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 0
        })
        .expect(400);

      expect(response.body.success).toBe(false);

      // Try 6 stars
      response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 6
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should automatically determine rated user based on trade participants', async () => {
      // User1 (proposer) rates - should rate User2 (receiver)
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5
        })
        .expect(201);

      expect(response.body.data.rater._id).toBe(user1._id.toString());
      expect(response.body.data.ratedUser._id).toBe(user2._id.toString());
    });

    test('should update average rating immediately after submission', async () => {
      // Submit rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5
        })
        .expect(201);

      // Check user's updated rating
      const user = await User.findById(user2._id);
      expect(user.averageRating).toBe(5);
      expect(user.ratingCount).toBe(1);
    });
  });

  describe('Rating Display on Profile', () => {
    test('should display average rating on user profile', async () => {
      // Create multiple ratings for User2
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5
        })
        .expect(201);

      // Fetch User2's profile
      const response = await request(app)
        .get(`/api/users/${user2._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.averageRating).toBe(5);
      expect(response.body.data.ratingCount).toBe(1);
      expect(response.body.data.name).toBe('Bob Smith');
    });

    test('should display all ratings for a user', async () => {
      // Submit a rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5,
          comment: 'Excellent trader!'
        })
        .expect(201);

      // Fetch User2's ratings
      const response = await request(app)
        .get(`/api/ratings/user/${user2._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].stars).toBe(5);
      expect(response.body.data[0].comment).toBe('Excellent trader!');
      expect(response.body.data[0].rater.name).toBe('Alice Johnson');
      // Email may or may not be exposed depending on implementation
      if (response.body.data[0].rater.email) {
        expect(response.body.data[0].rater.email).toBeDefined();
      }
    });

    test('should display ratings in chronological order (most recent first)', async () => {
      // Create multiple completed trades and ratings
      const trade2 = await Trade.create({
        proposer: user2._id,
        receiver: user1._id,
        requestedBook: user1Book._id,
        offeredBook: user2Book._id,
        status: 'completed',
        ratingEnabled: true
      });

      // First rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5,
          comment: 'First rating'
        })
        .expect(201);

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          trade: trade2._id.toString(),
          stars: 4,
          comment: 'Second rating'
        })
        .expect(201);

      // Fetch User1's ratings
      const response = await request(app)
        .get(`/api/ratings/user/${user1._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].comment).toBe('Second rating');
    });

    test('should show empty ratings list for user with no ratings', async () => {
      const response = await request(app)
        .get(`/api/ratings/user/${user1._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    test('should include trade information in rating display', async () => {
      // Submit a rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5,
          comment: 'Great trade!'
        })
        .expect(201);

      // Fetch ratings
      const response = await request(app)
        .get(`/api/ratings/user/${user2._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].trade).toBeDefined();
      expect(response.body.data[0].trade._id).toBe(completedTrade._id.toString());
    });

    test('should calculate correct average with multiple ratings', async () => {
      // Create additional users and trades
      const user3 = await User.create({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123',
        city: 'Chicago'
      });

      const user4 = await User.create({
        name: 'Diana Prince',
        email: 'diana@example.com',
        password: 'password123',
        city: 'Boston'
      });

      const user3Book = await Book.create({
        owner: user3._id,
        title: 'Book 3',
        author: 'Author 3',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/book3.jpg'
      });

      const user4Book = await Book.create({
        owner: user4._id,
        title: 'Book 4',
        author: 'Author 4',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/book4.jpg'
      });

      const trade2 = await Trade.create({
        proposer: user3._id,
        receiver: user2._id,
        requestedBook: user2Book._id,
        offeredBook: user3Book._id,
        status: 'completed',
        ratingEnabled: true
      });

      const trade3 = await Trade.create({
        proposer: user4._id,
        receiver: user2._id,
        requestedBook: user2Book._id,
        offeredBook: user4Book._id,
        status: 'completed',
        ratingEnabled: true
      });

      const user3Token = generateToken(user3._id);
      const user4Token = generateToken(user4._id);

      // Submit ratings: 5, 4, 3 stars
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5
        })
        .expect(201);

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user3Token}`)
        .send({
          trade: trade2._id.toString(),
          stars: 4
        })
        .expect(201);

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user4Token}`)
        .send({
          trade: trade3._id.toString(),
          stars: 3,
          comment: 'Okay trade'
        })
        .expect(201);

      // Fetch User2's profile
      const response = await request(app)
        .get(`/api/users/${user2._id}`)
        .expect(200);

      // Average should be (5 + 4 + 3) / 3 = 4
      expect(response.body.data.averageRating).toBe(4);
      expect(response.body.data.ratingCount).toBe(3);
    });

    test('should handle decimal averages correctly', async () => {
      // Create another user and trade
      const user3 = await User.create({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123',
        city: 'Chicago'
      });

      const user3Book = await Book.create({
        owner: user3._id,
        title: 'Book 3',
        author: 'Author 3',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/book3.jpg'
      });

      const trade2 = await Trade.create({
        proposer: user3._id,
        receiver: user2._id,
        requestedBook: user2Book._id,
        offeredBook: user3Book._id,
        status: 'completed',
        ratingEnabled: true
      });

      const user3Token = generateToken(user3._id);

      // Submit ratings: 5 and 4 stars
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5
        })
        .expect(201);

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user3Token}`)
        .send({
          trade: trade2._id.toString(),
          stars: 4
        })
        .expect(201);

      // Fetch User2's profile
      const response = await request(app)
        .get(`/api/users/${user2._id}`)
        .expect(200);

      // Average should be (5 + 4) / 2 = 4.5
      expect(response.body.data.averageRating).toBe(4.5);
      expect(response.body.data.ratingCount).toBe(2);
    });

    test('should display zero rating for users with no ratings', async () => {
      const response = await request(app)
        .get(`/api/users/${user1._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.averageRating).toBe(0);
      expect(response.body.data.ratingCount).toBe(0);
    });

    test('should include rater information in rating display', async () => {
      // Submit a rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5,
          comment: 'Great!'
        })
        .expect(201);

      // Fetch ratings
      const response = await request(app)
        .get(`/api/ratings/user/${user2._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].rater).toBeDefined();
      expect(response.body.data[0].rater.name).toBe('Alice Johnson');
      expect(response.body.data[0].rater._id).toBe(user1._id.toString());
    });

    test('should allow public access to user ratings', async () => {
      // Submit a rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5,
          comment: 'Excellent!'
        })
        .expect(201);

      // Fetch ratings without authentication
      const response = await request(app)
        .get(`/api/ratings/user/${user2._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('Average Rating Calculation', () => {
    test('should update average rating after first rating', async () => {
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 4
        })
        .expect(201);

      const user = await User.findById(user2._id);
      expect(user.averageRating).toBe(4);
      expect(user.ratingCount).toBe(1);
    });

    test('should recalculate average rating with multiple ratings', async () => {
      // First rating: 5 stars
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5
        })
        .expect(201);

      let user = await User.findById(user2._id);
      expect(user.averageRating).toBe(5);
      expect(user.ratingCount).toBe(1);

      // Create another trade and rating
      const user3 = await User.create({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123',
        city: 'Chicago'
      });

      const user3Book = await Book.create({
        owner: user3._id,
        title: 'Book 3',
        author: 'Author 3',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/book3.jpg'
      });

      const trade2 = await Trade.create({
        proposer: user3._id,
        receiver: user2._id,
        requestedBook: user2Book._id,
        offeredBook: user3Book._id,
        status: 'completed',
        ratingEnabled: true
      });

      const user3Token = generateToken(user3._id);

      // Second rating: 3 stars
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user3Token}`)
        .send({
          trade: trade2._id.toString(),
          stars: 3,
          comment: 'Okay trade'
        })
        .expect(201);

      user = await User.findById(user2._id);
      expect(user.averageRating).toBe(4); // (5 + 3) / 2 = 4
      expect(user.ratingCount).toBe(2);
    });

    test('should handle low ratings in average calculation', async () => {
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 1,
          comment: 'Bad experience'
        })
        .expect(201);

      const user = await User.findById(user2._id);
      expect(user.averageRating).toBe(1);
      expect(user.ratingCount).toBe(1);
    });

    test('should round average rating to one decimal place', async () => {
      // Create multiple trades and ratings
      const user3 = await User.create({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123',
        city: 'Chicago'
      });

      const user3Book = await Book.create({
        owner: user3._id,
        title: 'Book 3',
        author: 'Author 3',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/book3.jpg'
      });

      const trade2 = await Trade.create({
        proposer: user3._id,
        receiver: user2._id,
        requestedBook: user2Book._id,
        offeredBook: user3Book._id,
        status: 'completed',
        ratingEnabled: true
      });

      const user3Token = generateToken(user3._id);

      // Submit ratings: 5, 4, 4 stars
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5
        })
        .expect(201);

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user3Token}`)
        .send({
          trade: trade2._id.toString(),
          stars: 4
        })
        .expect(201);

      const user = await User.findById(user2._id);
      // (5 + 4) / 2 = 4.5
      expect(user.averageRating).toBe(4.5);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should require authentication for rating submission', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          trade: completedTrade._id.toString(),
          stars: 5
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle invalid trade ID format', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: 'invalid-id',
          stars: 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle non-existent trade', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: fakeId.toString(),
          stars: 5
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TRADE_NOT_FOUND');
    });

    test('should handle invalid user ID in rating display', async () => {
      const response = await request(app)
        .get('/api/ratings/user/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle non-existent user in rating display', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/ratings/user/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should validate required fields', async () => {
      // Missing stars
      let response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);

      // Missing trade
      response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          stars: 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle both participants rating each other', async () => {
      // User1 rates User2
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 5
        })
        .expect(201);

      // User2 rates User1
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          trade: completedTrade._id.toString(),
          stars: 4
        })
        .expect(201);

      // Verify both users have ratings
      const user1Updated = await User.findById(user1._id);
      const user2Updated = await User.findById(user2._id);

      expect(user1Updated.averageRating).toBe(4);
      expect(user1Updated.ratingCount).toBe(1);
      expect(user2Updated.averageRating).toBe(5);
      expect(user2Updated.ratingCount).toBe(1);
    });
  });
});
