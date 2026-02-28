const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeInput, sanitizeEmail, sanitizeString } = require('../utils/sanitize');
const { blacklistToken } = require('../utils/tokenBlacklist');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  // Input sanitization middleware
  sanitizeInput,
  // Validation middleware
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .customSanitizer(sanitizeEmail),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1 and 100 characters')
    .customSanitizer(sanitizeString),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('City is required and must be between 1 and 100 characters')
    .customSanitizer(sanitizeString),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
], async (req, res) => {
  try {
    const { name, email, password, city } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      
      // Check if it's a missing field error
      if (firstError.msg.includes('required')) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Please provide all required fields: name, email, password, and city',
            code: 'MISSING_FIELDS',
            details: errors.array()
          }
        });
      }
      
      return res.status(400).json({
        success: false,
        error: {
          message: firstError.msg,
          code: 'VALIDATION_ERROR',
          details: errors.array()
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

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    await sendVerificationEmail(user.email, user.name, verificationToken);

    // Return user data without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      city: user.city,
      emailVerified: user.emailVerified,
      privacySettings: user.privacySettings,
      averageRating: user.averageRating,
      ratingCount: user.ratingCount,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
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
  // Input sanitization middleware
  sanitizeInput,
  // Validation middleware
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .customSanitizer(sanitizeEmail),
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
      bio: req.user.bio,
      emailVerified: req.user.emailVerified,
      privacySettings: req.user.privacySettings,
      averageRating: req.user.averageRating,
      ratingCount: req.user.ratingCount,
      passwordChangedAt: req.user.passwordChangedAt,
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
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate JWT token
 * @access  Private (requires JWT token)
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Add the current token to the blacklist
    blacklistToken(req.token);
    
    res.status(200).json({
      success: true,
      message: 'Logout successful. Token has been invalidated.'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred during logout',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (name, city, and privacy settings)
 * @access  Private (requires JWT token)
 */
router.put('/profile', [
  authenticateToken,
  // Input sanitization middleware
  sanitizeInput,
  // Validation middleware
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name cannot be empty')
    .customSanitizer(sanitizeString),
  body('city')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City cannot be empty')
    .customSanitizer(sanitizeString),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
    .customSanitizer(sanitizeString),
  body('privacySettings.showCity')
    .optional()
    .isBoolean()
    .withMessage('Privacy setting showCity must be a boolean value'),
  body('privacySettings.showEmail')
    .optional()
    .isBoolean()
    .withMessage('Privacy setting showEmail must be a boolean value')
], async (req, res) => {
  try {
    const { name, city, bio, privacySettings } = req.body;

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
    if (!name && !city && !bio && !privacySettings) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide at least one field to update (name, city, bio, or privacySettings)',
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
    if (bio !== undefined) {
      updateFields.bio = bio;
    }
    if (privacySettings !== undefined) {
      // Handle nested privacy settings update
      if (privacySettings.showCity !== undefined) {
        updateFields['privacySettings.showCity'] = privacySettings.showCity;
      }
      if (privacySettings.showEmail !== undefined) {
        updateFields['privacySettings.showEmail'] = privacySettings.showEmail;
      }
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

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
const passport = require('../config/passport');

router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login?error=google_auth_failed'
  }),
  async (req, res) => {
    try {
      console.log('Google OAuth callback - User:', req.user._id);
      console.log('User email:', req.user.email);
      console.log('User has city:', !!req.user.city);
      
      // Generate JWT token for the authenticated user
      const token = generateToken(req.user._id);
      console.log('Generated token length:', token.length);
      console.log('Token first 20 chars:', token.substring(0, 20));

      // Check if user needs to complete profile (no city)
      const needsProfile = !req.user.city || req.user.city.trim() === '';
      console.log('User needs profile completion:', needsProfile);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      if (needsProfile) {
        // For profile completion, use a simpler redirect with token in URL
        const redirectUrl = `${frontendUrl}/complete-profile?token=${encodeURIComponent(token)}`;
        console.log('Redirecting to complete-profile');
        res.redirect(redirectUrl);
      } else {
        // For direct login, redirect to auth callback
        const redirectUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`;
        console.log('Redirecting to auth/callback');
        res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
);

module.exports = router;

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email with token
 * @access  Public
 */
router.post('/verify-email', [
  sanitizeInput,
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
], async (req, res) => {
  try {
    const { token } = req.body;

    // Check for validation errors
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

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token and non-expired token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid or expired verification token',
          code: 'INVALID_TOKEN'
        }
      });
    }

    // Mark email as verified and clear token
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred during email verification',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', [
  sanitizeInput,
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .customSanitizer(sanitizeEmail)
], async (req, res) => {
  try {
    const { email } = req.body;

    // Check for validation errors
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

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email is already verified',
          code: 'ALREADY_VERIFIED'
        }
      });
    }

    // Generate new verification token
    const verificationToken = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    await sendVerificationEmail(user.email, user.name, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while sending verification email',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', [
  sanitizeInput,
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .customSanitizer(sanitizeEmail)
], async (req, res) => {
  try {
    const { email } = req.body;

    // Check for validation errors
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

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Check if user registered with Google OAuth (no password)
    if (user.googleId && !user.password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'This account uses Google sign-in. Please log in with Google.',
          code: 'OAUTH_ACCOUNT'
        }
      });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while processing password reset request',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', [
  sanitizeInput,
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
], async (req, res) => {
  try {
    const { token, password } = req.body;

    // Check for validation errors
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

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token and non-expired token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid or expired reset token',
          code: 'INVALID_TOKEN'
        }
      });
    }

    // Set new password and clear reset token
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while resetting password',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.put('/change-password', [
  authenticateToken,
  sanitizeInput,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Check for validation errors
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

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');

    // Check if user has a password (not OAuth-only account)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'This account uses Google sign-in and does not have a password.',
          code: 'OAUTH_ACCOUNT'
        }
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        }
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'New password must be different from current password',
          code: 'SAME_PASSWORD'
        }
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'An error occurred while changing password',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});
