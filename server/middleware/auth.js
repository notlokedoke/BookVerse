const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * JWT Authentication Middleware
 * Extracts JWT from Authorization header, verifies it, and attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists and follows Bearer format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. No token provided.',
          code: 'NO_TOKEN'
        }
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token signature and expiration
    const decoded = verifyToken(token);

    // Attach decoded user ID to request object
    req.userId = decoded.id;

    // Optionally, fetch and attach full user object (excluding password)
    // This can be useful for routes that need user information
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token. User not found.',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    req.user = user;

    // Continue to next middleware/route handler
    next();

  } catch (error) {
    // Handle JWT verification errors
    if (error.message === 'Invalid or expired token') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }
      });
    }

    // Handle other errors (e.g., database errors)
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR'
      }
    });
  }
};

module.exports = {
  authenticateToken
};