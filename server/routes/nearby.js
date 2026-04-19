const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Book = require('../models/Book');
const { calculateDistance, geocodeCity } = require('../utils/locationUtils');
const { applyBookOwnerPrivacyToArray } = require('../utils/privacy');

/**
 * @route   GET /api/nearby/books
 * @desc    Get books sorted by distance from current user
 * @access  Private
 */
router.get('/books', authenticateToken, async (req, res) => {
  try {
    console.log('📍 Nearby books request from user:', req.userId);
    
    const { 
      page = 1, 
      limit = 20, 
      maxDistance = 50, // km
      genre,
      author,
      title 
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const maxDistanceNum = Math.min(500, Math.max(1, parseInt(maxDistance)));
    const skip = (pageNum - 1) * limitNum;

    // Get current user with coordinates
    const currentUser = await User.findById(req.userId).select('city coordinates');
    console.log('📍 Current user city:', currentUser?.city || 'NOT SET');

    if (!currentUser || !currentUser.city) {
      console.log('❌ User has no city set');
      return res.status(400).json({
        success: false,
        error: {
          message: 'You must set your city to search nearby books',
          code: 'CITY_NOT_SET'
        }
      });
    }

    // Get or geocode current user coordinates
    let currentCoords = currentUser.coordinates;
    if (!currentCoords || !currentCoords.lat || !currentCoords.lng) {
      try {
        currentCoords = await geocodeCity(currentUser.city);
        // Update user coordinates in background
        User.findByIdAndUpdate(req.userId, { coordinates: currentCoords }).exec();
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to determine your location',
            code: 'GEOCODING_FAILED'
          }
        });
      }
    }

    // Build book query
    const bookQuery = { 
      isAvailable: true,
      owner: { $ne: req.userId } // Exclude own books
    };

    if (title) bookQuery.title = new RegExp(title, 'i');
    if (genre) {
      const genreArray = genre.split(',').map(g => g.trim()).filter(g => g);
      if (genreArray.length > 0) {
        bookQuery.genre = { $in: genreArray };
      }
    }
    if (author) bookQuery.author = new RegExp(author, 'i');

    // Get all books with owner information
    const books = await Book.find(bookQuery)
      .populate('owner', 'city coordinates privacySettings name averageRating')
      .lean()
      .exec();

    // Filter books by distance and calculate distances
    const booksWithDistance = [];

    for (const book of books) {
      const owner = book.owner;

      // Skip if owner hides city
      if (owner.privacySettings?.showCity === false) {
        continue;
      }

      // Skip if owner has no city
      if (!owner.city) {
        continue;
      }

      // Get or geocode owner coordinates
      let ownerCoords = owner.coordinates;
      if (!ownerCoords || !ownerCoords.lat || !ownerCoords.lng) {
        try {
          ownerCoords = await geocodeCity(owner.city);
          // Update owner coordinates in background
          User.findByIdAndUpdate(owner._id, { coordinates: ownerCoords }).exec();
        } catch (error) {
          console.error(`Failed to geocode city for user ${owner._id}:`, error.message);
          continue;
        }
      }

      // Calculate distance
      const distance = calculateDistance(
        currentCoords.lat,
        currentCoords.lng,
        ownerCoords.lat,
        ownerCoords.lng
      );

      // Filter by max distance
      if (distance <= maxDistanceNum) {
        booksWithDistance.push({
          ...book,
          distance
        });
      }
    }

    // Sort by distance (nearest first)
    booksWithDistance.sort((a, b) => a.distance - b.distance);

    // Apply pagination
    const paginatedBooks = booksWithDistance.slice(skip, skip + limitNum);
    const total = booksWithDistance.length;

    // Apply privacy settings
    const booksWithPrivacy = applyBookOwnerPrivacyToArray(paginatedBooks);

    res.status(200).json({
      success: true,
      data: {
        books: booksWithPrivacy,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalBooks: total,
          hasNextPage: skip + paginatedBooks.length < total,
          hasPrevPage: pageNum > 1
        },
        filters: {
          maxDistance: maxDistanceNum,
          userLocation: currentUser.city
        }
      }
    });

  } catch (error) {
    console.error('Get nearby books error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching nearby books',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   GET /api/nearby/users
 * @desc    Get users sorted by distance from current user
 * @access  Private
 */
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      maxDistance = 50 // km
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const maxDistanceNum = Math.min(500, Math.max(1, parseInt(maxDistance)));
    const skip = (pageNum - 1) * limitNum;

    // Get current user with coordinates
    const currentUser = await User.findById(req.userId).select('city coordinates');

    if (!currentUser || !currentUser.city) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'You must set your city to search nearby users',
          code: 'CITY_NOT_SET'
        }
      });
    }

    // Get or geocode current user coordinates
    let currentCoords = currentUser.coordinates;
    if (!currentCoords || !currentCoords.lat || !currentCoords.lng) {
      try {
        currentCoords = await geocodeCity(currentUser.city);
        User.findByIdAndUpdate(req.userId, { coordinates: currentCoords }).exec();
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to determine your location',
            code: 'GEOCODING_FAILED'
          }
        });
      }
    }

    // Get all users who show their city (excluding current user)
    const users = await User.find({
      _id: { $ne: req.userId },
      city: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { 'privacySettings.showCity': { $ne: false } },
        { 'privacySettings.showCity': { $exists: false } }
      ]
    })
    .select('name city coordinates averageRating ratingCount privacySettings')
    .lean()
    .exec();

    // Calculate distances
    const usersWithDistance = [];

    for (const user of users) {
      // Get or geocode user coordinates
      let userCoords = user.coordinates;
      if (!userCoords || !userCoords.lat || !userCoords.lng) {
        try {
          userCoords = await geocodeCity(user.city);
          User.findByIdAndUpdate(user._id, { coordinates: userCoords }).exec();
        } catch (error) {
          console.error(`Failed to geocode city for user ${user._id}:`, error.message);
          continue;
        }
      }

      // Calculate distance
      const distance = calculateDistance(
        currentCoords.lat,
        currentCoords.lng,
        userCoords.lat,
        userCoords.lng
      );

      // Filter by max distance
      if (distance <= maxDistanceNum) {
        usersWithDistance.push({
          _id: user._id,
          name: user.name,
          city: user.city,
          averageRating: user.averageRating,
          ratingCount: user.ratingCount,
          distance
        });
      }
    }

    // Sort by distance (nearest first)
    usersWithDistance.sort((a, b) => a.distance - b.distance);

    // Apply pagination
    const paginatedUsers = usersWithDistance.slice(skip, skip + limitNum);
    const total = usersWithDistance.length;

    res.status(200).json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalUsers: total,
          hasNextPage: skip + paginatedUsers.length < total,
          hasPrevPage: pageNum > 1
        },
        filters: {
          maxDistance: maxDistanceNum,
          userLocation: currentUser.city
        }
      }
    });

  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching nearby users',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   GET /api/nearby/same-city
 * @desc    Get books from users in the same city (for local in-person trades)
 * @access  Private
 */
router.get('/same-city', authenticateToken, async (req, res) => {
  try {
    console.log('🏙️  Local books request from user:', req.userId);
    
    const { page = 1, limit = 20, genre, author, title } = req.query;

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

    // Build query
    const bookQuery = { 
      isAvailable: true,
      owner: { $ne: req.userId }
    };

    if (title) bookQuery.title = new RegExp(title, 'i');
    if (genre) {
      const genreArray = genre.split(',').map(g => g.trim()).filter(g => g);
      if (genreArray.length > 0) {
        bookQuery.genre = { $in: genreArray };
      }
    }
    if (author) bookQuery.author = new RegExp(author, 'i');

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
          'owner.city': new RegExp(`^${currentUser.city}$`, 'i'),
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
    console.log(`✅ Found ${books.length} books in ${currentUser.city}`);

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
