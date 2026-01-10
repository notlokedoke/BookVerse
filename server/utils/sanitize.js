/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove HTML tags and potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
};

/**
 * Sanitize email input
 * @param {string} email - The email to sanitize
 * @returns {string} - Sanitized email
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return email;
  }
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>]/g, ''); // Remove angle brackets that could be used for injection
};

/**
 * Sanitize object recursively
 * @param {object} obj - The object to sanitize
 * @returns {object} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize both key and value
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Express middleware to sanitize request body, query, and params
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid input format',
        code: 'INVALID_INPUT'
      }
    });
  }
};

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizeObject,
  sanitizeInput
};