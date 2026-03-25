const Book = require('../models/Book');
const Wishlist = require('../models/Wishlist');
const Trade = require('../models/Trade');
const User = require('../models/User');

/**
 * Signal weights for building user preference profile
 */
const SIGNAL_WEIGHTS = {
  WISHLIST: 5,           // They want these books
  RECEIVED_TRADES: 3,    // They traded for these
  PROPOSED_TRADES: 3,    // They tried to get these
  SEARCH_QUERIES: 2,     // They searched for these
  OWNED_BOOKS: 1,        // WEAK - they're trading away!
  GIVEN_AWAY: -1         // NEGATIVE - they didn't want them
};

/**
 * Build user preference profile from various signals
 * @param {String} userId - User ID
 * @returns {Object} User preference profile
 */
async function buildUserProfile(userId) {
  const profile = {
    favoriteGenres: {},
    favoriteAuthors: {},
    wishlistBooks: [],
    receivedBooks: [],
    ownedBooks: []
  };

  try {
    // STRONG SIGNAL: Wishlist (weight: 5x)
    const wishlist = await Wishlist.find({ user: userId });
    profile.wishlistBooks = wishlist;
    
    wishlist.forEach(item => {
      if (item.author) {
        profile.favoriteAuthors[item.author] = 
          (profile.favoriteAuthors[item.author] || 0) + SIGNAL_WEIGHTS.WISHLIST;
      }
      // Note: Wishlist items may not have genre info, so we skip genre extraction
    });

    // MEDIUM SIGNAL: Books received in trades (weight: 3x)
    const receivedTrades = await Trade.find({ 
      receiver: userId, 
      status: 'completed' 
    }).populate('offeredBook');
    
    receivedTrades.forEach(trade => {
      if (trade.offeredBook) {
        const book = trade.offeredBook;
        profile.receivedBooks.push(book);
        
        if (book.genre && Array.isArray(book.genre)) {
          book.genre.forEach(g => {
            profile.favoriteGenres[g] = 
              (profile.favoriteGenres[g] || 0) + SIGNAL_WEIGHTS.RECEIVED_TRADES;
          });
        }
        
        if (book.author) {
          profile.favoriteAuthors[book.author] = 
            (profile.favoriteAuthors[book.author] || 0) + SIGNAL_WEIGHTS.RECEIVED_TRADES;
        }
      }
    });

    // MEDIUM SIGNAL: Books they proposed trades for (weight: 3x)
    const proposedTrades = await Trade.find({ 
      proposer: userId,
      status: { $in: ['proposed', 'accepted', 'completed'] }
    }).populate('requestedBook');
    
    proposedTrades.forEach(trade => {
      if (trade.requestedBook) {
        const book = trade.requestedBook;
        
        if (book.genre && Array.isArray(book.genre)) {
          book.genre.forEach(g => {
            profile.favoriteGenres[g] = 
              (profile.favoriteGenres[g] || 0) + SIGNAL_WEIGHTS.PROPOSED_TRADES;
          });
        }
        
        if (book.author) {
          profile.favoriteAuthors[book.author] = 
            (profile.favoriteAuthors[book.author] || 0) + SIGNAL_WEIGHTS.PROPOSED_TRADES;
        }
      }
    });

    // WEAK SIGNAL: Owned books (weight: 1x) - they're trading these away!
    const ownedBooks = await Book.find({ owner: userId });
    profile.ownedBooks = ownedBooks;
    
    ownedBooks.forEach(book => {
      if (book.genre && Array.isArray(book.genre)) {
        book.genre.forEach(g => {
          profile.favoriteGenres[g] = 
            (profile.favoriteGenres[g] || 0) + SIGNAL_WEIGHTS.OWNED_BOOKS;
        });
      }
    });

    // Convert to sorted arrays (top preferences first)
    profile.favoriteGenres = Object.entries(profile.favoriteGenres)
      .sort((a, b) => b[1] - a[1])
      .map(([genre, score]) => ({ genre, score }));
      
    profile.favoriteAuthors = Object.entries(profile.favoriteAuthors)
      .sort((a, b) => b[1] - a[1])
      .map(([author, score]) => ({ author, score }));

    return profile;
  } catch (error) {
    console.error('Error building user profile:', error);
    throw error;
  }
}

/**
 * Calculate days since a date
 * @param {Date} date 
 * @returns {Number} Days since date
 */
