#!/usr/bin/env node

/**
 * Diagnostic Script: Analyze Book Data
 * 
 * Shows detailed statistics about your books:
 * - How many have descriptions
 * - How many have images
 * - Which books are missing data
 * 
 * Usage: node server/scripts/analyzeBooks.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book = require('../models/Book');

async function analyzeBooks() {
  try {
    console.log('\n📊 Analyzing Book Data...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get total count
    const totalBooks = await Book.countDocuments();
    console.log(`Total books in database: ${totalBooks}\n`);

    // Count books with descriptions
    const booksWithDescription = await Book.countDocuments({
      description: { $exists: true, $ne: null, $ne: '' }
    });

    // Count books without descriptions
    const booksWithoutDescription = await Book.countDocuments({
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    });

    // Count books with images (not placeholder)
    const booksWithImage = await Book.countDocuments({
      imageUrl: { 
        $exists: true, 
        $ne: null, 
        $ne: '', 
        $ne: '/placeholder-book.svg' 
      }
    });

    // Count books with placeholder or no image
    const booksWithoutImage = await Book.countDocuments({
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: '' },
        { imageUrl: '/placeholder-book.svg' }
      ]
    });

    // Print statistics
    console.log('='.repeat(60));
    console.log('\n📈 Description Statistics:\n');
    console.log(`  ✓ Books WITH descriptions: ${booksWithDescription} (${Math.round(booksWithDescription/totalBooks*100)}%)`);
    console.log(`  ✗ Books WITHOUT descriptions: ${booksWithoutDescription} (${Math.round(booksWithoutDescription/totalBooks*100)}%)`);

    console.log('\n📸 Image Statistics:\n');
    console.log(`  ✓ Books WITH images: ${booksWithImage} (${Math.round(booksWithImage/totalBooks*100)}%)`);
    console.log(`  ✗ Books WITHOUT images: ${booksWithoutImage} (${Math.round(booksWithoutImage/totalBooks*100)}%)`);

    console.log('\n' + '='.repeat(60));

    // Show sample of books without descriptions
    if (booksWithoutDescription > 0) {
      console.log('\n📚 Sample books WITHOUT descriptions (first 10):\n');
      const samplesNoDesc = await Book.find({
        $or: [
          { description: { $exists: false } },
          { description: null },
          { description: '' }
        ]
      })
      .select('title author isbn')
      .limit(10)
      .lean();

      samplesNoDesc.forEach((book, i) => {
        console.log(`  ${i + 1}. "${book.title}" by ${book.author}`);
        console.log(`     ISBN: ${book.isbn || 'N/A'}`);
      });
    }

    // Show sample of books without images
    if (booksWithoutImage > 0) {
      console.log('\n🖼️  Sample books WITHOUT images (first 10):\n');
      const samplesNoImage = await Book.find({
        $or: [
          { imageUrl: { $exists: false } },
          { imageUrl: null },
          { imageUrl: '' },
          { imageUrl: '/placeholder-book.svg' }
        ]
      })
      .select('title author isbn imageUrl')
      .limit(10)
      .lean();

      samplesNoImage.forEach((book, i) => {
        console.log(`  ${i + 1}. "${book.title}" by ${book.author}`);
        console.log(`     ISBN: ${book.isbn || 'N/A'}`);
        console.log(`     Current image: ${book.imageUrl || 'none'}`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 Summary:\n');
    
    if (booksWithoutDescription > 0) {
      console.log(`  → ${booksWithoutDescription} books still need descriptions`);
      console.log(`    Run: npm run enrich:descriptions`);
    } else {
      console.log(`  ✓ All books have descriptions!`);
    }

    if (booksWithoutImage > 0) {
      console.log(`  → ${booksWithoutImage} books still need images`);
      console.log(`    Run: npm run enrich:images`);
    } else {
      console.log(`  ✓ All books have images!`);
    }

    console.log('');

  } catch (error) {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

// Run analysis
analyzeBooks()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
