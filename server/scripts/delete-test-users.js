#!/usr/bin/env node

/**
 * Script to delete test users and their associated data
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Message = require('../models/Message');
const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');

async function deleteTestUsers() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');

    // Find test users
    const testUsers = await User.find({
      $or: [
        { name: { $regex: /test/i } },
        { email: { $regex: /test/i } }
      ]
    }).select('name email city createdAt');

    if (testUsers.length === 0) {
      console.log('✅ No test users found in database');
      return;
    }

    console.log('='.repeat(70));
    console.log('TEST USERS TO BE DELETED');
    console.log('='.repeat(70));
    console.log(`Found ${testUsers.length} test user(s)\n`);

    const testUserIds = testUsers.map(u => u._id);

    // Display test users and their data
    for (const user of testUsers) {
      console.log(`📧 ${user.name} (${user.email})`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   City: ${user.city || 'Not set'}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      
      // Count associated data
      const bookCount = await Book.countDocuments({ owner: user._id });
      const tradeCount = await Trade.countDocuments({
        $or: [
          { proposer: user._id },
          { receiver: user._id }
        ]
      });
      const messageCount = await Message.countDocuments({
        $or: [
          { sender: user._id },
          { receiver: user._id }
        ]
      });
      const wishlistCount = await Wishlist.countDocuments({ user: user._id });
      const notificationCount = await Notification.countDocuments({ user: user._id });

      console.log(`   Books: ${bookCount}`);
      console.log(`   Trades: ${tradeCount}`);
      console.log(`   Messages: ${messageCount}`);
      console.log(`   Wishlist entries: ${wishlistCount}`);
      console.log(`   Notifications: ${notificationCount}`);
      console.log('');
    }

    console.log('='.repeat(70));
    console.log('STARTING DELETION PROCESS');
    console.log('='.repeat(70));

    // Delete books owned by test users
    console.log('\n🗑️  Deleting books...');
    const deletedBooks = await Book.deleteMany({ owner: { $in: testUserIds } });
    console.log(`   ✅ Deleted ${deletedBooks.deletedCount} books`);

    // Delete trades involving test users
    console.log('\n🗑️  Deleting trades...');
    const deletedTrades = await Trade.deleteMany({
      $or: [
        { proposer: { $in: testUserIds } },
        { receiver: { $in: testUserIds } }
      ]
    });
    console.log(`   ✅ Deleted ${deletedTrades.deletedCount} trades`);

    // Delete messages involving test users
    console.log('\n🗑️  Deleting messages...');
    const deletedMessages = await Message.deleteMany({
      $or: [
        { sender: { $in: testUserIds } },
        { receiver: { $in: testUserIds } }
      ]
    });
    console.log(`   ✅ Deleted ${deletedMessages.deletedCount} messages`);

    // Delete wishlist entries
    console.log('\n🗑️  Deleting wishlist entries...');
    const deletedWishlists = await Wishlist.deleteMany({ user: { $in: testUserIds } });
    console.log(`   ✅ Deleted ${deletedWishlists.deletedCount} wishlist entries`);

    // Delete notifications
    console.log('\n🗑️  Deleting notifications...');
    const deletedNotifications = await Notification.deleteMany({ user: { $in: testUserIds } });
    console.log(`   ✅ Deleted ${deletedNotifications.deletedCount} notifications`);

    // Finally, delete the test users themselves
    console.log('\n🗑️  Deleting test users...');
    const deletedUsers = await User.deleteMany({ _id: { $in: testUserIds } });
    console.log(`   ✅ Deleted ${deletedUsers.deletedCount} test users`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('DELETION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Users deleted: ${deletedUsers.deletedCount}`);
    console.log(`Books deleted: ${deletedBooks.deletedCount}`);
    console.log(`Trades deleted: ${deletedTrades.deletedCount}`);
    console.log(`Messages deleted: ${deletedMessages.deletedCount}`);
    console.log(`Wishlist entries deleted: ${deletedWishlists.deletedCount}`);
    console.log(`Notifications deleted: ${deletedNotifications.deletedCount}`);
    console.log('='.repeat(70));

    // Verify remaining users
    const remainingUsers = await User.countDocuments();
    console.log(`\n📊 Users remaining in database: ${remainingUsers}`);

    console.log('\n✅ TEST USERS AND THEIR DATA DELETED SUCCESSFULLY');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

// Run the script
deleteTestUsers();
