/**
 * Global Teardown for Jest Tests
 * Runs once after all test suites
 */

const mongoose = require('mongoose');

module.exports = async () => {
  try {
    // Close all mongoose connections
    await mongoose.disconnect();
    
    // Close the default connection explicitly
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Close all connections in the connection pool
    const connections = mongoose.connections;
    for (const connection of connections) {
      if (connection.readyState !== 0) {
        await connection.close();
      }
    }
    
    console.log('Global test teardown complete');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
};
