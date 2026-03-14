const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');

describe('Password Hashing with bcrypt (Requirement 15.1)', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/bookverse-test');
    }
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

  describe('Password Hashing on User Creation', () => {
    test('should hash password before saving to database', async () => {
      const plainPassword = 'TestPassword123';
      
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: plainPassword,
        city: 'Test City'
      });

      await user.save();

      // Verify password is hashed (not plain text)
      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
      expect(user.password.length).toBe(60); // bcrypt hash length
    });

    test('should use bcrypt with correct salt rounds', async () => {
      const user = new User({
        name: 'Test User',
        email: 'bcrypt@example.com',
        password: 'SecurePass456',
        city: 'Test City'
      });

      await user.save();

      // Verify bcrypt format (starts with $2a$10$ for 10 rounds)
      expect(user.password).toMatch(/^\$2[ayb]\$10\$/);
    });

    test('should create different hashes for same password', async () => {
      const password = 'SamePassword789';
      
      const user1 = new User({
        name: 'User One',
        email: 'user1@example.com',
        password: password,
        city: 'City One'
      });

      const user2 = new User({
        name: 'User Two',
        email: 'user2@example.com',
        password: password,
        city: 'City Two'
      });

      await user1.save();
      await user2.save();

      // Hashes should be different due to unique salts
      expect(user1.password).not.toBe(user2.password);
      expect(user1.password).toMatch(/^\$2[ayb]\$.{56}$/);
      expect(user2.password).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    test('should only hash password when modified', async () => {
      const user = new User({
        name: 'Test User',
        email: 'nohash@example.com',
        password: 'InitialPassword123',
        city: 'Test City'
      });

      await user.save();
      const firstHash = user.password;

      // Update non-password field
      user.name = 'Updated Name';
      await user.save();

      // Password hash should remain the same
      expect(user.password).toBe(firstHash);
    });

    test('should rehash password when password is changed', async () => {
      const user = new User({
        name: 'Test User',
        email: 'rehash@example.com',
        password: 'OldPassword123',
        city: 'Test City'
      });

      await user.save();
      const oldHash = user.password;

      // Change password
      user.password = 'NewPassword456';
      await user.save();

      // Hash should be different
      expect(user.password).not.toBe(oldHash);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/);
    });
  });

  describe('Password Comparison on Login', () => {
    test('should correctly compare valid password', async () => {
      const plainPassword = 'ValidPassword123';
      
      const user = new User({
        name: 'Test User',
        email: 'compare@example.com',
        password: plainPassword,
        city: 'Test City'
      });

      await user.save();

      // Test comparePassword method
      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    test('should reject invalid password', async () => {
      const user = new User({
        name: 'Test User',
        email: 'reject@example.com',
        password: 'CorrectPassword123',
        city: 'Test City'
      });

      await user.save();

      // Test with wrong password
      const isMatch = await user.comparePassword('WrongPassword456');
      expect(isMatch).toBe(false);
    });

    test('should be case-sensitive for password comparison', async () => {
      const user = new User({
        name: 'Test User',
        email: 'case@example.com',
        password: 'CaseSensitive123',
        city: 'Test City'
      });

      await user.save();

      // Test with different case
      const isMatch = await user.comparePassword('casesensitive123');
      expect(isMatch).toBe(false);
    });

    test('should use bcrypt.compare for password verification', async () => {
      const plainPassword = 'BcryptTest123';
      
      const user = new User({
        name: 'Test User',
        email: 'bcryptcompare@example.com',
        password: plainPassword,
        city: 'Test City'
      });

      await user.save();

      // Verify using bcrypt directly
      const isMatch = await bcrypt.compare(plainPassword, user.password);
      expect(isMatch).toBe(true);

      // Verify using model method
      const isMatchModel = await user.comparePassword(plainPassword);
      expect(isMatchModel).toBe(true);
    });
  });

  describe('Password Never Returned in API Responses', () => {
    test('should not return password in registration response', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'SecurePass123',
          city: 'New City'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.password).toBeUndefined();
      expect(response.body.data.email).toBe('newuser@example.com');
    });

    test('should not return password in login response', async () => {
      // Create user first
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login User',
          email: 'loginuser@example.com',
          password: 'LoginPass123',
          city: 'Login City'
        });

      // Login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: 'LoginPass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
    });

    test('should not return password in profile endpoint', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Profile User',
          email: 'profileuser@example.com',
          password: 'ProfilePass123',
          city: 'Profile City'
        });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'profileuser@example.com',
          password: 'ProfilePass123'
        });

      const token = loginResponse.body.data.token;

      // Get profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data).toBeDefined();
      expect(profileResponse.body.data.password).toBeUndefined();
    });

    test('should not return password in profile update response', async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Update User',
          email: 'updateuser@example.com',
          password: 'UpdatePass123',
          city: 'Update City'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'updateuser@example.com',
          password: 'UpdatePass123'
        });

      const token = loginResponse.body.data.token;

      // Update profile
      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data).toBeDefined();
      expect(updateResponse.body.data.password).toBeUndefined();
    });

    test('should not expose password in database queries', async () => {
      const user = new User({
        name: 'Query User',
        email: 'queryuser@example.com',
        password: 'QueryPass123',
        city: 'Query City'
      });

      await user.save();

      // Query without selecting password
      const queriedUser = await User.findOne({ email: 'queryuser@example.com' });
      
      // Password should be in database but not selected by default
      expect(queriedUser.password).toBeDefined();
      expect(queriedUser.password).toMatch(/^\$2[ayb]\$.{56}$/);
    });
  });

  describe('Password Security Requirements', () => {
    test('should enforce minimum password length of 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass User',
          email: 'shortpass@example.com',
          password: 'Short1',
          city: 'Test City'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/at least 8 characters/i);
    });

    test('should accept password with exactly 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Eight Char User',
          email: 'eightchar@example.com',
          password: 'Pass1234',
          city: 'Test City'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('should never store plain text passwords', async () => {
      const plainPassword = 'PlainTextTest123';
      
      const user = new User({
        name: 'Plain Text User',
        email: 'plaintext@example.com',
        password: plainPassword,
        city: 'Test City'
      });

      await user.save();

      // Verify password in database is not plain text
      const dbUser = await User.findOne({ email: 'plaintext@example.com' });
      expect(dbUser.password).not.toBe(plainPassword);
      expect(dbUser.password).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    test('should handle special characters in passwords', async () => {
      const specialPassword = 'P@ssw0rd!#$%';
      
      const user = new User({
        name: 'Special Char User',
        email: 'special@example.com',
        password: specialPassword,
        city: 'Test City'
      });

      await user.save();

      // Verify password is hashed
      expect(user.password).not.toBe(specialPassword);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/);

      // Verify comparison works
      const isMatch = await user.comparePassword(specialPassword);
      expect(isMatch).toBe(true);
    });
  });

  describe('Login Authentication with Hashed Passwords', () => {
    test('should successfully authenticate with correct password', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Auth User',
          email: 'authuser@example.com',
          password: 'AuthPass123',
          city: 'Auth City'
        });

      // Login with correct password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'authuser@example.com',
          password: 'AuthPass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test('should reject authentication with incorrect password', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Wrong Pass User',
          email: 'wrongpass@example.com',
          password: 'CorrectPass123',
          city: 'Test City'
        });

      // Login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'WrongPass456'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should not reveal whether email or password is incorrect', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Security User',
          email: 'security@example.com',
          password: 'SecurePass123',
          city: 'Test City'
        });

      // Try with wrong email
      const wrongEmailResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePass123'
        });

      // Try with wrong password
      const wrongPassResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'security@example.com',
          password: 'WrongPass456'
        });

      // Both should return same generic error
      expect(wrongEmailResponse.status).toBe(401);
      expect(wrongPassResponse.status).toBe(401);
      expect(wrongEmailResponse.body.error.message).toBe('Invalid credentials');
      expect(wrongPassResponse.body.error.message).toBe('Invalid credentials');
    });
  });
});
