const express = require('express');
const axios = require('axios');
const router = express.Router();
const Book = require('../models/Book');
const { authenticateToken } = require('../middleware/auth');
const { applyBookOwnerPrivacy, applyBookOwnerPrivacyToArray } = require('../utils/privacy');
const { uploadSingleImage } = require('../middleware/upload');

/**
 * @route   POST /api/books/isbn/:isbn
 * @desc    Lookup book data from Google Books API by ISBN
 * @access  Public
 */
router.post('/isbn/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;

    // Validate ISBN format (basic validation)
    if (!isbn || isbn.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'ISBN is required',
          code: 'ISBN_REQUIRED'
        }
      });
    }

    // Clean ISBN (remove spaces, hyphens)
    const cleanIsbn = isbn.replace(/[-\s]/g, '');

    // Validate ISBN length (10 or 13 digits)
    if (!/^\d{10}(\d{3})?$/.test(cleanIsbn)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid ISBN format. ISBN must be 10 or 13 digits.',
          code: 'INVALID_ISBN_FORMAT'
        }
      });
    }

    // Check if Google Books API key is configured
    if (!process.env.GOOGLE_BOOKS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Google Books API is not configured',
          code: 'API_NOT_CONFIGURED'
        }
      });
    }

    // Query Google Books API
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${process.env.GOOGLE_BOOKS_API_KEY}`;
    
    const response = await axios.get(googleBooksUrl, {
      timeout: 10000 // 10 second timeout
    });

    // Check if any books were found
    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'No book found with this ISBN',
          code: 'BOOK_NOT_FOUND'
        }
      });
    }

    // Extract book information from the first result
    const bookInfo = response.data.items[0].volumeInfo;
    
    // Format the response data
    const formattedBookData = {
      title: bookInfo.title || '',
      author: bookInfo.authors ? bookInfo.authors.join(', ') : '',
      publisher: bookInfo.publisher || '',
      publicationYear: bookInfo.publishedDate ? 
        parseInt(bookInfo.publishedDate.split('-')[0]) : null,
      isbn: cleanIsbn,
      description: bookInfo.description || '',
      pageCount: bookInfo.pageCount || null,
      categories: bookInfo.categories || [],
      thumbnail: bookInfo.imageLinks?.thumbnail || null
    };

    res.status(200).json({
      success: true,
      data: formattedBookData,
      message: 'Book data retrieved successfully'
    });

  } catch (error) {
    console.error('ISBN lookup error:', error);

    // Handle specific axios errors
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        error: {
          message: 'Request timeout. Please try again.',
          code: 'REQUEST_TIMEOUT'
        }
      });
    }

    if (error.response) {
      // Google Books API returned an error
      if (error.response.status === 403) {
        return res.status(503).json({
          success: false,
          error: {
            message: 'Google Books API quota exceeded or invalid API key',
            code: 'API_QUOTA_EXCEEDED'
          }
        });
      }
      
      if (error.response.status === 400) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid request to Google Books API',
            code: 'INVALID_API_REQUEST'
          }
        });
      }
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Unable to connect to Google Books API. Please try again later.',
          code: 'API_CONNECTION_ERROR'
        }
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while looking up book data',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   POST /api/books
 * @desc    Create new book listing with image upload
 * @access  Private (requires authentication)
 */
router.post('/', authenticateToken, uploadSingleImage('coverImage'), (req, res, next) => {
  // Validate required fields after upload middleware
  const { title, author, condition, genre } = req.body;
  
  if (!title || !author || !condition || !genre) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Missing required fields: title, author, condition, and genre are required',
        code: 'MISSING_REQUIRED_FIELDS'
      }
    });
  }
  
  next();
}, async (req, res) => {
  try {
    const { title, author, condition, genre, isbn, description, publicationYear, publisher } = req.body;

    // Validate that an image was uploaded
    if (!req.imageUrl) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Image is required for book listing',
          code: 'IMAGE_REQUIRED'
        }
      });
    }

    // Create new book listing
    const bookData = {
      owner: req.userId,
      title: title.trim(),
      author: author.trim(),
      condition,
      genre: genre.trim(),
      imageUrl: req.imageUrl,
      isAvailable: true
    };

    // Add optional fields if provided
    if (isbn && isbn.trim()) bookData.isbn = isbn.trim();
    if (description && description.trim()) bookData.description = description.trim();
    if (publicationYear) bookData.publicationYear = parseInt(publicationYear);
    if (publisher && publisher.trim()) bookData.publisher = publisher.trim();

    const book = new Book(bookData);
    await book.save();

    // Populate owner information for response
    await book.populate('owner', '-password');

    // Apply privacy settings to owner information
    const bookWithPrivacy = applyBookOwnerPrivacy(book);

    res.status(201).json({
      success: true,
      data: bookWithPrivacy,
      message: 'Book listing created successfully'
    });

  } catch (error) {
    console.error('Create book error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationErrors
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while creating book listing',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

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