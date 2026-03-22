const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const crypto = require('crypto');

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();

// File filter to validate image types
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Accept common image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
};

// Configure multer with file size limit and filter
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow single file upload
  },
  fileFilter: fileFilter
});

// Configure multer for multiple files
const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5 // Allow up to 5 files
  },
  fileFilter: fileFilter
});

// Middleware to upload single image to Cloudinary
const uploadSingleImage = (fieldName = 'image') => {
  return async (req, res, next) => {
    // First apply multer middleware
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: {
                message: 'File too large. Maximum size is 10MB.',
                code: 'FILE_TOO_LARGE'
              }
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              error: {
                message: 'Too many files. Only one file is allowed.',
                code: 'TOO_MANY_FILES'
              }
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          error: {
            message: err.message || 'File upload error',
            code: 'INVALID_FILE_TYPE'
          }
        });
      }

      // If no file was uploaded, continue to next middleware
      if (!req.file) {
        return next();
      }

      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        // In test environment without Cloudinary, set a mock URL
        req.imageUrl = 'https://example.com/test-image.jpg';
        req.cloudinaryPublicId = 'test-public-id';
        return next();
      }

      try {
        // Generate unique filename using crypto for security (Req 15.2)
        // Format: UUID-timestamp to prevent overwrites and ensure uniqueness
        const uniqueFilename = `${crypto.randomUUID()}-${Date.now()}`;
        
        // Sanitize original filename by removing special characters (Req 15.2)
        const sanitizedOriginalName = req.file.originalname
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .substring(0, 100); // Limit length
        
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              public_id: `bookverse/books/${uniqueFilename}`,
              folder: 'bookverse/books',
              transformation: [
                { width: 800, height: 600, crop: 'limit' }, // Limit max dimensions
                { quality: 'auto:best' }, // Auto optimize quality (best setting)
                { fetch_format: 'auto' }, // Auto select best format
                { effect: 'sharpen:100' }, // Sharpen blurry images
                { effect: 'auto_contrast' }, // Auto adjust contrast for better visibility
                { effect: 'auto_brightness' }, // Auto adjust brightness for poor lighting
                { effect: 'improve' } // AI-powered general image improvement
              ]
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          ).end(req.file.buffer);
        });

        // Add the Cloudinary URL to the request object
        req.imageUrl = result.secure_url;
        req.cloudinaryPublicId = result.public_id;
        req.sanitizedFilename = sanitizedOriginalName;

        next();
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to upload image to cloud storage',
            code: 'CLOUDINARY_ERROR'
          }
        });
      }
    });
  };
};

