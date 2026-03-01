const express = require('express');
const axios = require('axios');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const { authenticateToken } = require('../middleware/auth');
const { applyBookOwnerPrivacy, applyBookOwnerPrivacyToArray } = require('../utils/privacy');
const { uploadSingleImage, uploadBookImages } = require('../middleware/upload');
const { sanitizeInput, sanitizeString } = require('../utils/sanitize');

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

    // Get the highest resolution image available from Google Books
    // Priority: extraLarge > large > medium > small > thumbnail
    let coverImage = null;
    if (bookInfo.imageLinks) {
      coverImage = 
        bookInfo.imageLinks.extraLarge ||
        bookInfo.imageLinks.large ||
        bookInfo.imageLinks.medium ||
        bookInfo.imageLinks.small ||
        bookInfo.imageLinks.thumbnail ||
        null;
      
      // Remove zoom parameter and edge effects to get higher quality
      if (coverImage) {
        coverImage = coverImage
          .replace('&edge=curl', '')  // Remove curl effect
          .replace('zoom=1', 'zoom=0') // Remove zoom restriction
          .replace('http://', 'https://'); // Use HTTPS
      }
    }

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
      thumbnail: coverImage
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
 * @route   GET /api/books/search-external
 * @desc    Search for books using Google Books API globally
 * @access  Public
 */