function getDaysSince(date) {
  const now = new Date();
  const diff = now - new Date(date);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate recommendation score for a book
 * @param {String} userId - User ID
 * @param {Object} book - Book object (populated with owner)
 * @param {Object} userProfile - User preference profile
 * @returns {Number} Recommendation score
 */
async function calculateRecommendationScore(userId, book, userProfile) {
  let score = 0;

  try {
    // 1. WISHLIST MATCH (highest priority - weight: 100)
    const wishlistMatch = await Wishlist.findOne({
      user: userId,
      $or: [
        { 
          title: { $regex: new RegExp(`^${escapeRegex(book.title)}$`, 'i') },
          author: { $regex: new RegExp(`^${escapeRegex(book.author)}$`, 'i') }
        },
        ...(book.isbn ? [{ isbn: book.isbn }] : [])
      ]
    });
    
    if (wishlistMatch) {
      score += 100;
    }

    // 2. GENRE MATCH (weight: 50 for top genre, 30 for others)
    if (book.genre && Array.isArray(book.genre) && userProfile.favoriteGenres.length > 0) {
      book.genre.forEach(bookGenre => {
        const genreIndex = userProfile.favoriteGenres.findIndex(g => g.genre === bookGenre);
        if (genreIndex === 0) {
          score += 50; // Top favorite genre
        } else if (genreIndex > 0 && genreIndex < 3) {
          score += 30; // Top 3 favorite genres
        } else if (genreIndex >= 3) {
          score += 15; // Other favorite genres
        }
      });
    }

    // 3. AUTHOR MATCH (weight: 40 for top author, 25 for others)
    if (book.author && userProfile.favoriteAuthors.length > 0) {
      const authorIndex = userProfile.favoriteAuthors.findIndex(a => a.author === book.author);
      if (authorIndex === 0) {
        score += 40; // Top favorite author
      } else if (authorIndex > 0 && authorIndex < 3) {
        score += 25; // Top 3 favorite authors
      } else if (authorIndex >= 3) {
        score += 10; // Other favorite authors
      }
    }

    // 4. LOCATION PROXIMITY (weight: up to 30)
    const user = await User.findById(userId);
    if (user && user.city && book.owner && book.owner.city) {
      const sameCity = user.city.toLowerCase() === book.owner.city.toLowerCase();
      if (sameCity) {
        score += 30; // Same city
      }
      // Note: For more sophisticated distance calculation, integrate with worldCities.js
    }

    // 5. RECENCY BOOST (weight: up to 15)
    const daysSinceListed = getDaysSince(book.createdAt);
    if (daysSinceListed <= 7) {
      score += 15; // Listed in last week
    } else if (daysSinceListed <= 30) {
      score += 10; // Listed in last month
    } else if (daysSinceListed <= 90) {
      score += 5; // Listed in last 3 months
    }

    // 6. OWNER REPUTATION (weight: up to 10)
    if (book.owner && book.owner.averageRating) {
      if (book.owner.averageRating >= 4.5) {
        score += 10;
      } else if (book.owner.averageRating >= 4.0) {
        score += 5;
      } else if (book.owner.averageRating >= 3.5) {
        score += 2;
      }
    }

    // 7. CONDITION PREFERENCE (weight: 5)
    const preferredConditions = ['New', 'Like New', 'Good'];
    if (preferredConditions.includes(book.condition)) {
      score += 5;
    }

    // 8. NEGATIVE SIGNAL: User owns similar book (weight: -20)
    const ownsSimilar = userProfile.ownedBooks.some(ownedBook => 
      ownedBook.author === book.author && 
      ownedBook.genre && book.genre &&
      ownedBook.genre.some(g => book.genre.includes(g))
    );
    if (ownsSimilar) {
      score -= 20;
    }

    return score;
  } catch (error) {
    console.error('Error calculating recommendation score:', error);
    return 0;
  }
}

/**
 * Escape regex special characters
 * @param {String} string 
 * @returns {String} Escaped string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate explanation for recommendation
 * @param {Number} score - Recommendation score
 * @param {Object} book - Book object
 * @param {Object} userProfile - User preference profile
 * @returns {String|null} Recommendation reason (null if no specific reason)
 */
function generateRecommendationReason(score, book, userProfile) {
  // Only show badges for truly meaningful recommendations
  
  if (score >= 100) {
    return "Matches your wishlist!";
  }
  
  if (score >= 80) {
    // Check if it's genre or author match
    const topGenre = userProfile.favoriteGenres[0]?.genre;
    if (topGenre && book.genre && book.genre.includes(topGenre)) {
      return `You love ${topGenre} books`;
    }
  }
  
  if (score >= 60) {
    const topAuthor = userProfile.favoriteAuthors[0]?.author;
    if (topAuthor && book.author === topAuthor) {
      return `By ${book.author}, one of your favorites`;
    }
  }
  
  // Don't show generic badges for mid-tier scores
  // The recommendation algorithm still works, just no badge displayed
  return null;
}

/**
 * Get trending books (recently listed with high engagement)
 * @param {String} userId - User ID
 * @param {Number} limit - Number of books to return
 * @returns {Array} Trending books
 */
async function getTrendingBooks(userId, limit = 10) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingBooks = await Book.find({
      isAvailable: true,
      owner: { $ne: userId },
      createdAt: { $gte: sevenDaysAgo }
    })
    .populate('owner', 'city averageRating privacySettings')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    return trendingBooks;
  } catch (error) {
    console.error('Error getting trending books:', error);
    return [];
  }
}

