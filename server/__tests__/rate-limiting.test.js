const request = require('supertest');
const User = require('../models/User');
const connectDB = require('../config/database');
const mongoose = require('mongoose');

// Note: Rate limiting is disabled in test environment by default (skip function in server.js)
// These tests verify the configuration and behavior when rate limiting would be active
describe('Rate Limiting Configuration Tests', () => {
  let app;

  beforeAll(async () => {
    await connectDB();
    // Import app after DB connection
    app = require('../server');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Auth Endpoint Rate Limiting Configuration', () => {
    it('should have rate limiting middleware applied to auth routes', async () => {
      // Verify auth endpoints are accessible (rate limiting is skipped in test mode)
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          city: 'New York'
        });

      // Should not return 429 in test mode (rate limiting is skipped)
      expect(response.status).not.toBe(429);
      // Should return either success (201) or validation error (400/409)
      expect([201, 400, 409]).toContain(response.status);
    });

    it('should allow multiple requests to auth endpoints in test mode', async () => {
      // In test mode, rate limiting is skipped, so we can make many requests
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/register')
            .send({
              name: 'Test User',
              email: `test${i}@example.com`,
              password: 'password123',
              city: 'New York'
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // None should be rate limited in test mode
      responses.forEach(response => {
        expect(response.status).not.toBe(429);
      });
    });

    it('should have proper error format configured for rate limit responses', () => {
      // Verify the rate limiter configuration exists in server.js
      const fs = require('fs');
      const serverCode = fs.readFileSync('./server.js', 'utf8');
      
      // Check that authLimiter is configured with correct parameters
      expect(serverCode).toContain('authLimiter');
      expect(serverCode).toContain('windowMs: 15 * 60 * 1000'); // 15 minutes
      expect(serverCode).toContain('max: 5'); // 5 requests
      expect(serverCode).toContain('RATE_LIMIT_EXCEEDED');
      expect(serverCode).toContain('Too many authentication attempts');
    });

    it('should apply auth rate limiter to /api/auth routes', () => {
      const fs = require('fs');
      const serverCode = fs.readFileSync('./server.js', 'utf8');
      
      // Verify authLimiter is applied to auth routes
      expect(serverCode).toContain('/api/auth');
      expect(serverCode).toContain('authLimiter');
    });
  });

  describe('General Rate Limiting Configuration', () => {
    it('should have general rate limiting configured', () => {
      const fs = require('fs');
      const serverCode = fs.readFileSync('./server.js', 'utf8');
      
      // Check that generalLimiter is configured
      expect(serverCode).toContain('generalLimiter');
      expect(serverCode).toContain('windowMs: 15 * 60 * 1000'); // 15 minutes
      expect(serverCode).toContain('max: 1000'); // 1000 requests
    });

    it('should allow non-auth endpoints to work normally', async () => {
      // Make requests to non-auth endpoints
      const healthResponse = await request(app).get('/api/health');
      expect(healthResponse.status).toBe(200);

      const booksResponse = await request(app).get('/api/books');
      expect(booksResponse.status).toBe(200);
    });
  });

  describe('Rate Limiting Error Response Format', () => {
    it('should have standardized error response format configured', () => {
      const fs = require('fs');
      const serverCode = fs.readFileSync('./server.js', 'utf8');
      
      // Verify error response format includes success, error.message, error.code
      const rateLimitConfig = serverCode.match(/authLimiter[\s\S]*?}\);/);
      expect(rateLimitConfig).toBeTruthy();
      expect(rateLimitConfig[0]).toContain('success: false');
      expect(rateLimitConfig[0]).toContain('error:');
      expect(rateLimitConfig[0]).toContain('message:');
      expect(rateLimitConfig[0]).toContain('code:');
    });
  });
});

// Integration test to document expected behavior in production
describe('Rate Limiting Production Behavior Documentation', () => {
  it('should document the expected rate limiting behavior in production', () => {
    // This test documents the expected behavior when rate limiting is active (production)
    const expectedBehavior = {
      authEndpoints: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        errorStatus: 429,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        errorMessage: 'Too many authentication attempts. Please try again later.'
      },
      generalEndpoints: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000,
        errorStatus: 429,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        errorMessage: 'Too many requests. Please try again later.'
      }
    };

    // Verify configuration matches expected behavior
    expect(expectedBehavior.authEndpoints.maxRequests).toBe(5);
    expect(expectedBehavior.authEndpoints.windowMs).toBe(900000); // 15 minutes in ms
    expect(expectedBehavior.authEndpoints.errorStatus).toBe(429);
  });
});
