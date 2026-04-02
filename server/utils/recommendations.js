const Book = require('../models/Book');
const Wishlist = require('../models/Wishlist');
const User = require('../models/User');

/**
 * Scoring weights for wishlist-based recommendations
 */
const SCORING_WEIGHTS = {
  AUTHOR_MATCH: 100,           // Same author as wishlist item
  SIMILAR_AUTHOR: 30,          // Author shares wishlist genres
  GENRE_MATCH: 50,             // Same genre as wishlist item
  MULTIPLE_GENRE_BONUS: 20,    // Bonus per additional matching genre
  SAME_CITY: 10,               // Same city as user
  GOOD_CONDITION: 5,            // New or Like New condition
  HIGH_RATING: 5,               // Owner rating >= 4.5
  // Popularity weights
  POPULAR_GENRE: 15,            // Genre is popular system-wide
  POPULAR_AUTHOR: 25,           // Author is popular system-wide
  RECENT_ADDITION: 10          // Book added recently
};

/**
 * Temporal decay configuration
 * Wishes decay exponentially over time - newer wishes have more weight
 */
const TEMPORAL_DECAY = {
  HALF_LIFE_DAYS: 90,          // Wishlist item loses half its weight after 90 days
  MAX_BOOST_DAYS: 7,           // Items added in last 7 days get maximum boost
  RECENCY_BOOST: 1.5           // Multiplier for recent items
};

/**
 * Calculate temporal decay weight for a wishlist item
 * @param {Date} createdAt - When the item was added to wishlist
 * @returns {Number} Weight multiplier (0.5 to 1.5)
 */
function calculateTemporalWeight(createdAt) {
  const now = new Date();
  const ageInDays = (now - new Date(createdAt)) / (1000 * 60 * 60 * 24);

  // Recent items (last 7 days) get a boost
  if (ageInDays <= TEMPORAL_DECAY.MAX_BOOST_DAYS) {
    return TEMPORAL_DECAY.RECENCY_BOOST;
  }

  // Exponential decay: weight = 0.5 * 2^(-age/halfLife)
  const decayFactor = Math.pow(0.5, ageInDays / TEMPORAL_DECAY.HALF_LIFE_DAYS);

  // Clamp between 0.5 and 1.5
  return Math.max(0.5, Math.min(1.5, decayFactor * TEMPORAL_DECAY.RECENCY_BOOST));
}

/**
 * Extract preferences from user's wishlist with temporal weights
 * @param {String} userId - User ID
 * @returns {Object} Wishlist preferences (authors, genres, similar authors, weighted scores)
 */
async function extractWishlistPreferences(userId) {
  try {
    const wishlist = await Wishlist.find({ user: userId });

    if (wishlist.length === 0) {
      return {
        authors: [],
        genres: [],
        authorWeights: {},
        genreWeights: {},
        wishlistItems: [],
        hasWishlist: false
      };
    }

    // Extract unique authors with temporal weights
    const authorScores = {};
    const authorCounts = {};

    wishlist.forEach(item => {
      if (item.author && item.author.trim()) {
        const weight = calculateTemporalWeight(item.createdAt) * (item.priority || 3);
        authorScores[item.author] = (authorScores[item.author] || 0) + weight;
        authorCounts[item.author] = (authorCounts[item.author] || 0) + 1;
      }
    });

    const authors = Object.keys(authorScores);
    const authorWeights = authorScores;

    // Extract unique genres with temporal weights
    const genreScores = {};

    wishlist.forEach(item => {
      const itemWeight = calculateTemporalWeight(item.createdAt) * (item.priority || 3);
      if (Array.isArray(item.genre)) {
        item.genre.forEach(g => {
          if (g) genreScores[g] = (genreScores[g] || 0) + itemWeight;
        });
      } else if (item.genre && typeof item.genre === 'string') {
        genreScores[item.genre] = (genreScores[item.genre] || 0) + itemWeight;
      }
    });

    const genres = Object.keys(genreScores);
    const genreWeights = genreScores;

    // Build similar authors list from wishlist genres
    let similarAuthors = [];
    if (genres.length > 0) {
      similarAuthors = await Book.distinct('author', {
        author: { $exists: true, $ne: null, $nin: authors },
        genre: { $in: genres }
      });
    }

    return {
      authors,
      genres,
      authorWeights,
      genreWeights,
      similarAuthors,
      wishlistItems: wishlist,
      hasWishlist: true
    };
  } catch (error) {
    console.error('Error extracting wishlist preferences:', error);
    throw error;
  }
}

