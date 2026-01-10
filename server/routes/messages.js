const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Trade = require('../models/Trade');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/messages
 * @desc    Send a message in a trade chat
 * @access  Private (requires authentication)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { trade, content } = req.body;

    // Validate required fields
    if (!trade || !content) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Trade ID and message content are required',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      });
    }

    // Validate trade ID format
    if (!trade.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid trade ID format',
          code: 'INVALID_TRADE_ID'
        }
      });
    }

    // Validate content length
    if (content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message content cannot be empty',
          code: 'EMPTY_CONTENT'
        }
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message content cannot exceed 1000 characters',
          code: 'CONTENT_TOO_LONG'
        }
      });
    }

    // Fetch trade to validate it exists and user is part of it
    const tradeDoc = await Trade.findById(trade)
      .populate('proposer', '-password')
      .populate('receiver', '-password');

    if (!tradeDoc) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Trade not found',
          code: 'TRADE_NOT_FOUND'
        }
      });
    }

    // Validate that authenticated user is part of the trade (proposer or receiver)
    const isProposer = tradeDoc.proposer._id.toString() === req.userId;
    const isReceiver = tradeDoc.receiver._id.toString() === req.userId;

    if (!isProposer && !isReceiver) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You are not authorized to send messages in this trade',
          code: 'NOT_AUTHORIZED'
        }
      });
    }

    // Validate that trade status is "accepted" (messaging only allowed for accepted trades)
    if (tradeDoc.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Messages can only be sent for accepted trades',
          code: 'INVALID_TRADE_STATUS'
        }
      });
    }

    // Create message document with sender as authenticated user
    const message = new Message({
      trade: trade,
      sender: req.userId,
      content: content.trim()
    });

    await message.save();

    // Populate sender information for response
    await message.populate('sender', '-password');

    // Determine recipient (the other party in the trade)
    const recipientId = isProposer ? tradeDoc.receiver._id : tradeDoc.proposer._id;

    // Create notification for the recipient
    try {
      const notification = new Notification({
        recipient: recipientId,
        type: 'new_message',
        relatedTrade: trade,
        relatedUser: req.userId,
        message: `${message.sender.name} sent you a message in your trade`
      });
      await notification.save();
    } catch (notificationError) {
      // Log notification error but don't fail the message creation
      console.error('Failed to create notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send message error:', error);

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
        message: 'An error occurred while sending the message',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;
