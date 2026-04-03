// Load environment variables before anything else
require('dotenv').config({ path: __dirname + '/../.env.test' });

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const { generateToken } = require('../utils/jwt');

describe('Book Update Tests (Task 140)', () => {
  let bookOwner, nonOwner, ownerToken, nonOwnerToken, testBook;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/bookverse_test');
    }
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Book.deleteMany({});

    // Create book owner
    bookOwner = await User.create({
      name: 'Book Owner',
      email: 'owner@example.com',
      password: 'password123',
      city: 'Owner City'
    });

    // Create non-owner user
    nonOwner = await User.create({
      name: 'Non Owner',
      email: 'nonowner@example.com',
      password: 'password123',
      city: 'Non Owner City'
    });

    // Generate auth tokens
    ownerToken = generateToken(bookOwner._id);
    nonOwnerToken = generateToken(nonOwner._id);

    // Create a test book owned by bookOwner
    testBook = await Book.create({
      owner: bookOwner._id,
      title: 'Original Title',
      author: 'Original Author',
      condition: 'Good',
      genre: ['Fiction', 'Drama'],
      isbn: '9780123456789',
      description: 'Original description',
      publicationYear: 2020,
      publisher: 'Original Publisher',
      imageUrl: 'https://example.com/original.jpg',
      isAvailable: true
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Book update by owner', () => {
    test('should successfully update book title by owner', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book listing updated successfully');
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.author).toBe('Original Author'); // Unchanged
      expect(response.body.data._id).toBe(testBook._id.toString());

      // Verify in database
      const updatedBook = await Book.findById(testBook._id);
      expect(updatedBook.title).toBe('Updated Title');
      expect(updatedBook.author).toBe('Original Author');
    });

    test('should successfully update book author by owner', async () => {
      const updateData = {
        author: 'Updated Author'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.author).toBe('Updated Author');
      expect(response.body.data.title).toBe('Original Title'); // Unchanged
    });

    test('should successfully update book condition by owner', async () => {
      const updateData = {
        condition: 'Like New'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.condition).toBe('Like New');
    });

    test('should successfully update book genres by owner', async () => {
      const updateData = {
        genres: JSON.stringify(['Science Fiction', 'Adventure'])
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.genre).toEqual(['Science Fiction', 'Adventure']);
    });

    test('should successfully update multiple fields by owner', async () => {
      const updateData = {
        title: 'Completely New Title',
        author: 'New Author Name',
        condition: 'Fair',
        genres: JSON.stringify(['Mystery', 'Thriller']),
        description: 'A brand new description',
        publicationYear: 2023,
        publisher: 'New Publisher'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Completely New Title');
      expect(response.body.data.author).toBe('New Author Name');
      expect(response.body.data.condition).toBe('Fair');
      expect(response.body.data.genre).toEqual(['Mystery', 'Thriller']);
      expect(response.body.data.description).toBe('A brand new description');
      expect(response.body.data.publicationYear).toBe(2023);
      expect(response.body.data.publisher).toBe('New Publisher');
    });

    test('should successfully update ISBN by owner', async () => {
      const updateData = {
        isbn: '9789876543210'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isbn).toBe('9789876543210');
    });

    test('should successfully update description by owner', async () => {
      const updateData = {
        description: 'This is a completely new and improved description for the book.'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('This is a completely new and improved description for the book.');
    });

    test('should successfully update Google Books image URL by owner', async () => {
      const updateData = {
        googleBooksImageUrl: 'https://books.google.com/new-image.jpg'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.googleBooksImageUrl).toBe('https://books.google.com/new-image.jpg');
      expect(response.body.data.imageUrl).toBe('https://books.google.com/new-image.jpg');
    });

    test('should reject update with invalid condition', async () => {
      const updateData = {
        condition: 'Invalid Condition'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CONDITION');
      expect(response.body.error.message).toContain('Condition must be one of');
    });

    test('should reject update with empty title', async () => {
      const updateData = {
        title: ''
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TITLE');
      expect(response.body.error.message).toContain('Title cannot be empty');
    });

    test('should reject update with empty author', async () => {
      const updateData = {
        author: '   '
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_AUTHOR');
      expect(response.body.error.message).toContain('Author cannot be empty');
    });

    test('should reject update with empty genres array', async () => {
      const updateData = {
        genres: JSON.stringify([])
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_GENRE');
      expect(response.body.error.message).toContain('At least one genre is required');
    });

    test('should reject update with invalid book ID format', async () => {
      const updateData = {
        title: 'New Title'
      };

      const response = await request(app)
        .put('/api/books/invalid-id-format')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_BOOK_ID');
    });

    test('should return 404 for non-existent book', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        title: 'New Title'
      };

      const response = await request(app)
        .put(`/api/books/${nonExistentId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_NOT_FOUND');
    });
  });

  describe('Book update by non-owner', () => {
    test('should reject book update by non-owner with 403 Forbidden', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED_UPDATE');
      expect(response.body.error.message).toBe('You can only update your own book listings');

      // Verify book was not updated in database
      const unchangedBook = await Book.findById(testBook._id);
      expect(unchangedBook.title).toBe('Original Title');
    });

    test('should reject multiple field update by non-owner', async () => {
      const updateData = {
        title: 'Hacked Title',
        author: 'Hacked Author',
        condition: 'Poor',
        description: 'Malicious description'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED_UPDATE');

      // Verify no fields were updated
      const unchangedBook = await Book.findById(testBook._id);
      expect(unchangedBook.title).toBe('Original Title');
      expect(unchangedBook.author).toBe('Original Author');
      expect(unchangedBook.condition).toBe('Good');
      expect(unchangedBook.description).toBe('Original description');
    });

    test('should reject update without authentication', async () => {
      const updateData = {
        title: 'Unauthenticated Update'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');

      // Verify book was not updated
      const unchangedBook = await Book.findById(testBook._id);
      expect(unchangedBook.title).toBe('Original Title');
    });

    test('should reject update with invalid token', async () => {
      const updateData = {
        title: 'Invalid Token Update'
      };

      const response = await request(app)
        .put(`/api/books/${testBook._id}`)
        .set('Authorization', 'Bearer invalid-token-here')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');

      // Verify book was not updated
      const unchangedBook = await Book.findById(testBook._id);
      expect(unchangedBook.title).toBe('Original Title');
    });
  });
});
