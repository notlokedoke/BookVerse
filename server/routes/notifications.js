const express = require('express');
const router = express.Router();
const { param, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for authenticated user
 * @access  Private (requires authentication)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Fetch all notifications for the authenticated user
    const notifications = await Notification.find({ recipient: req.userId })
      .populate('relatedUser', '-password')
      .populate('relatedTrade')
      .sort({ createdAt: -1 }); // Sort by creation date descending (newest first)

    // Calculate unread count
    const unreadCount = notifications.filter(notification => !notification.isRead).length;

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
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

    const { id } = req.params;

    // Find the notification
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Notification not found',
          code: 'NOT_FOUND'
        }
      });
    }

    // Verify the notification belongs to the authenticated user
    if (notification.recipient.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You are not authorized to update this notification',
          code: 'FORBIDDEN'
        }
      });
    }

    // Update isRead to true
    notification.isRead = true;
    await notification.save();

    // Return the updated notification with populated fields
    const updatedNotification = await Notification.findById(id)
      .populate('relatedUser', '-password')
      .populate('relatedTrade');

    res.status(200).json({
      success: true,
      data: updatedNotification
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
    // Update all unread notifications for the authenticated user
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

module.exports = router;
