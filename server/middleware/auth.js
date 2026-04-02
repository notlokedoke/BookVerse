const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { isTokenBlacklisted } = require('../utils/tokenBlacklist');

// Helper to conditionally log (suppress in test mode)
const log = (...args) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(...args);
  }
};

const logError = (...args) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(...args);
  }
};

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
      log('Auth failed: No token or invalid format');
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
    log('Authenticating token for request:', req.method, req.path);

    // Check if token is blacklisted (logged out)
    if (isTokenBlacklisted(token)) {
      log('Auth failed: Token is blacklisted');
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token has been invalidated. Please login again.',
          code: 'TOKEN_BLACKLISTED'
        }
      });
    }

    // Verify token signature and expiration
    const decoded = verifyToken(token);
    log('Token verified for user:', decoded.id);

    // Attach decoded user ID to request object
    req.userId = decoded.id;
    req.token = token; // Store token for potential blacklisting

    // Optionally, fetch and attach full user object (excluding password)
    // This can be useful for routes that need user information
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      log('Auth failed: User not found for ID:', decoded.id);
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token. User not found.',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    log('User authenticated:', user._id, user.email);
    req.user = user;

    // Continue to next middleware/route handler
    next();

  } catch (error) {
    // Handle JWT verification errors
    logError('Auth middleware error:', error.message);
    if (error.message === 'Invalid or expired token') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }
      });
    }

    // Handle Mongoose CastError (invalid ObjectId format)
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token. User not found.',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Handle other errors (e.g., database errors)
    logError('Authentication middleware error:', error);
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