/**
 * Global Setup for Jest Tests
 * Runs once before all test suites
 */

const mongoose = require('mongoose');

module.exports = async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Ensure MongoDB connection string is set
  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/bookverse-test';
  }

  console.log('Global test setup complete');
  console.log('MongoDB URI:', process.env.MONGODB_URI);
};
