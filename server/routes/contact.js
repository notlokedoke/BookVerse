const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const ContactMessage = require('../models/ContactMessage');
const { sendContactFormEmail } = require('../config/email');
const { sanitizeString, sanitizeEmail } = require('../utils/sanitize');

// Rate limiting for contact form - 3 submissions per hour per IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: {
      message: 'Too many contact form submissions. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route   POST /api/contact
 * @desc    Submit contact form
 * @access  Public
 */
router.post(
  '/',
  contactLimiter,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required')
      .isIn(['general', 'support', 'feedback', 'report', 'partnership', 'other'])
      .withMessage('Invalid subject'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters')
  ],
  async (req, res) => {
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

      const { name, email, subject, message } = req.body;

      // Sanitize inputs
      const sanitizedData = {
        name: sanitizeString(name),
        email: sanitizeEmail(email),
        subject: sanitizeString(subject),
        message: sanitizeString(message)
      };

      // Get IP address and user agent for tracking
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      // Save to database
      const contactMessage = new ContactMessage({
        ...sanitizedData,
        ipAddress,
        userAgent
      });

      await contactMessage.save();
      console.log('Contact message saved to database:', contactMessage._id);

      // Send email notification
      console.log('Attempting to send email to:', process.env.ADMIN_EMAIL);
      const emailResult = await sendContactFormEmail(sanitizedData);

      if (!emailResult.success) {
        console.error('Failed to send contact form email:', emailResult.error);
        // Still return success to user since message is saved in database
      } else {
        console.log('Contact form email sent successfully:', emailResult.messageId);
      }

      res.status(201).json({
        success: true,
        message: 'Thank you for contacting us! We will get back to you soon.',
        data: {
          id: contactMessage._id,
          submittedAt: contactMessage.createdAt
        }
      });

    } catch (error) {
      console.error('Contact form submission error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to submit contact form. Please try again later.',
          code: 'SERVER_ERROR'
        }
      });
    }
  }
);

module.exports = router;
