const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Rating = require('../models/Rating');
const { generateToken } = require('../utils/jwt');
const connectDB = require('../config/database');

/**
 * Rating Calculation Tests
 * 
 * These tests focus specifically on the rating calculation logic:
 * - Average rating calculation
 * - Rating count updates
 * - Edge cases (first rating, multiple ratings, decimal averages)
 */
describe('Rating Calculation Logic', () => {
  let testUser1, testUser2, testUser3;
  let token1, token2, token3;
  let completedTrades = [];

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
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
      city: 'New York'
    });
    await testUser1.save();

    testUser2 = new User({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
      city: 'Los Angeles'
    });
    await testUser2.save();

    testUser3 = new User({
      name: 'Charlie',
      email: 'charlie@example.com',
      password: 'password123',
      city: 'Chicago'
    });
    await testUser3.save();

    // Generate tokens
    token1 = generateToken(testUser1._id.toString());
    token2 = generateToken(testUser2._id.toString());
    token3 = generateToken(testUser3._id.toString());

    // Create multiple completed trades for testing
    completedTrades = [];
    for (let i = 0; i < 5; i++) {
      const book1 = new Book({
        owner: testUser1._id,
        title: `Book ${i * 2 + 1}`,
        author: `Author ${i * 2 + 1}`,
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: `http://example.com/image${i * 2 + 1}.jpg`
      });
      await book1.save();

      const book2 = new Book({
        owner: testUser2._id,
        title: `Book ${i * 2 + 2}`,
        author: `Author ${i * 2 + 2}`,
        genre: 'Non-Fiction',
        condition: 'Like New',
        imageUrl: `http://example.com/image${i * 2 + 2}.jpg`
      });
      await book2.save();

      const trade = new Trade({
        proposer: testUser1._id,
        receiver: testUser2._id,
        requestedBook: book2._id,
        offeredBook: book1._id,
        status: 'completed',
        completedAt: new Date()
      });
      await trade.save();
      completedTrades.push(trade);
    }
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

  describe('First Rating Edge Case', () => {
    test('should set average rating to the first rating value', async () => {
      // Verify initial state
      let user = await User.findById(testUser2._id);
      expect(user.averageRating).toBe(0);
      expect(user.ratingCount).toBe(0);

      // Submit first rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 4
        });

      // Verify rating calculation
      user = await User.findById(testUser2._id);
      expect(user.averageRating).toBe(4);
      expect(user.ratingCount).toBe(1);
    });

    test('should handle first rating of 1 star', async () => {
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 1,
          comment: 'Very poor experience'
        });

      const user = await User.findById(testUser2._id);
      expect(user.averageRating).toBe(1);
      expect(user.ratingCount).toBe(1);
    });

    test('should handle first rating of 5 stars', async () => {
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 5
        });

      const user = await User.findById(testUser2._id);
      expect(user.averageRating).toBe(5);
      expect(user.ratingCount).toBe(1);
    });
  });

  describe('Multiple Ratings Average Calculation', () => {
    test('should calculate correct average with 2 ratings', async () => {
      // Rating 1: 5 stars
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 5
        });

      // Rating 2: 3 stars
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[1]._id.toString(),
          stars: 3,
          comment: 'Average experience'
        });

      const user = await User.findById(testUser2._id);
      // Average: (5 + 3) / 2 = 4
      expect(user.averageRating).toBe(4);
      expect(user.ratingCount).toBe(2);
    });

    test('should calculate correct average with 3 ratings', async () => {
      // Submit 3 ratings: 5, 4, 3
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 5
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[1]._id.toString(),
          stars: 4
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[2]._id.toString(),
          stars: 3,
          comment: 'Okay trade'
        });

      const user = await User.findById(testUser2._id);
      // Average: (5 + 4 + 3) / 3 = 4
      expect(user.averageRating).toBe(4);
      expect(user.ratingCount).toBe(3);
    });

    test('should calculate correct average with 5 ratings', async () => {
      // Submit 5 ratings: 5, 4, 3, 2, 1
      const ratings = [5, 4, 3, 2, 1];
      
      for (let i = 0; i < ratings.length; i++) {
        const payload = {
          trade: completedTrades[i]._id.toString(),
          stars: ratings[i]
        };
        
        // Add comment for low ratings
        if (ratings[i] <= 3) {
          payload.comment = `Rating ${ratings[i]} stars`;
        }

        await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send(payload);
      }

      const user = await User.findById(testUser2._id);
      // Average: (5 + 4 + 3 + 2 + 1) / 5 = 3
      expect(user.averageRating).toBe(3);
      expect(user.ratingCount).toBe(5);
    });

    test('should calculate correct average with all 5-star ratings', async () => {
      // Submit 4 ratings, all 5 stars
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: completedTrades[i]._id.toString(),
            stars: 5
          });
      }

      const user = await User.findById(testUser2._id);
      // Average: (5 + 5 + 5 + 5) / 4 = 5
      expect(user.averageRating).toBe(5);
      expect(user.ratingCount).toBe(4);
    });

    test('should calculate correct average with all 1-star ratings', async () => {
      // Submit 3 ratings, all 1 star
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: completedTrades[i]._id.toString(),
            stars: 1,
            comment: 'Very poor experience'
          });
      }

      const user = await User.findById(testUser2._id);
      // Average: (1 + 1 + 1) / 3 = 1
      expect(user.averageRating).toBe(1);
      expect(user.ratingCount).toBe(3);
    });
  });

  describe('Decimal Average Calculation', () => {
    test('should handle decimal average (4.5)', async () => {
      // Ratings: 5, 4
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 5
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[1]._id.toString(),
          stars: 4
        });

      const user = await User.findById(testUser2._id);
      // Average: (5 + 4) / 2 = 4.5
      expect(user.averageRating).toBe(4.5);
      expect(user.ratingCount).toBe(2);
    });

    test('should handle decimal average (3.33...)', async () => {
      // Ratings: 5, 3, 2
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 5
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[1]._id.toString(),
          stars: 3,
          comment: 'Average'
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[2]._id.toString(),
          stars: 2,
          comment: 'Below average'
        });

      const user = await User.findById(testUser2._id);
      // Average: (5 + 3 + 2) / 3 = 3.333...
      expect(user.averageRating).toBeCloseTo(3.333, 2);
      expect(user.ratingCount).toBe(3);
    });

    test('should handle decimal average (2.75)', async () => {
      // Ratings: 4, 3, 2, 2
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 4
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[1]._id.toString(),
          stars: 3,
          comment: 'Okay'
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[2]._id.toString(),
          stars: 2,
          comment: 'Not great'
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[3]._id.toString(),
          stars: 2,
          comment: 'Poor'
        });

      const user = await User.findById(testUser2._id);
      // Average: (4 + 3 + 2 + 2) / 4 = 2.75
      expect(user.averageRating).toBe(2.75);
      expect(user.ratingCount).toBe(4);
    });
  });

  describe('Rating Count Updates', () => {
    test('should increment rating count with each new rating', async () => {
      let user = await User.findById(testUser2._id);
      expect(user.ratingCount).toBe(0);

      // First rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 5
        });

      user = await User.findById(testUser2._id);
      expect(user.ratingCount).toBe(1);

      // Second rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[1]._id.toString(),
          stars: 4
        });

      user = await User.findById(testUser2._id);
      expect(user.ratingCount).toBe(2);

      // Third rating
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[2]._id.toString(),
          stars: 3,
          comment: 'Okay'
        });

      user = await User.findById(testUser2._id);
      expect(user.ratingCount).toBe(3);
    });

    test('should maintain accurate count across multiple ratings', async () => {
      // Submit 5 ratings
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: completedTrades[i]._id.toString(),
            stars: 4
          });
      }

      const user = await User.findById(testUser2._id);
      expect(user.ratingCount).toBe(5);
    });
  });

  describe('Independent User Rating Calculations', () => {
    test('should calculate ratings independently for different users', async () => {
      // Create trades between different users
      const book3 = new Book({
        owner: testUser3._id,
        title: 'Book for User 3',
        author: 'Author 3',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'http://example.com/image3.jpg'
      });
      await book3.save();

      const book4 = new Book({
        owner: testUser1._id,
        title: 'Book for User 1',
        author: 'Author 1',
        genre: 'Non-Fiction',
        condition: 'Like New',
        imageUrl: 'http://example.com/image4.jpg'
      });
      await book4.save();

      const trade2 = new Trade({
        proposer: testUser3._id,
        receiver: testUser1._id,
        requestedBook: book4._id,
        offeredBook: book3._id,
        status: 'completed',
        completedAt: new Date()
      });
      await trade2.save();

      // User 1 rates User 2 with 5 stars
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 5
        });

      // User 3 rates User 1 with 2 stars
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token3}`)
        .send({
          trade: trade2._id.toString(),
          stars: 2,
          comment: 'Not satisfied'
        });

      // Check User 1's rating
      const user1 = await User.findById(testUser1._id);
      expect(user1.averageRating).toBe(2);
      expect(user1.ratingCount).toBe(1);

      // Check User 2's rating
      const user2 = await User.findById(testUser2._id);
      expect(user2.averageRating).toBe(5);
      expect(user2.ratingCount).toBe(1);

      // Check User 3's rating (no ratings received)
      const user3 = await User.findById(testUser3._id);
      expect(user3.averageRating).toBe(0);
      expect(user3.ratingCount).toBe(0);
    });

    test('should handle bidirectional ratings correctly', async () => {
      // User 1 rates User 2
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 5
        });

      // User 2 rates User 1
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 3,
          comment: 'Average experience'
        });

      // Check both users
      const user1 = await User.findById(testUser1._id);
      expect(user1.averageRating).toBe(3);
      expect(user1.ratingCount).toBe(1);

      const user2 = await User.findById(testUser2._id);
      expect(user2.averageRating).toBe(5);
      expect(user2.ratingCount).toBe(1);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle user with zero ratings', async () => {
      const user = await User.findById(testUser2._id);
      expect(user.averageRating).toBe(0);
      expect(user.ratingCount).toBe(0);
    });

    test('should maintain precision with many ratings', async () => {
      // Submit 5 ratings with varying values
      const starValues = [5, 4, 3, 4, 5];
      
      for (let i = 0; i < starValues.length; i++) {
        const payload = {
          trade: completedTrades[i]._id.toString(),
          stars: starValues[i]
        };
        
        if (starValues[i] <= 3) {
          payload.comment = 'Comment required';
        }

        await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send(payload);
      }

      const user = await User.findById(testUser2._id);
      // Average: (5 + 4 + 3 + 4 + 5) / 5 = 21 / 5 = 4.2
      expect(user.averageRating).toBe(4.2);
      expect(user.ratingCount).toBe(5);
    });

    test('should recalculate average correctly after each rating', async () => {
      // Rating 1: 5 stars
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 5
        });

      let user = await User.findById(testUser2._id);
      expect(user.averageRating).toBe(5);
      expect(user.ratingCount).toBe(1);

      // Rating 2: 3 stars (average should become 4)
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[1]._id.toString(),
          stars: 3,
          comment: 'Average'
        });

      user = await User.findById(testUser2._id);
      expect(user.averageRating).toBe(4);
      expect(user.ratingCount).toBe(2);

      // Rating 3: 4 stars (average should become 4)
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[2]._id.toString(),
          stars: 4
        });

      user = await User.findById(testUser2._id);
      expect(user.averageRating).toBe(4);
      expect(user.ratingCount).toBe(3);
    });

    test('should handle mix of high and low ratings', async () => {
      // Ratings: 5, 1, 5, 1
      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[0]._id.toString(),
          stars: 5
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[1]._id.toString(),
          stars: 1,
          comment: 'Very poor'
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[2]._id.toString(),
          stars: 5
        });

      await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          trade: completedTrades[3]._id.toString(),
          stars: 1,
          comment: 'Terrible'
        });

      const user = await User.findById(testUser2._id);
      // Average: (5 + 1 + 5 + 1) / 4 = 3
      expect(user.averageRating).toBe(3);
      expect(user.ratingCount).toBe(4);
    });
  });

  describe('Rating Calculation Consistency', () => {
    test('should match manual calculation of average', async () => {
      const starValues = [5, 4, 3, 5, 2];
      
      // Submit ratings
      for (let i = 0; i < starValues.length; i++) {
        const payload = {
          trade: completedTrades[i]._id.toString(),
          stars: starValues[i]
        };
        
        if (starValues[i] <= 3) {
          payload.comment = 'Comment for low rating';
        }

        await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send(payload);
      }

      // Manual calculation
      const sum = starValues.reduce((acc, val) => acc + val, 0);
      const expectedAverage = sum / starValues.length;

      const user = await User.findById(testUser2._id);
      expect(user.averageRating).toBe(expectedAverage);
      expect(user.ratingCount).toBe(starValues.length);
    });

    test('should verify rating count matches number of ratings in database', async () => {
      // Submit 3 ratings
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/ratings')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            trade: completedTrades[i]._id.toString(),
            stars: 4
          });
      }

      const user = await User.findById(testUser2._id);
      const ratingsInDb = await Rating.countDocuments({ ratedUser: testUser2._id });

      expect(user.ratingCount).toBe(ratingsInDb);
      expect(user.ratingCount).toBe(3);
    });
  });
});
