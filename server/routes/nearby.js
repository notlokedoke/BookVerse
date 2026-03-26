const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Book = require('../models/Book');
const { calculateDistance, geocodeCity } = require('../utils/locationUtils');
const { applyBookOwnerPrivacyToArray } = require('../utils/privacy');

/**
 * @route   GET /api/nearby/same-city
 * @desc    Get books from users in the same city (for local in-person trades)
 * @access  Private
 */
router.get('/same-city', authenticateToken, async (req, res) => {
  try {
    console.log('🏙️  Local books request from user:', req.userId);
    
    const { page = 1, limit = 24, genre, author, title } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get current user
    const currentUser = await User.findById(req.userId).select('city');
    console.log('🏙️  Current user city:', currentUser?.city || 'NOT SET');

    if (!currentUser || !currentUser.city) {
      console.log('❌ User has no city set');
      return res.status(400).json({
        success: false,
        error: {
          message: 'You must set your city to see local books',
          code: 'CITY_NOT_SET'
        }
      });
    }

    // Build query - EXCLUDE current user's books
    const bookQuery = { 
      isAvailable: true,
      owner: { $ne: req.userId } // This ensures current user's books are excluded
    };

    if (title) bookQuery.title = new RegExp(title, 'i');
    if (genre) {
      const genreArray = genre.split(',').map(g => g.trim()).filter(g => g);
      if (genreArray.length > 0) {
        bookQuery.genre = { $in: genreArray };
      }
    }
    if (author) bookQuery.author = new RegExp(author, 'i');

    // Escape special regex characters in city name
    const escapedCity = currentUser.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Aggregation pipeline
    const pipeline = [
      { $match: bookQuery },
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
        $match: {
          'owner.city': new RegExp(`^${escapedCity}`, 'i'),
          $or: [
            { 'owner.privacySettings.showCity': { $ne: false } },
            { 'owner.privacySettings.showCity': { $exists: false } }
          ]
        }
      },
      {
        $project: {
          'owner.password': 0
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Book.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limitNum });

    // Execute query
    const books = await Book.aggregate(pipeline);
    console.log(`✅ Page ${pageNum}: Found ${books.length} books from other users in ${currentUser.city}`);
    console.log(`   Total count: ${total}, Skip: ${skip}, Limit: ${limitNum}`);
    console.log(`   Calculated pages: ${Math.ceil(total / limitNum)}`);

    // Apply privacy settings
    const booksWithPrivacy = applyBookOwnerPrivacyToArray(books);

    res.status(200).json({
      success: true,
      data: {
        books: booksWithPrivacy,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalBooks: total,
          hasNextPage: skip + books.length < total,
          hasPrevPage: pageNum > 1
        },
        city: currentUser.city
      }
    });

  } catch (error) {
    console.error('Get same city books error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching local books',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;
