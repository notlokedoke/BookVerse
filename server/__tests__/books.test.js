const request = require('supertest');
const mongoose = require('mongoose');
const axios = require('axios');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
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
});