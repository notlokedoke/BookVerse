const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const { generateToken } = require('../utils/jwt');

describe('Book Creation Validation Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Create a test user
    const user = new User({
      name: 'Test User',
      email: 'bookvalidation@test.com',
      password: 'password123',
      city: 'Test City'
    });
    await user.save();
    userId = user._id.toString();
    authToken = generateToken(userId);
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: 'bookvalidation@test.com' });
    await Book.deleteMany({ owner: userId });
  });

  describe('POST /api/books - Input Validation', () => {
    it('should reject book creation with missing title', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .field('googleBooksImageUrl', 'https://example.com/image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
      expect(response.body.error.message).toContain('required fields');
    });

    it('should reject book creation with missing author', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Book')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .field('googleBooksImageUrl', 'https://example.com/image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should reject book creation with missing condition', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('genre', 'Fiction')
        .field('googleBooksImageUrl', 'https://example.com/image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should reject book creation with missing genre', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('googleBooksImageUrl', 'https://example.com/image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should reject book creation with invalid condition', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Invalid Condition')
        .field('genre', 'Fiction')
        .field('googleBooksImageUrl', 'https://example.com/image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Condition must be one of');
    });

    it('should reject book creation with title exceeding max length', async () => {
      const longTitle = 'A'.repeat(501);
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', longTitle)
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .field('googleBooksImageUrl', 'https://example.com/image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Title must be between');
    });

    it('should reject book creation with author exceeding max length', async () => {
      const longAuthor = 'A'.repeat(201);
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Book')
        .field('author', longAuthor)
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .field('googleBooksImageUrl', 'https://example.com/image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Author must be between');
    });

    it('should reject book creation with description exceeding max length', async () => {
      const longDescription = 'A'.repeat(2001);
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .field('description', longDescription)
        .field('googleBooksImageUrl', 'https://example.com/image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Description must not exceed');
    });

    it('should reject book creation with invalid publication year (too old)', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .field('publicationYear', '999')
        .field('googleBooksImageUrl', 'https://example.com/image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Publication year must be between');
    });

    it('should reject book creation with invalid publication year (future)', async () => {
      const futureYear = new Date().getFullYear() + 2;
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .field('publicationYear', futureYear.toString())
        .field('googleBooksImageUrl', 'https://example.com/image.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Publication year must be between');
    });

    it('should reject book creation with invalid Google Books image URL', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .field('googleBooksImageUrl', 'not-a-valid-url');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('valid URL');
    });

    it('should accept book creation with valid data and sanitize inputs', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', '<script>alert("xss")</script>Test Book')
        .field('author', 'Test Author<img src=x onerror=alert(1)>')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .field('description', 'A great book<script>alert("xss")</script>')
        .field('googleBooksImageUrl', 'https://example.com/image.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.author).not.toContain('<img');
      expect(response.body.data.description).not.toContain('<script>');
    });

    it('should accept book creation with all optional fields', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Complete Book')
        .field('author', 'Complete Author')
        .field('condition', 'Like New')
        .field('genre', 'Science Fiction')
        .field('isbn', '9780123456789')
        .field('description', 'A complete book with all fields')
        .field('publicationYear', '2020')
        .field('publisher', 'Test Publisher')
        .field('googleBooksImageUrl', 'https://example.com/complete.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Complete Book');
      expect(response.body.data.isbn).toBe('9780123456789');
      expect(response.body.data.publicationYear).toBe(2020);
      expect(response.body.data.publisher).toBe('Test Publisher');
    });
  });
});
