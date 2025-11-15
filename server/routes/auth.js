const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  // Validation middleware
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
], async (req, res) => {
  try {
    const { name, email, password, city } = req.body;

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

    // Validate required fields
    if (!name || !email || !password || !city) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide all required fields: name, email, password, and city',
          code: 'MISSING_FIELDS'
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'An account with this email already exists',
          code: 'EMAIL_EXISTS'
        }
      });
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({
      name,
      email,
      password,
      city
    });

    await user.save();

    // Return user data without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      city: user.city,
      privacySettings: user.privacySettings,
      averageRating: user.averageRating,
      ratingCount: user.ratingCount,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: userResponse
    });

  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: {
          message: messages.join(', '),
          code: 'VALIDATION_ERROR',
          details: error.errors
        }
      });
    }

    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'An account with this email already exists',
          code: 'EMAIL_EXISTS'
        }
      });
    }

    // Handle other errors
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred during registration',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;