/**
 * Calculate system-wide popularity metrics for genres and authors
 * @returns {Object} Popularity data for genres and authors
 */
async function getPopularityMetrics() {
  try {
    const [genreCounts, authorCounts] = await Promise.all([
      Book.aggregate([
        { $match: { isAvailable: true } },
        { $unwind: '$genre' },
        { $group: { _id: '$genre', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      Book.aggregate([
        { $match: { isAvailable: true, author: { $exists: true, $ne: null } } },
        { $group: { _id: '$author', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 }
      ])
    ]);

    const topGenres = genreCounts.slice(0, 10).map(g => g._id);
    const topAuthors = authorCounts.slice(0, 20).map(a => a._id);

    const maxGenreCount = genreCounts[0]?.count || 1;
    const maxAuthorCount = authorCounts[0]?.count || 1;

    const genrePopularity = {};
    genreCounts.forEach(g => {
      genrePopularity[g._id] = g.count / maxGenreCount;
    });

    const authorPopularity = {};
    authorCounts.forEach(a => {
      authorPopularity[a._id] = a.count / maxAuthorCount;
    });

    return {
      topGenres,
      topAuthors,
      genrePopularity,
      authorPopularity
    };
  } catch (error) {
    console.error('Error calculating popularity metrics:', error);
    return {
      topGenres: [],
      topAuthors: [],
      genrePopularity: {},
      authorPopularity: {}
    };
  }
}

/**
 * Get cold-start recommendations for users with no wishlist
 * Uses popular books, trending genres, and recency
 * @param {String} userId - User ID
 * @param {Number} limit - Number of recommendations
 * @returns {Array} Popular/trending book recommendations
 */
async function getColdStartRecommendations(userId, limit = 10) {
  try {
    const user = await User.findById(userId).select('city').lean();
    const popularityMetrics = await getPopularityMetrics();

    const orConditions = [];

    // Prioritize popular genres
    if (popularityMetrics.topGenres.length > 0) {
      orConditions.push({ genre: { $in: popularityMetrics.topGenres.slice(0, 5) } });
    }

    // Include popular authors
    if (popularityMetrics.topAuthors.length > 0) {
      orConditions.push({ author: { $in: popularityMetrics.topAuthors.slice(0, 10) } });
    }

    if (orConditions.length === 0) {
      orConditions.push({}); // Fallback to all books
    }

    const ownedBooks = await Book.find({ owner: userId }).select('_id');
    const ownedBookIds = ownedBooks.map(book => book._id);

    // Get books with recency scoring
    const books = await Book.find({
      isAvailable: true,
      owner: { $ne: userId },
      _id: { $nin: ownedBookIds },
      $or: orConditions
    })
    .populate('owner', 'name city averageRating privacySettings')
    .sort({ createdAt: -1 }) // Recent additions first
    .limit(limit * 3) // Get more to score and filter
    .lean();

    // Score books based on popularity
    const scoredBooks = books.map(book => {
      let score = 50; // Base score for cold-start

      // Add popularity bonus for genres
      if (book.genre) {
        book.genre.forEach(g => {
          if (popularityMetrics.genrePopularity[g]) {
            score += SCORING_WEIGHTS.POPULAR_GENRE * popularityMetrics.genrePopularity[g];
          }
        });
      }

      // Add popularity bonus for authors
      if (book.author && popularityMetrics.authorPopularity[book.author]) {
        score += SCORING_WEIGHTS.POPULAR_AUTHOR * popularityMetrics.authorPopularity[book.author];
      }

      // Recency bonus (books added in last 30 days)
      const ageInDays = (new Date() - new Date(book.createdAt)) / (1000 * 60 * 60 * 24);
      if (ageInDays <= 30) {
        score += SCORING_WEIGHTS.RECENT_ADDITION * (1 - ageInDays / 30);
      }

      // City match
      if (user?.city && book.owner?.city &&
          user.city.toLowerCase() === book.owner.city.toLowerCase()) {
        score += SCORING_WEIGHTS.SAME_CITY;
      }

      // Condition bonus
      if (book.condition === 'Like New') {
        score += SCORING_WEIGHTS.GOOD_CONDITION;
      }

      // Owner rating bonus
      if (book.owner?.averageRating >= 4.5) {
        score += SCORING_WEIGHTS.HIGH_RATING;
      }

      return {
        ...book,
        recommendationScore: score,
        recommendationReason: generateColdStartReason(book, popularityMetrics)
      };
    });

    scoredBooks.sort((a, b) => b.recommendationScore - a.recommendationScore);
    return scoredBooks.slice(0, limit);

  } catch (error) {
    console.error('Error generating cold-start recommendations:', error);
    return [];
  }
}

/**
 * Generate reason badge for cold-start recommendations
 * @param {Object} book - Book object
 * @param {Object} metrics - Popularity metrics
 * @returns {String} Reason for recommendation
 */
function generateColdStartReason(book, metrics) {
  const reasons = [];

  if (metrics.topGenres.some(g => book.genre?.includes(g))) {
    reasons.push('Popular genre');
  }

  if (metrics.topAuthors.includes(book.author)) {
    reasons.push('Trending author');
  }

  const ageInDays = (new Date() - new Date(book.createdAt)) / (1000 * 60 * 60 * 24);
  if (ageInDays <= 7) {
    reasons.push('Recently added');
  }

  if (reasons.length === 0) {
    return 'Trending in BookVerse';
  }

  return reasons.join(' • ');
}

/**
 * Calculate recommendation score for a book based on wishlist preferences
 * @param {Object} book - Book object (populated with owner)
 * @param {Array} wishlistAuthors - Array of authors from wishlist
 * @param {Object} authorWeights - Weighted scores for wishlist authors
 * @param {Array} wishlistGenres - Array of genres from wishlist
 * @param {Object} genreWeights - Weighted scores for wishlist genres
 * @param {Array} similarAuthors - Authors sharing wishlist genres
 * @param {Object} user - User object
 * @param {Object} popularityMetrics - System-wide popularity data
 * @returns {Number} Recommendation score
 */
function calculateWishlistScore(book, wishlistAuthors, authorWeights, wishlistGenres, genreWeights, similarAuthors, user, popularityMetrics) {
  let score = 0;

  try {
    // 1. AUTHOR MATCH (highest priority - weight: 100)
    if (book.author && wishlistAuthors.includes(book.author)) {
      score += SCORING_WEIGHTS.AUTHOR_MATCH * Math.min(1.5, (authorWeights[book.author] || 1) / 3);
    }

    // 2. SIMILAR AUTHOR (weight: 30)
    if (book.author && !wishlistAuthors.includes(book.author) && similarAuthors.includes(book.author)) {
      score += SCORING_WEIGHTS.SIMILAR_AUTHOR;
    }

    // 3. GENRE MATCH (weight: 50 per genre)
    let matchingGenresCount = 0;
    if (book.genre && Array.isArray(book.genre)) {
      book.genre.forEach(bookGenre => {
        if (wishlistGenres.includes(bookGenre)) {
          const genreWeight = Math.min(1.5, (genreWeights[bookGenre] || 1) / 3);
          score += SCORING_WEIGHTS.GENRE_MATCH * genreWeight;
          matchingGenresCount++;
        }
      });

      // Bonus for multiple genre matches
      if (matchingGenresCount > 1) {
        score += SCORING_WEIGHTS.MULTIPLE_GENRE_BONUS * (matchingGenresCount - 1);
      }
    }

    // 4. POPULARITY BONUS
    if (book.author && popularityMetrics.authorPopularity[book.author]) {
      score += SCORING_WEIGHTS.POPULAR_AUTHOR * popularityMetrics.authorPopularity[book.author] * 0.5;
    }
    if (book.genre) {
      book.genre.forEach(g => {
        if (popularityMetrics.genrePopularity[g]) {
          score += SCORING_WEIGHTS.POPULAR_GENRE * popularityMetrics.genrePopularity[g] * 0.5;
        }
      });
    }

    // 5. RECENCY BONUS
    const ageInDays = (new Date() - new Date(book.createdAt)) / (1000 * 60 * 60 * 24);
    if (ageInDays <= 30) {
      score += SCORING_WEIGHTS.RECENT_ADDITION * (1 - ageInDays / 30);
    }

    // 6. LOCATION PROXIMITY (weight: 10)
    if (user && user.city && book.owner && book.owner.city) {
      const sameCity = user.city.toLowerCase() === book.owner.city.toLowerCase();
      if (sameCity) {
        score += SCORING_WEIGHTS.SAME_CITY;
      }
    }

    // 7. BOOK CONDITION (weight: 5)
    const preferredConditions = ['Like New'];
    if (preferredConditions.includes(book.condition)) {
      score += SCORING_WEIGHTS.GOOD_CONDITION;
    }

    // 8. OWNER REPUTATION (weight: 5)
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
 * @param {Array} similarAuthors - Authors sharing wishlist genres
 * @returns {String|null} Recommendation reason badge
 */
function generateRecommendationBadge(book, wishlistAuthors, wishlistGenres, similarAuthors) {
  const authorMatch = book.author && wishlistAuthors.includes(book.author);
  const similarAuthorMatch = book.author && !authorMatch && similarAuthors.includes(book.author);
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

  if (similarAuthorMatch) {
    return `Similar author to your wishlist`;
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
 * Uses content-based filtering with popularity boosting and temporal decay
 * Falls back to cold-start recommendations for users without wishlist
 *
 * @param {String} userId - User ID
 * @param {Number} limit - Total number of recommendations to return
 * @returns {Array} Recommended books with scores and reasons
 */
async function getRecommendations(userId, limit = 10) {
  try {
    // Extract wishlist preferences with temporal weights
    const { authors, genres, authorWeights, genreWeights, similarAuthors, wishlistItems, hasWishlist } =
      await extractWishlistPreferences(userId);

    // Get user info for location-based scoring
    const user = await User.findById(userId).select('city').lean();

    // Get popularity metrics for scoring boost
    const popularityMetrics = await getPopularityMetrics();

    // Cold-start: user has no wishlist items
    if (!hasWishlist || (authors.length === 0 && genres.length === 0)) {
      return await getColdStartRecommendations(userId, limit);
    }

    // Get user's owned books to exclude
    const ownedBooks = await Book.find({ owner: userId }).select('_id');
    const ownedBookIds = ownedBooks.map(book => book._id);

    const orConditions = [];

    if (authors.length > 0) {
      orConditions.push({ author: { $in: authors } });
    }

    if (similarAuthors.length > 0) {
      orConditions.push({ author: { $in: similarAuthors } });
    }

    if (genres.length > 0) {
      orConditions.push({ genre: { $in: genres } });
    }

    if (orConditions.length === 0) {
      return await getColdStartRecommendations(userId, limit);
    }

    // Find available books matching wishlist authors, similar authors, or genres
    const availableBooks = await Book.find({
      isAvailable: true,
      owner: { $ne: userId },
      _id: { $nin: ownedBookIds },
      $or: orConditions
    })
    .populate('owner', 'name city averageRating privacySettings')
    .lean();

    // Filter out books already in wishlist
    const filteredBooks = availableBooks.filter(book =>
      !isBookInWishlist(book, wishlistItems)
    );

    // Score each book with updated function
    const scoredBooks = filteredBooks.map(book => ({
      ...book,
      recommendationScore: calculateWishlistScore(
        book, authors, authorWeights, genres, genreWeights, similarAuthors, user, popularityMetrics
      ),
      recommendationReason: generateRecommendationBadge(book, authors, genres, similarAuthors)
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
  getColdStartRecommendations,
  buildUserProfile,
  extractWishlistPreferences,
  calculateWishlistScore,
  calculateTemporalWeight,
  getPopularityMetrics,
  generateRecommendationBadge,
  generateColdStartReason,
  SCORING_WEIGHTS,
  TEMPORAL_DECAY
};
