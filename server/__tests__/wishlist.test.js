const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');
const { generateToken } = require('../utils/jwt');

describe('Wishlist API', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/bookverse-test');
    }
  });

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Wishlist.deleteMany({});

    // Drop indexes to ensure clean state
    try {
      await Wishlist.collection.dropIndexes();
    } catch (error) {
      // Ignore error if collection doesn't exist
    }

    // Create test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      city: 'Test City'
    });
    await testUser.save();

    // Generate auth token
    authToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    // Clean up database after each test
    await User.deleteMany({});
    await Wishlist.deleteMany({});
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe('POST /api/wishlist', () => {
    test('should add book to wishlist with valid data', async () => {
      const wishlistData = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '9780743273565',
        notes: 'Looking for a good condition copy'
      };

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book added to wishlist successfully');
      expect(response.body.data.title).toBe(wishlistData.title);
      expect(response.body.data.author).toBe(wishlistData.author);
      expect(response.body.data.isbn).toBe(wishlistData.isbn);
      expect(response.body.data.notes).toBe(wishlistData.notes);
      expect(response.body.data.user._id).toBe(testUser._id.toString());
    });

    test('should add book to wishlist with only title (minimum required)', async () => {
      const wishlistData = {
        title: 'To Kill a Mockingbird'
      };

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(wishlistData.title);
      expect(response.body.data.author).toBeUndefined();
      expect(response.body.data.isbn).toBeUndefined();
      expect(response.body.data.notes).toBeUndefined();
    });

    test('should reject request without authentication', async () => {
      const wishlistData = {
        title: 'The Great Gatsby'
      };

      const response = await request(app)
        .post('/api/wishlist')
        .send(wishlistData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should reject request with missing title', async () => {
      const wishlistData = {
        author: 'F. Scott Fitzgerald',
        isbn: '9780743273565'
      };

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Title is required');
    });

    test('should reject request with empty title', async () => {
      const wishlistData = {
        title: '',
        author: 'F. Scott Fitzgerald'
      };

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should prevent duplicate entries with same user and ISBN', async () => {
      const wishlistData = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '9780743273565'
      };

      // Add first item
      await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(201);

      // Try to add duplicate
      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_WISHLIST_ITEM');
      expect(response.body.error.message).toBe('This book is already in your wishlist');
    });

    test('should allow multiple entries with same title but different ISBN', async () => {
      const wishlistData1 = {
        title: 'The Great Gatsby',
        isbn: '9780743273565'
      };

      const wishlistData2 = {
        title: 'The Great Gatsby',
        isbn: '9780141182636'
      };

      // Add first item
      await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData1)
        .expect(201);

      // Add second item with different ISBN
      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData2)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should allow multiple entries with same title but no ISBN', async () => {
      const wishlistData = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald'
      };

      // Add first item
      await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(201);

      // Add second item (should be allowed since no ISBN)
      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should validate field lengths', async () => {
      const wishlistData = {
        title: 'A'.repeat(201), // Too long
        author: 'Valid Author',
        isbn: '9780743273565'
      };

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should sanitize input data', async () => {
      const wishlistData = {
        title: '<script>alert("xss")</script>The Great Gatsby',
        author: '<b>F. Scott Fitzgerald</b>',
        notes: 'Looking for <em>good condition</em> copy'
      };

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wishlistData)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Check that HTML tags are sanitized
      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.author).not.toContain('<b>');
      expect(response.body.data.notes).not.toContain('<em>');
    });
  });
});