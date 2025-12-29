const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const Book = require('../models/Book');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/trades
 * @desc    Propose a new trade
 * @access  Private (requires authentication)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { requestedBook, offeredBook } = req.body;

    // Validate required fields
    if (!requestedBook || !offeredBook) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Both requestedBook and offeredBook are required',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Validate book ID formats
    if (!requestedBook.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid requestedBook ID format',
          code: 'INVALID_BOOK_ID'
        }
      });
    }

    if (!offeredBook.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid offeredBook ID format',
          code: 'INVALID_BOOK_ID'
        }
      });
    }

    // Fetch both books to validate they exist
    const [requestedBookDoc, offeredBookDoc] = await Promise.all([
      Book.findById(requestedBook).populate('owner', '-password'),
      Book.findById(offeredBook).populate('owner', '-password')
    ]);

    // Validate that both books exist
    if (!requestedBookDoc) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Requested book not found',
          code: 'REQUESTED_BOOK_NOT_FOUND'
        }
      });
    }

    if (!offeredBookDoc) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Offered book not found',
          code: 'OFFERED_BOOK_NOT_FOUND'
        }
      });
    }

    // Validate that authenticated user owns the offered book (Req 8.2)
    if (offeredBookDoc.owner._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You can only offer books that you own',
          code: 'NOT_BOOK_OWNER'
        }
      });
    }

    // Validate that authenticated user doesn't own the requested book (Req 8.4)
    if (requestedBookDoc.owner._id.toString() === req.userId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'You cannot request your own book',
          code: 'CANNOT_REQUEST_OWN_BOOK'
        }
      });
    }

    // Validate that both books are available
    if (!requestedBookDoc.isAvailable) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Requested book is not available for trade',
          code: 'REQUESTED_BOOK_UNAVAILABLE'
        }
      });
    }

    if (!offeredBookDoc.isAvailable) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Offered book is not available for trade',
          code: 'OFFERED_BOOK_UNAVAILABLE'
        }
      });
    }

    // Create trade document with status "proposed"
    const trade = new Trade({
      proposer: req.userId,
      receiver: requestedBookDoc.owner._id,
      requestedBook: requestedBook,
      offeredBook: offeredBook,
      status: 'proposed',
      proposedAt: new Date()
    });

    await trade.save();

    // Populate book and user data for response
    await trade.populate([
      {
        path: 'proposer',
        select: '-password'
      },
      {
        path: 'receiver',
        select: '-password'
      },
      {
        path: 'requestedBook'
      },
      {
        path: 'offeredBook'
      }
    ]);

    res.status(201).json({
      success: true,
      data: trade,
      message: 'Trade proposal created successfully'
    });

  } catch (error) {
    console.error('Create trade error:', error);

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
        message: 'An error occurred while creating trade proposal',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;
