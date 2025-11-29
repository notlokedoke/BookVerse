const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');

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
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
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

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', [
  // Validation middleware
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    const { email, password } = req.body;

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
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide both email and password',
          code: 'MISSING_FIELDS'
        }
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Compare password hash
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return token and user data (excluding password)
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

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred during login',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (requires JWT token)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // User is already attached to req by authenticateToken middleware
    const userResponse = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      city: req.user.city,
      privacySettings: req.user.privacySettings,
      averageRating: req.user.averageRating,
      ratingCount: req.user.ratingCount,
      createdAt: req.user.createdAt
    };

    res.status(200).json({
      success: true,
      data: userResponse
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while fetching user profile',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (name and city)
 * @access  Private (requires JWT token)
 */
router.put('/profile', [
  authenticateToken,
  // Validation middleware
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name cannot be empty'),
  body('city')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('City cannot be empty')
], async (req, res) => {
  try {
    const { name, city } = req.body;

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

    // Check if at least one field is provided for update
    if (!name && !city) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide at least one field to update (name or city)',
          code: 'NO_UPDATE_FIELDS'
        }
      });
    }

    // Build update object with only provided fields
    const updateFields = {};
    if (name !== undefined) {
      updateFields.name = name;
    }
    if (city !== undefined) {
      updateFields.city = city;
    }

    // Update user document in database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    ).select('-password'); // Exclude password from response

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Return updated user data
    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      city: updatedUser.city,
      privacySettings: updatedUser.privacySettings,
      averageRating: updatedUser.averageRating,
      ratingCount: updatedUser.ratingCount,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
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

    // Handle other errors
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while updating profile',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

module.exports = router;
