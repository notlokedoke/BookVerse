#!/usr/bin/env node

/**
 * Script to find and remove books from deleted users (orphaned books)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');

async function cleanupOrphanedBooks() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');

    // Get all books
    const allBooks = await Book.find().populate('owner', 'name email');
    console.log(`Total books in database: ${allBooks.length}`);

    // Find orphaned books (books where owner doesn't exist)
    const orphanedBooks = [];
    const validBooks = [];

    for (const book of allBooks) {
      if (!book.owner) {
        orphanedBooks.push(book);
      } else {
        validBooks.push(book);
      }
    }

    console.log(`Valid books (with existing owners): ${validBooks.length}`);
    console.log(`Orphaned books (owner deleted): ${orphanedBooks.length}\n`);

    if (orphanedBooks.length === 0) {
      console.log('✅ No orphaned books found. Database is clean!');
      return;
    }

    // Display orphaned books details
    console.log('='.repeat(70));
    console.log('ORPHANED BOOKS FOUND');
    console.log('='.repeat(70));
    
    orphanedBooks.forEach((book, index) => {
      console.log(`\n${index + 1}. "${book.title}" by ${book.author}`);
      console.log(`   Book ID: ${book._id}`);
      console.log(`   Owner ID: ${book.owner} (USER DELETED)`);
      console.log(`   Genre: ${book.genre.join(', ')}`);
      console.log(`   Condition: ${book.condition}`);
      console.log(`   Created: ${book.createdAt.toLocaleDateString()}`);
      console.log(`   Available: ${book.isAvailable ? 'Yes' : 'No'}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(70));
    console.log(`Books to be deleted: ${orphanedBooks.length}`);
    console.log('='.repeat(70));

    // Delete orphaned books
    console.log('\n🗑️  Deleting orphaned books...');
    
    const bookIds = orphanedBooks.map(book => book._id);
    const deleteResult = await Book.deleteMany({ _id: { $in: bookIds } });

    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} orphaned books`);

    // Verify cleanup
    const remainingBooks = await Book.countDocuments();
    console.log(`\n📊 Books remaining in database: ${remainingBooks}`);

    // Check for any related data that might need cleanup
    console.log('\n🔍 Checking for related data...');
    
    // Check if there are any trades involving deleted books
    const Trade = require('../models/Trade');
    const orphanedTrades = await Trade.find({
      $or: [
        { requestedBook: { $in: bookIds } },
        { offeredBooks: { $in: bookIds } }
      ]
    });

    if (orphanedTrades.length > 0) {
      console.log(`⚠️  Found ${orphanedTrades.length} trades involving deleted books`);
      console.log('   Deleting orphaned trades...');
      await Trade.deleteMany({
        $or: [
          { requestedBook: { $in: bookIds } },
          { offeredBooks: { $in: bookIds } }
        ]
      });
      console.log(`✅ Deleted ${orphanedTrades.length} orphaned trades`);
    } else {
      console.log('✅ No orphaned trades found');
    }

    // Check for wishlist entries
    const Wishlist = require('../models/Wishlist');
    const orphanedWishlists = await Wishlist.find({
      book: { $in: bookIds }
    });

    if (orphanedWishlists.length > 0) {
      console.log(`⚠️  Found ${orphanedWishlists.length} wishlist entries for deleted books`);
      console.log('   Deleting orphaned wishlist entries...');
      await Wishlist.deleteMany({
        book: { $in: bookIds }
      });
      console.log(`✅ Deleted ${orphanedWishlists.length} orphaned wishlist entries`);
    } else {
      console.log('✅ No orphaned wishlist entries found');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ CLEANUP COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));

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
cleanupOrphanedBooks();
