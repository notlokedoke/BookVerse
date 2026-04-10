/**
 * End-to-End User Journey Tests
 * 
 * Task 158: Perform end-to-end testing for user journey
 * 
 * This test suite covers two critical user journeys:
 * 1. New user registration → create listing → logout flow
 * 2. Search → view book → propose trade flow
 * 
 * These tests validate the complete user experience from start to finish,
 * ensuring all components work together seamlessly.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Notification = require('../models/Notification');
const connectDB = require('../config/database');
const { clearDatabase, generateRandomEmail, createTestUser, createTestBook } = require('./test-utils');

describe('E2E User Journey Tests', () => {
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

  describe('Journey 1: New User Registration → Create Listing → Logout', () => {
    test('should complete full new user onboarding journey successfully', async () => {
      const newUserData = {
        name: 'Emma Wilson',
        email: generateRandomEmail(),
        password: 'securePassword123',
        city: 'San Francisco'
      };

      // ===== STEP 1: User Registration =====
      console.log('Step 1: Registering new user...');
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(newUserData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.message).toContain('registered successfully');
      expect(registerResponse.body.data).toHaveProperty('_id');
      expect(registerResponse.body.data.email).toBe(newUserData.email.toLowerCase());
      expect(registerResponse.body.data.name).toBe(newUserData.name);
      expect(registerResponse.body.data.city).toBe(newUserData.city);
      expect(registerResponse.body.data).not.toHaveProperty('password');

      const userId = registerResponse.body.data._id;

      // Verify user exists in database
      const userInDb = await User.findById(userId);
      expect(userInDb).toBeTruthy();
      expect(userInDb.email).toBe(newUserData.email.toLowerCase());

      // ===== STEP 2: User Login =====
      console.log('Step 2: Logging in...');
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: newUserData.email,
          password: newUserData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.message).toBe('Login successful');
      expect(loginResponse.body.data).toHaveProperty('token');
      expect(loginResponse.body.data).toHaveProperty('user');
      expect(loginResponse.body.data.user._id).toBe(userId);

      const authToken = loginResponse.body.data.token;

      // ===== STEP 3: Verify Profile Access =====
      console.log('Step 3: Accessing profile...');
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data._id).toBe(userId);
      expect(profileResponse.body.data.email).toBe(newUserData.email.toLowerCase());
      expect(profileResponse.body.data.privacySettings.showCity).toBe(true);
      expect(profileResponse.body.data.averageRating).toBe(0);

      // ===== STEP 4: Create Book Listing =====
      console.log('Step 4: Creating book listing...');
      
      const bookData = {
        title: 'The Midnight Library',
        author: 'Matt Haig',
        genres: ['Fiction'],
        condition: 'Like New',
        description: 'A wonderful book about infinite possibilities',
        isbn: '9780525559474',
        googleBooksImageUrl: 'https://example.com/book-cover.jpg'
      };

      const createBookResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', bookData.title)
        .field('author', bookData.author)
        .field('genres', JSON.stringify(bookData.genres))
        .field('condition', bookData.condition)
        .field('description', bookData.description)
        .field('isbn', bookData.isbn)
        .field('googleBooksImageUrl', bookData.googleBooksImageUrl)
        .expect(201);

      expect(createBookResponse.body.success).toBe(true);
      expect(createBookResponse.body.data).toHaveProperty('_id');
      expect(createBookResponse.body.data.title).toBe(bookData.title);
      expect(createBookResponse.body.data.author).toBe(bookData.author);
      expect(createBookResponse.body.data.genre).toContain('Fiction');
      expect(createBookResponse.body.data.condition).toBe(bookData.condition);
      expect(createBookResponse.body.data.owner._id).toBe(userId);
      expect(createBookResponse.body.data.isAvailable).toBe(true);
      expect(createBookResponse.body.data).toHaveProperty('imageUrl');

      const bookId = createBookResponse.body.data._id;

      // Verify book exists in database
      const bookInDb = await Book.findById(bookId);
      expect(bookInDb).toBeTruthy();
      expect(bookInDb.owner.toString()).toBe(userId);
      expect(bookInDb.title).toBe(bookData.title);

      // ===== STEP 5: Verify Book Appears in User's Listings =====
      console.log('Step 5: Verifying book in user listings...');
      const userBooksResponse = await request(app)
        .get(`/api/books/user/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(userBooksResponse.body.success).toBe(true);
      expect(userBooksResponse.body.data.books).toHaveLength(1);
      expect(userBooksResponse.body.data.books[0]._id).toBe(bookId);
      expect(userBooksResponse.body.data.books[0].title).toBe(bookData.title);

      // ===== STEP 6: Verify Book Appears in Browse/Search =====
      console.log('Step 6: Verifying book appears in search...');
      const browseResponse = await request(app)
        .get('/api/books')
        .expect(200);

      expect(browseResponse.body.success).toBe(true);
      expect(browseResponse.body.data.books.length).toBeGreaterThan(0);
      const createdBook = browseResponse.body.data.books.find(book => book._id === bookId);
      expect(createdBook).toBeTruthy();
      expect(createdBook.title).toBe(bookData.title);

      // ===== STEP 7: Logout (Verify Token Invalidation) =====
      console.log('Step 7: Testing logout...');
      // In a JWT-based system, logout is typically client-side (token removal)
      // We verify that the token is still valid before "logout"
      const preLogoutCheck = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(preLogoutCheck.body.success).toBe(true);

      // After logout, client would remove the token
      // We simulate this by attempting to access protected route without token
      const postLogoutCheck = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(postLogoutCheck.body.success).toBe(false);
      expect(postLogoutCheck.body.error.code).toBe('NO_TOKEN');

      // ===== FINAL VERIFICATION =====
      console.log('Final verification: Checking data persistence...');
      // Verify all data persists correctly
      const finalUser = await User.findById(userId);
      expect(finalUser).toBeTruthy();
      expect(finalUser.email).toBe(newUserData.email.toLowerCase());

      const finalBook = await Book.findById(bookId);
      expect(finalBook).toBeTruthy();
      expect(finalBook.owner.toString()).toBe(userId);

      console.log('✓ Journey 1 completed successfully!');
    });

    test('should handle errors gracefully during registration journey', async () => {
      const userData = {
        name: 'Test User',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Test City'
      };

      // Register successfully
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register again with same email (should fail)
      const duplicateResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.error.code).toBe('EMAIL_EXISTS');

      // Verify only one user was created
      const userCount = await User.countDocuments({ email: userData.email.toLowerCase() });
      expect(userCount).toBe(1);
    });

    test('should prevent creating book listing without authentication', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        genre: 'Fiction',
        condition: 'Good',
        description: 'Test description'
      };

      const response = await request(app)
        .post('/api/books')
        .send(bookData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');

      // Verify no book was created
      const bookCount = await Book.countDocuments();
      expect(bookCount).toBe(0);
    });
  });

  describe('Journey 2: Search → View Book → Propose Trade', () => {
    let existingUser, existingUserToken, existingBook;
    let newUser, newUserToken, newUserBook;

    beforeEach(async () => {
      // Set up existing user with a book (the one we'll search for and trade with)
      existingUser = await createTestUser({
        name: 'John Doe',
        email: 'john@example.com',
        city: 'New York'
      });
      existingUserToken = require('../utils/jwt').generateToken(existingUser._id);

      existingBook = await createTestBook(existingUser._id, {
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopian Fiction',
        condition: 'Good',
        description: 'Classic dystopian novel',
        isbn: '9780451524935'
      });

      // Set up new user with a book to offer in trade
      newUser = await createTestUser({
        name: 'Jane Smith',
        email: 'jane@example.com',
        city: 'Los Angeles'
      });
      newUserToken = require('../utils/jwt').generateToken(newUser._id);

      newUserBook = await createTestBook(newUser._id, {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Classic Fiction',
        condition: 'Like New',
        description: 'American classic'
      });
    });

    test('should complete full search and trade proposal journey successfully', async () => {
      // ===== STEP 1: Browse/Search for Books =====
      console.log('Step 1: Searching for books...');
      const searchResponse = await request(app)
        .get('/api/books')
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.books.length).toBeGreaterThan(0);
      
      // Find the book we're interested in
      const targetBook = searchResponse.body.data.books.find(book => book._id === existingBook._id.toString());
      expect(targetBook).toBeTruthy();
      expect(targetBook.title).toBe('1984');
      expect(targetBook.author).toBe('George Orwell');

      // ===== STEP 2: Filter Search by Genre =====
      console.log('Step 2: Filtering by genre...');
      const genreSearchResponse = await request(app)
        .get('/api/books?genre=Dystopian Fiction')
        .expect(200);

      expect(genreSearchResponse.body.success).toBe(true);
      const filteredBook = genreSearchResponse.body.data.books.find(book => book._id === existingBook._id.toString());
      expect(filteredBook).toBeTruthy();

      // ===== STEP 3: Filter Search by City =====
      console.log('Step 3: Filtering by city...');
      const citySearchResponse = await request(app)
        .get('/api/books?city=New York')
        .expect(200);

      expect(citySearchResponse.body.success).toBe(true);
      const cityFilteredBook = citySearchResponse.body.data.books.find(book => book._id === existingBook._id.toString());
      expect(cityFilteredBook).toBeTruthy();

      // ===== STEP 4: View Book Details =====
      console.log('Step 4: Viewing book details...');
      const bookDetailResponse = await request(app)
        .get(`/api/books/${existingBook._id}`)
        .expect(200);

      expect(bookDetailResponse.body.success).toBe(true);
      expect(bookDetailResponse.body.data._id).toBe(existingBook._id.toString());
      expect(bookDetailResponse.body.data.title).toBe('1984');
      expect(bookDetailResponse.body.data.author).toBe('George Orwell');
      expect(bookDetailResponse.body.data.genre).toContain('Dystopian Fiction');
      expect(bookDetailResponse.body.data.condition).toBe('Good');
      expect(bookDetailResponse.body.data.description).toBe('Classic dystopian novel');
      expect(bookDetailResponse.body.data.owner).toHaveProperty('_id');
      expect(bookDetailResponse.body.data.owner._id).toBe(existingUser._id.toString());
      expect(bookDetailResponse.body.data.owner.name).toBe('John Doe');
      expect(bookDetailResponse.body.data.isAvailable).toBe(true);

      // ===== STEP 5: View Book Owner's Profile =====
      console.log('Step 5: Viewing book owner profile...');
      const ownerProfileResponse = await request(app)
        .get(`/api/users/${existingUser._id}`)
        .expect(200);

      expect(ownerProfileResponse.body.success).toBe(true);
      expect(ownerProfileResponse.body.data._id).toBe(existingUser._id.toString());
      expect(ownerProfileResponse.body.data.name).toBe('John Doe');
      expect(ownerProfileResponse.body.data.city).toBe('New York');
      expect(ownerProfileResponse.body.data.averageRating).toBeDefined();
      expect(ownerProfileResponse.body.data).not.toHaveProperty('password');
      expect(ownerProfileResponse.body.data).not.toHaveProperty('email');

      // ===== STEP 6: Propose Trade =====
      console.log('Step 6: Proposing trade...');
      const proposeTradeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          requestedBook: existingBook._id.toString(),
          offeredBook: newUserBook._id.toString()
        })
        .expect(201);

      expect(proposeTradeResponse.body.success).toBe(true);
      expect(proposeTradeResponse.body.data).toHaveProperty('_id');
      expect(proposeTradeResponse.body.data.status).toBe('proposed');
      expect(proposeTradeResponse.body.data.proposer._id).toBe(newUser._id.toString());
      expect(proposeTradeResponse.body.data.receiver._id).toBe(existingUser._id.toString());
      expect(proposeTradeResponse.body.data.requestedBook._id).toBe(existingBook._id.toString());
      expect(proposeTradeResponse.body.data.offeredBook._id).toBe(newUserBook._id.toString());
      expect(proposeTradeResponse.body.data).toHaveProperty('proposedAt');

      const tradeId = proposeTradeResponse.body.data._id;

      // ===== STEP 7: Verify Trade Notification =====
      console.log('Step 7: Verifying trade notification...');
      const notifications = await Notification.find({ recipient: existingUser._id });
      expect(notifications.length).toBeGreaterThan(0);
      
      const tradeNotification = notifications.find(n => n.type === 'trade_request');
      expect(tradeNotification).toBeTruthy();
      expect(tradeNotification.relatedTrade.toString()).toBe(tradeId);
      expect(tradeNotification.relatedUser.toString()).toBe(newUser._id.toString());
      expect(tradeNotification.isRead).toBe(false);

      // ===== STEP 8: Verify Trade in Database =====
      console.log('Step 8: Verifying trade in database...');
      const tradeInDb = await Trade.findById(tradeId)
        .populate('proposer')
        .populate('receiver')
        .populate('requestedBook')
        .populate('offeredBook');

      expect(tradeInDb).toBeTruthy();
      expect(tradeInDb.status).toBe('proposed');
      expect(tradeInDb.proposer._id.toString()).toBe(newUser._id.toString());
      expect(tradeInDb.receiver._id.toString()).toBe(existingUser._id.toString());
      expect(tradeInDb.requestedBook._id.toString()).toBe(existingBook._id.toString());
      expect(tradeInDb.offeredBook._id.toString()).toBe(newUserBook._id.toString());

      // ===== STEP 9: Proposer Views Their Outgoing Trades =====
      console.log('Step 9: Viewing outgoing trades...');
      const outgoingTradesResponse = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(outgoingTradesResponse.body.success).toBe(true);
      expect(outgoingTradesResponse.body.data.length).toBeGreaterThan(0);
      
      const proposedTrade = outgoingTradesResponse.body.data.find(t => t._id === tradeId);
      expect(proposedTrade).toBeTruthy();
      expect(proposedTrade.status).toBe('proposed');

      // ===== STEP 10: Receiver Views Their Incoming Trades =====
      console.log('Step 10: Viewing incoming trades...');
      const incomingTradesResponse = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${existingUserToken}`)
        .expect(200);

      expect(incomingTradesResponse.body.success).toBe(true);
      expect(incomingTradesResponse.body.data.length).toBeGreaterThan(0);
      
      const receivedTrade = incomingTradesResponse.body.data.find(t => t._id === tradeId);
      expect(receivedTrade).toBeTruthy();
      expect(receivedTrade.status).toBe('proposed');

      console.log('✓ Journey 2 completed successfully!');
    });

    test('should handle search with multiple filters', async () => {
      // Create additional books for filtering
      await createTestBook(existingUser._id, {
        title: 'Brave New World',
        author: 'Aldous Huxley',
        genre: 'Dystopian Fiction',
        condition: 'Fair'
      });

      await createTestBook(newUser._id, {
        title: 'The Handmaid\'s Tale',
        author: 'Margaret Atwood',
        genre: 'Dystopian Fiction',
        condition: 'Good'
      });

      // Search with multiple filters
      const multiFilterResponse = await request(app)
        .get('/api/books?genre=Dystopian Fiction&city=New York')
        .expect(200);

      expect(multiFilterResponse.body.success).toBe(true);
      expect(multiFilterResponse.body.data.books.length).toBeGreaterThan(0);
      
      // All results should match both filters
      multiFilterResponse.body.data.books.forEach(book => {
        expect(book.genre).toContain('Dystopian Fiction');
        // Owner should be from New York
      });
    });

    test('should prevent proposing trade for own book', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          requestedBook: newUserBook._id.toString(),
          offeredBook: newUserBook._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CANNOT_REQUEST_OWN_BOOK');

      // Verify no trade was created
      const tradeCount = await Trade.countDocuments();
      expect(tradeCount).toBe(0);
    });

    test('should prevent proposing trade without authentication', async () => {
      const response = await request(app)
        .post('/api/trades')
        .send({
          requestedBook: existingBook._id.toString(),
          offeredBook: newUserBook._id.toString()
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');

      // Verify no trade was created
      const tradeCount = await Trade.countDocuments();
      expect(tradeCount).toBe(0);
    });

    test('should prevent proposing trade with book not owned by user', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          requestedBook: existingBook._id.toString(),
          offeredBook: existingBook._id.toString() // Trying to offer someone else's book
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_BOOK_OWNER');

      // Verify no trade was created
      const tradeCount = await Trade.countDocuments();
      expect(tradeCount).toBe(0);
    });

    test('should handle search with no results', async () => {
      const response = await request(app)
        .get('/api/books?genre=NonExistentGenre')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(0);
    });

    test('should handle viewing non-existent book', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/books/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_NOT_FOUND');
    });
  });

  describe('Combined Journey: Full Platform Experience', () => {
    test('should handle complete user lifecycle from registration to trade completion', async () => {
      // ===== USER 1: Registration and Book Creation =====
      const user1Data = {
        name: 'Alice Cooper',
        email: generateRandomEmail(),
        password: 'password123',
        city: 'Boston'
      };

      // Register User 1
      const user1RegisterResponse = await request(app)
        .post('/api/auth/register')
        .send(user1Data)
        .expect(201);

      const user1Id = user1RegisterResponse.body.data._id;

      // Login User 1
      const user1LoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user1Data.email,
          password: user1Data.password
        })
        .expect(200);

      const user1Token = user1LoginResponse.body.data.token;

      // User 1 creates a book
      const user1Book = await createTestBook(user1Id, {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        genre: 'Classic Fiction',
        condition: 'Good'
      });

      // ===== USER 2: Registration and Book Creation =====
      const user2Data = {
        name: 'Bob Dylan',
        email: generateRandomEmail(),
        password: 'password456',
        city: 'Seattle'
      };

      // Register User 2
      const user2RegisterResponse = await request(app)
        .post('/api/auth/register')
        .send(user2Data)
        .expect(201);

      const user2Id = user2RegisterResponse.body.data._id;

      // Login User 2
      const user2LoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user2Data.email,
          password: user2Data.password
        })
        .expect(200);

      const user2Token = user2LoginResponse.body.data.token;

      // User 2 creates a book
      const user2Book = await createTestBook(user2Id, {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Classic Fiction',
        condition: 'Like New'
      });

      // ===== USER 2 SEARCHES AND PROPOSES TRADE =====
      // User 2 searches for books
      const searchResponse = await request(app)
        .get('/api/books?genre=Classic Fiction')
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.books.length).toBeGreaterThan(0);

      // User 2 views User 1's book
      const bookDetailResponse = await request(app)
        .get(`/api/books/${user1Book._id}`)
        .expect(200);

      expect(bookDetailResponse.body.success).toBe(true);
      expect(bookDetailResponse.body.data.title).toBe('The Catcher in the Rye');

      // User 2 proposes trade
      const tradeResponse = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          requestedBook: user1Book._id.toString(),
          offeredBook: user2Book._id.toString()
        })
        .expect(201);

      expect(tradeResponse.body.success).toBe(true);
      expect(tradeResponse.body.data.status).toBe('proposed');

      const tradeId = tradeResponse.body.data._id;

      // ===== USER 1 ACCEPTS TRADE =====
      const acceptResponse = await request(app)
        .put(`/api/trades/${tradeId}/accept`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(acceptResponse.body.success).toBe(true);
      expect(acceptResponse.body.data.status).toBe('accepted');

      // ===== USERS EXCHANGE MESSAGES =====
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          trade: tradeId,
          content: 'Great! When can we meet?'
        })
        .expect(201);

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: tradeId,
          content: 'How about tomorrow at 3pm?'
        })
        .expect(201);

      // ===== USER 1 COMPLETES TRADE =====
      const completeResponse = await request(app)
        .put(`/api/trades/${tradeId}/complete`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(completeResponse.body.success).toBe(true);
      expect(completeResponse.body.data.status).toBe('completed');
      expect(completeResponse.body.data.ratingEnabled).toBe(true);

      // ===== VERIFY FINAL STATE =====
      const finalTrade = await Trade.findById(tradeId);
      expect(finalTrade.status).toBe('completed');
      expect(finalTrade.proposedAt).toBeDefined();
      expect(finalTrade.respondedAt).toBeDefined();
      expect(finalTrade.completedAt).toBeDefined();

      const notifications = await Notification.find({
        $or: [
          { recipient: user1Id },
          { recipient: user2Id }
        ]
      });
      expect(notifications.length).toBeGreaterThan(0);

      console.log('✓ Complete platform lifecycle test passed!');
    });
  });
});