router.get('/search-external', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Search query is required',
          code: 'QUERY_REQUIRED'
        }
      });
    }

    if (!process.env.GOOGLE_BOOKS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Google Books API is not configured',
          code: 'API_NOT_CONFIGURED'
        }
      });
    }

    const cleanQuery = q.trim();
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&key=${process.env.GOOGLE_BOOKS_API_KEY}&maxResults=10`;

    const response = await axios.get(googleBooksUrl, {
      timeout: 10000
    });

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No books found'
      });
    }

    // Extract book information from the results
    const books = response.data.items.map(item => {
      const bookInfo = item.volumeInfo;
      let isbn = null;
      if (bookInfo.industryIdentifiers) {
        const isbn13 = bookInfo.industryIdentifiers.find(identifier => identifier.type === 'ISBN_13');
        const isbn10 = bookInfo.industryIdentifiers.find(identifier => identifier.type === 'ISBN_10');
        isbn = isbn13 ? isbn13.identifier : (isbn10 ? isbn10.identifier : null);
      }

      // Get the highest resolution image available
      let coverImage = null;
      if (bookInfo.imageLinks) {
        coverImage = 
          bookInfo.imageLinks.extraLarge ||
          bookInfo.imageLinks.large ||
          bookInfo.imageLinks.medium ||
          bookInfo.imageLinks.small ||
          bookInfo.imageLinks.thumbnail ||
          null;
        
        // Remove zoom parameter and edge effects to get higher quality
        if (coverImage) {
          coverImage = coverImage
            .replace('&edge=curl', '')
            .replace('zoom=1', 'zoom=0')
            .replace('http://', 'https://');
        }
      }

      return {
        id: item.id,
        title: bookInfo.title || '',
        author: bookInfo.authors ? bookInfo.authors.join(', ') : '',
        isbn: isbn,
        thumbnail: coverImage,
        publishedDate: bookInfo.publishedDate || null
      };
    });

    res.status(200).json({
      success: true,
      data: books,
      message: 'Books retrieved successfully'
    });

  } catch (error) {
    console.error('External book search error:', error);

    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        error: {
          message: 'Request timeout. Please try again.',
          code: 'REQUEST_TIMEOUT'
        }
      });
    }

    if (error.response && error.response.status === 403) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Google Books API quota exceeded or invalid API key',
          code: 'API_QUOTA_EXCEEDED'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while searching for books',
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
router.post('/', authenticateToken, sanitizeInput, uploadBookImages(), [
  // Validation middleware
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters')
    .customSanitizer(sanitizeString),
  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Author must be between 1 and 200 characters')
    .customSanitizer(sanitizeString),
  body('condition')
    .notEmpty()
    .withMessage('Condition is required')
    .isIn(['New', 'Like New', 'Good', 'Fair', 'Poor'])
    .withMessage('Condition must be one of: New, Like New, Good, Fair, Poor'),
  body('genres')
    .custom((value) => {
      // Parse JSON string if it's a string
      const genres = typeof value === 'string' ? JSON.parse(value) : value;
      if (!Array.isArray(genres) || genres.length === 0) {
        throw new Error('At least one genre is required');
      }
      if (genres.some(g => typeof g !== 'string' || g.trim().length === 0)) {
        throw new Error('All genres must be non-empty strings');
      }
      if (genres.some(g => g.length > 100)) {
        throw new Error('Each genre must not exceed 100 characters');
      }
      return true;
    }),
  body('isbn')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('ISBN must not exceed 20 characters')
    .customSanitizer(sanitizeString),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters')
    .customSanitizer(sanitizeString),
  body('publicationYear')
    .optional({ checkFalsy: true })
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage(`Publication year must be between 1000 and ${new Date().getFullYear() + 1}`),
  body('publisher')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Publisher must not exceed 200 characters')
    .customSanitizer(sanitizeString),
  body('googleBooksImageUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Google Books image URL must be a valid URL')
], (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    
    // Check if it's a missing field error
    if (firstError.msg.includes('required')) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide all required fields: title, author, condition, and genres',
          code: 'MISSING_REQUIRED_FIELDS',
          details: errors.array()
        }
      });
    }
    
    return res.status(400).json({
      success: false,
      error: {
        message: firstError.msg,
        code: 'VALIDATION_ERROR',
        details: errors.array()
      }
    });
  }

  // Check if at least one image source is provided
  const { googleBooksImageUrl } = req.body;
  if (!req.frontImageUrl && !req.backImageUrl && !googleBooksImageUrl) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'At least one image is required. Please upload front/back images or use ISBN lookup.',
        code: 'IMAGE_REQUIRED'
      }
    });
  }

  next();
}, async (req, res) => {
  try {
    const { title, author, condition, genres, isbn, description, publicationYear, publisher, googleBooksImageUrl } = req.body;

    // Parse genres if it's a JSON string
    const genresArray = typeof genres === 'string' ? JSON.parse(genres) : genres;
    
    // Sanitize each genre
    const sanitizedGenres = genresArray.map(g => sanitizeString(g.trim()));

    // Determine primary image URL (prefer front, then Google Books, then back)
    const imageUrl = req.frontImageUrl || googleBooksImageUrl || req.backImageUrl;

    // Create new book listing with sanitized data
    const bookData = {
      owner: req.userId,
      title: sanitizeString(title.trim()),
      author: sanitizeString(author.trim()),
      condition,
      genre: sanitizedGenres,
      imageUrl: imageUrl,
      googleBooksImageUrl: googleBooksImageUrl || null,
      frontImageUrl: req.frontImageUrl || null,
      backImageUrl: req.backImageUrl || null,
      isAvailable: true
    };

    // Add optional fields if provided (with sanitization)
    if (isbn && isbn.trim()) bookData.isbn = sanitizeString(isbn.trim());
    if (description && description.trim()) bookData.description = sanitizeString(description.trim());
    if (publicationYear) bookData.publicationYear = parseInt(publicationYear);
    if (publisher && publisher.trim()) bookData.publisher = sanitizeString(publisher.trim());

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
    const { page = 1, limit = 20, city, genre, author, title } = req.query;

    // Build query object
    const query = { isAvailable: true };

    // Add filters if provided
    if (title) {
      query.title = new RegExp(title, 'i'); // Case-insensitive partial match
    }
    if (genre) {
      query.genre = genre; // Match if genre is in the array (MongoDB handles this automatically)
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

/**
 * @route   PUT /api/books/:id
 * @desc    Update book listing (owner only)
 * @access  Private (requires authentication and ownership)
 */
router.put('/:id', authenticateToken, sanitizeInput, uploadBookImages(), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, condition, genres, isbn, description, publicationYear, publisher, googleBooksImageUrl } = req.body;

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

    // Find the book first
    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Book not found',
          code: 'BOOK_NOT_FOUND'
        }
      });
    }

    // Verify that the authenticated user is the book owner
    if (book.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You can only update your own book listings',
          code: 'UNAUTHORIZED_UPDATE'
        }
      });
    }

    // Validate required fields if provided
    if (title !== undefined && (!title || title.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Title cannot be empty',
          code: 'INVALID_TITLE'
        }
      });
    }

    if (author !== undefined && (!author || author.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Author cannot be empty',
          code: 'INVALID_AUTHOR'
        }
      });
    }

    if (genres !== undefined) {
      const genresArray = typeof genres === 'string' ? JSON.parse(genres) : genres;
      if (!Array.isArray(genresArray) || genresArray.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'At least one genre is required',
            code: 'INVALID_GENRE'
          }
        });
      }
      if (genresArray.some(g => typeof g !== 'string' || g.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'All genres must be non-empty strings',
            code: 'INVALID_GENRE'
          }
        });
      }
    }

    // Validate condition if provided
    if (condition !== undefined) {
      const validConditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
      if (!validConditions.includes(condition)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Condition must be one of: New, Like New, Good, Fair, Poor',
            code: 'INVALID_CONDITION'
          }
        });
      }
    }

    // Build update object with only provided fields (with sanitization)
    const updateData = {};

    if (title !== undefined) updateData.title = sanitizeString(title.trim());
    if (author !== undefined) updateData.author = sanitizeString(author.trim());
    if (condition !== undefined) updateData.condition = condition;
    if (genres !== undefined) {
      const genresArray = typeof genres === 'string' ? JSON.parse(genres) : genres;
      updateData.genre = genresArray.map(g => sanitizeString(g.trim()));
    }
    if (isbn !== undefined) {
      const trimmedIsbn = isbn.trim();
      updateData.isbn = trimmedIsbn === '' ? null : sanitizeString(trimmedIsbn);
    }
    if (description !== undefined) {
      const trimmedDescription = description.trim();
      updateData.description = trimmedDescription === '' ? null : sanitizeString(trimmedDescription);
    }
    if (publicationYear !== undefined) updateData.publicationYear = publicationYear ? parseInt(publicationYear) : null;
    if (publisher !== undefined) {
      const trimmedPublisher = publisher.trim();
      updateData.publisher = trimmedPublisher === '' ? null : sanitizeString(trimmedPublisher);
    }

    // Update image URLs if new images were uploaded or provided
    if (req.frontImageUrl) {
      updateData.frontImageUrl = req.frontImageUrl;
      // Update primary imageUrl if front image is uploaded
      updateData.imageUrl = req.frontImageUrl;
    }
    if (req.backImageUrl) {
      updateData.backImageUrl = req.backImageUrl;
    }
    if (googleBooksImageUrl !== undefined) {
      updateData.googleBooksImageUrl = googleBooksImageUrl || null;
      // If no front image but Google Books image is provided, use it as primary
      if (!req.frontImageUrl && googleBooksImageUrl) {
        updateData.imageUrl = googleBooksImageUrl;
      }
    }

    // Update the book
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // Return updated document
        runValidators: true // Run schema validation
      }
    ).populate('owner', '-password');

    // Apply privacy settings to owner information
    const bookWithPrivacy = applyBookOwnerPrivacy(updatedBook);

    res.status(200).json({
      success: true,
      data: bookWithPrivacy,
      message: 'Book listing updated successfully'
    });

  } catch (error) {
    console.error('Update book error:', error);

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

    // Handle cast errors (invalid ObjectId, invalid number, etc.)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid data format',
          code: 'INVALID_DATA_FORMAT'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while updating book listing',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete book listing (owner only)
 * @access  Private (requires authentication and ownership)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
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

    // Find the book first
    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Book not found',
          code: 'BOOK_NOT_FOUND'
        }
      });
    }

    // Verify that the authenticated user is the book owner
    if (book.owner.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You can only delete your own book listings',
          code: 'UNAUTHORIZED_DELETE'
        }
      });
    }

    // Check for active trades involving this book (Requirement 5.5)
    const activeTrades = await Trade.find({
      $and: [
        {
          $or: [
            { requestedBook: id },
            { offeredBook: id }
          ]
        },
        {
          status: { $in: ['proposed', 'accepted'] }
        }
      ]
    });

    // If there are active trades, prevent deletion and inform the user
    if (activeTrades.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Cannot delete book listing because it is involved in active trades. Please complete or cancel the trades first.',
          code: 'BOOK_HAS_ACTIVE_TRADES',
          details: {
            activeTradeCount: activeTrades.length,
            tradeIds: activeTrades.map(trade => trade._id)
          }
        }
      });
    }

    // Delete the book document from database
    await Book.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Book listing deleted successfully'
    });

  } catch (error) {
    console.error('Delete book error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while deleting book listing',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;