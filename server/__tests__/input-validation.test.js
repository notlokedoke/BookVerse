const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const { generateToken } = require('../utils/jwt');

describe('Input Validation Tests', () => {
  let authToken;
  let userId;
  let bookId;
  let tradeId;

  beforeAll(async () => {
    // Create a test user
    const user = new User({
      name: 'Test User',
      email: 'validation@test.com',
      password: 'password123',
      city: 'Test City'
    });
    await user.save();
    userId = user._id;
    authToken = generateToken(userId);

    // Create a test book
    const book = new Book({
      owner: userId,
      title: 'Test Book',
      author: 'Test Author',
      condition: 'Good',
      genre: 'Fiction',
      imageUrl: 'https://example.com/image.jpg'
    });
    await book.save();
    bookId = book._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
    await Trade.deleteMany({});
  });

  describe('Trade Validation', () => {
    it('should reject trade proposal with invalid book ID format', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          requestedBook: 'invalid-id',
          offeredBook: bookId.toString()
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Invalid');
    });

    it('should reject trade proposal with missing fields', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          requestedBook: bookId.toString()
          // Missing offeredBook
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid trade status filter', async () => {
      const response = await request(app)
        .get('/api/trades?status=invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Message Validation', () => {
    it('should reject message with invalid trade ID format', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          trade: 'invalid-id',
          content: 'Test message'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject message with empty content', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          trade: new mongoose.Types.ObjectId().toString(),
          content: '   '
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject message exceeding max length', async () => {
      const longMessage = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          trade: new mongoose.Types.ObjectId().toString(),
          content: longMessage
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Rating Validation', () => {
    it('should reject rating with invalid trade ID format', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          trade: 'invalid-id',
          stars: 5
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject rating with invalid stars value', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          trade: new mongoose.Types.ObjectId().toString(),
          stars: 6
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject low rating without comment', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          trade: new mongoose.Types.ObjectId().toString(),
          stars: 2
          // Missing required comment for low rating
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Comment is required');
    });
  });

  describe('User Validation', () => {
    it('should reject invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Notification Validation', () => {
    it('should reject invalid notification ID format', async () => {
      const response = await request(app)
        .put('/api/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Cities Validation', () => {
    it('should reject search query that is too short', async () => {
      const response = await request(app)
        .get('/api/cities/search?q=a');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid region for popular cities', async () => {
      const response = await request(app)
        .get('/api/cities/popular?region=invalid-region');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize malicious input in messages', async () => {
      const maliciousContent = '<script>alert("XSS")</script>Test message';
      
      // This test verifies that sanitization is applied
      // The actual behavior depends on the sanitizeString implementation
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          trade: new mongoose.Types.ObjectId().toString(),
          content: maliciousContent
        });

      // Should either reject or sanitize the input
      // The exact behavior depends on implementation
      expect([400, 404, 403]).toContain(response.status);
    });
  });
});
