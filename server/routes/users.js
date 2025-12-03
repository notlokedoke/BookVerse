const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { applyUserPrivacySettings } = require('../utils/privacy');

/**
 * @route   GET /api/users/:userId
 * @desc    Get public user profile by ID
 * @access  Public
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid user ID format',
          code: 'INVALID_USER_ID'
        }
      });
    }

    // Find user by ID
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Apply privacy settings using utility function
    const userResponse = applyUserPrivacySettings(user);

    res.status(200).json({
      success: true,
      data: userResponse
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching user profile',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;