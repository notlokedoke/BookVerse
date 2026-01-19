const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Book = require('../models/Book');
const connectDB = require('../config/database');

describe('Rating Model', () => {
  let testUser1, testUser2, testBook1, testBook2, testTrade;

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    // Clean up database
    await Rating.deleteMany({});
    await User.deleteMany({});
    await Trade.deleteMany({});
    await Book.deleteMany({});

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

    // Create test trade
    testTrade = new Trade({
      proposer: testUser1._id,
      receiver: testUser2._id,
      requestedBook: testBook2._id,
      offeredBook: testBook1._id,
      status: 'completed'
    });
    await testTrade.save();
  });

  afterEach(async () => {
    await Rating.deleteMany({});
    await User.deleteMany({});
    await Trade.deleteMany({});
    await Book.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    test('should create a valid rating with all required fields', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 5,
        comment: 'Great trade!'
      });

      const savedRating = await rating.save();

      expect(savedRating._id).toBeDefined();
      expect(savedRating.trade.toString()).toBe(testTrade._id.toString());
      expect(savedRating.rater.toString()).toBe(testUser1._id.toString());
      expect(savedRating.ratedUser.toString()).toBe(testUser2._id.toString());
      expect(savedRating.stars).toBe(5);
      expect(savedRating.comment).toBe('Great trade!');
      expect(savedRating.createdAt).toBeDefined();
    });

    test('should create a rating without comment for 4-5 stars', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 4
      });

      const savedRating = await rating.save();

      expect(savedRating._id).toBeDefined();
      expect(savedRating.stars).toBe(4);
      expect(savedRating.comment).toBeUndefined();
    });

    test('should fail validation when trade is missing', async () => {
      const rating = new Rating({
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 5
      });

      await expect(rating.save()).rejects.toThrow();
    });

    test('should fail validation when rater is missing', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        ratedUser: testUser2._id,
        stars: 5
      });

      await expect(rating.save()).rejects.toThrow();
    });

    test('should fail validation when ratedUser is missing', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        stars: 5
      });

      await expect(rating.save()).rejects.toThrow();
    });

    test('should fail validation when stars is missing', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id
      });

      await expect(rating.save()).rejects.toThrow();
    });

    test('should fail validation when stars is less than 1', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 0
      });

      await expect(rating.save()).rejects.toThrow();
    });

    test('should fail validation when stars is greater than 5', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 6
      });

      await expect(rating.save()).rejects.toThrow();
    });

    test('should fail validation when stars is not an integer', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 3.5
      });

      await expect(rating.save()).rejects.toThrow();
    });

    test('should require comment for 3 stars or lower', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 3
      });

      await expect(rating.save()).rejects.toThrow();
    });

    test('should accept rating with comment for 3 stars', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 3,
        comment: 'Trade was okay, but book condition was not as described'
      });

      const savedRating = await rating.save();

      expect(savedRating._id).toBeDefined();
      expect(savedRating.stars).toBe(3);
      expect(savedRating.comment).toBe('Trade was okay, but book condition was not as described');
    });

    test('should accept rating with comment for 2 stars', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 2,
        comment: 'Poor communication and late delivery'
      });

      const savedRating = await rating.save();

      expect(savedRating._id).toBeDefined();
      expect(savedRating.stars).toBe(2);
      expect(savedRating.comment).toBe('Poor communication and late delivery');
    });

    test('should accept rating with comment for 1 star', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 1,
        comment: 'Never showed up for the trade'
      });

      const savedRating = await rating.save();

      expect(savedRating._id).toBeDefined();
      expect(savedRating.stars).toBe(1);
      expect(savedRating.comment).toBe('Never showed up for the trade');
    });

    test('should trim whitespace from comment', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 3,
        comment: '  Trade was okay  '
      });

      const savedRating = await rating.save();

      expect(savedRating.comment).toBe('Trade was okay');
    });

    test('should fail validation when comment is empty string for low rating', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 2,
        comment: '   '
      });

      await expect(rating.save()).rejects.toThrow();
    });
  });

  describe('Unique Constraint', () => {
    test('should prevent duplicate ratings for same trade and rater', async () => {
      // Create first rating
      const rating1 = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 5,
        comment: 'Great trade!'
      });
      await rating1.save();

      // Attempt to create duplicate rating
      const rating2 = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 4,
        comment: 'Different comment'
      });

      await expect(rating2.save()).rejects.toThrow();
    });

    test('should allow different users to rate the same trade', async () => {
      // User 1 rates User 2
      const rating1 = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 5
      });
      await rating1.save();

      // User 2 rates User 1
      const rating2 = new Rating({
        trade: testTrade._id,
        rater: testUser2._id,
        ratedUser: testUser1._id,
        stars: 4
      });
      const savedRating2 = await rating2.save();

      expect(savedRating2._id).toBeDefined();
      expect(savedRating2.rater.toString()).toBe(testUser2._id.toString());
    });
  });

  describe('Indexes', () => {
    test('should have compound unique index on trade and rater', async () => {
      const indexes = Rating.schema.indexes();
      const compoundIndex = indexes.find(
        index => index[0].trade === 1 && index[0].rater === 1
      );

      expect(compoundIndex).toBeDefined();
      expect(compoundIndex[1].unique).toBe(true);
    });

    test('should have index on ratedUser', async () => {
      const indexes = Rating.schema.indexes();
      const ratedUserIndex = indexes.find(
        index => index[0].ratedUser === 1 && !index[0].createdAt
      );

      expect(ratedUserIndex).toBeDefined();
    });

    test('should have index on createdAt', async () => {
      const indexes = Rating.schema.indexes();
      const createdAtIndex = indexes.find(
        index => index[0].createdAt === -1 && !index[0].ratedUser
      );

      expect(createdAtIndex).toBeDefined();
    });
  });

  describe('Population', () => {
    test('should populate trade, rater, and ratedUser references', async () => {
      const rating = new Rating({
        trade: testTrade._id,
        rater: testUser1._id,
        ratedUser: testUser2._id,
        stars: 5,
        comment: 'Excellent trade!'
      });
      await rating.save();

      const populatedRating = await Rating.findById(rating._id)
        .populate('trade')
        .populate('rater', 'name email')
        .populate('ratedUser', 'name email');

      expect(populatedRating.trade._id.toString()).toBe(testTrade._id.toString());
      expect(populatedRating.rater.name).toBe('John Doe');
      expect(populatedRating.ratedUser.name).toBe('Jane Smith');
    });
  });
});
