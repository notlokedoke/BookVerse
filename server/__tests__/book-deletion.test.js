// Load environment variables before anything else
require('dotenv').config({ path: __dirname + '/../.env.test' });

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const { generateToken } = require('../utils/jwt');

describe('Book Deletion Tests (Task 141)', () => {
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
      title: 'Test Book for Deletion',
      author: 'Test Author',
      condition: 'Good',
      genre: ['Fiction', 'Drama'],
      isbn: '9780123456789',
      description: 'A book that will be deleted',
      publicationYear: 2020,
      publisher: 'Test Publisher',
      imageUrl: 'https://example.com/test.jpg',
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

  describe('Book deletion by owner', () => {
    test('should successfully delete book by owner', async () => {
      const response = await request(app)
        .delete(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book listing deleted successfully');

      // Verify book was deleted from database
      const deletedBook = await Book.findById(testBook._id);
      expect(deletedBook).toBeNull();
    });

    test('should return 404 when deleting non-existent book', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/books/${nonExistentId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_NOT_FOUND');
      expect(response.body.error.message).toContain('Book not found');
    });

    test('should return 400 for invalid book ID format', async () => {
      const response = await request(app)
        .delete('/api/books/invalid-id-format')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_BOOK_ID');
    });

    test('should delete book and verify it no longer appears in listings', async () => {
      // First verify book exists in listings
      const beforeResponse = await request(app)
        .get('/api/books')
        .expect(200);

      expect(beforeResponse.body.success).toBe(true);
      const bookExists = beforeResponse.body.data.books.some(
        book => book._id === testBook._id.toString()
      );
      expect(bookExists).toBe(true);

      // Delete the book
      await request(app)
        .delete(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // Verify book no longer appears in listings
      const afterResponse = await request(app)
        .get('/api/books')
        .expect(200);

      expect(afterResponse.body.success).toBe(true);
      const bookStillExists = afterResponse.body.data.books.some(
        book => book._id === testBook._id.toString()
      );
      expect(bookStillExists).toBe(false);
    });

    test('should delete book and verify owner has one less book', async () => {
      // Create another book for the owner
      await Book.create({
        owner: bookOwner._id,
        title: 'Second Book',
        author: 'Test Author',
        condition: 'Good',
        genre: ['Fiction'],
        imageUrl: 'https://example.com/second.jpg',
        isAvailable: true
      });

      // Verify owner has 2 books
      const beforeCount = await Book.countDocuments({ owner: bookOwner._id });
      expect(beforeCount).toBe(2);

      // Delete one book
      await request(app)
        .delete(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // Verify owner now has 1 book
      const afterCount = await Book.countDocuments({ owner: bookOwner._id });
      expect(afterCount).toBe(1);
    });
  });

  describe('Book deletion by non-owner', () => {
    test('should reject book deletion by non-owner with 403 Forbidden', async () => {
      const response = await request(app)
        .delete(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED_DELETE');
      expect(response.body.error.message).toBe('You can only delete your own book listings');

      // Verify book was NOT deleted from database
      const stillExistingBook = await Book.findById(testBook._id);
      expect(stillExistingBook).toBeTruthy();
      expect(stillExistingBook.title).toBe('Test Book for Deletion');
    });

    test('should reject deletion without authentication', async () => {
      const response = await request(app)
        .delete(`/api/books/${testBook._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');

      // Verify book was NOT deleted
      const stillExistingBook = await Book.findById(testBook._id);
      expect(stillExistingBook).toBeTruthy();
    });

    test('should reject deletion with invalid token', async () => {
      const response = await request(app)
        .delete(`/api/books/${testBook._id}`)
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');

      // Verify book was NOT deleted
      const stillExistingBook = await Book.findById(testBook._id);
      expect(stillExistingBook).toBeTruthy();
    });

    test('should prevent non-owner from deleting multiple books', async () => {
      // Create another book for the owner
      const secondBook = await Book.create({
        owner: bookOwner._id,
        title: 'Second Book',
        author: 'Test Author',
        condition: 'Good',
        genre: ['Fiction'],
        imageUrl: 'https://example.com/second.jpg',
        isAvailable: true
      });

      // Attempt to delete first book as non-owner
      await request(app)
        .delete(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .expect(403);

      // Attempt to delete second book as non-owner
      await request(app)
        .delete(`/api/books/${secondBook._id}`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .expect(403);

      // Verify both books still exist
      const firstBookExists = await Book.findById(testBook._id);
      const secondBookExists = await Book.findById(secondBook._id);
      expect(firstBookExists).toBeTruthy();
      expect(secondBookExists).toBeTruthy();
    });

    test('should allow owner to delete after non-owner failed attempt', async () => {
      // Non-owner attempts to delete
      await request(app)
        .delete(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .expect(403);

      // Verify book still exists
      let book = await Book.findById(testBook._id);
      expect(book).toBeTruthy();

      // Owner successfully deletes
      await request(app)
        .delete(`/api/books/${testBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // Verify book is now deleted
      book = await Book.findById(testBook._id);
      expect(book).toBeNull();
    });
  });

  describe('Edge cases', () => {
    test('should handle deletion of book with minimal data', async () => {
      // Create a book with only required fields
      const minimalBook = await Book.create({
        owner: bookOwner._id,
        title: 'Minimal Book',
        author: 'Minimal Author',
        condition: 'Good',
        genre: ['Fiction'],
        imageUrl: 'https://example.com/minimal.jpg',
        isAvailable: true
      });

      const response = await request(app)
        .delete(`/api/books/${minimalBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const deletedBook = await Book.findById(minimalBook._id);
      expect(deletedBook).toBeNull();
    });

    test('should handle deletion of book with all optional fields', async () => {
      // Create a book with all fields populated
      const completeBook = await Book.create({
        owner: bookOwner._id,
        title: 'Complete Book',
        author: 'Complete Author',
        condition: 'Like New',
        genre: ['Fiction', 'Mystery', 'Thriller'],
        isbn: '9781234567890',
        description: 'A complete book with all fields',
        publicationYear: 2023,
        publisher: 'Complete Publisher',
        imageUrl: 'https://example.com/complete.jpg',
        frontImageUrl: 'https://example.com/front.jpg',
        backImageUrl: 'https://example.com/back.jpg',
        googleBooksImageUrl: 'https://books.google.com/complete.jpg',
        isAvailable: true
      });

      const response = await request(app)
        .delete(`/api/books/${completeBook._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const deletedBook = await Book.findById(completeBook._id);
      expect(deletedBook).toBeNull();
    });

    test('should handle concurrent deletion attempts by owner', async () => {
      // Attempt to delete the same book twice simultaneously
      const [response1, response2] = await Promise.all([
        request(app)
          .delete(`/api/books/${testBook._id}`)
          .set('Authorization', `Bearer ${ownerToken}`),
        request(app)
          .delete(`/api/books/${testBook._id}`)
          .set('Authorization', `Bearer ${ownerToken}`)
      ]);

      // Due to race conditions, both might succeed or one might fail with 404
      // The important thing is that the book ends up deleted
      const responses = [response1, response2];
      const successCount = responses.filter(r => r.status === 200).length;
      const notFoundCount = responses.filter(r => r.status === 404).length;

      // At least one should succeed
      expect(successCount).toBeGreaterThanOrEqual(1);
      // Total responses should be 2
      expect(successCount + notFoundCount).toBe(2);

      // Verify book is deleted
      const deletedBook = await Book.findById(testBook._id);
      expect(deletedBook).toBeNull();
    });
  });
});
