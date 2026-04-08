/**
 * Integration Tests for Book Management Flow
 * 
 * This test suite covers the complete book management lifecycle,
 * including creation, editing, and deletion flows with proper
 * authorization and data persistence validation.
 * 
 * Test Coverage:
 * - Complete book creation → editing → deletion flow
 * - Authorization checks throughout the lifecycle
 * - Data validation and persistence
 * - Error handling at each step
 * - Multi-user scenarios
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const { generateToken } = require('../utils/jwt');
const { clearDatabase, generateRandomEmail } = require('./test-utils');

describe('Book Management Integration Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/bookverse_test');
    }
  });

  afterAll(async () => {
    await clearDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Complete Book Creation → Editing → Deletion Flow', () => {
    test('should complete full book lifecycle: create → edit → delete', async () => {
      // Step 1: Create user
      const userData = {
        name: 'Book Manager',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Book City'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.data._id;

      // Step 2: Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const authToken = loginResponse.body.data.token;

      // Step 3: Create book
      const bookData = {
        title: 'Original Book Title',
        author: 'Original Author',
        condition: 'Good',
        genres: JSON.stringify(['Fiction', 'Drama']),
        description: 'Original description',
        googleBooksImageUrl: 'https://example.com/original.jpg'
      };

      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.title).toBe('Original Book Title');
      expect(createResponse.body.data.author).toBe('Original Author');
      expect(createResponse.body.data.owner._id).toBe(userId);

      const bookId = createResponse.body.data._id;

      // Verify book exists in database
      let bookInDb = await Book.findById(bookId);
      expect(bookInDb).toBeTruthy();
      expect(bookInDb.title).toBe('Original Book Title');
      expect(bookInDb.owner.toString()).toBe(userId);

      // Step 4: Edit book
      const updateData = {
        title: 'Updated Book Title',
        author: 'Updated Author',
        condition: 'Like New',
        description: 'Updated description with more details'
      };

      const updateResponse = await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.title).toBe('Updated Book Title');
      expect(updateResponse.body.data.author).toBe('Updated Author');
      expect(updateResponse.body.data.condition).toBe('Like New');
      expect(updateResponse.body.data.description).toBe('Updated description with more details');
      expect(updateResponse.body.data._id).toBe(bookId);

      // Verify updates persisted in database
      bookInDb = await Book.findById(bookId);
      expect(bookInDb.title).toBe('Updated Book Title');
      expect(bookInDb.author).toBe('Updated Author');
      expect(bookInDb.condition).toBe('Like New');

      // Step 5: Delete book
      const deleteResponse = await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toBe('Book listing deleted successfully');

      // Verify book was deleted from database
      bookInDb = await Book.findById(bookId);
      expect(bookInDb).toBeNull();

      // Verify book no longer appears in listings
      const listResponse = await request(app)
        .get('/api/books')
        .expect(200);

      const bookExists = listResponse.body.data.books.some(b => b._id === bookId);
      expect(bookExists).toBe(false);
    });

    test('should handle multiple edits before deletion', async () => {
      // Create user and login
      const user = await User.create({
        name: 'Multi Edit User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Edit City'
      });
      const authToken = generateToken(user._id);

      // Create book
      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Version 1',
          author: 'Author V1',
          condition: 'Good',
          genres: JSON.stringify(['Fiction']),
          googleBooksImageUrl: 'https://example.com/v1.jpg'
        })
        .expect(201);

      const bookId = createResponse.body.data._id;

      // Edit 1: Update title
      await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Version 2' })
        .expect(200);

      let book = await Book.findById(bookId);
      expect(book.title).toBe('Version 2');
      expect(book.author).toBe('Author V1'); // Unchanged

      // Edit 2: Update author
      await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ author: 'Author V2' })
        .expect(200);

      book = await Book.findById(bookId);
      expect(book.title).toBe('Version 2');
      expect(book.author).toBe('Author V2');

      // Edit 3: Update condition and genres
      await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          condition: 'Like New',
          genres: JSON.stringify(['Fiction', 'Mystery'])
        })
        .expect(200);

      book = await Book.findById(bookId);
      expect(book.condition).toBe('Like New');
      expect(book.genre).toEqual(['Fiction', 'Mystery']);

      // Delete book
      await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      book = await Book.findById(bookId);
      expect(book).toBeNull();
    });

    test('should maintain data integrity throughout lifecycle', async () => {
      // Create user
      const user = await User.create({
        name: 'Integrity User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Integrity City'
      });
      const authToken = generateToken(user._id);

      // Create book with all fields
      const completeBookData = {
        title: 'Complete Book',
        author: 'Complete Author',
        condition: 'Good',
        genres: JSON.stringify(['Fiction', 'Drama', 'Classic']),
        isbn: '9781234567890',
        description: 'A complete book with all fields populated',
        publicationYear: 2020,
        publisher: 'Test Publisher',
        googleBooksImageUrl: 'https://example.com/complete.jpg'
      };

      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(completeBookData)
        .expect(201);

      const bookId = createResponse.body.data._id;

      // Verify all fields were saved correctly
      let book = await Book.findById(bookId);
      expect(book.title).toBe('Complete Book');
      expect(book.author).toBe('Complete Author');
      expect(book.condition).toBe('Good');
      expect(book.genre).toEqual(['Fiction', 'Drama', 'Classic']);
      expect(book.isbn).toBe('9781234567890');
      expect(book.description).toBe('A complete book with all fields populated');
      expect(book.publicationYear).toBe(2020);
      expect(book.publisher).toBe('Test Publisher');
      expect(book.owner.toString()).toBe(user._id.toString());
      expect(book.isAvailable).toBe(true);

      // Edit some fields
      await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Complete Book',
          publicationYear: 2021
        })
        .expect(200);

      // Verify edited fields changed and others remained
      book = await Book.findById(bookId);
      expect(book.title).toBe('Updated Complete Book');
      expect(book.publicationYear).toBe(2021);
      expect(book.author).toBe('Complete Author'); // Unchanged
      expect(book.isbn).toBe('9781234567890'); // Unchanged
      expect(book.owner.toString()).toBe(user._id.toString()); // Unchanged

      // Delete
      await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      book = await Book.findById(bookId);
      expect(book).toBeNull();
    });
  });

  describe('Book Creation and Editing Flow with Authorization', () => {
    test('should prevent non-owner from editing after creation', async () => {
      // Create two users
      const owner = await User.create({
        name: 'Book Owner',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Owner City'
      });

      const nonOwner = await User.create({
        name: 'Non Owner',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Non Owner City'
      });

      const ownerToken = generateToken(owner._id);
      const nonOwnerToken = generateToken(nonOwner._id);

      // Owner creates book
      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Owner Book',
          author: 'Owner Author',
          condition: 'Good',
          genres: JSON.stringify(['Fiction']),
          googleBooksImageUrl: 'https://example.com/owner.jpg'
        })
        .expect(201);

      const bookId = createResponse.body.data._id;

      // Non-owner attempts to edit
      const editResponse = await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(editResponse.body.success).toBe(false);
      expect(editResponse.body.error.code).toBe('UNAUTHORIZED_UPDATE');

      // Verify book was not modified
      const book = await Book.findById(bookId);
      expect(book.title).toBe('Owner Book');

      // Owner can still edit
      await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'Updated by Owner' })
        .expect(200);

      const updatedBook = await Book.findById(bookId);
      expect(updatedBook.title).toBe('Updated by Owner');
    });

    test('should prevent non-owner from deleting after creation', async () => {
      // Create two users
      const owner = await User.create({
        name: 'Book Owner',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Owner City'
      });

      const nonOwner = await User.create({
        name: 'Non Owner',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Non Owner City'
      });

      const ownerToken = generateToken(owner._id);
      const nonOwnerToken = generateToken(nonOwner._id);

      // Owner creates book
      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Protected Book',
          author: 'Protected Author',
          condition: 'Good',
          genres: JSON.stringify(['Fiction']),
          googleBooksImageUrl: 'https://example.com/protected.jpg'
        })
        .expect(201);

      const bookId = createResponse.body.data._id;

      // Non-owner attempts to delete
      const deleteResponse = await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .expect(403);

      expect(deleteResponse.body.success).toBe(false);
      expect(deleteResponse.body.error.code).toBe('UNAUTHORIZED_DELETE');

      // Verify book still exists
      let book = await Book.findById(bookId);
      expect(book).toBeTruthy();
      expect(book.title).toBe('Protected Book');

      // Owner can delete
      await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      book = await Book.findById(bookId);
      expect(book).toBeNull();
    });

    test('should require authentication for all operations', async () => {
      // Create user and book
      const user = await User.create({
        name: 'Auth Test User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Auth City'
      });
      const authToken = generateToken(user._id);

      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Auth Test Book',
          author: 'Auth Author',
          condition: 'Good',
          genres: JSON.stringify(['Fiction']),
          googleBooksImageUrl: 'https://example.com/auth.jpg'
        })
        .expect(201);

      const bookId = createResponse.body.data._id;

      // Attempt to edit without token
      await request(app)
        .put(`/api/books/${bookId}`)
        .send({ title: 'Unauthorized Edit' })
        .expect(401);

      // Attempt to delete without token
      await request(app)
        .delete(`/api/books/${bookId}`)
        .expect(401);

      // Verify book unchanged
      const book = await Book.findById(bookId);
      expect(book.title).toBe('Auth Test Book');
    });
  });

  describe('Book Deletion Flow', () => {
    test('should handle deletion of book with minimal data', async () => {
      const user = await User.create({
        name: 'Minimal User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Minimal City'
      });
      const authToken = generateToken(user._id);

      // Create minimal book
      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Minimal Book',
          author: 'Minimal Author',
          condition: 'Good',
          genres: JSON.stringify(['Fiction']),
          googleBooksImageUrl: 'https://example.com/minimal.jpg'
        })
        .expect(201);

      const bookId = createResponse.body.data._id;

      // Delete
      await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const book = await Book.findById(bookId);
      expect(book).toBeNull();
    });

    test('should handle deletion of book with all optional fields', async () => {
      const user = await User.create({
        name: 'Complete User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Complete City'
      });
      const authToken = generateToken(user._id);

      // Create complete book
      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Complete Book',
          author: 'Complete Author',
          condition: 'Like New',
          genres: JSON.stringify(['Fiction', 'Mystery', 'Thriller']),
          isbn: '9781234567890',
          description: 'A complete book with all fields',
          publicationYear: 2023,
          publisher: 'Complete Publisher',
          googleBooksImageUrl: 'https://example.com/complete.jpg'
        })
        .expect(201);

      const bookId = createResponse.body.data._id;

      // Delete
      await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const book = await Book.findById(bookId);
      expect(book).toBeNull();
    });

    test('should verify book no longer appears in search after deletion', async () => {
      const user = await User.create({
        name: 'Search User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Search City'
      });
      const authToken = generateToken(user._id);

      // Create book
      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Searchable Book',
          author: 'Searchable Author',
          condition: 'Good',
          genres: JSON.stringify(['Science Fiction']),
          googleBooksImageUrl: 'https://example.com/search.jpg'
        })
        .expect(201);

      const bookId = createResponse.body.data._id;

      // Verify book appears in search
      const beforeSearch = await request(app)
        .get('/api/books')
        .expect(200);

      const bookFoundBefore = beforeSearch.body.data.books.some(b => b._id === bookId);
      expect(bookFoundBefore).toBe(true);

      // Delete book
      await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify book no longer appears in search
      const afterSearch = await request(app)
        .get('/api/books')
        .expect(200);

      const bookFoundAfter = afterSearch.body.data.books.some(b => b._id === bookId);
      expect(bookFoundAfter).toBe(false);
    });

    test('should handle deletion and verify owner book count decreases', async () => {
      const user = await User.create({
        name: 'Count User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Count City'
      });
      const authToken = generateToken(user._id);

      // Create three books
      const book1 = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Book 1',
          author: 'Author 1',
          condition: 'Good',
          genres: JSON.stringify(['Fiction']),
          googleBooksImageUrl: 'https://example.com/1.jpg'
        })
        .expect(201);

      await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Book 2',
          author: 'Author 2',
          condition: 'Good',
          genres: JSON.stringify(['Fiction']),
          googleBooksImageUrl: 'https://example.com/2.jpg'
        })
        .expect(201);

      await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Book 3',
          author: 'Author 3',
          condition: 'Good',
          genres: JSON.stringify(['Fiction']),
          googleBooksImageUrl: 'https://example.com/3.jpg'
        })
        .expect(201);

      // Verify count is 3
      let count = await Book.countDocuments({ owner: user._id });
      expect(count).toBe(3);

      // Delete one book
      await request(app)
        .delete(`/api/books/${book1.body.data._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify count is now 2
      count = await Book.countDocuments({ owner: user._id });
      expect(count).toBe(2);
    });
  });

  describe('Error Handling Throughout Lifecycle', () => {
    test('should handle creation errors and allow retry', async () => {
      const user = await User.create({
        name: 'Retry User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Retry City'
      });
      const authToken = generateToken(user._id);

      // Attempt to create with missing required field
      await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Incomplete Book',
          author: 'Author',
          condition: 'Good'
          // Missing genres
        })
        .expect(400);

      // Verify no book was created
      let count = await Book.countDocuments({ owner: user._id });
      expect(count).toBe(0);

      // Retry with complete data
      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Complete Book',
          author: 'Author',
          condition: 'Good',
          genres: JSON.stringify(['Fiction']),
          googleBooksImageUrl: 'https://example.com/complete.jpg'
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);

      // Verify book was created
      count = await Book.countDocuments({ owner: user._id });
      expect(count).toBe(1);
    });

    test('should handle edit errors and maintain original data', async () => {
      const user = await User.create({
        name: 'Edit Error User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Edit Error City'
      });
      const authToken = generateToken(user._id);

      // Create book
      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Original Title',
          author: 'Original Author',
          condition: 'Good',
          genres: JSON.stringify(['Fiction']),
          googleBooksImageUrl: 'https://example.com/original.jpg'
        })
        .expect(201);

      const bookId = createResponse.body.data._id;

      // Attempt invalid edit
      await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ condition: 'Invalid Condition' })
        .expect(400);

      // Verify original data unchanged
      let book = await Book.findById(bookId);
      expect(book.title).toBe('Original Title');
      expect(book.condition).toBe('Good');

      // Successful edit
      await request(app)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ condition: 'Like New' })
        .expect(200);

      book = await Book.findById(bookId);
      expect(book.condition).toBe('Like New');
    });

    test('should handle deletion of non-existent book gracefully', async () => {
      const user = await User.create({
        name: 'Delete Error User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Delete Error City'
      });
      const authToken = generateToken(user._id);

      const nonExistentId = new mongoose.Types.ObjectId();

      // Attempt to delete non-existent book
      const deleteResponse = await request(app)
        .delete(`/api/books/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(deleteResponse.body.success).toBe(false);
      expect(deleteResponse.body.error.code).toBe('BOOK_NOT_FOUND');
    });
  });

  describe('Multi-User Book Management Scenarios', () => {
    test('should handle multiple users creating and managing their own books', async () => {
      // Create three users
      const users = await Promise.all([
        User.create({
          name: 'User One',
          email: generateRandomEmail(),
          password: 'password123',
          city: 'City One'
        }),
        User.create({
          name: 'User Two',
          email: generateRandomEmail(),
          password: 'password123',
          city: 'City Two'
        }),
        User.create({
          name: 'User Three',
          email: generateRandomEmail(),
          password: 'password123',
          city: 'City Three'
        })
      ]);

      const tokens = users.map(user => generateToken(user._id));

      // Each user creates a book
      const books = await Promise.all(
        users.map((user, index) =>
          request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${tokens[index]}`)
            .send({
              title: `Book by User ${index + 1}`,
              author: `Author ${index + 1}`,
              condition: 'Good',
              genres: JSON.stringify(['Fiction']),
              googleBooksImageUrl: `https://example.com/user${index + 1}.jpg`
            })
            .expect(201)
        )
      );

      // Verify each user owns their book
      for (let i = 0; i < users.length; i++) {
        expect(books[i].body.data.owner._id).toBe(users[i]._id.toString());
      }

      // Each user edits their own book
      await Promise.all(
        books.map((book, index) =>
          request(app)
            .put(`/api/books/${book.body.data._id}`)
            .set('Authorization', `Bearer ${tokens[index]}`)
            .send({ title: `Updated Book ${index + 1}` })
            .expect(200)
        )
      );

      // Verify edits
      for (let i = 0; i < books.length; i++) {
        const book = await Book.findById(books[i].body.data._id);
        expect(book.title).toBe(`Updated Book ${i + 1}`);
      }

      // User 1 cannot edit User 2's book
      await request(app)
        .put(`/api/books/${books[1].body.data._id}`)
        .set('Authorization', `Bearer ${tokens[0]}`)
        .send({ title: 'Unauthorized Edit' })
        .expect(403);

      // Each user deletes their own book
      await Promise.all(
        books.map((book, index) =>
          request(app)
            .delete(`/api/books/${book.body.data._id}`)
            .set('Authorization', `Bearer ${tokens[index]}`)
            .expect(200)
        )
      );

      // Verify all books deleted
      const remainingBooks = await Book.countDocuments();
      expect(remainingBooks).toBe(0);
    });
  });
});
