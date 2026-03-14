/**
 * JWT Validation Tests for Protected Routes (Requirement 15.5)
 * 
 * This test suite verifies that:
 * 1. Authentication middleware is applied to all protected endpoints
 * 2. JWT signature and expiration are verified on each request
 * 3. 401 errors are returned for missing or invalid tokens
 * 4. Protected routes cannot be accessed without authentication
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Wishlist = require('../models/Wishlist');
const Message = require('../models/Message');
const Rating = require('../models/Rating');
const Notification = require('../models/Notification');
const { generateToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/database');

describe('JWT Validation on Protected Routes (Req 15.5)', () => {
  let testUser;
  let validToken;
  let testBook;
  let testUser2;
  let testTrade;

  beforeAll(async () => {
    // Connect to test database
    await connectDB();
    
    // Create test users
    testUser = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      city: 'Test City'
    });

    testUser2 = await User.create({
      name: 'Test User 2',
      email: 'testuser2@example.com',
      password: 'password123',
      city: 'Test City 2'
    });

    // Generate valid token
    validToken = generateToken(testUser._id);

    // Create test book
    testBook = await Book.create({
      owner: testUser._id,
      title: 'Test Book',
      author: 'Test Author',
      genre: 'Fiction',
      condition: 'Good',
      imageUrl: 'https://example.com/image.jpg'
    });

    // Create test trade
    const testBook2 = await Book.create({
      owner: testUser2._id,
      title: 'Test Book 2',
      author: 'Test Author 2',
      genre: 'Fiction',
      condition: 'Good',
      imageUrl: 'https://example.com/image2.jpg'
    });

    testTrade = await Trade.create({
      proposer: testUser._id,
      receiver: testUser2._id,
      requestedBook: testBook2._id,
      offeredBook: testBook._id,
      status: 'accepted'
    });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Book.deleteMany({});
    await Trade.deleteMany({});
    await Wishlist.deleteMany({});
    await Message.deleteMany({});
    await Rating.deleteMany({});
    await Notification.deleteMany({});
    
    // Close database connection
    await mongoose.connection.close();
  });

  describe('Authentication Middleware - Missing Token', () => {
    test('GET /api/auth/me should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('POST /api/auth/logout should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('PUT /api/auth/profile should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'New Name' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('PUT /api/auth/change-password should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .send({ currentPassword: 'old', newPassword: 'new123456' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('Book Routes - Protected Endpoints', () => {
    test('POST /api/books should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({
          title: 'New Book',
          author: 'Author',
          genre: 'Fiction',
          condition: 'Good'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('PUT /api/books/:id should return 401 without token', async () => {
      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('DELETE /api/books/:id should return 401 without token', async () => {
      const response = await request(app)
        .delete(`/api/books/${testBook._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('Wishlist Routes - Protected Endpoints', () => {
    test('POST /api/wishlist should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/wishlist')
        .send({
          title: 'Wishlist Book',
          author: 'Author'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('GET /api/wishlist/matches should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/wishlist/matches');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('DELETE /api/wishlist/:id should return 401 without token', async () => {
      const response = await request(app)
        .delete('/api/wishlist/507f1f77bcf86cd799439011');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('Trade Routes - Protected Endpoints', () => {
    test('GET /api/trades should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/trades');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('POST /api/trades should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/trades')
        .send({
          requestedBook: testBook._id,
          offeredBook: testBook._id
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('PUT /api/trades/:id/accept should return 401 without token', async () => {
      const response = await request(app)
        .put(`/api/trades/${testTrade._id}/accept`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('PUT /api/trades/:id/decline should return 401 without token', async () => {
      const response = await request(app)
        .put(`/api/trades/${testTrade._id}/decline`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('PUT /api/trades/:id/complete should return 401 without token', async () => {
      const response = await request(app)
        .put(`/api/trades/${testTrade._id}/complete`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('Message Routes - Protected Endpoints', () => {
    test('POST /api/messages should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({
          trade: testTrade._id,
          content: 'Test message'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('GET /api/messages/trade/:tradeId should return 401 without token', async () => {
      const response = await request(app)
        .get(`/api/messages/trade/${testTrade._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('Rating Routes - Protected Endpoints', () => {
    test('POST /api/ratings should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          trade: testTrade._id,
          stars: 5,
          comment: 'Great trade'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('GET /api/ratings/trade/:tradeId should return 401 without token', async () => {
      const response = await request(app)
        .get(`/api/ratings/trade/${testTrade._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('Notification Routes - Protected Endpoints', () => {
    test('GET /api/notifications should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/notifications');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('PUT /api/notifications/:id/read should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/notifications/507f1f77bcf86cd799439011/read');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('PUT /api/notifications/read-all should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/notifications/read-all');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('Authentication Middleware - Invalid Token', () => {
    test('GET /api/auth/me should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    test('POST /api/books should return 401 with malformed token', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', 'InvalidFormat token')
        .send({
          title: 'New Book',
          author: 'Author',
          genre: 'Fiction',
          condition: 'Good'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('POST /api/trades should return 401 with expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({
          requestedBook: testBook._id,
          offeredBook: testBook._id
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Authentication Middleware - Valid Token', () => {
    test('GET /api/auth/me should succeed with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    test('PUT /api/auth/profile should succeed with valid token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/trades should succeed with valid token', async () => {
      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/notifications should succeed with valid token', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('JWT Signature Verification', () => {
    test('Should reject token with invalid signature', async () => {
      // Create a token with wrong secret
      const invalidToken = jwt.sign(
        { id: testUser._id },
        'wrong_secret_key',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    test('Should reject token with tampered payload', async () => {
      // Create a valid token then tamper with it
      const parts = validToken.split('.');
      const tamperedPayload = Buffer.from(JSON.stringify({ id: 'fake_id' })).toString('base64');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('JWT Expiration Verification', () => {
    test('Should reject token that expired 1 day ago', async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '-1d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    test('Should accept token that expires in the future', async () => {
      const futureToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${futureToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('User Existence Verification', () => {
    test('Should reject valid token for non-existent user', async () => {
      // Create token for non-existent user
      const fakeUserId = '507f1f77bcf86cd799439011';
      const fakeToken = generateToken(fakeUserId);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('Public Routes - No Authentication Required', () => {
    test('POST /api/auth/register should work without token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Public User',
          email: 'public@example.com',
          password: 'password123',
          city: 'Public City'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('POST /api/auth/login should work without token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/books should work without token', async () => {
      const response = await request(app)
        .get('/api/books');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/books/:id should work without token', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/users/:userId should work without token', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/wishlist/user/:userId should work without token', async () => {
      const response = await request(app)
        .get(`/api/wishlist/user/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/ratings/user/:userId should work without token', async () => {
      const response = await request(app)
        .get(`/api/ratings/user/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
