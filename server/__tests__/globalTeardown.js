/**
 * Global Teardown for Jest Tests
 * Runs once after all test suites
 */

const mongoose = require('mongoose');

module.exports = async () => {
  // Close any remaining MongoDB connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  console.log('Global test teardown complete');
};
