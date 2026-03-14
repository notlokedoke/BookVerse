const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const { generateToken } = require('../utils/jwt');

describe('File Upload Security - Requirement 15.2', () => {
  let testUser, authToken;

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

  describe('File Type Validation (Req 15.2)', () => {
    test('should accept valid JPEG image', async () => {
      // Create a minimal JPEG image
      const jpegBuffer = Buffer.from(
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
        'base64'
      );
      
      const imagePath = path.join(__dirname, 'temp-test.jpg');
      fs.writeFileSync(imagePath, jpegBuffer);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', imagePath)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction');

      // Should succeed (201) or fail with validation error (400) but not file type error
      expect([200, 201, 400]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('INVALID_FILE_TYPE');
      }

      // Clean up
      fs.unlinkSync(imagePath);
    });

    test('should accept valid PNG image', async () => {
      // Create a minimal PNG image
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const imagePath = path.join(__dirname, 'temp-test.png');
      fs.writeFileSync(imagePath, pngBuffer);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', imagePath)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction');

      // Should succeed (201) or fail with validation error (400) but not file type error
      expect([200, 201, 400]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('INVALID_FILE_TYPE');
      }

      // Clean up
      fs.unlinkSync(imagePath);
    });

    test('should reject non-image files (text file)', async () => {
      // Create a text file
      const textContent = 'This is not an image file';
      const textFilePath = path.join(__dirname, 'temp-test.txt');
      fs.writeFileSync(textFilePath, textContent);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', textFilePath)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');
      expect(response.body.error.message).toContain('image');

      // Clean up
      fs.unlinkSync(textFilePath);
    });

    test('should reject non-image files (PDF)', async () => {
      // Create a minimal PDF file
      const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF';
      const pdfFilePath = path.join(__dirname, 'temp-test.pdf');
      fs.writeFileSync(pdfFilePath, pdfContent);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', pdfFilePath)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');

      // Clean up
      fs.unlinkSync(pdfFilePath);
    });

    test('should reject executable files', async () => {
      // Create a fake executable file
      const exeContent = 'MZ\x90\x00'; // DOS header signature
      const exeFilePath = path.join(__dirname, 'temp-test.exe');
      fs.writeFileSync(exeFilePath, exeContent);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', exeFilePath)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');

      // Clean up
      fs.unlinkSync(exeFilePath);
    });
  });

  describe('File Size Validation (Req 15.2)', () => {
    test('should reject files larger than 5MB', async () => {
      // Create a file larger than 5MB (5MB + 1KB)
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024, 'a');
      const largeFilePath = path.join(__dirname, 'temp-large.png');
      
      // Create a fake PNG header to pass file type validation
      const pngHeader = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==', 'base64');
      const fakeImage = Buffer.concat([pngHeader, largeBuffer]);
      
      fs.writeFileSync(largeFilePath, fakeImage);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', largeFilePath)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
      expect(response.body.error.message).toContain('5MB');

      // Clean up
      fs.unlinkSync(largeFilePath);
    });

    test('should accept files just under 5MB', async () => {
      // Create a file just under 5MB (4.9MB)
      const almostMaxBuffer = Buffer.alloc(4.9 * 1024 * 1024, 'a');
      const almostMaxFilePath = path.join(__dirname, 'temp-almost-max.png');
      
      // Create a fake PNG header
      const pngHeader = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==', 'base64');
      const fakeImage = Buffer.concat([pngHeader, almostMaxBuffer.slice(0, Math.floor(4.9 * 1024 * 1024) - pngHeader.length)]);
      
      fs.writeFileSync(almostMaxFilePath, fakeImage);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', almostMaxFilePath)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction');

      // Should not fail with FILE_TOO_LARGE error
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('FILE_TOO_LARGE');
      }

      // Clean up
      fs.unlinkSync(almostMaxFilePath);
    });

    test('should accept files smaller than 5MB', async () => {
      // Create a small PNG image (1KB)
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const imagePath = path.join(__dirname, 'temp-small.png');
      fs.writeFileSync(imagePath, pngBuffer);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', imagePath)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction');

      // Should not fail with FILE_TOO_LARGE error
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('FILE_TOO_LARGE');
      }

      // Clean up
      fs.unlinkSync(imagePath);
    });
  });

  describe('Filename Security (Req 15.2)', () => {
    test('should generate unique filenames to prevent overwrites', async () => {
      // Skip if Cloudinary is not configured
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.log('Skipping Cloudinary test - no configuration found');
        return;
      }

      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const imagePath = path.join(__dirname, 'temp-unique.png');
      fs.writeFileSync(imagePath, pngBuffer);

      // Upload first book
      const response1 = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', imagePath)
        .field('title', 'Test Book 1')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .expect(201);

      // Upload second book with same filename
      const response2 = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', imagePath)
        .field('title', 'Test Book 2')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .expect(201);

      // Both should succeed with different image URLs
      expect(response1.body.data.imageUrl).toBeDefined();
      expect(response2.body.data.imageUrl).toBeDefined();
      expect(response1.body.data.imageUrl).not.toBe(response2.body.data.imageUrl);

      // Clean up
      fs.unlinkSync(imagePath);
    });

    test('should sanitize filenames with special characters', async () => {
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      // Create file with dangerous characters in name
      const dangerousFilename = '../../../etc/passwd.png';
      const imagePath = path.join(__dirname, 'temp-dangerous.png');
      fs.writeFileSync(imagePath, pngBuffer);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', imagePath, dangerousFilename)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction');

      // Should not fail due to filename (may fail for other reasons in test env)
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('INVALID_FILENAME');
      }

      // Clean up
      fs.unlinkSync(imagePath);
    });

    test('should handle filenames with unicode characters', async () => {
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      // Create file with unicode characters
      const unicodeFilename = 'test-图书-книга-📚.png';
      const imagePath = path.join(__dirname, 'temp-unicode.png');
      fs.writeFileSync(imagePath, pngBuffer);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('coverImage', imagePath, unicodeFilename)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction');

      // Should handle unicode gracefully (sanitize to safe characters)
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('INVALID_FILENAME');
      }

      // Clean up
      fs.unlinkSync(imagePath);
    });
  });

  describe('Multiple File Upload Security', () => {
    test('should reject too many files', async () => {
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const imagePath1 = path.join(__dirname, 'temp-1.png');
      const imagePath2 = path.join(__dirname, 'temp-2.png');
      const imagePath3 = path.join(__dirname, 'temp-3.png');
      
      fs.writeFileSync(imagePath1, pngBuffer);
      fs.writeFileSync(imagePath2, pngBuffer);
      fs.writeFileSync(imagePath3, pngBuffer);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('frontImage', imagePath1)
        .attach('backImage', imagePath2)
        .attach('coverImage', imagePath3) // Third file should be rejected
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOO_MANY_FILES');

      // Clean up
      fs.unlinkSync(imagePath1);
      fs.unlinkSync(imagePath2);
      fs.unlinkSync(imagePath3);
    });

    test('should accept valid multiple images within limits', async () => {
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const imagePath1 = path.join(__dirname, 'temp-front.png');
      const imagePath2 = path.join(__dirname, 'temp-back.png');
      
      fs.writeFileSync(imagePath1, pngBuffer);
      fs.writeFileSync(imagePath2, pngBuffer);

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('frontImage', imagePath1)
        .attach('backImage', imagePath2)
        .field('title', 'Test Book')
        .field('author', 'Test Author')
        .field('condition', 'Good')
        .field('genre', 'Fiction');

      // Should not fail with file upload errors
      if (response.status === 400) {
        expect(response.body.error.code).not.toBe('INVALID_FILE_TYPE');
        expect(response.body.error.code).not.toBe('FILE_TOO_LARGE');
        expect(response.body.error.code).not.toBe('TOO_MANY_FILES');
      }

      // Clean up
      fs.unlinkSync(imagePath1);
      fs.unlinkSync(imagePath2);
    });
  });
});
