const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const Book = require('../models/Book');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/trades
 * @desc    Get user's trades (where user is either proposer or receiver)
 * @access  Private (requires authentication)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;

    // Build query to find trades where user is either proposer or receiver
    const query = {
      $or: [
        { proposer: req.userId },
        { receiver: req.userId }
      ]
    };

    // Add optional status filter if provided
    if (status) {
      // Validate status value
      const validStatuses = ['proposed', 'accepted', 'declined', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid status value. Must be one of: proposed, accepted, declined, completed',
            code: 'INVALID_STATUS'
          }
        });
      }
      query.status = status;
    }

    // Fetch trades with populated references, sorted by creation date descending
    const trades = await Trade.find(query)
      .populate({
        path: 'proposer',
        select: '-password'
      })
      .populate({
        path: 'receiver',
        select: '-password'
      })
      .populate({
        path: 'requestedBook',
        populate: {
          path: 'owner',
          select: '-password'
        }
      })
      .populate({
        path: 'offeredBook',
        populate: {
          path: 'owner',
          select: '-password'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: trades,
      count: trades.length
    });

  } catch (error) {
    console.error('Get trades error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching trades',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

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

    // Create notification for the receiver (Req 8.3)
    try {
      const notification = new Notification({
        recipient: requestedBookDoc.owner._id,
        type: 'trade_request',
        relatedTrade: trade._id,
        relatedUser: req.userId,
        message: `${trade.proposer.name} proposed a trade for your book "${requestedBookDoc.title}"`
      });
      await notification.save();
    } catch (notificationError) {
      // Log notification error but don't fail the trade creation
      console.error('Failed to create notification:', notificationError);
    }

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

/**
 * @route   PUT /api/trades/:id/accept
 * @desc    Accept a trade proposal
 * @access  Private (requires authentication, receiver only)
 */
router.put('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate trade ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid trade ID format',
          code: 'INVALID_TRADE_ID'
        }
      });
    }

    // Fetch trade with populated references
    const trade = await Trade.findById(id)
      .populate('proposer', '-password')
      .populate('receiver', '-password')
      .populate('requestedBook')
      .populate('offeredBook');

    // Validate that trade exists
    if (!trade) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Trade not found',
          code: 'TRADE_NOT_FOUND'
        }
      });
    }

    // Validate that authenticated user is the receiver (Req 9.4)
    if (trade.receiver._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only the receiver can accept this trade',
          code: 'NOT_AUTHORIZED'
        }
      });
    }

    // Validate that trade status is "proposed"
    if (trade.status !== 'proposed') {
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot accept trade with status "${trade.status}". Only proposed trades can be accepted.`,
          code: 'INVALID_TRADE_STATUS'
        }
      });
    }

    // Update trade status to "accepted" and set respondedAt timestamp
    trade.status = 'accepted';
    trade.respondedAt = new Date();
    await trade.save();

    // Create notification for the proposer (Req 9.3)
    try {
      const notification = new Notification({
        recipient: trade.proposer._id,
        type: 'trade_accepted',
        relatedTrade: trade._id,
        relatedUser: req.userId,
        message: `${trade.receiver.name} accepted your trade proposal for "${trade.requestedBook.title}"`
      });
      await notification.save();
    } catch (notificationError) {
      // Log notification error but don't fail the trade acceptance
      console.error('Failed to create notification:', notificationError);
    }

    res.status(200).json({
      success: true,
      data: trade,
      message: 'Trade accepted successfully. You can now communicate with the other user.'
    });

  } catch (error) {
    console.error('Accept trade error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while accepting the trade',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   PUT /api/trades/:id/decline
 * @desc    Decline a trade proposal
 * @access  Private (requires authentication, receiver only)
 */
router.put('/:id/decline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate trade ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid trade ID format',
          code: 'INVALID_TRADE_ID'
        }
      });
    }

    // Fetch trade with populated references
    const trade = await Trade.findById(id)
      .populate('proposer', '-password')
      .populate('receiver', '-password')
      .populate('requestedBook')
      .populate('offeredBook');

    // Validate that trade exists
    if (!trade) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Trade not found',
          code: 'TRADE_NOT_FOUND'
        }
      });
    }

    // Validate that authenticated user is the receiver (Req 9.4)
    if (trade.receiver._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only the receiver can decline this trade',
          code: 'NOT_AUTHORIZED'
        }
      });
    }

    // Validate that trade status is "proposed"
    if (trade.status !== 'proposed') {
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot decline trade with status "${trade.status}". Only proposed trades can be declined.`,
          code: 'INVALID_TRADE_STATUS'
        }
      });
    }

    // Update trade status to "declined" and set respondedAt timestamp
    trade.status = 'declined';
    trade.respondedAt = new Date();
    await trade.save();

    // Create notification for the proposer (Req 9.3)
    try {
      const notification = new Notification({
        recipient: trade.proposer._id,
        type: 'trade_declined',
        relatedTrade: trade._id,
        relatedUser: req.userId,
        message: `${trade.receiver.name} declined your trade proposal for "${trade.requestedBook.title}"`
      });
      await notification.save();
    } catch (notificationError) {
      // Log notification error but don't fail the trade decline
      console.error('Failed to create notification:', notificationError);
    }

    res.status(200).json({
      success: true,
      data: trade,
      message: 'Trade declined successfully'
    });

  } catch (error) {
    console.error('Decline trade error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while declining the trade',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;
