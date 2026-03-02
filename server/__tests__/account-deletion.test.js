const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Message = require('../models/Message');
const Wishlist = require('../models/Wishlist');
const Rating = require('../models/Rating');
const Notification = require('../models/Notification');

describe('Account Deletion', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Create a test user
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Delete Test User',
        email: 'delete@test.com',
        password: 'password123',
        city: 'Test City'
      });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'delete@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
    userId = loginResponse.body.data.user._id;

    // Create some test data
    await Book.create({
      title: 'Test Book',
      author: 'Test Author',
      owner: userId,
      condition: 'good',
      genre: 'Fiction'
    });

    await Wishlist.create({
      user: userId,
      title: 'Wanted Book',
      author: 'Some Author'
    });
  });

  describe('DELETE /api/auth/account', () => {
    it('should delete account with correct password and confirmation', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'password123',
          confirmText: 'DELETE'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify user is deleted
      const user = await User.findById(userId);
      expect(user).toBeNull();

      // Verify related data is deleted
      const books = await Book.find({ owner: userId });
      expect(books).toHaveLength(0);

      const wishlists = await Wishlist.find({ user: userId });
      expect(wishlists).toHaveLength(0);
    });

    it('should fail without confirmation text', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with incorrect confirmation text', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'password123',
          confirmText: 'delete'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'wrongpassword',
          confirmText: 'DELETE'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .send({
          password: 'password123',
          confirmText: 'DELETE'
        });

      expect(response.status).toBe(401);
    });

    it('should fail without password', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmText: 'DELETE'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('PASSWORD_REQUIRED');
    });
  });
});
