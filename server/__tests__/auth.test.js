const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const connectDB = require('../config/database');

describe('Auth Routes', () => {
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
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject registration with missing password', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.password;

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
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

  describe('POST /api/auth/login', () => {
    const validUserData = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      city: 'Boston'
    };

    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(validUserData);
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.name).toBe(validUserData.name);
      expect(response.body.data.user.city).toBe(validUserData.city);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(typeof response.body.data.token).toBe('string');
    });

    test('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: validUserData.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    test('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    test('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: validUserData.password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: validUserData.password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle case-insensitive email login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'JANE@EXAMPLE.COM',
          password: validUserData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUserData.email);
    });
  });

  describe('GET /api/auth/me', () => {
    const validUserData = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123',
      city: 'Chicago'
    };

    let authToken;
    let userId;

    beforeEach(async () => {
      // Create a user and get auth token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(validUserData);
      
      userId = registerResponse.body.data._id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        });
      
      authToken = loginResponse.body.data.token;
    });

    test('should get current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data._id).toBe(userId);
      expect(response.body.data.name).toBe(validUserData.name);
      expect(response.body.data.email).toBe(validUserData.email);
      expect(response.body.data.city).toBe(validUserData.city);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data.privacySettings.showCity).toBe(true);
      expect(response.body.data.averageRating).toBe(0);
      expect(response.body.data.ratingCount).toBe(0);
    });

    test('should reject request without Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
      expect(response.body.error.message).toBe('Access denied. No token provided.');
    });

    test('should reject request with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
      expect(response.body.error.message).toBe('Access denied. No token provided.');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });

    test('should reject request with expired token', async () => {
      // Create a token with very short expiration for testing
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '1ms' } // Expires immediately
      );

      // Wait a moment to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });

    test('should reject request with token for non-existent user', async () => {
      // Create a token with a non-existent user ID
      const jwt = require('jsonwebtoken');
      const fakeUserId = new mongoose.Types.ObjectId();
      const fakeToken = jwt.sign(
        { id: fakeUserId },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
      expect(response.body.error.message).toBe('Invalid token. User not found.');
    });
  });
});
