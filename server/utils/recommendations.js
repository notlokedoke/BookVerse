const Book = require('../models/Book');
const Wishlist = require('../models/Wishlist');
const User = require('../models/User');

/**
 * Scoring weights for wishlist-based recommendations
 */
const SCORING_WEIGHTS = {
  AUTHOR_MATCH: 100,           // Same author as wishlist item
  GENRE_MATCH: 50,             // Same genre as wishlist item
  MULTIPLE_GENRE_BONUS: 20,    // Bonus per additional matching genre
  SAME_CITY: 10,               // Same city as user
  GOOD_CONDITION: 5,           // New or Like New condition
  HIGH_RATING: 5               // Owner rating >= 4.5
};

/**
 * Extract preferences from user's wishlist
 * @param {String} userId - User ID
 * @returns {Object} Wishlist preferences (authors and genres)
 */
async function extractWishlistPreferences(userId) {
  try {
    const wishlist = await Wishlist.find({ user: userId });

    if (wishlist.length === 0) {
      return {
        authors: [],
        genres: [],
        wishlistItems: []
      };
    }

    // Extract unique authors
    const authors = [...new Set(
      wishlist
        .map(item => item.author)
        .filter(author => author && author.trim())
    )];

    // Since wishlist items don't have genres, we'll infer genres from:
    // 1. Books by the same authors in the database
    // 2. This allows genre-based recommendations even without explicit genre data
    const genreSet = new Set();
    
    if (authors.length > 0) {
      const booksByWishlistAuthors = await Book.find({
        author: { $in: authors },
        genre: { $exists: true, $ne: [] }
      }).select('genre').lean();

      booksByWishlistAuthors.forEach(book => {
        if (book.genre && Array.isArray(book.genre)) {
          book.genre.forEach(g => genreSet.add(g));
        }
      });
    }

    const genres = Array.from(genreSet);

    return {
      authors,
      genres,
      wishlistItems: wishlist
    };
  } catch (error) {
    console.error('Error extracting wishlist preferences:', error);
    throw error;
  }
}

/**
 * Calculate recommendation score for a book based on wishlist preferences
 * @param {Object} book - Book object (populated with owner)
 * @param {Array} wishlistAuthors - Array of authors from wishlist
 * @param {Array} wishlistGenres - Array of genres from wishlist
 * @param {Object} user - User object
 * @returns {Number} Recommendation score
 */
function calculateWishlistScore(book, wishlistAuthors, wishlistGenres, user) {
  let score = 0;

  try {
    // 1. AUTHOR MATCH (highest priority - weight: 100)
    if (book.author && wishlistAuthors.includes(book.author)) {
      score += SCORING_WEIGHTS.AUTHOR_MATCH;
    }

    // 2. GENRE MATCH (weight: 50 per genre)
    let matchingGenresCount = 0;
    if (book.genre && Array.isArray(book.genre)) {
      book.genre.forEach(bookGenre => {
        if (wishlistGenres.includes(bookGenre)) {
          score += SCORING_WEIGHTS.GENRE_MATCH;
          matchingGenresCount++;
        }
      });

      // Bonus for multiple genre matches
      if (matchingGenresCount > 1) {
        score += SCORING_WEIGHTS.MULTIPLE_GENRE_BONUS * (matchingGenresCount - 1);
      }
    }

    // 3. LOCATION PROXIMITY (weight: 10)
    if (user && user.city && book.owner && book.owner.city) {
      const sameCity = user.city.toLowerCase() === book.owner.city.toLowerCase();
      if (sameCity) {
        score += SCORING_WEIGHTS.SAME_CITY;
      }
    }

    // 4. BOOK CONDITION (weight: 5)
    const preferredConditions = ['New', 'Like New'];
    if (preferredConditions.includes(book.condition)) {
      score += SCORING_WEIGHTS.GOOD_CONDITION;
    }

    // 5. OWNER REPUTATION (weight: 5)
    if (book.owner && book.owner.averageRating >= 4.5) {
      score += SCORING_WEIGHTS.HIGH_RATING;
    }

    return score;
  } catch (error) {
    console.error('Error calculating wishlist score:', error);
    return 0;
  }
}

/**
 * Generate explanation badge for recommendation
 * @param {Object} book - Book object
 * @param {Array} wishlistAuthors - Array of authors from wishlist
 * @param {Array} wishlistGenres - Array of genres from wishlist
 * @returns {String|null} Recommendation reason badge
 */
