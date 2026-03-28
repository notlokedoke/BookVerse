/**
 * Test Setup File
 * 
 * This file is loaded before all tests run.
 * It sets up the test environment and configures environment variables.
 */

// Load test environment variables from .env.test
require('dotenv').config({ path: '.env.test' });

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';

// Set default test environment variables if not already set
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/bookverse-test';
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
}

if (!process.env.JWT_EXPIRE) {
  process.env.JWT_EXPIRE = '24h';
}

if (!process.env.GOOGLE_CLIENT_ID) {
  process.env.GOOGLE_CLIENT_ID = 'test_google_client_id';
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  process.env.GOOGLE_CLIENT_SECRET = 'test_google_client_secret';
}

if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = 'http://localhost:3000';
}

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud_name';
}

if (!process.env.CLOUDINARY_API_KEY) {
  process.env.CLOUDINARY_API_KEY = 'test_api_key';
}

if (!process.env.CLOUDINARY_API_SECRET) {
  process.env.CLOUDINARY_API_SECRET = 'test_api_secret';
}

// Suppress console output during tests (optional)
// Uncomment the following lines to suppress console logs during tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
