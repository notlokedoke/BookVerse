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

  describe('GET /api/wishlist/user/:userId', () => {
    let otherUser;

    beforeEach(async () => {
      // Create another test user
      otherUser = new User({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        city: 'Other City'
      });
      await otherUser.save();
    });

    test('should get user wishlist items sorted by creation date descending', async () => {
      // Create multiple wishlist items for testUser
      const wishlistItem1 = new Wishlist({
        user: testUser._id,
        title: 'First Book',
        author: 'Author One',
        isbn: '1111111111111'
      });
      await wishlistItem1.save();

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const wishlistItem2 = new Wishlist({
        user: testUser._id,
        title: 'Second Book',
        author: 'Author Two',
        isbn: '2222222222222'
      });
      await wishlistItem2.save();

      await new Promise(resolve => setTimeout(resolve, 10));

      const wishlistItem3 = new Wishlist({
        user: testUser._id,
        title: 'Third Book',
        author: 'Author Three'
      });
      await wishlistItem3.save();

      const response = await request(app)
        .get(`/api/wishlist/user/${testUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);

      // Check that items are sorted by creation date descending (newest first)
      expect(response.body.data[0].title).toBe('Third Book');
      expect(response.body.data[1].title).toBe('Second Book');
      expect(response.body.data[2].title).toBe('First Book');

      // Check that user information is populated
      expect(response.body.data[0].user.name).toBe(testUser.name);
      expect(response.body.data[0].user.city).toBe(testUser.city);
      expect(response.body.data[0].user.password).toBeUndefined(); // Password should not be included
    });

    test('should return empty array for user with no wishlist items', async () => {
      const response = await request(app)
        .get(`/api/wishlist/user/${otherUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    test('should only return wishlist items for specified user', async () => {
      // Create wishlist items for both users
      const testUserItem = new Wishlist({
        user: testUser._id,
        title: 'Test User Book',
        author: 'Test Author'
      });
      await testUserItem.save();

      const otherUserItem = new Wishlist({
        user: otherUser._id,
        title: 'Other User Book',
        author: 'Other Author'
      });
      await otherUserItem.save();

      // Get testUser's wishlist
      const response = await request(app)
        .get(`/api/wishlist/user/${testUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test User Book');
      expect(response.body.data[0].user._id).toBe(testUser._id.toString());
    });

    test('should reject invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/wishlist/user/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_USER_ID');
      expect(response.body.error.message).toBe('Invalid user ID format');
    });

    test('should handle non-existent user ID gracefully', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/wishlist/user/${nonExistentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    test('should be accessible without authentication (public route)', async () => {
      // Create a wishlist item
      const wishlistItem = new Wishlist({
        user: testUser._id,
        title: 'Public Book',
        author: 'Public Author'
      });
      await wishlistItem.save();

      // Access without authentication token
      const response = await request(app)
        .get(`/api/wishlist/user/${testUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Public Book');
    });
  });
});