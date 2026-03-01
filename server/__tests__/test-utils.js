/**
 * Test Utilities and Data Seeding Functions
 * 
 * This module provides helper functions for creating test data,
 * managing test database state, and common test operations.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Message = require('../models/Message');
const Rating = require('../models/Rating');
const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

/**
 * Clear all collections in the test database
 */
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Create a test user with default or custom data
 * @param {Object} userData - Custom user data (optional)
 * @returns {Promise<Object>} Created user document
 */
async function createTestUser(userData = {}) {
  const defaultUser = {
    name: 'Test User',
    email: `testuser${Date.now()}@example.com`,
    password: 'password123',
    city: 'Test City',
    privacySettings: {
      showCity: true
    },
    averageRating: 0,
    ratingCount: 0
  };

  const user = new User({ ...defaultUser, ...userData });
  await user.save();
  
  return user;
}

/**
 * Create multiple test users
 * @param {number} count - Number of users to create
 * @returns {Promise<Array>} Array of created user documents
 */
async function createTestUsers(count = 3) {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      name: `Test User ${i + 1}`,
      email: `testuser${i + 1}_${Date.now()}@example.com`,
      city: `City ${i + 1}`
    });
    users.push(user);
  }
  
  return users;
}

/**
 * Generate JWT token for a user
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
function generateAuthToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
}

/**
 * Create a test book listing
 * @param {string} ownerId - User ID of the book owner
 * @param {Object} bookData - Custom book data (optional)
 * @returns {Promise<Object>} Created book document
 */
async function createTestBook(ownerId, bookData = {}) {
  const defaultBook = {
    owner: ownerId,
    title: 'Test Book',
    author: 'Test Author',
    genre: ['Fiction'],
    condition: 'Good',
    imageUrl: 'https://example.com/book.jpg',
    description: 'A test book description',
    isAvailable: true
  };

  const book = new Book({ ...defaultBook, ...bookData });
  await book.save();
  
  return book;
}

/**
 * Create multiple test books for a user
 * @param {string} ownerId - User ID of the book owner
 * @param {number} count - Number of books to create
 * @returns {Promise<Array>} Array of created book documents
 */
async function createTestBooks(ownerId, count = 3) {
  const books = [];
  
  for (let i = 0; i < count; i++) {
    const book = await createTestBook(ownerId, {
      title: `Test Book ${i + 1}`,
      author: `Author ${i + 1}`,
      genre: [['Fiction', 'Non-Fiction', 'Mystery'][i % 3]]
    });
    books.push(book);
  }
  
  return books;
}

/**
 * Create a test trade
 * @param {string} proposerId - User ID of the proposer
 * @param {string} receiverId - User ID of the receiver
 * @param {string} requestedBookId - Book ID being requested
 * @param {string} offeredBookId - Book ID being offered
 * @param {Object} tradeData - Custom trade data (optional)
 * @returns {Promise<Object>} Created trade document
 */
async function createTestTrade(proposerId, receiverId, requestedBookId, offeredBookId, tradeData = {}) {
  const defaultTrade = {
    proposer: proposerId,
    receiver: receiverId,
    requestedBook: requestedBookId,
    offeredBook: offeredBookId,
    status: 'proposed',
    proposedAt: new Date()
  };

  const trade = new Trade({ ...defaultTrade, ...tradeData });
  await trade.save();
  
  return trade;
}

/**
 * Create a test message in a trade
 * @param {string} tradeId - Trade ID
 * @param {string} senderId - User ID of the sender
 * @param {Object} messageData - Custom message data (optional)
 * @returns {Promise<Object>} Created message document
 */
async function createTestMessage(tradeId, senderId, messageData = {}) {
  const defaultMessage = {
    trade: tradeId,
    sender: senderId,
    content: 'Test message content',
    createdAt: new Date()
  };

  const message = new Message({ ...defaultMessage, ...messageData });
  await message.save();
  
  return message;
}

