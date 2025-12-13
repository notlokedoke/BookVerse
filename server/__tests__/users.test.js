const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const connectDB = require('../config/database');

describe('Users API', () => {
  let testUser1, testUser2;

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});

    // Create test users
    testUser1 = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      city: 'New York',
      privacySettings: {
        showCity: true
      }
    });
    await testUser1.save();

    testUser2 = new User({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      city: 'Los Angeles',
      privacySettings: {
        showCity: false
      }
    });
    await testUser2.save();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/users/:userId', () => {
    test('should return user profile with city when showCity is true', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser1._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        _id: testUser1._id.toString(),
        name: 'John Doe',
        city: 'New York',
        averageRating: 0,
        ratingCount: 0,
        privacySettings: {
          showCity: true
        }
      });
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).not.toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should return user profile without city when showCity is false', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser2._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        _id: testUser2._id.toString(),
        name: 'Jane Smith',
        averageRating: 0,
        ratingCount: 0,
        privacySettings: {
          showCity: false
        }
      });
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).not.toHaveProperty('city');
      expect(response.body.data).not.toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/users/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not found');
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    test('should return 400 for invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid user ID format');
      expect(response.body.error.code).toBe('INVALID_USER_ID');
    });

    test('should handle user with default privacy settings (showCity should default to true)', async () => {
      // Create user without explicit privacy settings
      const testUser3 = new User({
        name: 'Bob Wilson',
        email: 'bob@example.com',
        password: 'password123',
        city: 'Chicago'
        // No privacySettings specified - should default to showCity: true
      });
      await testUser3.save();

      const response = await request(app)
        .get(`/api/users/${testUser3._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        _id: testUser3._id.toString(),
        name: 'Bob Wilson',
        city: 'Chicago', // Should be visible since showCity defaults to true
        averageRating: 0,
        ratingCount: 0
      });
    });
  });
});