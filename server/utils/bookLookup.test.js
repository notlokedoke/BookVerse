const { hybridBookLookup, lookupGoogleBooks, lookupOpenLibrary } = require('./bookLookup');

// Test ISBNs
const TEST_ISBNS = {
  // Popular book with good coverage
  harryPotter: '9780439708180', // Harry Potter and the Sorcerer's Stone
  // Classic book
  gatsby: '9780743273565', // The Great Gatsby
  // Technical book
  cleanCode: '9780132350884', // Clean Code
  // Invalid ISBN
  invalid: '1234567890'
};

/**
 * Manual test script for book lookup
 * Run with: node server/utils/bookLookup.test.js
 */
async function testBookLookup() {
  console.log('='.repeat(60));
  console.log('BOOK LOOKUP HYBRID TEST');
  console.log('='.repeat(60));
  console.log('');

  for (const [name, isbn] of Object.entries(TEST_ISBNS)) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Testing: ${name} (ISBN: ${isbn})`);
    console.log('─'.repeat(60));

    try {
      const result = await hybridBookLookup(isbn);
      
      if (result.success) {
        console.log('✅ SUCCESS');
        console.log(`Title: ${result.data.title}`);
        console.log(`Author: ${result.data.author}`);
        console.log(`Publisher: ${result.data.publisher}`);
        console.log(`Year: ${result.data.publicationYear}`);
        console.log(`Cover: ${result.data.thumbnail ? '✓ Available' : '✗ Not available'}`);
        if (result.data.thumbnail) {
          console.log(`Cover URL: ${result.data.thumbnail.substring(0, 80)}...`);
        }
        console.log(`Source: ${result.data.source}`);
        console.log(`Message: ${result.message}`);
      } else {
        console.log('❌ FAILED');
        console.log(`Message: ${result.message}`);
      }
      
      console.log(`\nSource Results:`);
      console.log(`  Google Books: ${result.sources.googleBooks || 'not_tried'}`);
      console.log(`  Open Library: ${result.sources.openLibrary || 'not_tried'}`);
      
    } catch (error) {
      console.log('❌ ERROR');
      console.error(error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  testBookLookup().catch(console.error);
}

module.exports = { testBookLookup };
