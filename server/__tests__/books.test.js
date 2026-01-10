const request = require('supertest');
const mongoose = require('mongoose');
const axios = require('axios');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const { generateToken } = require('../utils/jwt');

// Mock axios for ISBN lookup tests
jest.mock('axios');
const mockedAxios = axios;

describe('Books API - Privacy Settings', () => {
  let publicUser, privateUser, publicUserToken, privateUserToken;
  let publicUserBook, privateUserBook;

  beforeAll(async () => {
    // Set up test environment variables
    process.env.GOOGLE_BOOKS_API_KEY = 'test-api-key';
    
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/bookverse_test');
    }
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Book.deleteMany({});
    await Trade.deleteMany({});

    // Create test users
    publicUser = await User.create({
      name: 'Public User',
      email: 'public@example.com',
      password: 'password123',
      city: 'New York',
      privacySettings: { showCity: true }
    });

    privateUser = await User.create({
      name: 'Private User',
      email: 'private@example.com',
      password: 'password123',
      city: 'Los Angeles',
      privacySettings: { showCity: false }
    });

    // Generate tokens
    publicUserToken = generateToken(publicUser._id);
    privateUserToken = generateToken(privateUser._id);

    // Create test books
    publicUserBook = await Book.create({
      owner: publicUser._id,
      title: 'Public User Book',
      author: 'Test Author',
      genre: 'Fiction',
      condition: 'Good',
      imageUrl: 'https://example.com/image1.jpg'
    });

    privateUserBook = await Book.create({
      owner: privateUser._id,
      title: 'Private User Book',
      author: 'Test Author',
      genre: 'Fiction',
      condition: 'Good',
      imageUrl: 'https://example.com/image2.jpg'
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
    await Trade.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/books/:id', () => {
    test('should show city for public user book owner', async () => {
      const response = await request(app)
        .get(`/api/books/${publicUserBook._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.owner.name).toBe('Public User');
      expect(response.body.data.owner.city).toBe('New York');
      expect(response.body.data.owner.email).toBeUndefined();
    });

    test('should hide city for private user book owner', async () => {
      const response = await request(app)
        .get(`/api/books/${privateUserBook._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.owner.name).toBe('Private User');
      expect(response.body.data.owner.city).toBeUndefined();
      expect(response.body.data.owner.email).toBeUndefined();
    });

    test('should return 404 for non-existent book', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/books/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_NOT_FOUND');
    });

    test('should return 400 for invalid book ID format', async () => {
      const response = await request(app)
        .get('/api/books/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_BOOK_ID');
    });
  });

  describe('GET /api/books', () => {
    test('should apply privacy settings to all books in list', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(2);

      const publicBook = response.body.data.books.find(book => book.title === 'Public User Book');
      const privateBook = response.body.data.books.find(book => book.title === 'Private User Book');

      expect(publicBook.owner.city).toBe('New York');
      expect(privateBook.owner.city).toBeUndefined();
      expect(publicBook.owner.name).toBe('Public User');
      expect(privateBook.owner.name).toBe('Private User');
    });

    test('should filter by city only for users with public city settings', async () => {
      const response = await request(app)
        .get('/api/books?city=New York')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe('Public User Book');
      expect(response.body.data.books[0].owner.city).toBe('New York');
    });

    test('should not return private user books when filtering by their city', async () => {
      const response = await request(app)
        .get('/api/books?city=Los Angeles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(0);
    });

    test('should filter by genre regardless of privacy settings', async () => {
      const response = await request(app)
        .get('/api/books?genre=Fiction')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(2);
    });

    test('should filter by genre with exact match only', async () => {
      // Create additional books with different genres to test exact matching
      await Book.create({
        owner: publicUser._id,
        title: 'Science Fiction Book',
        author: 'Sci-Fi Author',
        genre: 'Science Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/scifi.jpg'
      });

      await Book.create({
        owner: publicUser._id,
        title: 'Non-Fiction Book',
        author: 'Non-Fiction Author',
        genre: 'Non-Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/nonfiction.jpg'
      });

      // Test exact match for "Fiction" - should only return books with genre exactly "Fiction"
      const fictionResponse = await request(app)
        .get('/api/books?genre=Fiction')
        .expect(200);

      expect(fictionResponse.body.success).toBe(true);
      expect(fictionResponse.body.data.books).toHaveLength(2); // Only the original 2 Fiction books
      fictionResponse.body.data.books.forEach(book => {
        expect(book.genre).toBe('Fiction');
      });

      // Test exact match for "Science Fiction" - should only return the Science Fiction book
      const sciFiResponse = await request(app)
        .get('/api/books?genre=Science Fiction')
        .expect(200);

      expect(sciFiResponse.body.success).toBe(true);
      expect(sciFiResponse.body.data.books).toHaveLength(1);
      expect(sciFiResponse.body.data.books[0].genre).toBe('Science Fiction');
      expect(sciFiResponse.body.data.books[0].title).toBe('Science Fiction Book');

      // Test exact match for "Non-Fiction" - should only return the Non-Fiction book
      const nonFictionResponse = await request(app)
        .get('/api/books?genre=Non-Fiction')
        .expect(200);

      expect(nonFictionResponse.body.success).toBe(true);
      expect(nonFictionResponse.body.data.books).toHaveLength(1);
      expect(nonFictionResponse.body.data.books[0].genre).toBe('Non-Fiction');
      expect(nonFictionResponse.body.data.books[0].title).toBe('Non-Fiction Book');

      // Test partial match should not work - searching for "Fiction" should not return "Science Fiction" or "Non-Fiction"
      const partialResponse = await request(app)
        .get('/api/books?genre=Fiction')
        .expect(200);

      expect(partialResponse.body.success).toBe(true);
      expect(partialResponse.body.data.books).toHaveLength(2); // Only exact "Fiction" matches
      partialResponse.body.data.books.forEach(book => {
        expect(book.genre).toBe('Fiction'); // Should not include "Science Fiction" or "Non-Fiction"
      });
    });

    test('should filter by author regardless of privacy settings', async () => {
      const response = await request(app)
        .get('/api/books?author=Test Author')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(2);
    });

    test('should include pagination information', async () => {
      const response = await request(app)
        .get('/api/books?limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.pagination).toEqual({
        currentPage: 1,
        totalPages: 2,
        totalBooks: 2,
        hasNextPage: true,
        hasPrevPage: false
      });
    });
  });

  describe('GET /api/books/user/:userId', () => {
    test('should apply privacy settings to user books', async () => {
      const response = await request(app)
        .get(`/api/books/user/${publicUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].owner.city).toBe('New York');
      expect(response.body.data.books[0].owner.name).toBe('Public User');
    });

    test('should hide city for private user books', async () => {
      const response = await request(app)
        .get(`/api/books/user/${privateUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].owner.city).toBeUndefined();
      expect(response.body.data.books[0].owner.name).toBe('Private User');
    });

    test('should return empty array for user with no books', async () => {
      const userWithNoBooks = await User.create({
        name: 'No Books User',
        email: 'nobooks@example.com',
        password: 'password123',
        city: 'Chicago'
      });

      const response = await request(app)
        .get(`/api/books/user/${userWithNoBooks._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(0);
    });

    test('should return 400 for invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/books/user/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_USER_ID');
    });

    test('should include pagination information', async () => {
      const response = await request(app)
        .get(`/api/books/user/${publicUser._id}?limit=1`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalBooks: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    });
  });

  describe('POST /api/books/isbn/:isbn', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });

    test('should return book data for valid ISBN', async () => {
      const mockGoogleBooksResponse = {
        data: {
          items: [{
            volumeInfo: {
              title: 'The Great Gatsby',
              authors: ['F. Scott Fitzgerald'],
              publisher: 'Scribner',
              publishedDate: '1925-04-10',
              description: 'A classic American novel',
              pageCount: 180,
              categories: ['Fiction'],
              imageLinks: {
                thumbnail: 'https://example.com/thumbnail.jpg'
              }
            }
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockGoogleBooksResponse);

      const response = await request(app)
        .post('/api/books/isbn/9780743273565')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        publisher: 'Scribner',
        publicationYear: 1925,
        isbn: '9780743273565',
        description: 'A classic American novel',
        pageCount: 180,
        categories: ['Fiction'],
        thumbnail: 'https://example.com/thumbnail.jpg'
      });
      expect(response.body.message).toBe('Book data retrieved successfully');
    });

    test('should handle ISBN with hyphens and spaces', async () => {
      const mockGoogleBooksResponse = {
        data: {
          items: [{
            volumeInfo: {
              title: 'Test Book',
              authors: ['Test Author']
            }
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockGoogleBooksResponse);

      const response = await request(app)
        .post('/api/books/isbn/978-0-7432-7356-5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isbn).toBe('9780743273565');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('isbn:9780743273565'),
        expect.any(Object)
      );
    });

    test('should handle 10-digit ISBN', async () => {
      const mockGoogleBooksResponse = {
        data: {
          items: [{
            volumeInfo: {
              title: 'Test Book',
              authors: ['Test Author']
            }
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockGoogleBooksResponse);

      const response = await request(app)
        .post('/api/books/isbn/0743273567')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isbn).toBe('0743273567');
    });

    test('should return 400 for empty ISBN', async () => {
      const response = await request(app)
        .post('/api/books/isbn/%20') // URL encoded space
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ISBN_REQUIRED');
    });

    test('should return 400 for invalid ISBN format', async () => {
      const response = await request(app)
        .post('/api/books/isbn/invalid-isbn')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ISBN_FORMAT');
    });

    test('should return 404 when no book found', async () => {
      const mockGoogleBooksResponse = {
        data: {
          items: []
        }
      };

      mockedAxios.get.mockResolvedValue(mockGoogleBooksResponse);

      const response = await request(app)
        .post('/api/books/isbn/9999999999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_NOT_FOUND');
    });

    test('should handle missing optional fields gracefully', async () => {
      const mockGoogleBooksResponse = {
        data: {
          items: [{
            volumeInfo: {
              title: 'Minimal Book Data'
              // Missing authors, publisher, etc.
            }
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockGoogleBooksResponse);

      const response = await request(app)
        .post('/api/books/isbn/9780743273565')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        title: 'Minimal Book Data',
        author: '',
        publisher: '',
        publicationYear: null,
        isbn: '9780743273565',
        description: '',
        pageCount: null,
        categories: [],
        thumbnail: null
      });
    });

    test('should handle API timeout error', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.code = 'ECONNABORTED';
      mockedAxios.get.mockRejectedValue(timeoutError);

      const response = await request(app)
        .post('/api/books/isbn/9780743273565')
        .expect(408);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REQUEST_TIMEOUT');
    });

    test('should handle API quota exceeded error', async () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.response = { status: 403 };
      mockedAxios.get.mockRejectedValue(quotaError);

      const response = await request(app)
        .post('/api/books/isbn/9780743273565')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('API_QUOTA_EXCEEDED');
    });

    test('should handle network connection error', async () => {
      const networkError = new Error('Network error');
      networkError.code = 'ENOTFOUND';
      mockedAxios.get.mockRejectedValue(networkError);

      const response = await request(app)
        .post('/api/books/isbn/9780743273565')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('API_CONNECTION_ERROR');
    });
  });

  describe('PUT /api/books/:id', () => {
    test('should update book listing when user is owner', async () => {
      const updateData = {
        title: 'Updated Book Title',
        author: 'Updated Author',
        condition: 'Like New',
        genre: 'Updated Genre',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Book Title');
      expect(response.body.data.author).toBe('Updated Author');
      expect(response.body.data.condition).toBe('Like New');
      expect(response.body.data.genre).toBe('Updated Genre');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.message).toBe('Book listing updated successfully');
    });

    test('should return 403 when user tries to update book they do not own', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${privateUserToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED_UPDATE');
      expect(response.body.error.message).toBe('You can only update your own book listings');
    });

    test('should return 401 when no authentication token provided', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/books/${publicUserBook._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when book does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        title: 'Non-existent Book'
      };

      const response = await request(app)
        .put(`/api/books/${fakeId}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_NOT_FOUND');
    });

    test('should return 400 for invalid book ID format', async () => {
      const updateData = {
        title: 'Invalid ID Test'
      };

      const response = await request(app)
        .put('/api/books/invalid-id')
        .set('Authorization', `Bearer ${publicUserToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_BOOK_ID');
    });

    test('should validate required fields when provided', async () => {
      const updateData = {
        title: '', // Empty title should fail
        author: 'Valid Author'
      };

      const response = await request(app)
        .put(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TITLE');
    });

    test('should validate condition field when provided', async () => {
      const updateData = {
        condition: 'Invalid Condition'
      };

      const response = await request(app)
        .put(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CONDITION');
    });

    test('should allow partial updates', async () => {
      const updateData = {
        title: 'Only Title Updated'
      };

      const response = await request(app)
        .put(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Only Title Updated');
      expect(response.body.data.author).toBe('Test Author'); // Should remain unchanged
      expect(response.body.data.genre).toBe('Fiction'); // Should remain unchanged
    });

    test('should allow clearing optional fields', async () => {
      // First add some optional data
      await Book.findByIdAndUpdate(publicUserBook._id, {
        isbn: '1234567890',
        description: 'Original description',
        publisher: 'Original publisher'
      });

      const updateData = {
        isbn: '',
        description: '',
        publisher: ''
      };

      const response = await request(app)
        .put(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isbn).toBeNull();
      expect(response.body.data.description).toBeNull();
      expect(response.body.data.publisher).toBeNull();
    });

    test('should apply privacy settings to updated book response', async () => {
      const updateData = {
        title: 'Privacy Test Update'
      };

      const response = await request(app)
        .put(`/api/books/${privateUserBook._id}`)
        .set('Authorization', `Bearer ${privateUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Privacy Test Update');
      expect(response.body.data.owner.name).toBe('Private User');
      expect(response.body.data.owner.city).toBeUndefined(); // Should be hidden due to privacy settings
    });
  });

  describe('DELETE /api/books/:id', () => {
    test('should delete book listing when user is owner', async () => {
      const response = await request(app)
        .delete(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book listing deleted successfully');

      // Verify book is actually deleted from database
      const deletedBook = await Book.findById(publicUserBook._id);
      expect(deletedBook).toBeNull();
    });

    test('should prevent deletion when book has active trades (Requirement 5.5)', async () => {
      // Create another user and book for trade
      const traderUser = await User.create({
        name: 'Trader User',
        email: 'trader@example.com',
        password: 'password123',
        city: 'Chicago'
      });

      const traderBook = await Book.create({
        owner: traderUser._id,
        title: 'Trader Book',
        author: 'Trader Author',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/trader.jpg'
      });

      // Create an active trade (proposed status)
      const activeTrade = await Trade.create({
        proposer: traderUser._id,
        receiver: publicUser._id,
        requestedBook: publicUserBook._id,
        offeredBook: traderBook._id,
        status: 'proposed'
      });

      const response = await request(app)
        .delete(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_HAS_ACTIVE_TRADES');
      expect(response.body.error.message).toContain('Cannot delete book listing because it is involved in active trades');
      expect(response.body.error.details.activeTradeCount).toBe(1);
      expect(response.body.error.details.tradeIds).toContain(activeTrade._id.toString());

      // Verify book still exists in database
      const existingBook = await Book.findById(publicUserBook._id);
      expect(existingBook).not.toBeNull();
    });

    test('should prevent deletion when book has accepted trades (Requirement 5.5)', async () => {
      // Create another user and book for trade
      const traderUser = await User.create({
        name: 'Trader User',
        email: 'trader@example.com',
        password: 'password123',
        city: 'Chicago'
      });

      const traderBook = await Book.create({
        owner: traderUser._id,
        title: 'Trader Book',
        author: 'Trader Author',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/trader.jpg'
      });

      // Create an accepted trade
      const acceptedTrade = await Trade.create({
        proposer: traderUser._id,
        receiver: publicUser._id,
        requestedBook: publicUserBook._id,
        offeredBook: traderBook._id,
        status: 'accepted',
        respondedAt: new Date()
      });

      const response = await request(app)
        .delete(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_HAS_ACTIVE_TRADES');
      expect(response.body.error.details.activeTradeCount).toBe(1);
      expect(response.body.error.details.tradeIds).toContain(acceptedTrade._id.toString());

      // Verify book still exists in database
      const existingBook = await Book.findById(publicUserBook._id);
      expect(existingBook).not.toBeNull();
    });

    test('should allow deletion when book has only completed or declined trades', async () => {
      // Create another user and book for trade
      const traderUser = await User.create({
        name: 'Trader User',
        email: 'trader@example.com',
        password: 'password123',
        city: 'Chicago'
      });

      const traderBook = await Book.create({
        owner: traderUser._id,
        title: 'Trader Book',
        author: 'Trader Author',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/trader.jpg'
      });

      // Create completed and declined trades
      await Trade.create({
        proposer: traderUser._id,
        receiver: publicUser._id,
        requestedBook: publicUserBook._id,
        offeredBook: traderBook._id,
        status: 'completed',
        respondedAt: new Date(),
        completedAt: new Date()
      });

      await Trade.create({
        proposer: publicUser._id,
        receiver: traderUser._id,
        requestedBook: traderBook._id,
        offeredBook: publicUserBook._id,
        status: 'declined',
        respondedAt: new Date()
      });

      const response = await request(app)
        .delete(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book listing deleted successfully');

      // Verify book is actually deleted from database
      const deletedBook = await Book.findById(publicUserBook._id);
      expect(deletedBook).toBeNull();
    });

    test('should prevent deletion when book is offered in active trade', async () => {
      // Create another user and book for trade
      const traderUser = await User.create({
        name: 'Trader User',
        email: 'trader@example.com',
        password: 'password123',
        city: 'Chicago'
      });

      const traderBook = await Book.create({
        owner: traderUser._id,
        title: 'Trader Book',
        author: 'Trader Author',
        genre: 'Fiction',
        condition: 'Good',
        imageUrl: 'https://example.com/trader.jpg'
      });

      // Create a trade where publicUserBook is the offered book (not requested)
      const activeTrade = await Trade.create({
        proposer: publicUser._id,
        receiver: traderUser._id,
        requestedBook: traderBook._id,
        offeredBook: publicUserBook._id, // This book is being offered
        status: 'proposed'
      });

      const response = await request(app)
        .delete(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_HAS_ACTIVE_TRADES');
      expect(response.body.error.details.activeTradeCount).toBe(1);
      expect(response.body.error.details.tradeIds).toContain(activeTrade._id.toString());

      // Verify book still exists in database
      const existingBook = await Book.findById(publicUserBook._id);
      expect(existingBook).not.toBeNull();
    });

    test('should return 403 when user tries to delete book they do not own', async () => {
      const response = await request(app)
        .delete(`/api/books/${publicUserBook._id}`)
        .set('Authorization', `Bearer ${privateUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED_DELETE');
      expect(response.body.error.message).toBe('You can only delete your own book listings');

      // Verify book still exists in database
      const existingBook = await Book.findById(publicUserBook._id);
      expect(existingBook).not.toBeNull();
    });

    test('should return 401 when no authentication token provided', async () => {
      const response = await request(app)
        .delete(`/api/books/${publicUserBook._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);

      // Verify book still exists in database
      const existingBook = await Book.findById(publicUserBook._id);
      expect(existingBook).not.toBeNull();
    });

    test('should return 404 when book does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/books/${fakeId}`)
        .set('Authorization', `Bearer ${publicUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOK_NOT_FOUND');
    });

    test('should return 400 for invalid book ID format', async () => {
      const response = await request(app)
        .delete('/api/books/invalid-id')
        .set('Authorization', `Bearer ${publicUserToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_BOOK_ID');
    });
  });
});