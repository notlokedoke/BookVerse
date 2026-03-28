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
      expect(response.body.message).toBe('User registered successfully. Please check your email to verify your account.');
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

    test('should generate valid JWT token that can be verified', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      const token = response.body.data.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify the token can be decoded
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('iat'); // issued at
      expect(decoded).toHaveProperty('exp'); // expiration
      expect(decoded.id).toBe(response.body.data.user._id);
    });

    test('should include correct user ID in JWT token payload', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      const token = response.body.data.token;
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // The token payload should contain the user's ID
      expect(decoded.id).toBe(response.body.data.user._id);
      
      // Verify we can use this token to fetch the user profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.data._id).toBe(decoded.id);
      expect(profileResponse.body.data.email).toBe(validUserData.email);
    });

    test('should set token expiration time', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      const token = response.body.data.token;
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check that expiration is set
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      
      // Verify expiration is in the future
      const currentTime = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(currentTime);
      
      // Verify expiration is approximately 24 hours from now (with 1 minute tolerance)
      const expectedExpiration = currentTime + (24 * 60 * 60);
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpiration - 60);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiration + 60);
    });

    test('should not include sensitive data in JWT token payload', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      const token = response.body.data.token;
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Token should only contain user ID, not sensitive information
      expect(decoded).not.toHaveProperty('password');
      expect(decoded).not.toHaveProperty('email');
      expect(decoded).not.toHaveProperty('name');
      expect(decoded.id).toBeDefined();
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

  describe('PUT /api/auth/profile', () => {
    const validUserData = {
      name: 'Bob Wilson',
      email: 'bob@example.com',
      password: 'password123',
      city: 'Seattle'
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

    test('should update user name with valid token', async () => {
      const updateData = { name: 'Robert Wilson' };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.city).toBe(validUserData.city); // Should remain unchanged
      expect(response.body.data.email).toBe(validUserData.email); // Should remain unchanged
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should update user city with valid token', async () => {
      const updateData = { city: 'Portland' };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.city).toBe(updateData.city);
      expect(response.body.data.name).toBe(validUserData.name); // Should remain unchanged
      expect(response.body.data.email).toBe(validUserData.email); // Should remain unchanged
    });

    test('should update both name and city with valid token', async () => {
      const updateData = { 
        name: 'Robert Wilson',
        city: 'Portland'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.city).toBe(updateData.city);
      expect(response.body.data.email).toBe(validUserData.email); // Should remain unchanged
    });

    test('should update privacy settings with valid token', async () => {
      const updateData = { privacySettings: { showCity: false } };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.privacySettings.showCity).toBe(false);
      expect(response.body.data.email).toBe(validUserData.email);
    });

    test('should update name and privacy settings together', async () => {
      const updateData = { 
        name: 'Privacy User',
        privacySettings: { showCity: false }
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.name).toBe('Privacy User');
      expect(response.body.data.privacySettings.showCity).toBe(false);
      expect(response.body.data.email).toBe(validUserData.email);
    });

    test('should reject update with empty name', async () => {
      const updateData = { name: '' };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Name cannot be empty');
    });

    test('should reject update with empty city', async () => {
      const updateData = { city: '' };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('City cannot be empty');
    });

    test('should reject update with no fields provided', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_UPDATE_FIELDS');
      expect(response.body.error.message).toBe('Please provide at least one field to update (name, city, bio, or privacySettings)');
    });

    test('should reject update without Authorization header', async () => {
      const updateData = { name: 'Robert Wilson' };

      const response = await request(app)
        .put('/api/auth/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
      expect(response.body.error.message).toBe('Access denied. No token provided.');
    });

    test('should reject update with invalid token', async () => {
      const updateData = { name: 'Robert Wilson' };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });

    test('should trim whitespace from name and city', async () => {
      const updateData = { 
        name: '  Robert Wilson  ',
        city: '  Portland  '
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Robert Wilson');
      expect(response.body.data.city).toBe('Portland');
    });

    test('should persist changes in database', async () => {
      const updateData = { 
        name: 'Robert Wilson',
        city: 'Portland'
      };

      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Verify changes persisted by fetching user profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.data.name).toBe(updateData.name);
      expect(profileResponse.body.data.city).toBe(updateData.city);
    });
  });

  describe('Protected Route Access', () => {
    const validUserData = {
      name: 'Protected User',
      email: 'protected@example.com',
      password: 'password123',
      city: 'Denver'
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

    test('should allow access to protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data._id).toBe(userId);
      expect(response.body.data.email).toBe(validUserData.email);
    });

    test('should deny access to protected route without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
      expect(response.body.error.message).toBe('Access denied. No token provided.');
    });

    test('should deny access to protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });

    test('should deny access to protected route with malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer malformed-token-without-dots')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });

    test('should deny access to protected route with token signed with wrong secret', async () => {
      const jwt = require('jsonwebtoken');
      const wrongSecretToken = jwt.sign(
        { id: userId },
        'wrong-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });

    test('should deny access to protected route with expired token', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '1ms' }
      );

      // Wait to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });

    test('should deny access to protected route with token for deleted user', async () => {
      // Delete the user
      await User.findByIdAndDelete(userId);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
      expect(response.body.error.message).toBe('Invalid token. User not found.');
    });

    test('should deny access to protected route with empty Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', '')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
      expect(response.body.error.message).toBe('Access denied. No token provided.');
    });

    test('should deny access to protected route with Bearer prefix but no token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
      expect(response.body.error.message).toBe('Access denied. No token provided.');
    });

    test('should deny access to protected route with token but no Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', authToken)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
      expect(response.body.error.message).toBe('Access denied. No token provided.');
    });

    test('should allow access to multiple protected routes with same valid token', async () => {
      // Test GET /api/auth/me
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data._id).toBe(userId);

      // Test PUT /api/auth/profile
      const profileResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.name).toBe('Updated Name');
    });

    test('should extract correct user ID from token for protected routes', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify the returned user matches the token's user ID
      expect(response.body.data._id).toBe(userId);
      expect(response.body.data.email).toBe(validUserData.email);
      expect(response.body.data.name).toBe(validUserData.name);
    });

    test('should deny access with token containing invalid user ID format', async () => {
      const jwt = require('jsonwebtoken');
      const invalidIdToken = jwt.sign(
        { id: 'not-a-valid-objectid' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidIdToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    test('should deny access with token missing user ID in payload', async () => {
      const jwt = require('jsonwebtoken');
      const noIdToken = jwt.sign(
        { email: validUserData.email }, // Missing 'id' field
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${noIdToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});
