#!/usr/bin/env node

/**
 * Script to check for test users and their books
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');

async function checkTestUsers() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');

    // Find test users (users with "test" in name or email)
    const testUsers = await User.find({
      $or: [
        { name: { $regex: /test/i } },
        { email: { $regex: /test/i } }
      ]
    }).select('name email city createdAt');

    console.log('='.repeat(70));
    console.log('TEST USERS IN DATABASE');
    console.log('='.repeat(70));
    console.log(`Found ${testUsers.length} test user(s)\n`);

    if (testUsers.length > 0) {
      for (const user of testUsers) {
        console.log(`📧 ${user.name} (${user.email})`);
        console.log(`   User ID: ${user._id}`);
        console.log(`   City: ${user.city || 'Not set'}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        
        // Count books for this user
        const bookCount = await Book.countDocuments({ owner: user._id });
        console.log(`   Books: ${bookCount}`);
        
        if (bookCount > 0) {
          const books = await Book.find({ owner: user._id }).select('title author condition');
          console.log(`   Book list:`);
          books.forEach((book, idx) => {
            console.log(`     ${idx + 1}. "${book.title}" by ${book.author} (${book.condition})`);
          });
        }
        console.log('');
      }
    } else {
      console.log('✅ No test users found in database');
    }

    // Get all users for context
    const allUsers = await User.find().select('name email');
    console.log('='.repeat(70));
    console.log('ALL USERS IN DATABASE');
    console.log('='.repeat(70));
    console.log(`Total users: ${allUsers.length}\n`);
    
    allUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} (${user.email})`);
    });

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

// Run the script
checkTestUsers();
