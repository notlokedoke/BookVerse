const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Trade = require('../models/Trade');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/ratings/trade/:tradeId
 * @desc    Get rating for a specific trade by the authenticated user
 * @access  Private (requires authentication)
 */
router.get('/trade/:tradeId', authenticateToken, async (req, res) => {
  try {
    const { tradeId } = req.params;

    // Validate trade ID format
    if (!tradeId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid trade ID format',
          code: 'INVALID_TRADE_ID'
        }
      });
    }

    // Find rating by trade and authenticated user
    const rating = await Rating.findOne({
      trade: tradeId,
      rater: req.userId
    })
      .populate('rater', '-password')
      .populate('ratedUser', '-password')
      .populate('trade');

    if (!rating) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Rating not found',
          code: 'RATING_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: rating
    });

  } catch (error) {
    console.error('Get rating error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching the rating',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   POST /api/ratings
 * @desc    Submit a rating for a completed trade
 * @access  Private (requires authentication)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { trade: tradeId, stars, comment } = req.body;

    // Validate required fields
    if (!tradeId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Trade ID is required',
          code: 'MISSING_TRADE_ID'
        }
      });
    }

    if (stars === undefined || stars === null || stars === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Stars rating is required',
          code: 'MISSING_STARS'
        }
      });
    }

    // Validate stars is a number between 1 and 5
    const starsNum = Number(stars);
    if (isNaN(starsNum) || starsNum < 1 || starsNum > 5) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Stars must be a number between 1 and 5',
          code: 'INVALID_STARS'
        }
      });
    }

    // Validate stars is an integer
    if (!Number.isInteger(starsNum)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Stars must be an integer value',
          code: 'INVALID_STARS'
        }
      });
    }

    // Validate comment is required for stars <= 3
    if (starsNum <= 3 && (!comment || comment.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Comment is required for ratings of 3 stars or lower',
          code: 'COMMENT_REQUIRED'
        }
      });
    }

    // Validate trade ID format
    if (!tradeId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid trade ID format',
          code: 'INVALID_TRADE_ID'
        }
      });
    }

    // Fetch trade with populated references
    const trade = await Trade.findById(tradeId)
      .populate('proposer', '-password')
      .populate('receiver', '-password');

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

    // Validate that trade status is "completed"
    if (trade.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot rate trade with status "${trade.status}". Only completed trades can be rated.`,
          code: 'TRADE_NOT_COMPLETED'
        }
      });
    }

    // Validate that authenticated user is part of the trade (proposer or receiver)
    const isProposer = trade.proposer._id.toString() === req.userId;
    const isReceiver = trade.receiver._id.toString() === req.userId;

    if (!isProposer && !isReceiver) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You can only rate trades you are part of',
          code: 'NOT_AUTHORIZED'
        }
      });
    }

    // Check if user has already rated this trade
    const existingRating = await Rating.findOne({
      trade: tradeId,
      rater: req.userId
    });

    if (existingRating) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'You have already rated this trade',
          code: 'DUPLICATE_RATING'
        }
      });
    }

    // Determine the ratedUser (the other party in the trade)
    const ratedUserId = isProposer ? trade.receiver._id : trade.proposer._id;

    // Create rating document
    const rating = new Rating({
      trade: tradeId,
      rater: req.userId,
      ratedUser: ratedUserId,
      stars: starsNum,
      comment: comment ? comment.trim() : undefined
    });

    await rating.save();

    // Calculate and update the rated user's average rating
    // Fetch all ratings for the rated user
    const allRatings = await Rating.find({ ratedUser: ratedUserId });
    
    // Calculate the new average rating
    const totalStars = allRatings.reduce((sum, r) => sum + r.stars, 0);
    const ratingCount = allRatings.length;
    const averageRating = ratingCount > 0 ? totalStars / ratingCount : 0;
    
    // Update the rated user's averageRating and ratingCount fields
    await User.findByIdAndUpdate(
      ratedUserId,
      {
        averageRating: averageRating,
        ratingCount: ratingCount
      },
      { new: true }
    );

    // Populate the rating for response
    await rating.populate([
      {
        path: 'rater',
        select: '-password'
      },
      {
        path: 'ratedUser',
        select: '-password'
      },
      {
        path: 'trade'
      }
    ]);

    res.status(201).json({
      success: true,
      data: rating,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Submit rating error:', error);

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

    // Handle duplicate key error (compound unique index)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'You have already rated this trade',
          code: 'DUPLICATE_RATING'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while submitting the rating',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;
