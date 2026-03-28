const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const { generateToken } = require('../utils/jwt');

// Mock axios for ISBN lookup tests
jest.mock('axios');
const mockedAxios = axios;

describe('Book Creation Tests (Task 139)', () => {
  let testUser, authToken;

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
    jest.clearAllMocks();

    // Default Open Library cover probe to "not found" so ISBN tests
    // keep using the mocked Google Books thumbnail unless overridden.
    mockedAxios.head.mockRejectedValue(new Error('Open Library cover not found'));

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      city: 'Test City'
    });

    // Generate auth token
    authToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Book creation with all required fields', () => {
    test('should create book with all required fields (title, author, condition, genres) and Google Books image', async () => {
      const bookData = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        condition: 'Good',
        genres: JSON.stringify(['Fiction', 'Classic']),
        googleBooksImageUrl: 'https://books.google.com/books/content/images/frontcover/example.jpg'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book listing created successfully');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.title).toBe('The Great Gatsby');
      expect(response.body.data.author).toBe('F. Scott Fitzgerald');
      expect(response.body.data.condition).toBe('Good');
      expect(response.body.data.genre).toEqual(['Fiction', 'Classic']);
      expect(response.body.data.imageUrl).toBe('https://books.google.com/books/content/images/frontcover/example.jpg');
      expect(response.body.data.owner).toHaveProperty('_id');
      expect(response.body.data.owner.name).toBe('Test User');
      expect(response.body.data.isAvailable).toBe(true);

      // Verify book was saved to database
      const savedBook = await Book.findById(response.body.data._id);
      expect(savedBook).toBeTruthy();
      expect(savedBook.title).toBe('The Great Gatsby');
      expect(savedBook.owner.toString()).toBe(testUser._id.toString());
    });

    test('should create book with all required fields and optional fields', async () => {
      const bookData = {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        condition: 'Like New',
        genres: JSON.stringify(['Fiction', 'Classic', 'Historical']),
        isbn: '9780061120084',
        description: 'A gripping tale of racial injustice and childhood innocence',
        publicationYear: 1960,
        publisher: 'J.B. Lippincott & Co.',
        googleBooksImageUrl: 'https://books.google.com/books/content/images/frontcover/mockingbird.jpg'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('To Kill a Mockingbird');
      expect(response.body.data.author).toBe('Harper Lee');
      expect(response.body.data.condition).toBe('Like New');
      expect(response.body.data.genre).toEqual(['Fiction', 'Classic', 'Historical']);
      expect(response.body.data.isbn).toBe('9780061120084');
      expect(response.body.data.description).toBe('A gripping tale of racial injustice and childhood innocence');
      expect(response.body.data.publicationYear).toBe(1960);
      expect(response.body.data.publisher).toBe('J.B. Lippincott & Co.');
      expect(response.body.data.imageUrl).toBe('https://books.google.com/books/content/images/frontcover/mockingbird.jpg');
    });

    test('should create book with multiple genres', async () => {
      const bookData = {
        title: 'Dune',
        author: 'Frank Herbert',
        condition: 'Good',
        genres: JSON.stringify(['Science Fiction', 'Fantasy', 'Adventure']),
        googleBooksImageUrl: 'https://example.com/dune.jpg'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.genre).toEqual(['Science Fiction', 'Fantasy', 'Adventure']);
      expect(response.body.data.genre).toHaveLength(3);
    });

    test('should reject book creation with missing title', async () => {
      const bookData = {
        author: 'Test Author',
        condition: 'Good',
        genres: JSON.stringify(['Fiction']),
        googleBooksImageUrl: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
      expect(response.body.error.message).toContain('required fields');
    });

    test('should reject book creation with missing author', async () => {
      const bookData = {
        title: 'Test Book',
        condition: 'Good',
        genres: JSON.stringify(['Fiction']),
        googleBooksImageUrl: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    test('should reject book creation with missing condition', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        genres: JSON.stringify(['Fiction']),
        googleBooksImageUrl: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    test('should reject book creation with missing genres', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        condition: 'Good',
        googleBooksImageUrl: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    test('should reject book creation with empty genres array', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        condition: 'Good',
        genres: JSON.stringify([]),
        googleBooksImageUrl: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('At least one genre is required');
    });

    test('should reject book creation with invalid condition', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        condition: 'Invalid Condition',
        genres: JSON.stringify(['Fiction']),
        googleBooksImageUrl: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Condition must be one of');
    });

    test('should reject book creation without authentication', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        condition: 'Good',
        genres: JSON.stringify(['Fiction']),
        googleBooksImageUrl: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .post('/api/books')
        .send(bookData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should reject book creation without any image source', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        condition: 'Good',
        genres: JSON.stringify(['Fiction'])
        // No googleBooksImageUrl, no uploaded images
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('IMAGE_REQUIRED');
      expect(response.body.error.message).toContain('At least one image is required');
    });
  });

  describe('Book creation with ISBN lookup', () => {
    test('should create book using data from ISBN lookup', async () => {
      // Mock Google Books API response
      const mockGoogleBooksResponse = {
        data: {
          items: [{
            volumeInfo: {
              title: '1984',
              authors: ['George Orwell'],
              publisher: 'Secker & Warburg',
              publishedDate: '1949-06-08',
              description: 'A dystopian social science fiction novel',
              pageCount: 328,
              categories: ['Fiction', 'Dystopian'],
              imageLinks: {
                thumbnail: 'https://books.google.com/books/content/images/frontcover/1984.jpg'
              }
            }
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockGoogleBooksResponse);

      // First, lookup the ISBN to get book data
      const isbnResponse = await request(app)
        .post('/api/books/isbn/9780451524935')
        .expect(200);

      expect(isbnResponse.body.success).toBe(true);
      expect(isbnResponse.body.data.title).toBe('1984');
      expect(isbnResponse.body.data.author).toBe('George Orwell');
      expect(isbnResponse.body.data.isbn).toBe('9780451524935');

      // Now create a book using the ISBN lookup data
      const bookData = {
        title: isbnResponse.body.data.title,
        author: isbnResponse.body.data.author,
        condition: 'Good',
        genres: JSON.stringify(['Fiction', 'Dystopian']),
        isbn: isbnResponse.body.data.isbn,
        description: isbnResponse.body.data.description,
        publicationYear: isbnResponse.body.data.publicationYear,
        publisher: isbnResponse.body.data.publisher,
        googleBooksImageUrl: isbnResponse.body.data.thumbnail
      };

      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.title).toBe('1984');
      expect(createResponse.body.data.author).toBe('George Orwell');
      expect(createResponse.body.data.isbn).toBe('9780451524935');
      expect(createResponse.body.data.description).toBe('A dystopian social science fiction novel');
      expect(createResponse.body.data.publicationYear).toBe(1949);
      expect(createResponse.body.data.publisher).toBe('Secker & Warburg');
      expect(createResponse.body.data.imageUrl).toBe(isbnResponse.body.data.thumbnail);
    });

    test('should create book with ISBN and autofilled metadata', async () => {
      // Mock Google Books API response
      const mockGoogleBooksResponse = {
        data: {
          items: [{
            volumeInfo: {
              title: 'The Hobbit',
              authors: ['J.R.R. Tolkien'],
              publisher: 'George Allen & Unwin',
              publishedDate: '1937-09-21',
              description: 'A fantasy novel and children\'s book',
              imageLinks: {
                thumbnail: 'https://books.google.com/books/content/images/frontcover/hobbit.jpg'
              }
            }
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockGoogleBooksResponse);

      // Lookup ISBN
      const isbnResponse = await request(app)
        .post('/api/books/isbn/9780547928227')
        .expect(200);

      // Create book with autofilled data
      const bookData = {
        title: isbnResponse.body.data.title,
        author: isbnResponse.body.data.author,
        condition: 'Like New',
        genres: JSON.stringify(['Fantasy', 'Adventure']),
        isbn: isbnResponse.body.data.isbn,
        description: isbnResponse.body.data.description,
        publicationYear: isbnResponse.body.data.publicationYear,
        publisher: isbnResponse.body.data.publisher,
        googleBooksImageUrl: isbnResponse.body.data.thumbnail
      };

      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.title).toBe('The Hobbit');
      expect(createResponse.body.data.author).toBe('J.R.R. Tolkien');
      expect(createResponse.body.data.isbn).toBe('9780547928227');
      expect(createResponse.body.data.publisher).toBe('George Allen & Unwin');
      expect(createResponse.body.data.publicationYear).toBe(1937);
      expect(createResponse.body.data.imageUrl).toBe(isbnResponse.body.data.thumbnail);
    });

    test('should handle ISBN lookup with minimal data and still create book', async () => {
      // Mock Google Books API response with minimal data
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

      // Lookup ISBN
      const isbnResponse = await request(app)
        .post('/api/books/isbn/9780000000000')
        .expect(200);

      expect(isbnResponse.body.data.title).toBe('Minimal Book Data');
      expect(isbnResponse.body.data.author).toBe('');

      // Create book with minimal data (user must provide required fields)
      const bookData = {
        title: isbnResponse.body.data.title,
        author: 'Unknown Author', // User provides this since ISBN lookup didn't have it
        condition: 'Good',
        genres: JSON.stringify(['Fiction']),
        isbn: isbnResponse.body.data.isbn,
        googleBooksImageUrl: 'https://example.com/default.jpg' // User provides default image
      };

      const createResponse = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.title).toBe('Minimal Book Data');
      expect(createResponse.body.data.author).toBe('Unknown Author');
    });
  });

  describe('Book creation with image upload', () => {
    test('should create book with uploaded front image', async () => {
      // Skip if Cloudinary is not configured
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.log('Skipping Cloudinary test - not configured');
        return;
      }

      // Create a minimal PNG image for testing
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const imagePath = path.join(__dirname, 'temp-1.png');
      fs.writeFileSync(imagePath, pngBuffer);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('frontImage', imagePath)
        .field('title', 'Book with Uploaded Image')
        .field('author', 'Image Test Author')
        .field('condition', 'Good')
        .field('genres', JSON.stringify(['Fiction']))
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Book with Uploaded Image');
      expect(response.body.data.imageUrl).toBeDefined();
      expect(response.body.data.frontImageUrl).toBeDefined();
      expect(typeof response.body.data.imageUrl).toBe('string');
      expect(response.body.data.imageUrl.length).toBeGreaterThan(0);

      // Verify book was saved to database
      const savedBook = await Book.findById(response.body.data._id);
      expect(savedBook).toBeTruthy();
      expect(savedBook.frontImageUrl).toBeDefined();

      // Clean up
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    test('should create book with both front and back images', async () => {
      // Skip if Cloudinary is not configured
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.log('Skipping Cloudinary test - not configured');
        return;
      }

      // Create minimal PNG images for testing
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const frontImagePath = path.join(__dirname, 'temp-2.png');
      const backImagePath = path.join(__dirname, 'temp-3.png');
      fs.writeFileSync(frontImagePath, pngBuffer);
      fs.writeFileSync(backImagePath, pngBuffer);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('frontImage', frontImagePath)
        .attach('backImage', backImagePath)
        .field('title', 'Book with Front and Back Images')
        .field('author', 'Multi Image Author')
        .field('condition', 'Like New')
        .field('genres', JSON.stringify(['Non-Fiction']))
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Book with Front and Back Images');
      expect(response.body.data.imageUrl).toBeDefined();
      expect(response.body.data.frontImageUrl).toBeDefined();
      expect(response.body.data.backImageUrl).toBeDefined();
      expect(response.body.data.imageUrl).toBe(response.body.data.frontImageUrl); // Primary image should be front

      // Clean up
      if (fs.existsSync(frontImagePath)) {
        fs.unlinkSync(frontImagePath);
      }
      if (fs.existsSync(backImagePath)) {
        fs.unlinkSync(backImagePath);
      }
    });

    test('should create book with uploaded image and ISBN data', async () => {
      // Skip if Cloudinary is not configured
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.log('Skipping Cloudinary test - not configured');
        return;
      }

      // Create a minimal PNG image for testing
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const imagePath = path.join(__dirname, 'temp-exact.png');
      fs.writeFileSync(imagePath, pngBuffer);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('frontImage', imagePath)
        .field('title', 'Complete Book')
        .field('author', 'Complete Author')
        .field('condition', 'Good')
        .field('genres', JSON.stringify(['Fiction']))
        .field('isbn', '9781234567890')
        .field('description', 'A complete book with all data')
        .field('publicationYear', '2020')
        .field('publisher', 'Test Publisher')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Complete Book');
      expect(response.body.data.isbn).toBe('9781234567890');
      expect(response.body.data.imageUrl).toBeDefined();
      expect(response.body.data.frontImageUrl).toBeDefined();

      // Clean up
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    test('should reject non-image file upload', async () => {
      // Create a text file
      const textContent = 'This is not an image';
      const textFilePath = path.join(__dirname, 'temp-text.txt');
      fs.writeFileSync(textFilePath, textContent);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('frontImage', textFilePath)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genres', JSON.stringify(['Fiction']))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');

      // Clean up
      if (fs.existsSync(textFilePath)) {
        fs.unlinkSync(textFilePath);
      }
    });

    test('should prefer uploaded front image over Google Books image', async () => {
      // Skip if Cloudinary is not configured
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.log('Skipping Cloudinary test - not configured');
        return;
      }

      // Create a minimal PNG image for testing
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const imagePath = path.join(__dirname, 'temp-unique.png');
      fs.writeFileSync(imagePath, pngBuffer);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('frontImage', imagePath)
        .field('title', 'Priority Test Book')
        .field('author', 'Priority Author')
        .field('condition', 'Good')
        .field('genres', JSON.stringify(['Fiction']))
        .field('googleBooksImageUrl', 'https://books.google.com/books/content/images/frontcover/test.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.imageUrl).toBeDefined();
      expect(response.body.data.frontImageUrl).toBeDefined();
      expect(response.body.data.googleBooksImageUrl).toBe('https://books.google.com/books/content/images/frontcover/test.jpg');
      // Primary imageUrl should be the uploaded front image, not Google Books
      expect(response.body.data.imageUrl).toBe(response.body.data.frontImageUrl);

      // Clean up
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });
  });
});
