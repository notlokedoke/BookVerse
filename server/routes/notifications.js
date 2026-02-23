const express = require('express');
const router = express.Router();
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

module.exports = router;
