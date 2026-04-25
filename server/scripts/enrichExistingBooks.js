#!/usr/bin/env node

/**
 * Migration Script: Enrich Existing Books
 * 
 * This script enriches existing books with:
 * - Descriptions from Google Books API
 * - Cover images from Open Library API
 * 
 * Usage:
 *   node server/scripts/enrichExistingBooks.js [options]
 * 
 * Options:
 *   --dry-run          Preview changes without updating database
 *   --batch-size=N     Process N books at a time (default: 10)
 *   --delay=N          Delay N ms between batches (default: 2000)
 *   --descriptions     Only fetch descriptions
 *   --images           Only fetch images
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { enrichBook, delay } = require('../utils/bookEnrichment');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 10;
const delayMs = parseInt(args.find(arg => arg.startsWith('--delay='))?.split('=')[1]) || 2000;
const onlyDescriptions = args.includes('--descriptions');
const onlyImages = args.includes('--images');

// Determine what to fetch
const fetchOptions = {
  fetchDescription: !onlyImages,
  fetchImage: !onlyDescriptions
};

// Statistics
const stats = {
  total: 0,
  processed: 0,
  descriptionsAdded: 0,
  imagesAdded: 0,
  failed: 0,
  skipped: 0,
  alreadyHadDescription: 0,
  alreadyHadImage: 0,
  descriptionNotFound: 0,
  imageNotFound: 0
};

/**
 * Main migration function
 */
async function migrateBooks() {
  try {
    console.log('\n🚀 Starting Book Enrichment Migration\n');
    console.log('Configuration:');
    console.log(`  Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}`);
    console.log(`  Batch Size: ${batchSize}`);
    console.log(`  Delay: ${delayMs}ms`);
    console.log(`  Fetch Descriptions: ${fetchOptions.fetchDescription}`);
    console.log(`  Fetch Images: ${fetchOptions.fetchImage}`);
    console.log('\n' + '='.repeat(60) + '\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Build query for books that need enrichment
    const query = {
      $or: []
    };

    if (fetchOptions.fetchDescription) {
      query.$or.push({
        $or: [
          { description: { $exists: false } },
          { description: null },
          { description: '' }
        ]
      });
    }

    if (fetchOptions.fetchImage) {
      query.$or.push({
        $or: [
          { imageUrl: { $exists: false } },
          { imageUrl: null },
          { imageUrl: '' },
          { imageUrl: '/placeholder-book.svg' }
        ]
      });
    }

    // Get total count
    stats.total = await Book.countDocuments(query);
    console.log(`📚 Found ${stats.total} books that need enrichment\n`);

    if (stats.total === 0) {
      console.log('✓ All books are already enriched!\n');
      return;
    }

    // Process books in batches
    let skip = 0;
    let batchNumber = 1;

    while (skip < stats.total) {
      console.log(`\n📦 Processing Batch ${batchNumber} (${skip + 1}-${Math.min(skip + batchSize, stats.total)} of ${stats.total})\n`);

      // Fetch batch
      const books = await Book.find(query)
        .select('title author isbn description imageUrl')
        .skip(skip)
        .limit(batchSize)
        .lean();

      // Process each book in the batch
      for (const book of books) {
        try {
          console.log(`\n  Processing: "${book.title}" by ${book.author}`);
          
          // Check what needs to be fetched
          const needsDescription = fetchOptions.fetchDescription && 
            (!book.description || book.description.trim() === '');
          const needsImage = fetchOptions.fetchImage && 
            (!book.imageUrl || book.imageUrl === '/placeholder-book.svg');

          // Track what book already has
          if (!needsDescription && fetchOptions.fetchDescription) {
            stats.alreadyHadDescription++;
            console.log(`  ℹ Already has description`);
          }
          if (!needsImage && fetchOptions.fetchImage) {
            stats.alreadyHadImage++;
            console.log(`  ℹ Already has image`);
          }

          if (!needsDescription && !needsImage) {
            console.log(`  ⊘ Skipped (already has all data)`);
            stats.skipped++;
            continue;
          }

          // Fetch enrichment data
          const enrichmentData = await enrichBook(book, {
            fetchDescription: needsDescription,
            fetchImage: needsImage
          });

          // Prepare update
          const updates = {};
          let hasUpdates = false;

          if (needsDescription && enrichmentData.description) {
            updates.description = enrichmentData.description;
            stats.descriptionsAdded++;
            hasUpdates = true;
          } else if (needsDescription && !enrichmentData.description) {
            stats.descriptionNotFound++;
            console.log(`  ⚠ Description not found in Google Books`);
          }

          if (needsImage && enrichmentData.imageUrl) {
            updates.imageUrl = enrichmentData.imageUrl;
            stats.imagesAdded++;
            hasUpdates = true;
          } else if (needsImage && !enrichmentData.imageUrl) {
            stats.imageNotFound++;
            console.log(`  ⚠ Image not found in Open Library`);
          }

          // Update database (if not dry run)
          if (hasUpdates) {
            if (!isDryRun) {
              await Book.findByIdAndUpdate(book._id, updates);
              console.log(`  ✓ Updated successfully`);
            } else {
              console.log(`  ✓ Would update (dry run)`);
            }
            stats.processed++;
          } else {
            console.log(`  ✗ No data found from APIs`);
            stats.failed++;
          }

        } catch (error) {
          console.error(`  ✗ Error processing book:`, error.message);
          stats.failed++;
        }

        // Small delay between individual books
        await delay(200);
      }

      skip += batchSize;
      batchNumber++;

      // Delay between batches to respect rate limits
      if (skip < stats.total) {
        console.log(`\n⏳ Waiting ${delayMs}ms before next batch...`);
        await delay(delayMs);
      }
    }

    // Print final statistics
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Migration Complete!\n');
    console.log('Statistics:');
    console.log(`  Total books found: ${stats.total}`);
    console.log(`  Successfully processed: ${stats.processed}`);
    console.log(`  Descriptions added: ${stats.descriptionsAdded}`);
    console.log(`  Images added: ${stats.imagesAdded}`);
    console.log(`  Skipped (already had all data): ${stats.skipped}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log('');
    console.log('Breakdown:');
    console.log(`  Already had description: ${stats.alreadyHadDescription}`);
    console.log(`  Already had image: ${stats.alreadyHadImage}`);
    console.log(`  Description not found in API: ${stats.descriptionNotFound}`);
    console.log(`  Image not found in API: ${stats.imageNotFound}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

// Run migration
migrateBooks()
  .then(() => {
    console.log('✓ Migration script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
