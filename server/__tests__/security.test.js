const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const connectDB = require('../config/database');

describe('Security Features', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Input Sanitization', () => {
    test('should sanitize XSS attempts in registration', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>John Doe',
        email: 'test@example.com',
        password: 'password123',
        city: '<img src=x onerror=alert("xss")>New York'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      // Check that the malicious scripts were sanitized
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.city).toBe('New York');
      expect(response.body.data.name).not.toContain('<script>');
      expect(response.body.data.city).not.toContain('<img');
    });

    test('should sanitize NoSQL injection attempts', async () => {
      const maliciousData = {
        name: 'John Doe',
        email: { $ne: null }, // NoSQL injection attempt
        password: 'password123',
        city: 'New York'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData);

      // Should fail validation due to invalid email format
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should sanitize HTML tags in book creation', async () => {
      // First register a user
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

      const maliciousBookData = {
        title: '<script>alert("xss")</script>Test Book',
        author: '<b>Test Author</b>',
        condition: 'Good',
        genre: 'Fiction',
        description: '<iframe src="javascript:alert(\'xss\')"></iframe>Great book!'
      };

      // Create a simple 1x1 pixel PNG buffer for testing
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${token}`)
        .field('title', maliciousBookData.title)
        .field('author', maliciousBookData.author)
        .field('condition', maliciousBookData.condition)
        .field('genre', maliciousBookData.genre)
        .field('description', maliciousBookData.description)
        .attach('coverImage', pngBuffer, 'test.png');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      // Check that HTML tags were sanitized
      expect(response.body.data.title).toBe('Test Book');
      expect(response.body.data.author).toBe('Test Author');
      expect(response.body.data.description).toBe('Great book!');
      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.author).not.toContain('<b>');
      expect(response.body.data.description).not.toContain('<iframe>');
    });
  });

  describe('Rate Limiting', () => {
    test('should not apply rate limiting in test environment', async () => {
      // Make multiple requests quickly - should not be rate limited in test env
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'nonexistent@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All should return 401 (invalid credentials) not 429 (rate limited)
      responses.forEach(response => {
        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      });
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/health');

      // Check for security headers (helmet.js)
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-xss-protection']).toBe('0');
    });

    test('should include response time header', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers['x-response-time']).toBeDefined();
      expect(response.headers['x-response-time']).toMatch(/\d+ms/);
    });
  });

  describe('Password Security', () => {
    test('should hash passwords with bcrypt', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        city: 'Test City'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);

      // Check that password is hashed in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });
});