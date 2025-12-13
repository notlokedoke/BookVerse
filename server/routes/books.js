const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { authenticateToken } = require('../middleware/auth');
const { applyBookOwnerPrivacy, applyBookOwnerPrivacyToArray } = require('../utils/privacy');

/**
 * @route   GET /api/books/:id
 * @desc    Get single book by ID with owner information (respecting privacy settings)
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate book ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid book ID format',
          code: 'INVALID_BOOK_ID'
        }
      });
    }

    // Find book by ID and populate owner information
    const book = await Book.findById(id)
      .populate('owner', '-password') // Populate owner but exclude password
      .exec();

    if (!book) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Book not found',
          code: 'BOOK_NOT_FOUND'
        }
      });
    }

    // Apply privacy settings to owner information
    const bookWithPrivacy = applyBookOwnerPrivacy(book);

    res.status(200).json({
      success: true,
      data: bookWithPrivacy
    });

  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching book',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   GET /api/books
 * @desc    Get all books with owner information (respecting privacy settings)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, city, genre, author } = req.query;

    // Build query object
    const query = { isAvailable: true };

    // Add filters if provided
    if (genre) {
      query.genre = new RegExp(genre, 'i'); // Case-insensitive match
    }
    if (author) {
      query.author = new RegExp(author, 'i'); // Case-insensitive partial match
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Base aggregation pipeline
    let pipeline = [
      { $match: query },
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
          'owner.password': 0 // Exclude password from owner data
        }
      }
    ];

    // Add city filter if provided (only for users who allow city visibility)
    if (city) {
      pipeline.push({
        $match: {
          $and: [
            { 'owner.city': new RegExp(city, 'i') },
            {
              $or: [
                { 'owner.privacySettings.showCity': { $ne: false } },
                { 'owner.privacySettings.showCity': { $exists: false } }
              ]
            }
          ]
        }
      });
    }

    // Add sorting and pagination
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    // Execute aggregation
    const books = await Book.aggregate(pipeline);

    // Get total count for pagination (without limit/skip)
    const countPipeline = pipeline.slice(0, -2); // Remove skip and limit
    countPipeline.push({ $count: 'total' });
    const countResult = await Book.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Apply privacy settings to all books
    const booksWithPrivacy = applyBookOwnerPrivacyToArray(books);

    res.status(200).json({
      success: true,
      data: {
        books: booksWithPrivacy,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBooks: total,
          hasNextPage: skip + books.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching books',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   GET /api/books/user/:userId
 * @desc    Get books owned by a specific user (respecting privacy settings)
 * @access  Public
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate user ID format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid user ID format',
          code: 'INVALID_USER_ID'
        }
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find books owned by the user and populate owner information
    const books = await Book.find({ 
      owner: userId, 
      isAvailable: true 
    })
      .populate('owner', '-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // Get total count for pagination
    const total = await Book.countDocuments({ 
      owner: userId, 
      isAvailable: true 
    });

    // Apply privacy settings to all books
    const booksWithPrivacy = applyBookOwnerPrivacyToArray(books);

    res.status(200).json({
      success: true,
      data: {
        books: booksWithPrivacy,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBooks: total,
          hasNextPage: skip + books.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user books error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching user books',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;