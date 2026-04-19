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
const { bookLookup } = require('../utils/bookLookup');

/**
 * @route   GET /api/books/proxy-image
 * @desc    Proxy external book cover images to avoid CORS issues
 * @access  Public
 */
router.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: { message: 'Image URL is required' }
      });
    }

    // Validate that it's a book cover URL from trusted sources
    const allowedDomains = [
      'books.google.com',
      'covers.openlibrary.org',
      'books.googleusercontent.com'
    ];

    let imageUrl;
    try {
      imageUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid URL format' }
      });
    }

    if (!allowedDomains.some(domain => imageUrl.hostname.includes(domain))) {
      return res.status(403).json({
        success: false,
        error: { message: 'Image source not allowed' }
      });
    }

    // Fetch the image
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
      }
    });

    // Set appropriate headers
    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.set('Access-Control-Allow-Origin', '*'); // Allow CORS
    res.send(response.data);

  } catch (error) {
    console.error('Image proxy error:', error.message);
    
    // Return a placeholder or error response
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch image' }
    });
  }
});

/**
 * @route   POST /api/books/isbn/:isbn
 * @desc    Lookup book data using Open Library
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

    // Use Open Library for book lookup
    const result = await bookLookup(cleanIsbn);

    if (result.success && result.data) {
      return res.status(200).json({
        success: true,
        data: result.data,
        message: 'Book data retrieved from Open Library'
      });
    }

    // No book found
    return res.status(404).json({
      success: false,
      error: {
        message: result.message || 'No book found with this ISBN',
        code: 'BOOK_NOT_FOUND'
      }
    });

  } catch (error) {
    console.error('ISBN lookup error:', error);

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
 * @desc    Search for books using Open Library API globally
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

    const cleanQuery = q.trim();
    // Add language filter for English books only
    const openLibraryUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(cleanQuery)}&language=eng&limit=10`;

    const response = await axios.get(openLibraryUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'BookVerse/1.0 (Book Trading Platform)'
      }
    });

    if (!response.data.docs || response.data.docs.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No books found'
      });
    }

    // Extract book information from Open Library results
    const books = response.data.docs.map(doc => {
      // Get ISBN (prefer ISBN-13, fallback to ISBN-10)
      let isbn = null;
      if (doc.isbn && doc.isbn.length > 0) {
        const isbn13 = doc.isbn.find(i => i.length === 13);
        const isbn10 = doc.isbn.find(i => i.length === 10);
        isbn = isbn13 || isbn10 || doc.isbn[0];
      }

      // Get cover image from Open Library
      let coverImage = null;
      if (doc.cover_i) {
        // Use Open Library's cover API - Large size (L)
        coverImage = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      } else if (isbn) {
        // Fallback to ISBN-based cover
        coverImage = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
      }

      // Get author names
      const author = doc.author_name ? doc.author_name.join(', ') : '';

      // Get publication year
      const publishedDate = doc.first_publish_year ? doc.first_publish_year.toString() : null;

      return {
        id: doc.key || doc.cover_edition_key || `ol-${Date.now()}-${Math.random()}`,
        title: doc.title || '',
        author: author,
        isbn: isbn,
        thumbnail: coverImage,
        publishedDate: publishedDate
      };
    });

    res.status(200).json({
      success: true,
      data: books,
      message: 'Books retrieved successfully from Open Library'
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

    if (error.response && error.response.status === 429) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Too many requests to Open Library. Please try again in a moment.',
          code: 'RATE_LIMIT_EXCEEDED'
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
    .custom((value) => {
      if (!value) return true;
      
      // Simple validation - just check if it looks like a URL
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return true;
      }
      throw new Error('Google Books image URL must be a valid URL');
    })
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

    // Determine primary image URL (prefer Google Books cover, then front upload, then back)
    const imageUrl = googleBooksImageUrl || req.frontImageUrl || req.backImageUrl;

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

    // Check for wishlist matches and notify users (Phase 2)
    try {
      const Wishlist = require('../models/Wishlist');
      const Notification = require('../models/Notification');
      
      // Helper function to escape regex special characters
      const escapeRegex = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };

      // Find matching wishlist items
      const matchQuery = {
        user: { $ne: req.userId } // Don't notify the book owner
      };

      // Build OR conditions for matching
      const orConditions = [];
      
      // Exact ISBN match (highest priority)
      if (isbn && isbn.trim()) {
        orConditions.push({ isbn: isbn.trim() });
      }
      
      // Title + Author match
      orConditions.push({
        title: new RegExp(`^${escapeRegex(title.trim())}$`, 'i'),
        author: new RegExp(`^${escapeRegex(author.trim())}$`, 'i')
      });

      if (orConditions.length > 0) {
        matchQuery.$or = orConditions;
        
        const wishlistMatches = await Wishlist.find(matchQuery);

        // Create notifications for users with matching wishlist items
        for (const wishlistItem of wishlistMatches) {
          await Notification.create({
            recipient: wishlistItem.user,
            type: 'wishlist_match',
            relatedUser: req.userId,
            relatedBook: book._id,
            relatedWishlist: wishlistItem._id,
            message: `Great news! "${book.title}" from your wishlist is now available for trade!`
          });
        }

        console.log(`Created ${wishlistMatches.length} wishlist match notifications for book: ${book.title}`);
      }
    } catch (notificationError) {
      // Log error but don't fail the book creation
      console.error('Failed to create wishlist match notifications:', notificationError);
    }

    // Location-based notifications removed - keeping it simple
    // Users will get general wishlist match notifications instead

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

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page

    // Build query object
    const query = { isAvailable: true };

    // Add filters if provided
    if (title) {
      query.title = new RegExp(title, 'i'); // Case-insensitive partial match
    }
    if (genre) {
      // Handle multiple genres (comma-separated)
      const genreArray = genre.split(',').map(g => g.trim()).filter(g => g);
      if (genreArray.length > 0) {
        query.genre = { $in: genreArray }; // Match if any of the genres is in the book's genre array
      }
    }
    if (author) {
      query.author = new RegExp(author, 'i'); // Case-insensitive partial match
    }

    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;

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
      { $limit: limitNum }
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

    // Set cache headers for better performance
    res.set('Cache-Control', 'public, max-age=30'); // Cache for 30 seconds

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
    const { page = 1, limit = 20, includeUnavailable = 'false' } = req.query;

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

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page

    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { owner: userId };
    if (includeUnavailable !== 'true') {
      query.isAvailable = true;
    }

    // Find books owned by the user and populate owner information
    const books = await Book.find(query)
      .populate('owner', '-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean() // Use lean for better performance
      .exec();

    // Get total count for pagination
    const total = await Book.countDocuments(query);

    // Apply privacy settings to all books
    const booksWithPrivacy = applyBookOwnerPrivacyToArray(books);

    // Set cache headers for better performance
    res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute

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
    }
    if (req.backImageUrl) {
      updateData.backImageUrl = req.backImageUrl;
    }
    if (googleBooksImageUrl !== undefined) {
      updateData.googleBooksImageUrl = googleBooksImageUrl || null;
    }
    
    // Determine primary imageUrl: prefer Google Books cover, then front, then back
    if (googleBooksImageUrl) {
      updateData.imageUrl = googleBooksImageUrl;
    } else if (req.frontImageUrl) {
      updateData.imageUrl = req.frontImageUrl;
    } else if (req.backImageUrl && !book.frontImageUrl && !book.googleBooksImageUrl) {
      updateData.imageUrl = req.backImageUrl;
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