function generateRecommendationBadge(book, wishlistAuthors, wishlistGenres) {
  const authorMatch = book.author && wishlistAuthors.includes(book.author);
  const matchingGenres = book.genre 
    ? book.genre.filter(g => wishlistGenres.includes(g))
    : [];

  // Author + Genre match
  if (authorMatch && matchingGenres.length > 0) {
    return `By ${book.author}, in your wishlist`;
  }

  // Author match only
  if (authorMatch) {
    return `By ${book.author}, in your wishlist`;
  }

  // Multiple genre matches
  if (matchingGenres.length > 2) {
    const genreList = matchingGenres.slice(0, 2).join(' & ');
    return `Matches ${genreList} from your wishlist`;
  }

  if (matchingGenres.length === 2) {
    return `Matches ${matchingGenres.join(' & ')} from your wishlist`;
  }

  // Single genre match
  if (matchingGenres.length === 1) {
    return `You're interested in ${matchingGenres[0]}`;
  }

  return null;
}

/**
 * Check if book is already in user's wishlist
 * @param {Object} book - Book object
 * @param {Array} wishlistItems - User's wishlist items
 * @returns {Boolean} True if book is in wishlist
 */
function isBookInWishlist(book, wishlistItems) {
  return wishlistItems.some(item => {
    // Check by ISBN if available
    if (book.isbn && item.isbn && book.isbn === item.isbn) {
      return true;
    }

    // Check by title and author (case-insensitive)
    const titleMatch = book.title.toLowerCase().trim() === item.title.toLowerCase().trim();
    const authorMatch = book.author.toLowerCase().trim() === item.author.toLowerCase().trim();
    
    return titleMatch && authorMatch;
  });
}

/**
 * Generate wishlist-based recommendations for a user
 * 100% Content-Based Filtering using wishlist preferences
 * 
 * @param {String} userId - User ID
 * @param {Number} limit - Total number of recommendations to return
 * @returns {Array} Recommended books with scores and reasons
 */
async function getRecommendations(userId, limit = 10) {
  try {
    // Extract wishlist preferences
    const { authors, genres, wishlistItems } = await extractWishlistPreferences(userId);

    // If no wishlist, return empty with message
    if (authors.length === 0 && genres.length === 0) {
      return [];
    }

    // Get user info for location-based scoring
    const user = await User.findById(userId).select('city');

    // Get user's owned books to exclude
    const ownedBooks = await Book.find({ owner: userId }).select('_id');
    const ownedBookIds = ownedBooks.map(book => book._id);

    // Find available books matching wishlist authors or genres
    const availableBooks = await Book.find({
      isAvailable: true,
      owner: { $ne: userId },
      _id: { $nin: ownedBookIds },
      $or: [
        { author: { $in: authors } },
        { genre: { $in: genres } }
      ]
    })
    .populate('owner', 'city averageRating privacySettings')
    .lean();

    // Filter out books already in wishlist
    const filteredBooks = availableBooks.filter(book => 
      !isBookInWishlist(book, wishlistItems)
    );

    // Score each book
    const scoredBooks = filteredBooks.map(book => ({
      ...book,
      recommendationScore: calculateWishlistScore(book, authors, genres, user),
      recommendationReason: generateRecommendationBadge(book, authors, genres)
    }));

    // Sort by score (highest first)
    scoredBooks.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Return top recommendations
    return scoredBooks.slice(0, limit);

  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Build user preference profile (for debugging/transparency)
 * @param {String} userId - User ID
 * @returns {Object} User preference profile
 */
async function buildUserProfile(userId) {
  try {
    const { authors, genres, wishlistItems } = await extractWishlistPreferences(userId);

    return {
      favoriteAuthors: authors.map(author => ({ author, score: 5 })),
      favoriteGenres: genres.map(genre => ({ genre, score: 5 })),
      wishlistBooks: wishlistItems,
      receivedBooks: [],
      ownedBooks: []
    };
  } catch (error) {
    console.error('Error building user profile:', error);
    throw error;
  }
}

module.exports = {
  getRecommendations,
  buildUserProfile,
  extractWishlistPreferences,
  calculateWishlistScore,
  generateRecommendationBadge,
  SCORING_WEIGHTS
};
