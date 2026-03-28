/**
 * Example Test Using Test Utilities
 * 
 * This file demonstrates how to use the test utilities
 * for creating test data and writing tests.
 */

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const {
  clearDatabase,
  createTestUser,
  createTestUsers,
  generateAuthToken,
  createTestBook,
  createTestBooks,
  createTestTrade,
  seedCompleteScenario,
  generateRandomEmail,
  generateRandomISBN
} = require('./test-utils');

describe('Test Utilities Examples', () => {
  beforeAll(async () => {
    // Connect to test database
    await connectDB();
  });

  afterAll(async () => {
    // Clean up and close connection
    await clearDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await clearDatabase();
  });

  describe('User Creation Utilities', () => {
    test('should create a single test user with default data', async () => {
      const user = await createTestUser();

      expect(user).toBeDefined();
      expect(user._id).toBeDefined();
      expect(user.name).toBe('Test User');
      expect(user.email).toContain('@example.com');
      expect(user.city).toBe('Test City');
      expect(user.privacySettings.showCity).toBe(true);
      expect(user.averageRating).toBe(0);
      expect(user.ratingCount).toBe(0);
    });

    test('should create a test user with custom data', async () => {
      const customData = {
        name: 'Custom User',
        email: 'custom@example.com',
        city: 'Custom City'
      };

      const user = await createTestUser(customData);

      expect(user.name).toBe(customData.name);
      expect(user.email).toBe(customData.email);
      expect(user.city).toBe(customData.city);
    });

    test('should create multiple test users', async () => {
      const users = await createTestUsers(3);

      expect(users).toHaveLength(3);
      expect(users[0].name).toBe('Test User 1');
      expect(users[1].name).toBe('Test User 2');
      expect(users[2].name).toBe('Test User 3');
      
      // Each user should have unique email
      const emails = users.map(u => u.email);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(3);
    });

    test('should generate valid auth token for user', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('Book Creation Utilities', () => {
    test('should create a single test book', async () => {
      const user = await createTestUser();
      const book = await createTestBook(user._id);

      expect(book).toBeDefined();
      expect(book._id).toBeDefined();
      expect(book.owner.toString()).toBe(user._id.toString());
      expect(book.title).toBe('Test Book');
      expect(book.author).toBe('Test Author');
      expect(book.genre).toEqual(['Fiction']);
      expect(book.condition).toBe('Good');
      expect(book.isAvailable).toBe(true);
    });

    test('should create a test book with custom data', async () => {
      const user = await createTestUser();
      const customBook = {
        title: 'Custom Book',
        author: 'Custom Author',
        genre: ['Mystery'],
        condition: 'Like New'
      };

      const book = await createTestBook(user._id, customBook);

      expect(book.title).toBe(customBook.title);
      expect(book.author).toBe(customBook.author);
      expect(book.genre).toEqual(customBook.genre);
      expect(book.condition).toBe(customBook.condition);
    });

    test('should create multiple test books for a user', async () => {
      const user = await createTestUser();
      const books = await createTestBooks(user._id, 5);

      expect(books).toHaveLength(5);
      
      // All books should belong to the same user
      books.forEach(book => {
        expect(book.owner.toString()).toBe(user._id.toString());
      });

      // Books should have different titles
      expect(books[0].title).toBe('Test Book 1');
      expect(books[1].title).toBe('Test Book 2');
      expect(books[4].title).toBe('Test Book 5');
    });
  });

  describe('Trade Creation Utilities', () => {
    test('should create a test trade', async () => {
      const [user1, user2] = await createTestUsers(2);
      const book1 = await createTestBook(user1._id);
      const book2 = await createTestBook(user2._id);

      const trade = await createTestTrade(
        user1._id,
        user2._id,
        book2._id,
        book1._id
      );

      expect(trade).toBeDefined();
      expect(trade._id).toBeDefined();
      expect(trade.proposer.toString()).toBe(user1._id.toString());
      expect(trade.receiver.toString()).toBe(user2._id.toString());
      expect(trade.requestedBook.toString()).toBe(book2._id.toString());
      expect(trade.offeredBook.toString()).toBe(book1._id.toString());
      expect(trade.status).toBe('proposed');
    });

    test('should create a trade with custom status', async () => {
      const [user1, user2] = await createTestUsers(2);
      const book1 = await createTestBook(user1._id);
      const book2 = await createTestBook(user2._id);

      const trade = await createTestTrade(
        user1._id,
        user2._id,
        book2._id,
        book1._id,
        { status: 'accepted' }
      );

      expect(trade.status).toBe('accepted');
    });
  });

  describe('Complete Scenario Seeding', () => {
    test('should seed a complete test scenario', async () => {
      const testData = await seedCompleteScenario();

      // Verify users
      expect(testData.users).toHaveLength(3);
      expect(testData.users[0].name).toBe('Alice Johnson');
      expect(testData.users[1].name).toBe('Bob Smith');
      expect(testData.users[2].name).toBe('Charlie Brown');

      // Verify books
      expect(testData.books.alice).toHaveLength(2);
      expect(testData.books.bob).toHaveLength(2);
      expect(testData.books.charlie).toHaveLength(2);

      // Verify trades
      expect(testData.trades).toHaveLength(1);
      expect(testData.trades[0].proposer.toString()).toBe(testData.users[0]._id.toString());
      expect(testData.trades[0].receiver.toString()).toBe(testData.users[1]._id.toString());

      // Verify wishlists
      expect(testData.wishlists).toHaveLength(1);
      expect(testData.wishlists[0].user.toString()).toBe(testData.users[2]._id.toString());
    });
  });

  describe('Utility Functions', () => {
    test('should generate random email', () => {
      const email1 = generateRandomEmail();
      const email2 = generateRandomEmail();

      expect(email1).toContain('@example.com');
      expect(email2).toContain('@example.com');
      expect(email1).not.toBe(email2); // Should be unique
    });

    test('should generate random ISBN', () => {
      const isbn1 = generateRandomISBN();
      const isbn2 = generateRandomISBN();

      expect(isbn1).toHaveLength(10);
      expect(isbn2).toHaveLength(10);
      expect(isbn1).not.toBe(isbn2); // Should be unique
      expect(/^\d{10}$/.test(isbn1)).toBe(true); // Should be 10 digits
    });
  });

  describe('Database Cleanup', () => {
    test('should clear all data from database', async () => {
      // Create some test data
      await createTestUsers(3);
      const user = await createTestUser();
      await createTestBooks(user._id, 5);

      // Clear database
      await clearDatabase();

      // Verify all collections are empty
      const User = require('../models/User');
      const Book = require('../models/Book');

      const userCount = await User.countDocuments();
      const bookCount = await Book.countDocuments();

      expect(userCount).toBe(0);
      expect(bookCount).toBe(0);
    });
  });
});
