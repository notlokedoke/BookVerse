/**
 * Background Job: Book Enrichment
 * 
 * Continuously enriches books that are missing descriptions or images.
 * Runs periodically to process a small batch of books at a time.
 */

const Book = require('../models/Book');
const { enrichBook, delay } = require('../utils/bookEnrichment');

// Configuration
const BATCH_SIZE = 5; // Process 5 books per run
const JOB_INTERVAL = 5 * 60 * 1000; // Run every 5 minutes
const DELAY_BETWEEN_BOOKS = 1000; // 1 second delay between books

let isRunning = false;
let jobInterval = null;

/**
 * Process a batch of books that need enrichment
 */
async function processBatch() {
  if (isRunning) {
    console.log('[BookEnrichment] Job already running, skipping...');
    return;
  }

  isRunning = true;

  try {
    // Find books that need enrichment
    const query = {
      $or: [
        // Missing description
        { description: { $exists: false } },
        { description: null },
        { description: '' },
        // Missing or placeholder image
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: '' },
        { imageUrl: '/placeholder-book.svg' }
      ]
    };

    const books = await Book.find(query)
      .select('title author isbn description imageUrl')
      .limit(BATCH_SIZE)
      .lean();

    if (books.length === 0) {
      console.log('[BookEnrichment] No books need enrichment');
      return;
    }

    console.log(`[BookEnrichment] Processing ${books.length} books...`);

    let successCount = 0;
    let failCount = 0;

    for (const book of books) {
      try {
        // Determine what needs to be fetched
        const needsDescription = !book.description || book.description.trim() === '';
        const needsImage = !book.imageUrl || book.imageUrl === '/placeholder-book.svg';

        if (!needsDescription && !needsImage) {
          continue;
        }

        console.log(`[BookEnrichment] Enriching: "${book.title}" by ${book.author}`);

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
          hasUpdates = true;
        }

        if (needsImage && enrichmentData.imageUrl) {
          updates.imageUrl = enrichmentData.imageUrl;
          hasUpdates = true;
        }

        // Update database
        if (hasUpdates) {
          await Book.findByIdAndUpdate(book._id, updates);
          console.log(`[BookEnrichment] ✓ Updated "${book.title}"`);
          successCount++;
        } else {
          console.log(`[BookEnrichment] ✗ No data found for "${book.title}"`);
          failCount++;
        }

        // Delay between books to respect rate limits
        await delay(DELAY_BETWEEN_BOOKS);

      } catch (error) {
        console.error(`[BookEnrichment] Error processing book "${book.title}":`, error.message);
        failCount++;
      }
    }

    console.log(`[BookEnrichment] Batch complete: ${successCount} success, ${failCount} failed`);

  } catch (error) {
    console.error('[BookEnrichment] Job error:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the background job
 */
function startJob() {
  if (jobInterval) {
    console.log('[BookEnrichment] Job already running');
    return;
  }

  console.log(`[BookEnrichment] Starting background job (runs every ${JOB_INTERVAL / 1000 / 60} minutes)`);

  // Run immediately on start
  processBatch();

  // Then run periodically
  jobInterval = setInterval(processBatch, JOB_INTERVAL);
}

/**
 * Stop the background job
 */
function stopJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log('[BookEnrichment] Background job stopped');
  }
}

/**
 * Get job status
 */
function getStatus() {
  return {
    isRunning: isRunning,
    isScheduled: jobInterval !== null,
    batchSize: BATCH_SIZE,
    intervalMinutes: JOB_INTERVAL / 1000 / 60
  };
}

module.exports = {
  startJob,
  stopJob,
  processBatch,
  getStatus
};
