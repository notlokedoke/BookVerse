require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Testing Cloudinary Configuration...\n');

// Check if credentials are set
console.log('1. Checking Environment Variables:');
console.log('   CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
console.log('   CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
console.log('   CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
console.log();

// Test API connection
console.log('2. Testing Cloudinary API Connection...');

cloudinary.api.ping()
  .then(result => {
    console.log('   ✓ Cloudinary API is working!');
    console.log('   Response:', result);
    console.log();
    
    // Get account details
    return cloudinary.api.usage();
  })
  .then(usage => {
    console.log('3. Account Information:');
    console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('   Plan:', usage.plan || 'Free');
    console.log('   Credits Used:', usage.credits?.usage || 0);
    console.log('   Storage Used:', Math.round((usage.storage?.usage || 0) / 1024 / 1024), 'MB');
    console.log('   Bandwidth Used:', Math.round((usage.bandwidth?.usage || 0) / 1024 / 1024), 'MB');
    console.log();
    console.log('✓ Cloudinary is configured correctly and working!');
  })
  .catch(error => {
    console.log('   ✗ Cloudinary API Error!');
    console.error('   Error:', error.message);
    console.log();
    console.log('Possible issues:');
    console.log('  - Invalid API credentials');
    console.log('  - Network connectivity issues');
    console.log('  - Cloudinary account suspended');
    console.log();
    console.log('Please check your .env file and verify your Cloudinary credentials.');
    process.exit(1);
  });
