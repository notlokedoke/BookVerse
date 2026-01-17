const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Wishlist = require('../models/Wishlist');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeInput, sanitizeString } = require('../utils/sanitize');

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
    .customSanitizer(sanitizeString)
], async (req, res) => {
  try {
    const { title, author, isbn, notes } = req.body;

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

    // Add optional fields if provided
    if (author && author.trim()) {
      wishlistData.author = author.trim();
    }
    if (isbn && isbn.trim()) {
      wishlistData.isbn = isbn.trim();
    }
    if (notes && notes.trim()) {
      wishlistData.notes = notes.trim();
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

module.exports = router;