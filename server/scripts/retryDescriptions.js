#!/usr/bin/env node

/**
 * Retry Script: Re-fetch Descriptions for Books Without Them
 * 
 * This script:
 * 1. Finds books without descriptions
 * 2. Attempts to fetch descriptions from Google Books API
 * 3. Updates the database
 * 
 * Usage:
 *   node server/scripts/retryDescriptions.js [options]
 * 
 * Options:
 *   --dry-run          Preview changes without updating database
 *   --batch-size=N     Process N books at a time (default: 10)
 *   --delay=N          Delay N ms between batches (default: 2000)
 *   --clear-first      Clear existing descriptions before retrying (use with caution!)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { fetchDescriptionFromGoogleBooks, delay } = require('../utils/bookEnrichment');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const clearFirst = args.includes('--clear-first');
const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 10;
const delayMs = parseInt(args.find(arg => arg.startsWith('--delay='))?.split('=')[1]) || 2000;

// Statistics
const stats = {
  total: 0,
  cleared: 0,
  descriptionsAdded: 0,
  notFound: 0,
  failed: 0
};

/**
 * Main function
 */
async function retryDescriptions() {
  try {
    console.log('\n🔄 Retrying Description Fetch\n');
    console.log('Configuration:');
    console.log(`  Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}`);
    console.log(`  Clear existing first: ${clearFirst ? 'YES' : 'NO'}`);
    console.log(`  Batch Size: ${batchSize}`);
    console.log(`  Delay: ${delayMs}ms`);
    console.log('\n' + '='.repeat(60) + '\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Step 1: Clear descriptions if requested
    if (clearFirst) {
      console.log('⚠️  CLEARING EXISTING DESCRIPTIONS...\n');
      
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
      
      // Wait a moment
      await delay(1000);
    }

    // Step 2: Find books without descriptions
    const query = {
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    };

    stats.total = await Book.countDocuments(query);
    console.log(`📚 Found ${stats.total} books without descriptions\n`);

    if (stats.total === 0) {
      console.log('✓ All books already have descriptions!\n');
      return;
    }

    // Step 3: Process books in batches
    let skip = 0;
    let batchNumber = 1;

    while (skip < stats.total) {
      console.log(`\n📦 Processing Batch ${batchNumber} (${skip + 1}-${Math.min(skip + batchSize, stats.total)} of ${stats.total})\n`);

      // Fetch batch
      const books = await Book.find(query)
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

          // Fetch description from Google Books
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
      if (skip < stats.total) {
        console.log(`\n⏳ Waiting ${delayMs}ms before next batch...`);
        await delay(delayMs);
      }
    }

    // Print final statistics
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Retry Complete!\n');
    console.log('Statistics:');
    if (clearFirst) {
      console.log(`  Descriptions cleared: ${stats.cleared}`);
    }
    console.log(`  Total books processed: ${stats.total}`);
    console.log(`  Descriptions added: ${stats.descriptionsAdded}`);
    console.log(`  Not found in API: ${stats.notFound}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log('');

    // Calculate success rate
    const successRate = Math.round((stats.descriptionsAdded / stats.total) * 100);
    console.log(`Success Rate: ${successRate}%`);
    console.log('');

    // Recommendations
    if (stats.notFound > 0) {
      console.log('💡 Tips for books not found:');
      console.log('  - Check if title/author names are correct in database');
      console.log('  - Some books may not be in Google Books database');
      console.log('  - Try adding ISBN data for better accuracy');
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
retryDescriptions()
  .then(() => {
    console.log('✓ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
