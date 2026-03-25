const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const Wishlist = require('../models/Wishlist');
const Book = require('../models/Book');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeInput, sanitizeString } = require('../utils/sanitize');
const { getCoverImage } = require('../utils/bookLookup');

/**
 * @route   POST /api/wishlist
 * @desc    Add book to user's wishlist
 * @access  Private (requires authentication)
 */
router.post('/', [
  authenticateToken,
  sanitizeInput,
  // Validation middleware
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .customSanitizer(sanitizeString),
  body('author')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Author must be less than 200 characters')
    .customSanitizer(sanitizeString),
  body('isbn')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('ISBN must be less than 20 characters')
    .customSanitizer(sanitizeString),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
    .customSanitizer(sanitizeString),
  body('imageUrl')
    .optional()
    .trim(),
  body('sourceBook')
    .optional()
    .trim()
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid source book ID format'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    const { title, author, isbn, notes, imageUrl, sourceBook, priority, isPublic } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: errors.array()[0].msg,
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
    }

    // Check for duplicate entries (same user and ISBN) if ISBN is provided
    if (isbn && isbn.trim()) {
      const existingWishlistItem = await Wishlist.findOne({
        user: req.userId,
        isbn: isbn.trim()
      });

      if (existingWishlistItem) {
        return res.status(409).json({
          success: false,
          error: {
            message: 'This book is already in your wishlist',
            code: 'DUPLICATE_WISHLIST_ITEM'
          }
        });
      }
    }

    // Create wishlist document linked to authenticated user
    const wishlistData = {
      user: req.userId,
      title: title.trim()
    };

    // Add optional fields if provided (only add if they have actual values)
    if (author && author.trim()) {
      wishlistData.author = author.trim();
    }
    if (isbn && isbn.trim()) {
      wishlistData.isbn = isbn.trim();
      
      // Try to fetch book cover using hybrid lookup (Google Books primary, Open Library fallback)
      if (!imageUrl || !imageUrl.trim()) {
        try {
          const cleanIsbn = isbn.replace(/[-\s]/g, '');
          const coverImage = await getCoverImage(cleanIsbn);
          
          if (coverImage) {
            wishlistData.imageUrl = coverImage;
          }
        } catch (error) {
          // Silently fail - image is optional
          console.log('Could not fetch book image:', error.message);
        }
      }
    }
    // If no ISBN, explicitly don't include it in the data (not even as undefined)
    
    if (notes && notes.trim()) {
      wishlistData.notes = notes.trim();
    }
    if (imageUrl && imageUrl.trim()) {
      wishlistData.imageUrl = imageUrl.trim();
    }
    if (sourceBook && sourceBook.trim()) {
      wishlistData.sourceBook = sourceBook.trim();
    }
    if (priority) {
      wishlistData.priority = priority;
    }
    if (typeof isPublic === 'boolean') {
      wishlistData.isPublic = isPublic;
    }

    const wishlistItem = new Wishlist(wishlistData);
    await wishlistItem.save();

    // Populate user information for response (excluding password)
    await wishlistItem.populate('user', '-password');

    res.status(201).json({
      success: true,
      data: wishlistItem,
      message: 'Book added to wishlist successfully'
    });

  } catch (error) {
    console.error('Add to wishlist error:', error);

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

    // Handle duplicate key error (user + isbn combination)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'This book is already in your wishlist',
          code: 'DUPLICATE_WISHLIST_ITEM'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while adding book to wishlist',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   GET /api/wishlist/check/:bookId
 * @desc    Check if a book is in user's wishlist
 * @access  Private (requires authentication)
 */
router.get('/check/:bookId', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.params;

    // Validate bookId format
    if (!bookId || !bookId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid book ID format',
          code: 'INVALID_BOOK_ID'
        }
      });
    }

    // Check if book is in wishlist
    const wishlistItem = await Wishlist.findOne({
      user: req.userId,
      sourceBook: bookId
    });

    res.json({
      success: true,
      data: {
        inWishlist: !!wishlistItem,
        wishlistItem: wishlistItem || null
      }
    });

  } catch (error) {
    console.error('Check wishlist error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while checking wishlist',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   GET /api/wishlist
 * @desc    Get all wishlist items for authenticated user
 * @access  Private (requires authentication)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Fetch all wishlist items for authenticated user
    // Sort by creation date descending (newest first)
    const wishlistItems = await Wishlist.find({ user: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: wishlistItems,
      count: wishlistItems.length
    });

  } catch (error) {
    console.error('Get wishlist error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching wishlist',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   GET /api/wishlist/user/:userId/public
 * @desc    Get public wishlist items for specified user
 * @access  Public
 */
router.get('/user/:userId/public', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid user ID format',
          code: 'INVALID_USER_ID'
        }
      });
    }

    // Fetch only public wishlist items for specified user
    const wishlistItems = await Wishlist.find({ 
      user: userId,
      isPublic: true,
      fulfilledBy: null // Don't show fulfilled items
    })
      .populate('user', 'name city averageRating ratingCount privacySettings')
      .sort({ priority: -1, createdAt: -1 }); // Sort by priority first, then date

    res.json({
      success: true,
      data: wishlistItems,
      count: wishlistItems.length
    });

  } catch (error) {
    console.error('Get public wishlist error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching public wishlist',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   GET /api/wishlist/user/:userId
 * @desc    Get all wishlist items for specified user
 * @access  Public
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid user ID format',
          code: 'INVALID_USER_ID'
        }
      });
    }

    // Fetch all wishlist items for specified user
    // Sort by creation date descending (newest first)
    const wishlistItems = await Wishlist.find({ user: userId })
      .populate('user', 'name city averageRating ratingCount privacySettings')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: wishlistItems,
      count: wishlistItems.length
    });

  } catch (error) {
    console.error('Get user wishlist error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching wishlist',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   GET /api/wishlist/matches
 * @desc    Find books that match the authenticated user's wishlist
 * @access  Private (requires authentication)
 */
router.get('/matches', authenticateToken, async (req, res) => {
  try {
    // Get user's wishlist
    const wishlistItems = await Wishlist.find({ user: req.userId });

    if (wishlistItems.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No wishlist items to match'
      });
    }

    const matches = [];

    // For each wishlist item, find matching books
    for (const wishlistItem of wishlistItems) {
      let matchingBooks = [];

      // Level 1: Exact ISBN match (most reliable)
      if (wishlistItem.isbn) {
        const isbnMatches = await Book.find({
          isbn: wishlistItem.isbn,
          isAvailable: true,
          owner: { $ne: req.userId } // Exclude user's own books
        })
          .populate('owner', 'name city averageRating ratingCount privacySettings')
          .limit(10);

        matchingBooks = isbnMatches.map(book => ({
          ...book.toObject(),
          matchType: 'exact',
          matchScore: 100
        }));
      }

      // Level 2: Title + Author match (strong match)
      if (matchingBooks.length === 0 && wishlistItem.author) {
        const titleAuthorMatches = await Book.find({
          title: new RegExp(`^${escapeRegex(wishlistItem.title)}$`, 'i'),
          author: new RegExp(`^${escapeRegex(wishlistItem.author)}$`, 'i'),
          isAvailable: true,
          owner: { $ne: req.userId }
        })
          .populate('owner', 'name city averageRating ratingCount privacySettings')
          .limit(10);

        matchingBooks = titleAuthorMatches.map(book => ({
          ...book.toObject(),
          matchType: 'strong',
          matchScore: 90
        }));
      }

      // Level 3: Fuzzy title match (helpful but less precise)
      if (matchingBooks.length === 0) {
        const fuzzyMatches = await Book.find({
          title: new RegExp(escapeRegex(wishlistItem.title), 'i'),
          isAvailable: true,
          owner: { $ne: req.userId }
        })
          .populate('owner', 'name city averageRating ratingCount privacySettings')
          .limit(10);

        matchingBooks = fuzzyMatches.map(book => {
          const similarity = calculateTitleSimilarity(
            wishlistItem.title.toLowerCase(),
            book.title.toLowerCase()
          );
          return {
            ...book.toObject(),
            matchType: 'fuzzy',
            matchScore: Math.round(similarity * 100)
          };
        }).filter(book => book.matchScore >= 60); // Only include 60%+ matches
      }

      if (matchingBooks.length > 0) {
        matches.push({
          wishlistItem: wishlistItem.toObject(),
          matches: matchingBooks
        });
      }
    }

    res.json({
      success: true,
      data: matches,
      count: matches.length,
      message: matches.length > 0
        ? `Found ${matches.length} wishlist item(s) with available matches`
        : 'No matches found for your wishlist items'
    });

  } catch (error) {
    console.error('Get wishlist matches error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while finding wishlist matches',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   DELETE /api/wishlist/:id
 * @desc    Remove book from user's wishlist
 * @access  Private (requires authentication)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate wishlist item ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid wishlist item ID format',
          code: 'INVALID_WISHLIST_ID'
        }
      });
    }

    // Find the wishlist item
    const wishlistItem = await Wishlist.findById(id);

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Wishlist item not found',
          code: 'WISHLIST_ITEM_NOT_FOUND'
        }
      });
    }

    // Verify that authenticated user owns the wishlist item
    if (wishlistItem.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You can only remove your own wishlist items',
          code: 'UNAUTHORIZED_WISHLIST_ACCESS'
        }
      });
    }

    // Delete wishlist document from database
    await Wishlist.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Book removed from wishlist successfully'
    });

  } catch (error) {
    console.error('Remove from wishlist error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while removing book from wishlist',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// Helper function to escape special regex characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to calculate title similarity (Levenshtein distance based)
function calculateTitleSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Calculate Levenshtein distance
function getEditDistance(str1, str2) {
  const costs = [];
  for (let i = 0; i <= str1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= str2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[str2.length] = lastValue;
  }
  return costs[str2.length];
}

/**
 * @route   POST /api/wishlist/backfill-images
 * @desc    Backfill missing images for wishlist items with ISBN
 * @access  Private (requires authentication)
 */
router.post('/backfill-images', authenticateToken, async (req, res) => {
  try {
    // Find all wishlist items for this user that have ISBN but no imageUrl
    const wishlistItems = await Wishlist.find({
      user: req.userId,
      isbn: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: '' }
      ]
    });

    let updatedCount = 0;
    let failedCount = 0;

    // Process each item
    for (const item of wishlistItems) {
      try {
        const cleanIsbn = item.isbn.replace(/[-\s]/g, '');
        const coverImage = await getCoverImage(cleanIsbn);
        
        if (coverImage) {
          item.imageUrl = coverImage;
          await item.save();
          updatedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Failed to fetch image for ISBN ${item.isbn}:`, error.message);
        failedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Backfill complete: ${updatedCount} images added, ${failedCount} failed`,
      data: {
        total: wishlistItems.length,
        updated: updatedCount,
        failed: failedCount
      }
    });

  } catch (error) {
    console.error('Backfill images error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while backfilling images',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;

