require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Fetching Cloudinary assets...\n');

// List all resources
cloudinary.api.resources({
  type: 'upload',
  max_results: 50,
  prefix: 'bookverse/' // Filter by folder
})
  .then(result => {
    console.log(`Found ${result.resources.length} assets:\n`);
    
    result.resources.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.public_id}`);
      console.log(`   URL: ${asset.secure_url}`);
      console.log(`   Size: ${Math.round(asset.bytes / 1024)} KB`);
      console.log(`   Format: ${asset.format}`);
      console.log(`   Created: ${asset.created_at}`);
      console.log();
    });
    
    if (result.resources.length === 0) {
      console.log('No assets found in the bookverse folder.');
      console.log('Upload some book images to see them here!');
    }
  })
  .catch(error => {
    console.error('Error fetching assets:', error.message);
  });
