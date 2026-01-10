const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const connectDB = require('../config/database');
const { clearBlacklist } = require('../utils/tokenBlacklist');

describe('JWT Requirements', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    clearBlacklist(); // Clear token blacklist before each test
  });

  describe('JWT Token Expiration', () => {
    test('should set JWT tokens to expire within 24 hours', async () => {
      // Register a user
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        city: 'Test City'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.data.token;

      // Decode token without verification to check expiration
      const decoded = jwt.decode(token);
      expect(decoded).toBeTruthy();
      expect(decoded.exp).toBeTruthy();

      // Calculate token lifetime in hours
      const now = Math.floor(Date.now() / 1000);
      const tokenLifetimeSeconds = decoded.exp - decoded.iat;
      const tokenLifetimeHours = tokenLifetimeSeconds / 3600;

      // Token should expire within 24 hours
      expect(tokenLifetimeHours).toBeLessThanOrEqual(24);
      expect(tokenLifetimeHours).toBeGreaterThan(23); // Should be close to 24 hours
    });

    test('should reject expired tokens', async () => {
      // Create a token that expires immediately
      const payload = { id: new mongoose.Types.ObjectId() };
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '0s' });

      // Wait a moment to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to use expired token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Token Invalidation on Logout', () => {
    test('should invalidate token on logout', async () => {
      // Register a user
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        city: 'Test City'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.data.token;

      // Verify token works before logout
      const beforeLogout = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(beforeLogout.status).toBe(200);

      // Logout to invalidate token
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);
      expect(logoutResponse.body.message).toContain('invalidated');

      // Try to use token after logout - should fail
      const afterLogout = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(afterLogout.status).toBe(401);
      expect(afterLogout.body.success).toBe(false);
      expect(afterLogout.body.error.code).toBe('TOKEN_BLACKLISTED');
    });

    test('should provide logout endpoint', async () => {
      // Register and login
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        city: 'Test City'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.data.token;

      // Test logout endpoint exists and requires authentication
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);
    });

    test('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should handle multiple logouts gracefully', async () => {
      // Register and login
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        city: 'Test City'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.data.token;

      // First logout
      const firstLogout = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(firstLogout.status).toBe(200);

      // Second logout with same token should fail
      const secondLogout = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(secondLogout.status).toBe(401);
      expect(secondLogout.body.error.code).toBe('TOKEN_BLACKLISTED');
    });
  });
});