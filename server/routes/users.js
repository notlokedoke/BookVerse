const express = require('express');
const router = express.Router();
const { param, validationResult } = require('express-validator');
const User = require('../models/User');
const { applyUserPrivacySettings } = require('../utils/privacy');

/**
 * @route   GET /api/users/:userId
 * @desc    Get public user profile by ID
 * @access  Public
 */
router.get('/:userId', [
  param('userId')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid user ID format')
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

    const { userId } = req.params;

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