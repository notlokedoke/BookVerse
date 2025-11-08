const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const connectDB = require('../config/database');

describe('Auth Routes - Registration', () => {
  beforeAll(async () => {
    // Connect to test database
    await connectDB();
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      city: 'New York'
    };

    test('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(validUserData.name);
      expect(response.body.data.email).toBe(validUserData.email.toLowerCase());
      expect(response.body.data.city).toBe(validUserData.city);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data.privacySettings.showCity).toBe(true);
      expect(response.body.data.averageRating).toBe(0);
      expect(response.body.data.ratingCount).toBe(0);
    });

    test('should hash the password before storing', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      const user = await User.findOne({ email: validUserData.email });
      expect(user.password).not.toBe(validUserData.password);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });

    test('should reject registration with duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
      expect(response.body.error.message).toContain('email already exists');
    });

    test('should reject registration with missing name', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.name;

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    test('should reject registration with missing email', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.email;

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    test('should reject registration with missing password', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.password;

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    test('should reject registration with missing city', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.city;

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    test('should reject registration with invalid email format', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject registration with password less than 8 characters', async () => {
      const invalidData = { ...validUserData, password: 'short' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('8 characters');
    });

    test('should convert email to lowercase', async () => {
      const upperCaseEmail = { ...validUserData, email: 'JOHN@EXAMPLE.COM' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(upperCaseEmail)
        .expect(201);

      expect(response.body.data.email).toBe('john@example.com');
    });
  });
});
