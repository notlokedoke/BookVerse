#!/usr/bin/env node

/**
 * Bulk Book Import Script
 * 
 * Automatically adds books to a user's library using ISBNs.
 * Fetches book details and cover images from Open Library API.
 * 
 * Usage: node bulk-add-books.js <user-email-or-id>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');
const User = require('./models/User');
const { bookLookup } = require('./utils/bookLookup');

// Book list with ISBNs and genres
const BOOKS_TO_ADD = [
  // Fiction & Literature (20 books)
  { isbn: '9780061120084', genre: ['Classic Fiction'], condition: 'Good' },
  { isbn: '9780451524935', genre: ['Dystopian Fiction'], condition: 'Good' },
  { isbn: '9780141439518', genre: ['Romance', 'Classic'], condition: 'Good' },
  { isbn: '9780743273565', genre: ['Classic Fiction'], condition: 'Good' },
  { isbn: '9780060883287', genre: ['Magical Realism'], condition: 'Good' },
  { isbn: '9780316769174', genre: ['Coming-of-age Fiction'], condition: 'Good' },
  { isbn: '9781400033416', genre: ['Historical Fiction'], condition: 'Good' },
  { isbn: '9780544003415', genre: ['Fantasy'], condition: 'Good' },
  { isbn: '9780439708180', genre: ['Fantasy'], condition: 'Good' },
  { isbn: '9780385490818', genre: ['Dystopian Fiction'], condition: 'Good' },
  { isbn: '9780060850524', genre: ['Science Fiction'], condition: 'Good' },
  { isbn: '9780547928227', genre: ['Fantasy'], condition: 'Good' },
  { isbn: '9780141441146', genre: ['Gothic Romance'], condition: 'Good' },
  { isbn: '9780141439556', genre: ['Gothic Fiction'], condition: 'Good' },
  { isbn: '9780142437247', genre: ['Adventure Fiction'], condition: 'Good' },
  { isbn: '9780140268867', genre: ['Epic Poetry'], condition: 'Good' },
  { isbn: '9780486415871', genre: ['Psychological Fiction'], condition: 'Good' },
  { isbn: '9780143035008', genre: ['Literary Fiction'], condition: 'Good' },
  { isbn: '9780141439570', genre: ['Gothic Fiction'], condition: 'Good' },
  { isbn: '9780486282114', genre: ['Gothic Science Fiction'], condition: 'Good' },

  // Mystery & Thriller (10 books)
  { isbn: '9780307454546', genre: ['Mystery', 'Thriller'], condition: 'Good' },
  { isbn: '9780307588371', genre: ['Psychological Thriller'], condition: 'Good' },
  { isbn: '9780307474278', genre: ['Mystery', 'Thriller'], condition: 'Good' },
  { isbn: '9780062073488', genre: ['Mystery'], condition: 'Good' },
  { isbn: '9780312924584', genre: ['Thriller'], condition: 'Good' },
  { isbn: '9780399587197', genre: ['Mystery'], condition: 'Good' },
  { isbn: '9780486282145', genre: ['Mystery'], condition: 'Good' },
  { isbn: '9780380730407', genre: ['Gothic Mystery'], condition: 'Good' },
  { isbn: '9780679722649', genre: ['Detective Fiction'], condition: 'Good' },
  { isbn: '9780679745587', genre: ['True Crime'], condition: 'Good' },

  // Science Fiction (10 books)
  { isbn: '9780441172719', genre: ['Science Fiction'], condition: 'Good' },
  { isbn: '9780553293357', genre: ['Science Fiction'], condition: 'Good' },
  { isbn: '9780441569595', genre: ['Cyberpunk'], condition: 'Good' },
  { isbn: '9780345391803', genre: ['Science Fiction', 'Comedy'], condition: 'Good' },
  { isbn: '9780812550702', genre: ['Science Fiction'], condition: 'Good' },
  { isbn: '9780441478125', genre: ['Science Fiction'], condition: 'Good' },
  { isbn: '9780345404473', genre: ['Science Fiction'], condition: 'Good' },
  { isbn: '9780486284729', genre: ['Science Fiction'], condition: 'Good' },
  { isbn: '9781451673319', genre: ['Dystopian Science Fiction'], condition: 'Good' },
  { isbn: '9780486295060', genre: ['Science Fiction'], condition: 'Good' },

  // Non-Fiction: History & Biography (10 books)
  { isbn: '9780062316097', genre: ['History'], condition: 'Good' },
  { isbn: '9780553296983', genre: ['Biography', 'Memoir'], condition: 'Good' },
  { isbn: '9780399590504', genre: ['Memoir'], condition: 'Good' },
  { isbn: '9781400052189', genre: ['Biography', 'Science'], condition: 'Good' },
  { isbn: '9780393317558', genre: ['History', 'Anthropology'], condition: 'Good' },
  { isbn: '9780553380163', genre: ['Science', 'Cosmology'], condition: 'Good' },
  { isbn: '9781476728759', genre: ['Biography'], condition: 'Good' },
  { isbn: '9780743270755', genre: ['Biography', 'History'], condition: 'Good' },
  { isbn: '9780812974492', genre: ['Biography', 'History'], condition: 'Good' },
  { isbn: '9780375725609', genre: ['Historical Non-Fiction'], condition: 'Good' },

  // Self-Help & Psychology (10 books)
  { isbn: '9780374533557', genre: ['Psychology'], condition: 'Good' },
  { isbn: '9781982137274', genre: ['Self-Help'], condition: 'Good' },
  { isbn: '9780735211292', genre: ['Self-Help'], condition: 'Good' },
  { isbn: '9780807014295', genre: ['Psychology', 'Memoir'], condition: 'Good' },
  { isbn: '9780671027032', genre: ['Self-Help'], condition: 'Good' },
  { isbn: '9781577314806', genre: ['Spirituality', 'Self-Help'], condition: 'Good' },
  { isbn: '9780307352156', genre: ['Psychology'], condition: 'Good' },
  { isbn: '9781501111105', genre: ['Psychology', 'Self-Help'], condition: 'Good' },
  { isbn: '9780345472328', genre: ['Psychology'], condition: 'Good' },
  { isbn: '9780062457714', genre: ['Self-Help'], condition: 'Good' },

  // Business & Economics (10 books)
  { isbn: '9780307887894', genre: ['Business'], condition: 'Good' },
  { isbn: '9780066620992', genre: ['Business'], condition: 'Good' },
  { isbn: '9780060731335', genre: ['Economics'], condition: 'Good' },
  { isbn: '9780060555665', genre: ['Finance'], condition: 'Good' },
  { isbn: '9780804139298', genre: ['Business', 'Entrepreneurship'], condition: 'Good' },
  { isbn: '9780062060242', genre: ['Business'], condition: 'Good' },
  { isbn: '9780735216358', genre: ['Decision Making'], condition: 'Good' },
  { isbn: '9780062273208', genre: ['Business'], condition: 'Good' },
  { isbn: '9781612680194', genre: ['Personal Finance'], condition: 'Good' },
  { isbn: '9780812973815', genre: ['Economics', 'Philosophy'], condition: 'Good' },

  // Science & Nature (10 books)
  { isbn: '9780451529060', genre: ['Science', 'Biology'], condition: 'Good' },
  { isbn: '9780345539434', genre: ['Astronomy'], condition: 'Good' },
  { isbn: '9780199291151', genre: ['Biology'], condition: 'Good' },
  { isbn: '9780618249060', genre: ['Environmental Science'], condition: 'Good' },
  { isbn: '9780743216302', genre: ['Science', 'Memoir'], condition: 'Good' },
  { isbn: '9780767908184', genre: ['Science'], condition: 'Good' },
  { isbn: '9781439170915', genre: ['Medical Science'], condition: 'Good' },
  { isbn: '9781476733524', genre: ['Science', 'Biology'], condition: 'Good' },
  { isbn: '9780393609394', genre: ['Astronomy'], condition: 'Good' },
  { isbn: '9781771642484', genre: ['Nature'], condition: 'Good' },

  // Philosophy & Religion (5 books)
  { isbn: '9780812968255', genre: ['Philosophy'], condition: 'Good' },
  { isbn: '9780140449143', genre: ['Philosophy'], condition: 'Good' },
  { isbn: '9780679724650', genre: ['Philosophy'], condition: 'Good' },
  { isbn: '9781599869773', genre: ['Philosophy', 'Strategy'], condition: 'Good' },
  { isbn: '9780553208849', genre: ['Philosophy', 'Fiction'], condition: 'Good' },

  // Poetry & Drama (5 books)
  { isbn: '9780517053614', genre: ['Drama', 'Poetry'], condition: 'Good' },
  { isbn: '9780486456768', genre: ['Poetry'], condition: 'Good' },
  { isbn: '9780156948777', genre: ['Poetry'], condition: 'Good' },
  { isbn: '9780140481341', genre: ['Drama'], condition: 'Good' },
  { isbn: '9780811216029', genre: ['Drama'], condition: 'Good' },

  // Children's & Young Adult (5 books)
  { isbn: '9780064400558', genre: ['Children\'s Fiction'], condition: 'Good' },
  { isbn: '9780439023481', genre: ['Young Adult', 'Dystopian'], condition: 'Good' },
  { isbn: '9780142424179', genre: ['Young Adult'], condition: 'Good' },
  { isbn: '9780060254926', genre: ['Children\'s Picture Book'], condition: 'Good' },
  { isbn: '9780544336261', genre: ['Young Adult', 'Dystopian'], condition: 'Good' },

  // Cookbooks & Food (3 books)
  { isbn: '9781476753836', genre: ['Cookbook'], condition: 'Good' },
  { isbn: '9780743246262', genre: ['Cookbook'], condition: 'Good' },
  { isbn: '9780060899226', genre: ['Memoir', 'Food'], condition: 'Good' },

  // Art & Photography (2 books)
  { isbn: '9780714832470', genre: ['Art History'], condition: 'Good' },
  { isbn: '9780140135152', genre: ['Art Criticism'], condition: 'Good' }
];

// Statistics
const stats = {
  total: BOOKS_TO_ADD.length,
  added: 0,
  skipped: 0,
  failed: 0,
  errors: []
};

/**
 * Clean ISBN (remove hyphens and spaces)
 */
