# Image Upload Middleware

This middleware provides image upload functionality using Multer for file handling and Cloudinary for cloud storage.

## Features

- **File Type Validation**: Only accepts image files (JPEG, PNG, GIF, WebP)
- **File Size Validation**: Maximum file size of 5MB
- **Unique Filenames**: Generates unique filenames using UUID and timestamp
- **Cloud Storage**: Uploads images to Cloudinary with automatic optimization
- **Error Handling**: Comprehensive error handling for various upload scenarios

## Setup

### Environment Variables

Make sure the following environment variables are set:

```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Usage

### Basic Usage

```javascript
const { uploadSingleImage } = require('../middleware/upload');

// Use in a route
router.post('/upload', uploadSingleImage('image'), (req, res) => {
  // req.imageUrl contains the Cloudinary URL
  // req.cloudinaryPublicId contains the public ID for deletion
  
  res.json({
    success: true,
    imageUrl: req.imageUrl,
    publicId: req.cloudinaryPublicId
  });
});
```

### With Authentication

```javascript
const { authenticateToken } = require('../middleware/auth');
const { uploadSingleImage } = require('../middleware/upload');

router.post('/books', 
  authenticateToken, 
  uploadSingleImage('image'), 
  async (req, res) => {
    // Handle book creation with uploaded image
    const bookData = {
      ...req.body,
      imageUrl: req.imageUrl,
      owner: req.user.userId
    };
    
    // Save to database...
  }
);
```

## Image Transformations

The middleware automatically applies the following Cloudinary transformations:

- **Size Limit**: Maximum dimensions of 800x600 pixels
- **Quality**: Auto-optimized quality
- **Format**: Auto-selected best format (WebP when supported)

## Error Handling

The middleware handles various error scenarios:

- **FILE_TOO_LARGE**: File exceeds 5MB limit
- **TOO_MANY_FILES**: More than one file uploaded
- **UPLOAD_ERROR**: Invalid file type or other upload errors
- **CLOUDINARY_ERROR**: Cloud storage upload failures

## File Deletion

To delete uploaded images:

```javascript
const { deleteImage } = require('../middleware/upload');

// Delete by public ID
await deleteImage(publicId);
```

## Testing

The middleware includes comprehensive tests covering:

- File type validation
- File size validation
- Error handling
- Successful uploads (when Cloudinary is configured)

Run tests with:

```bash
npm test -- --testPathPattern=upload.test.js
```