/**
 * Get random discovery books
 * @param {String} userId - User ID
 * @param {Array} excludeIds - Book IDs to exclude
 * @param {Number} limit - Number of books to return
 * @returns {Array} Random books
 */
async function getRandomBooks(userId, excludeIds = [], limit = 5) {
  try {
    const randomBooks = await Book.aggregate([
      {
        $match: {
          isAvailable: true,
          owner: { $ne: userId },
          _id: { $nin: excludeIds }
        }
      },
      { $sample: { size: limit } },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner'
        }
      },
      { $unwind: '$owner' },
      {
        $project: {
          'owner.password': 0
        }
      }
    ]);

    return randomBooks;
  } catch (error) {
    console.error('Error getting random books:', error);
    return [];
  }
}

/**
 * Generate personalized recommendations for a user
 * Phase 1: Hybrid approach (Wishlist 50%, Content-Based 30%, Trending 15%, Random 5%)
 * 
 * @param {String} userId - User ID
 * @param {Number} limit - Total number of recommendations to return
 * @returns {Array} Recommended books with scores and reasons
 */
async function getRecommendations(userId, limit = 10) {
  try {
    // Build user preference profile
    const userProfile = await buildUserProfile(userId);

    // Get available books (exclude user's own books)
    const availableBooks = await Book.find({ 
      isAvailable: true,
      owner: { $ne: userId }
    })
    .populate('owner', 'city averageRating privacySettings')
    .lean();

    // Score each book
    const scoredBooks = await Promise.all(
      availableBooks.map(async (book) => ({
        book,
        score: await calculateRecommendationScore(userId, book, userProfile),
        reason: null // Will be set later
      }))
    );

    // Sort by score
    scoredBooks.sort((a, b) => b.score - a.score);

    // Phase 1 Hybrid Distribution:
    // 50% Wishlist/Content-Based (top scored)
    // 15% Trending
    // 5% Random Discovery

    const contentBasedCount = Math.ceil(limit * 0.80); // 80% content-based (wishlist + preferences)
    const trendingCount = Math.ceil(limit * 0.15);     // 15% trending
    const randomCount = Math.max(1, limit - contentBasedCount - trendingCount); // 5% random

    // Get top content-based recommendations
    const contentBased = scoredBooks.slice(0, contentBasedCount);

    // Get trending books
    const trending = await getTrendingBooks(userId, trendingCount);
    const trendingWithScore = trending.map(book => ({
      book,
      score: 20, // Base trending score
      reason: null // Don't show badge for trending
    }));

    // Get random discovery books (exclude already recommended)
    const excludeIds = [
      ...contentBased.map(item => item.book._id),
      ...trendingWithScore.map(item => item.book._id)
    ];
    const random = await getRandomBooks(userId, excludeIds, randomCount);
    const randomWithScore = random.map(book => ({
      book,
      score: 10, // Base random score
      reason: null // Don't show badge for random
    }));

    // Combine all recommendations
    let recommendations = [
      ...contentBased,
      ...trendingWithScore,
      ...randomWithScore
    ];

    // Remove duplicates (by book ID)
    const seen = new Set();
    recommendations = recommendations.filter(item => {
      const id = item.book._id.toString();
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });

    // Limit to requested count
    recommendations = recommendations.slice(0, limit);

    // Generate reasons for content-based recommendations
    recommendations = recommendations.map(item => ({
      ...item.book,
      recommendationScore: item.score,
      recommendationReason: item.reason || generateRecommendationReason(item.score, item.book, userProfile)
    }));

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

module.exports = {
  getRecommendations,
  buildUserProfile,
  calculateRecommendationScore,
  getTrendingBooks,
  getRandomBooks,
  SIGNAL_WEIGHTS
};