function cleanIsbn(isbn) {
  return isbn.replace(/[-\s]/g, '');
}

/**
 * Add a single book to user's library
 */
async function addBook(userId, bookData) {
  const cleanedIsbn = cleanIsbn(bookData.isbn);
  
  try {
    // Check if book already exists for this user
    const existingBook = await Book.findOne({
      owner: userId,
      isbn: cleanedIsbn
    });

    if (existingBook) {
      console.log(`  ⏭️  Skipped: "${existingBook.title}" (already in library)`);
      stats.skipped++;
      return { success: true, skipped: true };
    }

    // Lookup book details from Open Library
    console.log(`  🔍 Looking up ISBN: ${cleanedIsbn}...`);
    const lookupResult = await bookLookup(cleanedIsbn);

    if (!lookupResult.success) {
      console.log(`  ❌ Failed: ${lookupResult.message}`);
      stats.failed++;
      stats.errors.push({ isbn: cleanedIsbn, error: lookupResult.message });
      return { success: false, error: lookupResult.message };
    }

    const bookInfo = lookupResult.data;

    // Create book with fetched data
    const newBook = new Book({
      owner: userId,
      title: bookInfo.title,
      author: bookInfo.author,
      condition: bookData.condition,
      genre: bookData.genre,
      isbn: cleanedIsbn,
      description: bookInfo.description || '',
      publicationYear: bookInfo.publicationYear,
      publisher: bookInfo.publisher || '',
      imageUrl: bookInfo.thumbnail || '/placeholder-book.svg',
      googleBooksImageUrl: bookInfo.thumbnail || null,
      isAvailable: true
    });

    await newBook.save();
    
    console.log(`  ✅ Added: "${bookInfo.title}" by ${bookInfo.author}`);
    console.log(`     Cover: ${bookInfo.thumbnail ? '✓' : '✗'}`);
    stats.added++;
    
    return { success: true, book: newBook };
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    stats.failed++;
    stats.errors.push({ isbn: cleanedIsbn, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Find user by email or ID
 */
async function findUser(identifier) {
  // Try to find by email first
  let user = await User.findOne({ email: identifier });
  
  // If not found, try by ID
  if (!user && mongoose.Types.ObjectId.isValid(identifier)) {
    user = await User.findById(identifier);
  }
  
  return user;
}

/**
 * Main function
 */
async function main() {
  console.log('\n📚 Bulk Book Import Script\n');
  console.log('========================================\n');

  // Get user identifier from command line
  const userIdentifier = process.argv[2];
  
  if (!userIdentifier) {
    console.error('❌ Error: Please provide a user email or ID');
    console.error('   Usage: node bulk-add-books.js <user-email-or-id>\n');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    console.log(`🔍 Looking for user: ${userIdentifier}...`);
    const user = await findUser(userIdentifier);
    
    if (!user) {
      console.error(`❌ User not found: ${userIdentifier}\n`);
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.username} (${user.email})\n`);
    console.log(`📖 Preparing to add ${stats.total} books...\n`);
    console.log('========================================\n');

    // Add books one by one
    for (let i = 0; i < BOOKS_TO_ADD.length; i++) {
      const bookData = BOOKS_TO_ADD[i];
      console.log(`\n[${i + 1}/${stats.total}] Processing ISBN: ${bookData.isbn}`);
      
      await addBook(user._id, bookData);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Print summary
    console.log('\n========================================\n');
    console.log('📊 Import Summary:\n');
    console.log(`   Total books processed:     ${stats.total}`);
    console.log(`   ✅ Successfully added:      ${stats.added}`);
    console.log(`   ⏭️  Already in library:     ${stats.skipped}`);
    console.log(`   ❌ Failed:                  ${stats.failed}`);
    console.log('');

    if (stats.errors.length > 0) {
      console.log('❌ Failed Books:\n');
      stats.errors.forEach(err => {
        console.log(`   ISBN: ${err.isbn}`);
        console.log(`   Error: ${err.error}\n`);
      });
    }

    if (stats.added > 0) {
      console.log('✨ Import complete!');
      console.log(`📚 ${stats.added} books added to ${user.username}'s library.`);
      console.log('🖼️  All books have cover images from Open Library.\n');
    } else {
      console.log('ℹ️  No new books were added.\n');
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed\n');
  }
}

// Run the script
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
