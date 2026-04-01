#!/usr/bin/env node

/**
 * Fix Wrong Descriptions Script
 * 
 * This script:
 * 1. Clears ALL existing descriptions
 * 2. Re-fetches them with improved validation
 * 3. Ensures ISBN results match the title/author
 * 4. Falls back to title+author search if ISBN gives wrong result
 * 
 * Usage:
 *   node server/scripts/fixWrongDescriptions.js [options]
 * 
 * Options:
 *   --dry-run          Preview changes without updating database
 *   --batch-size=N     Process N books at a time (default: 10)
 *   --delay=N          Delay N ms between batches (default: 2000)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { fetchDescriptionFromGoogleBooks, delay } = require('../utils/bookEnrichment');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 10;
const delayMs = parseInt(args.find(arg => arg.startsWith('--delay='))?.split('=')[1]) || 2000;

// Statistics
const stats = {
  totalBooks: 0,
  cleared: 0,
  descriptionsAdded: 0,
  notFound: 0,
  failed: 0,
  isbnUsed: 0,
  titleAuthorUsed: 0,
  isbnRejected: 0
};

/**
 * Main function
 */
async function fixDescriptions() {
  try {
    console.log('\n🔧 Fixing Wrong Descriptions\n');
    console.log('⚠️  WARNING: This will clear ALL existing descriptions and re-fetch them!\n');
    console.log('Configuration:');
    console.log(`  Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}`);
    console.log(`  Batch Size: ${batchSize}`);
    console.log(`  Delay: ${delayMs}ms`);
    console.log('\n' + '='.repeat(60) + '\n');

    if (!isDryRun) {
      console.log('⏳ Starting in 5 seconds... Press Ctrl+C to cancel\n');
      await delay(5000);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get total count
    stats.totalBooks = await Book.countDocuments();
    console.log(`📚 Total books in database: ${stats.totalBooks}\n`);

    // Step 1: Clear all descriptions
    console.log('🗑️  Step 1: Clearing existing descriptions...\n');
    
    if (!isDryRun) {
      const clearResult = await Book.updateMany(
        { description: { $exists: true, $ne: null, $ne: '' } },
        { $set: { description: '' } }
      );
      stats.cleared = clearResult.modifiedCount;
      console.log(`✓ Cleared ${stats.cleared} descriptions\n`);
    } else {
      const countToClear = await Book.countDocuments({
        description: { $exists: true, $ne: null, $ne: '' }
      });
      stats.cleared = countToClear;
      console.log(`✓ Would clear ${countToClear} descriptions (dry run)\n`);
    }
    
    await delay(2000);

    // Step 2: Re-fetch all descriptions with validation
    console.log('📥 Step 2: Re-fetching descriptions with validation...\n');

    let skip = 0;
    let batchNumber = 1;

    while (skip < stats.totalBooks) {
      console.log(`\n📦 Processing Batch ${batchNumber} (${skip + 1}-${Math.min(skip + batchSize, stats.totalBooks)} of ${stats.totalBooks})\n`);

      // Fetch batch
      const books = await Book.find({})
        .select('title author isbn')
        .skip(skip)
        .limit(batchSize)
        .lean();

      // Process each book
      for (const book of books) {
        try {
          console.log(`\n  Processing: "${book.title}" by ${book.author}`);
          if (book.isbn) {
            console.log(`  ISBN: ${book.isbn}`);
          }

          // Fetch description with validation
          const description = await fetchDescriptionFromGoogleBooks(
            book.title,
            book.author,
            book.isbn
          );

          if (description) {
            // Update database
            if (!isDryRun) {
              await Book.findByIdAndUpdate(book._id, { description });
              console.log(`  ✓ Description added (${description.length} characters)`);
            } else {
              console.log(`  ✓ Would add description (${description.length} characters) [dry run]`);
            }
            stats.descriptionsAdded++;
            
            // Track which method was used (check the log output)
            if (book.isbn) {
              stats.isbnUsed++;
            } else {
              stats.titleAuthorUsed++;
            }
          } else {
            console.log(`  ✗ Description not found in Google Books`);
            stats.notFound++;
          }

          // Small delay between books
          await delay(500);

        } catch (error) {
          console.error(`  ✗ Error:`, error.message);
          stats.failed++;
        }
      }

      skip += batchSize;
      batchNumber++;

      // Delay between batches
      if (skip < stats.totalBooks) {
        console.log(`\n⏳ Waiting ${delayMs}ms before next batch...`);
        await delay(delayMs);
      }
    }

    // Print final statistics
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Fix Complete!\n');
    console.log('Statistics:');
    console.log(`  Total books: ${stats.totalBooks}`);
    console.log(`  Descriptions cleared: ${stats.cleared}`);
    console.log(`  Descriptions added: ${stats.descriptionsAdded}`);
    console.log(`  Not found in API: ${stats.notFound}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log('');
    console.log('Search Methods:');
    console.log(`  ISBN search used: ${stats.isbnUsed}`);
    console.log(`  Title+Author search used: ${stats.titleAuthorUsed}`);
    console.log('');

    // Calculate success rate
    const successRate = Math.round((stats.descriptionsAdded / stats.totalBooks) * 100);
    console.log(`Success Rate: ${successRate}%`);
    console.log('');

    // Recommendations
    if (stats.notFound > 0) {
      console.log('💡 Tips for books not found:');
      console.log('  - Check if title/author names are correct in database');
      console.log('  - Some books may not be in Google Books database');
      console.log('  - Consider updating ISBN data for better accuracy');
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

// Run script
fixDescriptions()
  .then(() => {
    console.log('✓ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
