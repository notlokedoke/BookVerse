/**
 * Error Scenarios Tests
 * 
 * Task 161: Test error scenarios
 * 
 * This test suite covers:
 * 1. Network/Parsing failure handling (Invalid JSON)
 * 2. Invalid input handling (Format, length constraints)
 * 3. Unauthorized access attempts (Missing/Invalid tokens)
 * 4. Edge cases (Empty states, invalid IDs, missing data)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Book = require('../models/Book');
const connectDB = require('../config/database');
const { clearDatabase, generateRandomEmail, createTestUser } = require('./test-utils');

describe('Error Scenarios and Edge Cases', () => {
  let user, userToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await clearDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    user = await createTestUser({
      name: 'Error Test User',
      email: generateRandomEmail(),
      city: 'Test City'
    });
    userToken = require('../utils/jwt').generateToken(user._id);
  });

  describe('1. Network / Parsing Failure (Bad Requests)', () => {
    test('should return 400 or 500 when sending malformed JSON', async () => {
      // Sending invalid JSON to an endpoint that expects JSON
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@test.com", "password": "password"'); // Missing closing brace

      // Express body-parser usually returns a 400 Bad Request if it fails to parse JSON
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.text).toContain('Expected'); // E.g., 'Expected \',\' ...'
    });
  });

  describe('2. Invalid Input Handling', () => {
    test('should reject extremely long inputs exceeding constraints', async () => {
      const veryLongString = 'a'.repeat(300); // Beyond allowed lengths for titles
      
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: veryLongString,
          author: 'Test Author',
          condition: 'Good',
          genre: 'Fiction'
        });

      // Based on validation middleware, we should get 400
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      // Even if it triggers a required field validation early, it's rejected. We just verify 400.
      expect(res.body.error).toBeDefined();
    });

    test('should reject missing required fields with descriptive errors', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // Missing title, author, condition
          description: 'A description but no title'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toBeDefined();
    });
    
    test('should reject invalid ratings outside of 1-5 bounds', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          trade: fakeId,
          stars: 6, // Invalid stars
          comment: 'Too many stars!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('3. Unauthorized Access Attempts', () => {
    test('should reject access with no token provided', async () => {
      const res = await request(app)
        .get('/api/auth/me'); // Protected route

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NO_TOKEN');
    });

    test('should reject access with structurally invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer NotARealTokenAtAll');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    test('should reject access with token that has valid signature but wrong secret/fake payload', async () => {
      const jwt = require('jsonwebtoken');
      const badToken = jwt.sign({ id: user._id }, 'wrong-secret');
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${badToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('4. Edge Cases, Empty States, and Missing Data', () => {
    test('should handle fetching books when none exist gracefully (Empty State)', async () => {
      const res = await request(app).get('/api/books');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.books).toBeInstanceOf(Array);
      expect(res.body.data.books.length).toBe(0);
    });

    test('should handle paginating well beyond total items available', async () => {
      // Even with 0 items, page 100 should return an empty array without crashing
      const res = await request(app).get('/api/books?page=100&limit=10');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.books).toEqual([]);
    });

    test('should handle invalid MongoDB ObjectIDs cleanly', async () => {
      const res = await request(app).get('/api/books/this-is-not-an-objectid');

      // The validation middleware should catch this and return 400
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should return 404 when looking for a valid ID but non-existent resource', async () => {
      const validFakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/books/${validFakeId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BOOK_NOT_FOUND'); // Or NOT_FOUND depending on route
    });

    test('should handle query parameters gracefully when filtering by non-existent values', async () => {
      // E.g., searching for a genre that doesn't exist
      const res = await request(app).get('/api/books?genre=UnbelievableFakeGenre123');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.books).toEqual([]);
    });

    test('should ensure trying to delete a book belonging to someone else handles the error safely', async () => {
      // Given: Book owned by user A
      const book = await Book.create({
        owner: user._id,
        title: 'User A Book',
        author: 'Auth',
        condition: 'Good',
        isAvailable: true,
        imageUrl: 'http://example.com/image.jpg',
        genre: ['Fiction']
      });

      // Given: User B authenticates
      const userB = await createTestUser({
        name: 'Another User',
        email: generateRandomEmail()
      });
      const userBToken = require('../utils/jwt').generateToken(userB._id);

      // When: User B tries to delete User A's book
      const res = await request(app)
        .delete(`/api/books/${book._id}`)
        .set('Authorization', `Bearer ${userBToken}`);

      // Then: 403 Forbidden
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED_DELETE');
    });
  });
});
