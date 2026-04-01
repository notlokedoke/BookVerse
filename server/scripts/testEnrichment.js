#!/usr/bin/env node

/**
 * Test Script: Test Enrichment for a Single Book
 * 
 * Tests fetching description and image for a specific book
 * 
 * Usage: 
 *   node server/scripts/testEnrichment.js "Book Title" "Author Name"
 *   node server/scripts/testEnrichment.js "Book Title" "Author Name" "ISBN"
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { enrichBook } = require('../utils/bookEnrichment');

const title = process.argv[2];
const author = process.argv[3];
const isbn = process.argv[4] || null;

if (!title || !author) {
  console.log('\n❌ Usage: node server/scripts/testEnrichment.js "Book Title" "Author Name" ["ISBN"]\n');
  console.log('Example:');
  console.log('  node server/scripts/testEnrichment.js "The Great Gatsby" "F. Scott Fitzgerald"\n');
  process.exit(1);
}

async function testEnrichment() {
  console.log('\n🧪 Testing Book Enrichment\n');
  console.log('Book Details:');
  console.log(`  Title: ${title}`);
  console.log(`  Author: ${author}`);
  console.log(`  ISBN: ${isbn || 'Not provided'}`);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    const result = await enrichBook(
      { title, author, isbn },
      { fetchDescription: true, fetchImage: true }
    );

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Results:\n');

    if (result.description) {
      console.log('✓ Description found:');
      console.log(`  ${result.description.substring(0, 200)}...`);
      console.log(`  (${result.description.length} characters total)`);
    } else {
      console.log('✗ Description not found');
    }

    console.log('');

    if (result.imageUrl) {
      console.log('✓ Image found:');
      console.log(`  ${result.imageUrl}`);
    } else {
      console.log('✗ Image not found');
    }

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testEnrichment();