/**
 * Create a test rating
 * @param {string} tradeId - Trade ID
 * @param {string} raterId - User ID of the rater
 * @param {string} ratedUserId - User ID of the rated user
 * @param {Object} ratingData - Custom rating data (optional)
 * @returns {Promise<Object>} Created rating document
 */
async function createTestRating(tradeId, raterId, ratedUserId, ratingData = {}) {
  const defaultRating = {
    trade: tradeId,
    rater: raterId,
    ratedUser: ratedUserId,
    stars: 5,
    comment: 'Great trader!',
    createdAt: new Date()
  };

  const rating = new Rating({ ...defaultRating, ...ratingData });
  await rating.save();
  
  return rating;
}

/**
 * Create a test wishlist item
 * @param {string} userId - User ID
 * @param {Object} wishlistData - Custom wishlist data (optional)
 * @returns {Promise<Object>} Created wishlist document
 */
async function createTestWishlist(userId, wishlistData = {}) {
  const defaultWishlist = {
    user: userId,
    title: 'Wishlist Book',
    author: 'Wishlist Author',
    isbn: '1234567890',
    notes: 'Looking for this book',
    createdAt: new Date()
  };

  const wishlist = new Wishlist({ ...defaultWishlist, ...wishlistData });
  await wishlist.save();
  
  return wishlist;
}

/**
 * Create a test notification
 * @param {string} recipientId - User ID of the recipient
 * @param {Object} notificationData - Custom notification data (optional)
 * @returns {Promise<Object>} Created notification document
 */
async function createTestNotification(recipientId, notificationData = {}) {
  const defaultNotification = {
    recipient: recipientId,
    type: 'trade_request',
    message: 'Test notification message',
    isRead: false,
    createdAt: new Date()
  };

  const notification = new Notification({ ...defaultNotification, ...notificationData });
  await notification.save();
  
  return notification;
}

/**
 * Seed a complete test scenario with users, books, and trades
 * @returns {Promise<Object>} Object containing all created test data
 */
async function seedCompleteScenario() {
  // Create users
  const user1 = await createTestUser({
    name: 'Alice Johnson',
    email: 'alice@test.com',
    city: 'New York'
  });

  const user2 = await createTestUser({
    name: 'Bob Smith',
    email: 'bob@test.com',
    city: 'Los Angeles'
  });

  const user3 = await createTestUser({
    name: 'Charlie Brown',
    email: 'charlie@test.com',
    city: 'Chicago'
  });

  // Create books for each user
  const aliceBooks = await createTestBooks(user1._id, 2);
  const bobBooks = await createTestBooks(user2._id, 2);
  const charlieBooks = await createTestBooks(user3._id, 2);

  // Create a trade between Alice and Bob
  const trade1 = await createTestTrade(
    user1._id,
    user2._id,
    bobBooks[0]._id,
    aliceBooks[0]._id
  );

  // Create a wishlist for Charlie
  const wishlist1 = await createTestWishlist(user3._id, {
    title: aliceBooks[1].title,
    author: aliceBooks[1].author
  });

  return {
    users: [user1, user2, user3],
    books: {
      alice: aliceBooks,
      bob: bobBooks,
      charlie: charlieBooks
    },
    trades: [trade1],
    wishlists: [wishlist1]
  };
}

/**
 * Wait for a specified amount of time (useful for async operations)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random email address
 * @returns {string} Random email address
 */
function generateRandomEmail() {
  return `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate a random ISBN
 * @returns {string} Random 10-digit ISBN
 */
function generateRandomISBN() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

module.exports = {
  clearDatabase,
  createTestUser,
  createTestUsers,
  generateAuthToken,
  createTestBook,
  createTestBooks,
  createTestTrade,
  createTestMessage,
  createTestRating,
  createTestWishlist,
  createTestNotification,
  seedCompleteScenario,
  wait,
  generateRandomEmail,
  generateRandomISBN
};
