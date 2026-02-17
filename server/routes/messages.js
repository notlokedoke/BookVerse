const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Trade = require('../models/Trade');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeInput, sanitizeString } = require('../utils/sanitize');

/**
 * @route   POST /api/messages
 * @desc    Send a message in a trade chat
 * @access  Private (requires authentication)
 */
router.post('/', [
  authenticateToken,
  sanitizeInput,
  body('trade')
    .trim()
    .notEmpty()
    .withMessage('Trade ID is required')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid trade ID format'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters')
    .customSanitizer(sanitizeString)
], async (req, res) => {
  try {
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

    const { trade, content } = req.body;

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

/**
 * @route   GET /api/messages/trade/:tradeId
 * @desc    Get all messages for a trade
 * @access  Private (requires authentication)
 */
router.get('/trade/:tradeId', [
  authenticateToken,
  param('tradeId')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid trade ID format')
], async (req, res) => {
  try {
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

    const { tradeId } = req.params;

    // Fetch trade to validate it exists and user is part of it
    const tradeDoc = await Trade.findById(tradeId);

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
    const isProposer = tradeDoc.proposer.toString() === req.userId;
    const isReceiver = tradeDoc.receiver.toString() === req.userId;

    if (!isProposer && !isReceiver) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You are not authorized to view messages for this trade',
          code: 'NOT_AUTHORIZED'
        }
      });
    }

    // Fetch all messages for the trade
    const messages = await Message.find({ trade: tradeId })
      .populate('sender', '-password')
      .sort({ createdAt: 1 }); // Sort by createdAt ascending (chronological order)

    res.status(200).json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Get trade messages error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching messages',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;
