const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Wishlist = require('../models/Wishlist');
const Trade = require('../models/Trade');
const { generateToken } = require('../utils/jwt');

describe('Recommendations API', () => {
  let authToken;
  let testUser;
  let otherUser;
  let testBooks = [];

  beforeAll(async () => {
    // Create test users
    testUser = await User.create({
      name: 'Test User',
      email: 'test@recommendations.com',
      password: 'password123',
      city: 'New York',
      emailVerified: true
    });

    otherUser = await User.create({
      name: 'Other User',
      email: 'other@recommendations.com',
      password: 'password123',
      city: 'New York',
      emailVerified: true
    });

    authToken = generateToken(testUser._id);

    // Create test books owned by other user
    const bookData = [
      {
        owner: otherUser._id,
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        genre: ['Fantasy', 'Adventure'],
        condition: 'Good',
        imageUrl: 'https://example.com/hobbit.jpg',
        isAvailable: true
      },
      {
        owner: otherUser._id,
        title: 'Foundation',
        author: 'Isaac Asimov',
        genre: ['Science Fiction'],
        condition: 'Like New',
        imageUrl: 'https://example.com/foundation.jpg',
        isAvailable: true
      },
      {
        owner: otherUser._id,
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        genre: ['Fantasy', 'Adventure'],
        condition: 'Good',
        imageUrl: 'https://example.com/lotr.jpg',
        isAvailable: true
      },
      {
        owner: otherUser._id,
        title: 'Dune',
        author: 'Frank Herbert',
        genre: ['Science Fiction'],
        condition: 'New',
        imageUrl: 'https://example.com/dune.jpg',
        isAvailable: true
      }
    ];

    testBooks = await Book.insertMany(bookData);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
    await Wishlist.deleteMany({});
    await Trade.deleteMany({});
  });

  describe('GET /api/recommendations', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return recommendations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    it('should prioritize wishlist matches', async () => {
      // Add a book to wishlist
      await Wishlist.create({
        user: testUser._id,
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien'
      });

      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const recommendations = response.body.data.recommendations;
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Check if The Hobbit is in recommendations with high score
      const hobbitRec = recommendations.find(r => r.title === 'The Hobbit');
      if (hobbitRec) {
        expect(hobbitRec.recommendationScore).toBeGreaterThanOrEqual(100);
        expect(hobbitRec.recommendationReason).toContain('wishlist');
      }
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/recommendations?limit=3')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should not recommend user\'s own books', async () => {
      // Create a book owned by test user
      const ownBook = await Book.create({
        owner: testUser._id,
        title: 'My Book',
        author: 'Test Author',
        genre: ['Fiction'],
        condition: 'Good',
        imageUrl: 'https://example.com/mybook.jpg',
        isAvailable: true
      });

      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      const recommendations = response.body.data.recommendations;
      const ownBookInRecs = recommendations.find(r => r._id === ownBook._id.toString());
      expect(ownBookInRecs).toBeUndefined();
    });
  });

  describe('GET /api/recommendations/profile', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations/profile');

      expect(response.status).toBe(401);
    });

    it('should return user preference profile', async () => {
      const response = await request(app)
        .get('/api/recommendations/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('topGenres');
      expect(response.body.data).toHaveProperty('topAuthors');
      expect(response.body.data).toHaveProperty('wishlistCount');
      expect(response.body.data).toHaveProperty('receivedBooksCount');
      expect(response.body.data).toHaveProperty('ownedBooksCount');
    });

    it('should reflect wishlist in profile', async () => {
      // Clear existing wishlist
      await Wishlist.deleteMany({ user: testUser._id });

      // Add items to wishlist
      await Wishlist.create({
        user: testUser._id,
        title: 'Foundation',
        author: 'Isaac Asimov'
      });

      const response = await request(app)
        .get('/api/recommendations/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.wishlistCount).toBe(1);
      expect(response.body.data.topAuthors).toContain('Isaac Asimov');
    });
  });
});
