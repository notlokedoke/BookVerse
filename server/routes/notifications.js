const express = require('express');
const router = express.Router();
const { param, query, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for authenticated user (paginated)
 * @access  Private (requires authentication)
 */
router.get('/', [
  authenticateToken,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: errors.array()[0].msg, code: 'VALIDATION_ERROR' }
      });
    }

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;

    // Run both queries in parallel: paginated list + unread count
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.userId })
        .populate('relatedUser', 'name')
        .populate('relatedTrade', '_id status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      // Use countDocuments with the compound index { recipient, isRead }
      Notification.countDocuments({ recipient: req.userId, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        hasMore: notifications.length === limit
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching notifications',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private (requires authentication)
 */
router.put('/:id/read', [
  authenticateToken,
  param('id')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid notification ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: errors.array()[0].msg,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const { id } = req.params;

    // Update and return in a single round-trip using findOneAndUpdate
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.userId },
      { $set: { isRead: true } },
      { new: true }
    )
      .populate('relatedUser', 'name')
      .populate('relatedTrade', '_id status')
      .lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Notification not found',
          code: 'NOT_FOUND'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while updating the notification',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for authenticated user
 * @access  Private (requires authentication)
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while updating notifications',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Delete all notifications for authenticated user
 * @access  Private (requires authentication)
 */
router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ recipient: req.userId });

    res.status(200).json({
      success: true,
      message: 'All notifications cleared',
      count: result.deletedCount
    });

  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while clearing notifications',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;
