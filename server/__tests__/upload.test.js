const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { uploadSingleImage } = require('../middleware/upload');

// Create a simple test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Test route with upload middleware
  app.post('/test-upload', uploadSingleImage('image'), (req, res) => {
    res.json({
      success: true,
      imageUrl: req.imageUrl,
      cloudinaryPublicId: req.cloudinaryPublicId,
      fileReceived: !!req.file
    });
  });
  
  return app;
};

describe('Image Upload Middleware', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });

  describe('File Type Validation', () => {
    test('should reject non-image files', async () => {
      // Create a temporary text file
      const textContent = 'This is not an image';
      const textFilePath = path.join(__dirname, 'temp-text.txt');
      fs.writeFileSync(textFilePath, textContent);

      const response = await request(app)
        .post('/test-upload')
        .attach('image', textFilePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Only image files are allowed');

      // Clean up
      fs.unlinkSync(textFilePath);
    });

    test('should accept valid image types', async () => {
      // Skip this test if Cloudinary is not configured (in CI/CD environments)
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.log('Skipping Cloudinary test - no configuration found');
        return;
      }

      // Create a minimal 1x1 PNG image (base64 encoded)
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8j6gAAAABJRU5ErkJggg==',
        'base64'
      );
      
      const imagePath = path.join(__dirname, 'temp-image.png');
      fs.writeFileSync(imagePath, pngBuffer);

      const response = await request(app)
        .post('/test-upload')
        .attach('image', imagePath)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.imageUrl).toBeDefined();
      expect(response.body.cloudinaryPublicId).toBeDefined();

      // Clean up
      fs.unlinkSync(imagePath);
    });
  });

  describe('File Size Validation', () => {
    test('should reject files larger than 5MB', async () => {
      // Create a large PNG file (simulate 6MB)
      // Start with a minimal PNG header and pad with data
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // width: 1
        0x00, 0x00, 0x00, 0x01, // height: 1
        0x08, 0x02, 0x00, 0x00, 0x00 // bit depth, color type, compression, filter, interlace
      ]);
      
      // Create a large buffer (6MB) and prepend PNG header
      const largeData = Buffer.alloc(6 * 1024 * 1024, 0xFF); // 6MB of data
      const largeBuffer = Buffer.concat([pngHeader, largeData]);
      
      const largePath = path.join(__dirname, 'large-image.png');
      fs.writeFileSync(largePath, largeBuffer);

      const response = await request(app)
        .post('/test-upload')
        .attach('image', largePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('File too large');
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');

      // Clean up
      fs.unlinkSync(largePath);
    });
  });

  describe('No File Upload', () => {
    test('should continue to next middleware when no file is uploaded', async () => {
      const response = await request(app)
        .post('/test-upload')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.imageUrl).toBeUndefined();
      expect(response.body.fileReceived).toBe(false);
    });
  });

  describe('Invalid File Types', () => {
    test('should reject unsupported image formats', async () => {
      // Create a fake BMP file (not in allowed types)
      const bmpHeader = Buffer.from([0x42, 0x4D]); // BMP signature
      const bmpPath = path.join(__dirname, 'temp-image.bmp');
      fs.writeFileSync(bmpPath, bmpHeader);

      const response = await request(app)
        .post('/test-upload')
        .attach('image', bmpPath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid file type');

      // Clean up
      fs.unlinkSync(bmpPath);
    });
  });
});