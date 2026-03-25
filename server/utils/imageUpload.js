const axios = require('axios');
const { cloudinary } = require('../config/cloudinary');
const crypto = require('crypto');

/**
 * Fetch an image from a URL and upload it to Cloudinary
 * This eliminates the need for a proxy by storing images permanently
 * 
 * @param {string} imageUrl - The URL of the image to fetch and upload
 * @param {string} folder - Cloudinary folder (default: 'bookverse/books')
 * @returns {Promise<Object>} - { secure_url, public_id }
 */
async function fetchAndUploadImage(imageUrl, folder = 'bookverse/books') {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary not configured, returning original URL');
      return {
        secure_url: imageUrl,
        public_id: null,
        isOriginal: true
      };
    }

    console.log(`[Image Upload] Fetching image from: ${imageUrl}`);

    // Fetch the image from the external URL
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
        'Referer': 'https://www.google.com/'
      }
    });

    // Convert to buffer
    const imageBuffer = Buffer.from(response.data);

    // Generate unique filename
    const uniqueFilename = `${crypto.randomUUID()}-${Date.now()}-google-books`;

    console.log(`[Image Upload] Uploading to Cloudinary...`);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: `${folder}/${uniqueFilename}`,
          folder: folder,
          transformation: [
            { width: 800, height: 1200, crop: 'limit' }, // Limit max dimensions
            { quality: 'auto:best' }, // Auto optimize quality
            { fetch_format: 'auto' }, // Auto select best format (WebP, etc.)
            { effect: 'sharpen:100' }, // Sharpen for clarity
            { effect: 'auto_contrast' }, // Auto adjust contrast
            { effect: 'improve' } // AI-powered improvement
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(imageBuffer);
    });

    console.log(`[Image Upload] ✓ Successfully uploaded to Cloudinary`);
    console.log(`[Image Upload] URL: ${result.secure_url}`);

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      isOriginal: false
    };

  } catch (error) {
    console.error('[Image Upload] Failed to fetch and upload image:', error.message);
    
    // Return original URL as fallback
    return {
      secure_url: imageUrl,
      public_id: null,
      isOriginal: true,
      error: error.message
    };
  }
}

/**
 * Upload Google Books image URL to Cloudinary
 * Specifically handles Google Books image URLs
 * 
 * @param {string} googleBooksImageUrl - Google Books image URL
 * @returns {Promise<Object>} - { secure_url, public_id }
 */
async function uploadGoogleBooksImage(googleBooksImageUrl) {
  if (!googleBooksImageUrl) {
    return null;
  }

  return await fetchAndUploadImage(googleBooksImageUrl, 'bookverse/books/google-books');
}

module.exports = {
  fetchAndUploadImage,
  uploadGoogleBooksImage
};
