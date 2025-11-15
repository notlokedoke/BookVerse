require('dotenv').config();
const connectDB = require('./config/database');
const mongoose = require('mongoose');

/**
 * Test script to verify MongoDB connection
 */
const testConnection = async () => {
  console.log('=== MongoDB Connection Test ===\n');
  console.log(`MongoDB URI: ${process.env.MONGODB_URI}\n`);
  
  try {
    // Attempt to connect
    await connectDB();
    
    console.log('\n✓ Connection successful!');
    console.log(`✓ Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected'}`);
    console.log(`✓ Database: ${mongoose.connection.name}`);
    console.log(`✓ Host: ${mongoose.connection.host}`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n✓ Connection closed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Connection failed:', error.message);
    console.error('\nPlease ensure:');
    console.error('1. MongoDB is installed and running');
    console.error('2. MONGODB_URI in .env is correct');
    console.error('3. MongoDB service is accessible\n');
    
    process.exit(1);
  }
};

testConnection();
