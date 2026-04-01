#!/usr/bin/env node

/**
 * List Books Without Description
 * 
 * Shows all books that are missing descriptions
 * 
 * Usage: node server/scripts/listBooksWithoutDescription.js [--limit=N]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book = require('../models/Book');

// Parse command line arguments
const args = process.argv.slice(2);
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 0;

async function listBooks() {
  try {
    console.log('\n📚 Books Without Descriptions\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find books without descriptions
    const query = {
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    };

    const total = await Book.countDocuments(query);
    console.log(`Found ${total} books without descriptions\n`);

    if (total === 0) {
      console.log('✓ All books have descriptions!\n');
      return;
    }

    console.log('='.repeat(80) + '\n');

    // Fetch books
    let booksQuery = Book.find(query)
      .select('title author isbn createdAt')
      .sort({ createdAt: -1 });

    if (limit > 0) {
      booksQuery = booksQuery.limit(limit);
      console.log(`Showing first ${limit} of ${total} books:\n`);
    } else {
      console.log(`Showing all ${total} books:\n`);
    }

    const books = await booksQuery.lean();

    // Display books
    books.forEach((book, index) => {
      console.log(`${index + 1}. "${book.title}"`);
      console.log(`   Author: ${book.author}`);
      console.log(`   ISBN: ${book.isbn || 'N/A'}`);
      console.log(`   Added: ${new Date(book.createdAt).toLocaleDateString()}`);
      console.log('');
    });

    console.log('='.repeat(80) + '\n');

    // Summary
    console.log('📊 Summary:\n');
    console.log(`  Total books without descriptions: ${total}`);
    
    const withISBN = books.filter(b => b.isbn).length;
    const withoutISBN = books.filter(b => !b.isbn).length;
    
    console.log(`  Books with ISBN: ${withISBN}`);
    console.log(`  Books without ISBN: ${withoutISBN}`);
    console.log('');

    // Recommendations
    console.log('💡 Next Steps:\n');
    console.log('  1. Run: npm run enrich:retry');
    console.log('     (Tries to fetch descriptions for these books)');
    console.log('');
    console.log('  2. Test a specific book:');
    console.log('     node scripts/testEnrichment.js "Title" "Author" "ISBN"');
    console.log('');
    console.log('  3. If many books have no ISBN, consider adding ISBNs for better results');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

// Run script
listBooks()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
