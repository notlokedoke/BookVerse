/**
 * Integration Tests for Registration Flow
 * 
 * This test suite covers the complete user registration and login flow,
 * including error handling throughout the process.
 * 
 * Test Coverage:
 * - Complete registration → login → profile access flow
 * - Error handling at each step
 * - Data validation and persistence
 * - Token generation and authentication
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const connectDB = require('../config/database');
const { clearDatabase, generateRandomEmail } = require('./test-utils');

describe('Registration Flow Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await clearDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Complete Registration → Login → Profile Access Flow', () => {
    test('should complete full registration and login flow successfully', async () => {
      const userData = {
        name: 'Integration Test User',
        email: generateRandomEmail(),
        password: 'securePassword123',
        city: 'San Francisco'
      };

      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.message).toBe('User registered successfully. Please check your email to verify your account.');
      expect(registerResponse.body.data).toHaveProperty('_id');
      expect(registerResponse.body.data.email).toBe(userData.email.toLowerCase());
      expect(registerResponse.body.data.name).toBe(userData.name);
      expect(registerResponse.body.data.city).toBe(userData.city);
      expect(registerResponse.body.data).not.toHaveProperty('password');

      const userId = registerResponse.body.data._id;

      // Step 2: Login with registered credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.message).toBe('Login successful');
      expect(loginResponse.body.data).toHaveProperty('token');
      expect(loginResponse.body.data).toHaveProperty('user');
      expect(loginResponse.body.data.user._id).toBe(userId);
      expect(loginResponse.body.data.user.email).toBe(userData.email.toLowerCase());

      const authToken = loginResponse.body.data.token;

      // Step 3: Access protected profile endpoint with token
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data._id).toBe(userId);
      expect(profileResponse.body.data.email).toBe(userData.email.toLowerCase());
      expect(profileResponse.body.data.name).toBe(userData.name);
      expect(profileResponse.body.data.city).toBe(userData.city);
      expect(profileResponse.body.data).not.toHaveProperty('password');
      expect(profileResponse.body.data.privacySettings.showCity).toBe(true);
      expect(profileResponse.body.data.averageRating).toBe(0);
      expect(profileResponse.body.data.ratingCount).toBe(0);
    });

    test('should persist user data correctly throughout the flow', async () => {
      const userData = {
        name: 'Persistence Test User',
        email: generateRandomEmail(),
        password: 'testPassword456',
        city: 'Boston'
      };

      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.data._id;

      // Verify user exists in database
      const userInDb = await User.findById(userId);
      expect(userInDb).toBeTruthy();
      expect(userInDb.email).toBe(userData.email.toLowerCase());
      expect(userInDb.name).toBe(userData.name);
      expect(userInDb.city).toBe(userData.city);
      expect(userInDb.password).not.toBe(userData.password); // Should be hashed

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const authToken = loginResponse.body.data.token;

      // Access profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify all data matches original registration
      expect(profileResponse.body.data._id).toBe(userId);
      expect(profileResponse.body.data.email).toBe(userData.email.toLowerCase());
      expect(profileResponse.body.data.name).toBe(userData.name);
      expect(profileResponse.body.data.city).toBe(userData.city);
    });

    test('should handle case-insensitive email throughout the flow', async () => {
      const userData = {
        name: 'Case Test User',
        email: 'CaseSensitive@Example.COM',
        password: 'password789',
        city: 'Seattle'
      };

      // Register with mixed case email
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.data.email).toBe('casesensitive@example.com');

      // Login with different case
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'caseSENSITIVE@example.com',
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe('casesensitive@example.com');

      // Access profile
      const authToken = loginResponse.body.data.token;
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.data.email).toBe('casesensitive@example.com');
    });

    test('should generate valid JWT token that works across requests', async () => {
      const userData = {
        name: 'JWT Test User',
        email: generateRandomEmail(),
        password: 'jwtPassword123',
        city: 'Austin'
      };

      // Register
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login and get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const authToken = loginResponse.body.data.token;
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET);

      // Verify token structure
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
      expect(decoded.id).toBe(loginResponse.body.data.user._id);

      // Use token for multiple protected requests
      const profileResponse1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse1.body.success).toBe(true);

      const profileResponse2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse2.body.success).toBe(true);
      expect(profileResponse2.body.data._id).toBe(profileResponse1.body.data._id);
    });

    test('should set default privacy settings during registration', async () => {
      const userData = {
        name: 'Privacy Test User',
        email: generateRandomEmail(),
        password: 'privacyPass123',
        city: 'Denver'
      };

      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.data.privacySettings.showCity).toBe(true);
      expect(registerResponse.body.data.privacySettings).toHaveProperty('showCity');

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      // Verify privacy settings persist
      const authToken = loginResponse.body.data.token;
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.data.privacySettings.showCity).toBe(true);
    });

    test('should initialize rating fields correctly during registration', async () => {
      const userData = {
        name: 'Rating Test User',
        email: generateRandomEmail(),
        password: 'ratingPass123',
        city: 'Portland'
      };

      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.data.averageRating).toBe(0);
      expect(registerResponse.body.data.ratingCount).toBe(0);

      // Login and verify
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const authToken = loginResponse.body.data.token;
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.data.averageRating).toBe(0);
      expect(profileResponse.body.data.ratingCount).toBe(0);
    });
  });

  describe('Registration Error Handling', () => {
    test('should reject registration with missing required fields', async () => {
      const testCases = [
        { data: { email: 'test@test.com', password: 'pass123', city: 'City' }, missing: 'name' },
        { data: { name: 'Test', password: 'pass123', city: 'City' }, missing: 'email' },
        { data: { name: 'Test', email: 'test@test.com', city: 'City' }, missing: 'password' },
        { data: { name: 'Test', email: 'test@test.com', password: 'pass123' }, missing: 'city' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/auth/register')
          .send(testCase.data)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_FIELDS');
      }
    });

    test('should reject registration with invalid email format', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        'double@@domain.com'
      ];

      for (const invalidEmail of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: invalidEmail,
            password: 'password123',
            city: 'Test City'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    test('should reject registration with weak password', async () => {
      const weakPasswords = [
        'short',
        '1234567',
        'seven77'
      ];

      for (const weakPassword of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: generateRandomEmail(),
            password: weakPassword,
            city: 'Test City'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toContain('8 characters');
      }
    });

    test('should reject duplicate email registration', async () => {
      const userData = {
        name: 'First User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'City One'
      };

      // First registration succeeds
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email fails
      const duplicateResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          name: 'Second User',
          city: 'City Two'
        })
        .expect(409);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.error.code).toBe('EMAIL_EXISTS');
      expect(duplicateResponse.body.error.message).toContain('email already exists');
    });

    test('should reject duplicate email with different case', async () => {
      const userData = {
        name: 'First User',
        email: 'unique@example.com',
        password: 'password123',
        city: 'City One'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email in different case
      const duplicateResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          email: 'UNIQUE@EXAMPLE.COM',
          name: 'Second User'
        })
        .expect(409);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.error.code).toBe('EMAIL_EXISTS');
    });

    test('should not create user in database when registration fails', async () => {
      const invalidData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        city: 'Test City'
      };

      await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      // Verify no user was created
      const userCount = await User.countDocuments({ name: 'Test User' });
      expect(userCount).toBe(0);
    });

    test('should sanitize input data during registration', async () => {
      const userData = {
        name: '  Test User  ',
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
        city: '  Test City  '
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.name).toBe('Test User');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.city).toBe('Test City');
    });
  });

  describe('Login Error Handling', () => {
    const validUserData = {
      name: 'Login Test User',
      email: generateRandomEmail(),
      password: 'correctPassword123',
      city: 'Login City'
    };

    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(validUserData);
    });

    test('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anyPassword123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    test('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'wrongPassword123'
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
          email: 'invalid-email-format',
          password: validUserData.password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject login with empty credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: ''
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should not reveal whether email exists on failed login', async () => {
      // Login with non-existent email
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anyPassword123'
        })
        .expect(401);

      // Login with existing email but wrong password
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'wrongPassword123'
        })
        .expect(401);

      // Both should return the same generic error message
      expect(response1.body.error.message).toBe('Invalid credentials');
      expect(response2.body.error.message).toBe('Invalid credentials');
      expect(response1.body.error.code).toBe(response2.body.error.code);
    });
  });

  describe('Profile Access Error Handling', () => {
    test('should reject profile access without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
      expect(response.body.error.message).toBe('Access denied. No token provided.');
    });

    test('should reject profile access with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
      expect(response.body.error.message).toBe('Invalid or expired token');
    });

    test('should reject profile access with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should reject profile access with expired token', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET,
        { expiresIn: '1ms' }
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    test('should reject profile access with token for non-existent user', async () => {
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
    });

    test('should reject profile access with token signed with wrong secret', async () => {
      const jwt = require('jsonwebtoken');
      const wrongSecretToken = jwt.sign(
        { id: new mongoose.Types.ObjectId() },
        'wrong-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('End-to-End Flow with Error Recovery', () => {
    test('should allow successful login after failed registration attempt', async () => {
      const userData = {
        name: 'Recovery Test User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Recovery City'
      };

      // First attempt with weak password fails
      await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          password: 'weak'
        })
        .expect(400);

      // Second attempt with valid password succeeds
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login should work
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data).toHaveProperty('token');
    });

    test('should allow successful login after failed login attempts', async () => {
      const userData = {
        name: 'Retry Test User',
        email: generateRandomEmail(),
        password: 'correctPassword123',
        city: 'Retry City'
      };

      // Register user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Failed login attempt 1
      await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongPassword1'
        })
        .expect(401);

      // Failed login attempt 2
      await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongPassword2'
        })
        .expect(401);

      // Successful login with correct password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data).toHaveProperty('token');

      // Verify profile access works
      const authToken = loginResponse.body.data.token;
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
    });

    test('should maintain data integrity after multiple failed operations', async () => {
      const userData = {
        name: 'Integrity Test User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Integrity City'
      };

      // Successful registration
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.data._id;

      // Multiple failed login attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: 'wrongPassword'
          })
          .expect(401);
      }

      // Successful login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      // Verify user data is intact
      const authToken = loginResponse.body.data.token;
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.data._id).toBe(userId);
      expect(profileResponse.body.data.email).toBe(userData.email.toLowerCase());
      expect(profileResponse.body.data.name).toBe(userData.name);
      expect(profileResponse.body.data.city).toBe(userData.city);

      // Verify in database
      const userInDb = await User.findById(userId);
      expect(userInDb.email).toBe(userData.email.toLowerCase());
      expect(userInDb.name).toBe(userData.name);
      expect(userInDb.city).toBe(userData.city);
    });
  });

  describe('Multiple User Registration Flow', () => {
    test('should handle multiple users registering and logging in independently', async () => {
      const users = [
        {
          name: 'User One',
          email: generateRandomEmail(),
          password: 'password123',
          city: 'City One'
        },
        {
          name: 'User Two',
          email: generateRandomEmail(),
          password: 'password456',
          city: 'City Two'
        },
        {
          name: 'User Three',
          email: generateRandomEmail(),
          password: 'password789',
          city: 'City Three'
        }
      ];

      const tokens = [];

      // Register all users
      for (const userData of users) {
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(registerResponse.body.success).toBe(true);
      }

      // Login all users
      for (const userData of users) {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          })
          .expect(200);

        tokens.push({
          token: loginResponse.body.data.token,
          userId: loginResponse.body.data.user._id,
          email: userData.email
        });
      }

      // Verify each user can access their own profile
      for (let i = 0; i < tokens.length; i++) {
        const profileResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${tokens[i].token}`)
          .expect(200);

        expect(profileResponse.body.data._id).toBe(tokens[i].userId);
        expect(profileResponse.body.data.email).toBe(tokens[i].email.toLowerCase());
        expect(profileResponse.body.data.name).toBe(users[i].name);
        expect(profileResponse.body.data.city).toBe(users[i].city);
      }

      // Verify total user count
      const userCount = await User.countDocuments();
      expect(userCount).toBe(users.length);
    });
  });
});
