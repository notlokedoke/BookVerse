# Cloud Storage Setup Guide (Cloudinary)

This guide walks you through setting up Cloudinary for the BookVerse platform, from account creation to configuring image uploads for book covers.

## Table of Contents

1. [Cloudinary Account Setup](#1-cloudinary-account-setup)
2. [Get Your API Credentials](#2-get-your-api-credentials)
3. [Configure Application Environment](#3-configure-application-environment)
4. [Understanding Upload Configuration](#4-understanding-upload-configuration)
5. [Verify Image Upload](#5-verify-image-upload)
6. [Image Transformation Features](#6-image-transformation-features)
7. [Security Best Practices](#7-security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 1. Cloudinary Account Setup

Cloudinary is a cloud-based image and video management service that provides image hosting, transformation, and optimization. The free tier is perfect for development and small-scale production deployments.

### Steps:

1. **Visit Cloudinary**: Go to [https://cloudinary.com](https://cloudinary.com)

2. **Sign Up**: Click "Sign Up" or "Get Started Free"
   - You can sign up with email or use Google/GitHub authentication
   - Fill in your details and verify your email address

3. **Complete Initial Setup**:
   - Choose your use case (e.g., "Web Application", "E-commerce")
   - Select your role (e.g., "Developer", "Student")
   - Cloudinary may ask about your project details

4. **Free Tier Includes**:
   - 25 monthly credits (generous for development)
   - 25 GB storage
   - 25 GB bandwidth
   - Image transformations and optimizations
   - CDN delivery
   - No credit card required for signup

---

## 2. Get Your API Credentials

After creating your account, you'll need three credentials to connect BookVerse to Cloudinary.

### Steps:

1. **Access Dashboard**:
   - After logging in, you'll be on the Dashboard (Home page)
   - Or navigate to Dashboard from the top menu

2. **Locate API Credentials**:
   - On the Dashboard, look for the "Account Details" or "API Keys" section
   - You'll see three important values:
     - **Cloud Name**: Your unique Cloudinary identifier
     - **API Key**: Public key for API access
     - **API Secret**: Private key for authentication (keep this secure!)

3. **Copy Your Credentials**:
   
   **Cloud Name**:
   ```
   Example: bookverse-cloud
   Location: Displayed prominently at the top of the dashboard
   ```

   **API Key**:
   ```
   Example: 123456789012345
   Location: Under "API Keys" section
   Format: 15-digit number
   ```

   **API Secret**:
   ```
   Example: abcdefghijklmnopqrstuvwxyz123456
   Location: Under "API Keys" section (click "Reveal" to view)
   Format: Alphanumeric string
   ⚠️ IMPORTANT: Keep this secret! Never commit to version control
   ```

4. **Save Credentials Securely**:
   - Copy all three values to a secure location
   - You'll need these for the application configuration
   - The API Secret is sensitive - treat it like a password

### Understanding Your Credentials:

| Credential | Purpose | Security Level | Example |
|------------|---------|----------------|---------|
| **Cloud Name** | Identifies your Cloudinary account | Public | `bookverse-cloud` |
| **API Key** | Public identifier for API requests | Public | `123456789012345` |
| **API Secret** | Authenticates API requests | **Private** | `abc123xyz...` |

### Best Practices:

- **Never** commit API Secret to version control
- **Never** expose API Secret in client-side code
- **Use** environment variables for all credentials
- **Rotate** API Secret periodically for production
- **Create** separate Cloudinary accounts for dev/staging/prod if possible

---

## 3. Configure Application Environment

Now that you have your Cloudinary credentials, configure the BookVerse application to use them.

### Steps:

1. **Navigate to Server Directory**:
   ```bash
   cd server
   ```

2. **Open Environment File**:
   - If you already have a `.env` file, open it
   - If not, copy from the example:
     ```bash
     cp .env.example .env
     ```

3. **Add Cloudinary Credentials**:
   - Open `server/.env` in your text editor
   - Find the Cloudinary configuration section
   - Add your credentials:

   ```env
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Replace Placeholder Values**:
   ```env
   # Example configuration
   CLOUDINARY_CLOUD_NAME=bookverse-cloud
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
   ```

5. **Complete Environment Configuration**:
   
   Ensure other required variables are also set:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # Database (required)
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bookverse

   # JWT Configuration (required)
   JWT_SECRET=your_secure_random_string_here_min_32_chars
   JWT_EXPIRE=24h

   # Cloudinary Configuration (required for image uploads)
   CLOUDINARY_CLOUD_NAME=bookverse-cloud
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

6. **Verify `.env` Security**:
   - Confirm `.env` is listed in `.gitignore`
   - Never commit `.env` to version control
   - Keep separate `.env` files for different environments

### Environment-Specific Configuration:

**Development** (`server/.env`):
```env
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=bookverse-dev
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=dev_secret_here
```

**Production** (Set in hosting platform):
```env
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=bookverse-prod
CLOUDINARY_API_KEY=987654321098765
CLOUDINARY_API_SECRET=prod_secret_here
```

### Security Checklist:

- ✅ `.env` file is in `.gitignore`
- ✅ API Secret is never committed to version control
- ✅ Different Cloudinary accounts for dev/prod (recommended)
- ✅ All credentials are in `.env`, not hardcoded in code
- ✅ `.env.example` has placeholder values only

---

## 4. Understanding Upload Configuration

BookVerse uses Cloudinary with Multer for handling image uploads. Here's how the configuration works.

### Upload Middleware Configuration

The upload middleware is located in `server/middleware/upload.js` and provides:

#### File Validation

**Allowed Image Formats**:
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)

**File Size Limits**:
- Maximum: 10 MB per image
- Recommended: Keep images under 5 MB for faster uploads

**File Count Limits**:
- Single upload: 1 file
- Multiple upload: Up to 5 files (1 front + 1 back + 3 additional)

#### Storage Configuration

**Cloudinary Folder Structure**:
```
bookverse/
└── books/
    ├── {uuid}-{timestamp}-front.jpg
    ├── {uuid}-{timestamp}-back.jpg
    └── {uuid}-{timestamp}-additional-0.jpg
```

**Filename Generation**:
- Format: `{UUID}-{timestamp}-{type}`
- Example: `a1b2c3d4-1234567890-front`
- Ensures uniqueness and prevents overwrites
- Original filename is sanitized and stored separately

#### Image Transformations

BookVerse automatically applies transformations to uploaded images:

**Automatic Optimizations**:
1. **Size Limiting**: Max dimensions 800x600 (maintains aspect ratio)
2. **Quality Optimization**: Auto-best quality setting
3. **Format Selection**: Auto-select best format (WebP when supported)
4. **Sharpening**: Sharpen:100 for clarity
5. **Auto Contrast**: Improves visibility
6. **Auto Brightness**: Corrects poor lighting
7. **AI Improvement**: General image enhancement

**Example Transformation**:
```javascript
transformation: [
  { width: 800, height: 600, crop: 'limit' },
  { quality: 'auto:best' },
  { fetch_format: 'auto' },
  { effect: 'sharpen:100' },
  { effect: 'auto_contrast' },
  { effect: 'auto_brightness' },
  { effect: 'improve' }
]
```

### Upload Endpoints

**Single Image Upload**:
```javascript
// Used for: Profile pictures, single book cover
POST /api/books
Content-Type: multipart/form-data
Field: coverImage (single file)
```

**Multiple Image Upload**:
```javascript
// Used for: Book listings with multiple views
POST /api/books
Content-Type: multipart/form-data
Fields:
  - frontImage (1 file) - Front cover
  - backImage (1 file) - Back cover
  - additionalImages (up to 3 files) - Additional views
```

### Response Format

After successful upload, the middleware adds these properties to the request:

```javascript
req.imageUrl = "https://res.cloudinary.com/bookverse-cloud/image/upload/v1234567890/bookverse/books/uuid-timestamp-front.jpg"
req.cloudinaryPublicId = "bookverse/books/uuid-timestamp-front"
req.sanitizedFilename = "original_filename_sanitized.jpg"
```

### Image Deletion

When a book is deleted or updated, old images are removed from Cloudinary:

```javascript
// Automatic cleanup
const { deleteImage } = require('../middleware/upload');
await deleteImage(publicId);
```

---

## 5. Verify Image Upload

Test that your application can successfully upload images to Cloudinary.

### Steps:

1. **Start the Server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Check Console Output**:
   - Server should start without Cloudinary errors
   - Look for successful startup messages:
     ```
     Server running on port 5000
     MongoDB Connected: ...
     ```

3. **Test Image Upload via API**:

   **Option A: Using cURL**
   ```bash
   # First, register and login to get a token
   TOKEN="your_jwt_token_here"

   # Upload a book with an image
   curl -X POST http://localhost:5000/api/books \
     -H "Authorization: Bearer $TOKEN" \
     -F "title=Test Book" \
     -F "author=Test Author" \
     -F "genre=Fiction" \
     -F "condition=Good" \
     -F "frontImage=@/path/to/your/image.jpg"
   ```

   **Option B: Using Postman**
   1. Create a POST request to `http://localhost:5000/api/books`
   2. Set Authorization header: `Bearer {your_token}`
   3. Select Body → form-data
   4. Add fields:
      - `title`: "Test Book"
      - `author`: "Test Author"
      - `genre`: "Fiction"
      - `condition`: "Good"
      - `frontImage`: Select file (change type to "File")
   5. Send request

   **Option C: Using the Frontend**
   1. Start the client: `cd client && npm run dev`
   2. Navigate to `http://localhost:3000`
   3. Login or register
   4. Click "List a Book" or "+" button
   5. Fill in book details and upload an image
   6. Submit the form

4. **Verify Upload Success**:

   **In API Response**:
   ```json
   {
     "success": true,
     "message": "Book created successfully",
     "data": {
       "book": {
         "_id": "...",
         "title": "Test Book",
         "frontImageUrl": "https://res.cloudinary.com/bookverse-cloud/image/upload/...",
         "frontImagePublicId": "bookverse/books/uuid-timestamp-front"
       }
     }
   }
   ```

   **In Cloudinary Dashboard**:
   1. Go to [cloudinary.com](https://cloudinary.com) and login
   2. Navigate to "Media Library" in the top menu
   3. Look for the "bookverse/books" folder
   4. You should see your uploaded image(s)
   5. Click on an image to view details and transformations

5. **Verify Image Accessibility**:
   - Copy the `frontImageUrl` from the API response
   - Paste it in your browser
   - The image should load from Cloudinary's CDN
   - URL format: `https://res.cloudinary.com/{cloud_name}/image/upload/...`

### Successful Upload Indicators:

- ✅ API returns 200/201 status code
- ✅ Response includes `frontImageUrl` and `frontImagePublicId`
- ✅ Image appears in Cloudinary Media Library
- ✅ Image URL loads in browser
- ✅ Image displays in BookVerse frontend
- ✅ No error messages in server console

---

## 6. Image Transformation Features

Cloudinary provides powerful image transformation capabilities. BookVerse uses several of these features automatically.

### Automatic Transformations

All uploaded images are automatically optimized:

#### 1. Size Optimization
```javascript
{ width: 800, height: 600, crop: 'limit' }
```
- Limits maximum dimensions to 800x600 pixels
- Maintains original aspect ratio
- Smaller images are not upscaled
- Reduces file size and improves load times

#### 2. Quality Optimization
```javascript
{ quality: 'auto:best' }
```
- Automatically selects optimal quality level
- Balances file size and visual quality
- Adapts based on image content
- Reduces bandwidth usage

#### 3. Format Selection
```javascript
{ fetch_format: 'auto' }
```
- Automatically delivers best format for the browser
- WebP for modern browsers (smaller file size)
- JPEG/PNG fallback for older browsers
- Transparent format negotiation

#### 4. Image Enhancement
```javascript
{ effect: 'sharpen:100' }      // Sharpens blurry images
{ effect: 'auto_contrast' }    // Improves contrast
{ effect: 'auto_brightness' }  // Corrects lighting
{ effect: 'improve' }          // AI-powered enhancement
```
- Automatically improves image quality
- Corrects common issues (blur, poor lighting, low contrast)
- AI-powered general improvements
- No manual editing required

### Manual Transformations

You can also apply custom transformations by modifying the URL:

#### Resize Image
```
Original:
https://res.cloudinary.com/bookverse-cloud/image/upload/v1234567890/bookverse/books/image.jpg

Resized to 400x300:
https://res.cloudinary.com/bookverse-cloud/image/upload/w_400,h_300,c_fill/v1234567890/bookverse/books/image.jpg
```

#### Create Thumbnail
```
Thumbnail (200x200):
https://res.cloudinary.com/bookverse-cloud/image/upload/w_200,h_200,c_thumb/v1234567890/bookverse/books/image.jpg
```

#### Apply Effects
```
Grayscale:
https://res.cloudinary.com/bookverse-cloud/image/upload/e_grayscale/v1234567890/bookverse/books/image.jpg

Sepia:
https://res.cloudinary.com/bookverse-cloud/image/upload/e_sepia/v1234567890/bookverse/books/image.jpg
```

### Transformation Parameters

Common transformation parameters you can use:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `w_` | Width in pixels | `w_500` |
| `h_` | Height in pixels | `h_400` |
| `c_` | Crop/resize mode | `c_fill`, `c_fit`, `c_limit` |
| `q_` | Quality (1-100) | `q_80` |
| `f_` | Format | `f_webp`, `f_jpg` |
| `e_` | Effect | `e_grayscale`, `e_blur` |
| `r_` | Border radius | `r_10`, `r_max` |

### Performance Benefits

Cloudinary's transformations provide significant performance benefits:

- **Reduced File Sizes**: 40-80% smaller than originals
- **Faster Load Times**: CDN delivery + optimized formats
- **Responsive Images**: Serve appropriate sizes for different devices
- **Bandwidth Savings**: Automatic format and quality optimization
- **Better UX**: Faster page loads and image rendering

---

## 7. Security Best Practices

Follow these security best practices when using Cloudinary in production.

### Credential Security

**DO:**
- ✅ Store credentials in environment variables
- ✅ Use different accounts for dev/staging/prod
- ✅ Rotate API secrets periodically
- ✅ Limit API key permissions in Cloudinary dashboard
- ✅ Monitor usage and set up alerts

**DON'T:**
- ❌ Commit credentials to version control
- ❌ Expose API secret in client-side code
- ❌ Share credentials via email or chat
- ❌ Use production credentials in development
- ❌ Hardcode credentials in source code

### Upload Security

**File Validation**:
```javascript
// BookVerse implements these validations
- File type checking (JPEG, PNG, GIF, WebP only)
- File size limits (10 MB maximum)
- MIME type validation
- Filename sanitization
- Unique filename generation (prevents overwrites)
```

**Access Control**:
- Uploads require authentication (JWT token)
- Users can only delete their own images
- Rate limiting prevents abuse
- Input sanitization prevents injection attacks

### Cloudinary Dashboard Settings

**Recommended Settings**:

1. **Upload Presets**:
   - Create signed upload presets for production
   - Restrict unsigned uploads
   - Set folder restrictions

2. **Access Control**:
   - Enable "Strict Transformations" in production
   - Restrict allowed transformations
   - Prevent arbitrary transformation requests

3. **Usage Limits**:
   - Set up usage alerts (80% of quota)
   - Monitor bandwidth and storage
   - Configure auto-moderation for inappropriate content

4. **Backup**:
   - Enable automatic backups (paid plans)
   - Export media library periodically
   - Keep local copies of critical images

### Production Checklist

Before deploying to production:

- [ ] Use separate Cloudinary account for production
- [ ] Store credentials in hosting platform environment variables
- [ ] Enable "Strict Transformations" in Cloudinary settings
- [ ] Set up usage alerts and monitoring
- [ ] Configure signed upload presets
- [ ] Implement rate limiting on upload endpoints
- [ ] Set up automatic backups (if available)
- [ ] Review and restrict API key permissions
- [ ] Test image upload and deletion flows
- [ ] Monitor Cloudinary usage dashboard regularly

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "Cloudinary configuration error" or "Invalid credentials"

**Cause**: Incorrect or missing Cloudinary credentials.

**Solutions**:
- Verify all three credentials are set in `.env`:
  ```env
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```
- Check for typos in credential values
- Ensure no extra spaces or quotes around values
- Verify credentials match those in Cloudinary dashboard
- Restart the server after updating `.env`

#### 2. "File too large" error

**Cause**: Image exceeds 10 MB size limit.

**Solutions**:
- Compress image before uploading
- Use image editing tools to reduce file size
- Convert to JPEG (smaller than PNG for photos)
- Recommended: Keep images under 5 MB
- For larger limits, modify `server/middleware/upload.js`:
  ```javascript
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  }
  ```

#### 3. "Invalid file type" error

**Cause**: Unsupported file format.

**Solutions**:
- Only these formats are allowed: JPEG, PNG, GIF, WebP
- Convert image to supported format
- Check file extension matches actual format
- Ensure file is not corrupted

#### 4. Upload succeeds but image doesn't appear

**Cause**: Image URL not saved or frontend not displaying it.

**Solutions**:
- Check API response includes `frontImageUrl`
- Verify URL is saved in database (check MongoDB)
- Test URL directly in browser
- Check browser console for CORS errors
- Verify Cloudinary Media Library shows the image

#### 5. "Failed to upload image to cloud storage"

**Cause**: Network error or Cloudinary service issue.

**Solutions**:
- Check internet connection
- Verify Cloudinary service status: [status.cloudinary.com](https://status.cloudinary.com)
- Check server logs for detailed error message
- Ensure firewall allows outbound HTTPS connections
- Try uploading a different image
- Verify Cloudinary account is active and not over quota

#### 6. Images load slowly

**Cause**: Large file sizes or network issues.

**Solutions**:
- Cloudinary automatically optimizes images
- Verify transformations are applied (check URL)
- Use Cloudinary's CDN URLs (should start with `res.cloudinary.com`)
- Check network speed and latency
- Consider using responsive images with different sizes

#### 7. "Quota exceeded" error

**Cause**: Free tier limits reached.

**Solutions**:
- Check usage in Cloudinary dashboard
- Free tier includes:
  - 25 monthly credits
  - 25 GB storage
  - 25 GB bandwidth
- Delete unused images to free up space
- Upgrade to paid plan for higher limits
- Optimize images to reduce bandwidth usage

#### 8. Environment variables not loading

**Cause**: `.env` file not found or not loaded properly.

**Solutions**:
- Verify `.env` file exists in `server/` directory
- Check file is named exactly `.env` (not `.env.txt`)
- Restart the server after editing `.env`
- Verify `dotenv` is configured in `server.js`:
  ```javascript
  require('dotenv').config();
  ```
- Check for syntax errors in `.env` file

#### 9. Images deleted from Cloudinary but still in database

**Cause**: Cleanup logic not executed or failed.

**Solutions**:
- Check server logs for deletion errors
- Manually delete orphaned database records
- Verify `deleteImage` function is called when books are deleted
- Check Cloudinary API secret is correct (required for deletion)
- Implement periodic cleanup job for orphaned records

#### 10. CORS errors when accessing images

**Cause**: Cloudinary CORS settings or browser security.

**Solutions**:
- Cloudinary images should work without CORS configuration
- Verify URL starts with `https://res.cloudinary.com/`
- Check browser console for specific CORS error
- Ensure frontend URL is correct in `.env`
- Try accessing image URL directly in browser

---

## Additional Resources

### Cloudinary Documentation
- [Getting Started Guide](https://cloudinary.com/documentation/how_to_integrate_cloudinary)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [Upload API Reference](https://cloudinary.com/documentation/image_upload_api_reference)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)

### BookVerse Documentation
- `server/.env.example` - Environment variable reference
- `server/config/cloudinary.js` - Cloudinary configuration
- `server/middleware/upload.js` - Upload middleware implementation
- `API_DOCUMENTATION.md` - API endpoints reference
- `API_CURL_EXAMPLES.md` - Upload examples with cURL

### Multer Documentation
- [Multer GitHub](https://github.com/expressjs/multer)
- [Multer Storage Cloudinary](https://github.com/affanshahid/multer-storage-cloudinary)

---

## Advanced Configuration

### Custom Upload Presets

Create upload presets in Cloudinary dashboard for consistent transformations:

1. Go to Settings → Upload
2. Click "Add upload preset"
3. Configure transformations, folder, and access mode
4. Use preset in code:
   ```javascript
   upload_preset: 'bookverse_books'
   ```

### Responsive Images

Serve different image sizes for different devices:

```javascript
// Thumbnail for list view
const thumbnailUrl = imageUrl.replace('/upload/', '/upload/w_300,h_300,c_fill/');

// Medium for detail view
const mediumUrl = imageUrl.replace('/upload/', '/upload/w_800,h_600,c_limit/');

// Original for full view
const originalUrl = imageUrl; // Use as-is
```

### Image Moderation

Enable automatic content moderation (paid feature):

1. Go to Settings → Security
2. Enable "Content Moderation"
3. Configure moderation rules
4. Cloudinary will flag inappropriate content

### Backup Strategy

Implement a backup strategy for production:

```javascript
// Periodic backup script
const cloudinary = require('cloudinary').v2;

async function backupImages() {
  const resources = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'bookverse/books',
    max_results: 500
  });
  
  // Download and store locally or in another cloud service
  // Implementation depends on your backup requirements
}
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Create separate Cloudinary account for production
- [ ] Configure production credentials in hosting platform
- [ ] Enable "Strict Transformations" in Cloudinary settings
- [ ] Set up usage alerts (80% threshold)
- [ ] Configure signed upload presets
- [ ] Implement rate limiting on upload endpoints
- [ ] Test upload and deletion flows in production
- [ ] Set up monitoring and logging
- [ ] Configure automatic backups (if available)
- [ ] Review and restrict API key permissions
- [ ] Document credential rotation procedure
- [ ] Test image delivery from CDN
- [ ] Verify transformations work correctly
- [ ] Monitor initial usage and adjust limits

---

## Support

If you encounter issues not covered in this guide:

1. **Check Cloudinary Status**: [status.cloudinary.com](https://status.cloudinary.com)
2. **Review Server Logs**: Check console output for detailed error messages
3. **Cloudinary Support**: [support.cloudinary.com](https://support.cloudinary.com)
4. **Cloudinary Community**: [community.cloudinary.com](https://community.cloudinary.com)
5. **BookVerse Issues**: Check project documentation or contact development team

---

**Last Updated**: January 2025  
**Cloudinary SDK Version**: 1.41  
**Multer Version**: 1.4  
**BookVerse Version**: 1.0