// Utility function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Middleware to upload multiple images to Cloudinary
const uploadBookImages = () => {
  return async (req, res, next) => {
    // Apply multer middleware for multiple fields
    uploadMultiple.fields([
      { name: 'coverImage', maxCount: 1 },
      { name: 'frontImage', maxCount: 1 },
      { name: 'backImage', maxCount: 1 },
      { name: 'additionalImages', maxCount: 3 } // Allow up to 3 additional images
    ])(req, res, async (err) => {
      if (err) {
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: {
                message: 'File too large. Maximum size is 10MB per image.',
                code: 'FILE_TOO_LARGE'
              }
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              error: {
                message: 'Too many files. Maximum 5 images allowed.',
                code: 'TOO_MANY_FILES'
              }
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          error: {
            message: err.message || 'File upload error',
            code: 'INVALID_FILE_TYPE'
          }
        });
      }

      // If no files were uploaded, continue to next middleware
      if (!req.files || (Object.keys(req.files).length === 0)) {
        return next();
      }

      // Count total uploaded images
      const totalImages = 
        (req.files.coverImage ? 1 : 0) +
        (req.files.frontImage ? 1 : 0) +
        (req.files.backImage ? 1 : 0) +
        (req.files.additionalImages ? req.files.additionalImages.length : 0);

      // Validate minimum 2 images (only if images are uploaded)
      if (totalImages > 0 && totalImages < 2) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Minimum 2 images required. Please upload at least 2 images.',
            code: 'INSUFFICIENT_IMAGES'
          }
        });
      }

      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        // In test environment without Cloudinary, set mock URLs
        if (req.files.coverImage) {
          req.frontImageUrl = 'https://example.com/test-cover-image.jpg';
          req.frontImagePublicId = 'test-cover-public-id';
        }
        if (req.files.frontImage) {
          req.frontImageUrl = 'https://example.com/test-front-image.jpg';
          req.frontImagePublicId = 'test-front-public-id';
        }
        if (req.files.backImage) {
          req.backImageUrl = 'https://example.com/test-back-image.jpg';
          req.backImagePublicId = 'test-back-public-id';
        }
        if (req.files.additionalImages) {
          req.additionalImageUrls = req.files.additionalImages.map((_, i) => 
            `https://example.com/test-additional-${i}.jpg`
          );
          req.additionalImagePublicIds = req.files.additionalImages.map((_, i) => 
            `test-additional-${i}-public-id`
          );
        }
        return next();
      }

      try {
        // Initialize arrays for additional images
        req.additionalImageUrls = [];
        req.additionalImagePublicIds = [];

        // Upload cover image (legacy single-image field) if provided.
        // frontImage takes precedence when both are present.
        if (req.files.coverImage && req.files.coverImage[0] && !req.files.frontImage) {
          // Generate unique filename using crypto for security
          const uniqueFilename = `${crypto.randomUUID()}-${Date.now()}-cover`;
          
          // Sanitize original filename
          const sanitizedName = req.files.coverImage[0].originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 100);
          
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                resource_type: 'image',
                public_id: `bookverse/books/${uniqueFilename}`,
                folder: 'bookverse/books',
                transformation: [
                  { width: 800, height: 600, crop: 'limit' },
                  { quality: 'auto:best' },
                  { fetch_format: 'auto' },
                  { effect: 'sharpen:100' },
                  { effect: 'auto_contrast' },
                  { effect: 'auto_brightness' },
                  { effect: 'improve' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(req.files.coverImage[0].buffer);
          });

          req.frontImageUrl = result.secure_url;
          req.frontImagePublicId = result.public_id;
          req.sanitizedCoverFilename = sanitizedName;
        }

        // Upload front image if provided
        if (req.files.frontImage && req.files.frontImage[0]) {
          // Generate unique filename using crypto for security
          const uniqueFilename = `${crypto.randomUUID()}-${Date.now()}-front`;
          
          // Sanitize original filename
          const sanitizedName = req.files.frontImage[0].originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 100);
          
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                resource_type: 'image',
                public_id: `bookverse/books/${uniqueFilename}`,
                folder: 'bookverse/books',
                transformation: [
                  { width: 800, height: 600, crop: 'limit' },
                  { quality: 'auto:best' },
                  { fetch_format: 'auto' },
                  { effect: 'sharpen:100' },
                  { effect: 'auto_contrast' },
                  { effect: 'auto_brightness' },
                  { effect: 'improve' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(req.files.frontImage[0].buffer);
          });

          req.frontImageUrl = result.secure_url;
          req.frontImagePublicId = result.public_id;
          req.sanitizedFrontFilename = sanitizedName;
        }

        // Upload back image if provided
        if (req.files.backImage && req.files.backImage[0]) {
          // Generate unique filename using crypto for security
          const uniqueFilename = `${crypto.randomUUID()}-${Date.now()}-back`;
          
          // Sanitize original filename
          const sanitizedName = req.files.backImage[0].originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 100);
          
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                resource_type: 'image',
                public_id: `bookverse/books/${uniqueFilename}`,
                folder: 'bookverse/books',
                transformation: [
                  { width: 800, height: 600, crop: 'limit' },
                  { quality: 'auto:best' },
                  { fetch_format: 'auto' },
                  { effect: 'sharpen:100' },
                  { effect: 'auto_contrast' },
                  { effect: 'auto_brightness' },
                  { effect: 'improve' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(req.files.backImage[0].buffer);
          });

          req.backImageUrl = result.secure_url;
          req.backImagePublicId = result.public_id;
          req.sanitizedBackFilename = sanitizedName;
        }

        // Upload additional images if provided
        if (req.files.additionalImages && req.files.additionalImages.length > 0) {
          for (let i = 0; i < req.files.additionalImages.length; i++) {
            const file = req.files.additionalImages[i];
            
            // Generate unique filename using crypto for security
            const uniqueFilename = `${crypto.randomUUID()}-${Date.now()}-additional-${i}`;
            
            // Sanitize original filename
            const sanitizedName = file.originalname
              .replace(/[^a-zA-Z0-9.-]/g, '_')
              .substring(0, 100);
            
            const result = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                {
                  resource_type: 'image',
                  public_id: `bookverse/books/${uniqueFilename}`,
                  folder: 'bookverse/books',
                  transformation: [
                    { width: 800, height: 600, crop: 'limit' },
                    { quality: 'auto:best' },
                    { fetch_format: 'auto' },
                    { effect: 'sharpen:100' },
                    { effect: 'auto_contrast' },
                    { effect: 'auto_brightness' },
                    { effect: 'improve' }
                  ]
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              ).end(file.buffer);
            });

            req.additionalImageUrls.push(result.secure_url);
            req.additionalImagePublicIds.push(result.public_id);
          }
        }

        next();
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to upload images to cloud storage',
            code: 'CLOUDINARY_ERROR'
          }
        });
      }
    });
  };
};

module.exports = {
  uploadSingleImage,
  uploadBookImages,
  deleteImage
};
