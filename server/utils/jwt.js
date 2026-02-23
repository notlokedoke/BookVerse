const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user
 * @param {string} userId - The user's MongoDB ObjectId
 * @returns {string} - Signed JWT token
 */
const generateToken = (userId) => {
  // Create payload with user ID
  const payload = {
    id: userId
  };

  // Sign token with secret and set expiration
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '24h'
    }
  );

  return token;
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
const verifyToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      throw new Error('Server configuration error');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error.message);
    if (error.name === 'TokenExpiredError') {
      throw new Error('Invalid or expired token');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid or expired token');
    }
    throw new Error('Invalid or expired token');
  }
};

/**
 * Get secure cookie options based on environment
 * @returns {object} - Cookie options for secure token storage
 */
const getSecureCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true, // Prevents client-side JavaScript access
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    path: '/', // Cookie available for all routes
    ...(isProduction && { domain: process.env.COOKIE_DOMAIN }) // Set domain in production if specified
  };
};

module.exports = {
  generateToken,
  verifyToken,
  getSecureCookieOptions
};
