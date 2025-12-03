/**
 * Privacy utility functions for handling user data visibility
 * Used to apply privacy settings when displaying user information in various contexts
 */

/**
 * Apply privacy settings to user data for public display
 * @param {Object} user - User object from database
 * @param {Object} options - Options for privacy filtering
 * @param {boolean} options.includeEmail - Whether to include email (default: false)
 * @returns {Object} Filtered user object respecting privacy settings
 */
const applyUserPrivacySettings = (user, options = {}) => {
  if (!user) {
    return null;
  }

  const { includeEmail = false } = options;

  // Base user response object
  const userResponse = {
    _id: user._id,
    name: user.name,
    averageRating: user.averageRating || 0,
    ratingCount: user.ratingCount || 0,
    createdAt: user.createdAt,
    privacySettings: user.privacySettings
  };

  // Only include city if privacy settings allow it
  if (user.privacySettings?.showCity !== false) {
    userResponse.city = user.city;
  }

  // Include email only if explicitly requested (for authenticated user's own data)
  if (includeEmail) {
    userResponse.email = user.email;
  }

  return userResponse;
};

/**
 * Apply privacy settings to book owner information
 * This function is specifically designed for book-related queries where owner info is populated
 * @param {Object} book - Book object with populated owner field
 * @returns {Object} Book object with privacy-filtered owner information
 */
const applyBookOwnerPrivacy = (book) => {
  if (!book) {
    return null;
  }

  // Create a copy of the book object
  const bookResponse = {
    ...book.toObject ? book.toObject() : book
  };

  // Apply privacy settings to owner information if owner is populated
  if (bookResponse.owner && typeof bookResponse.owner === 'object') {
    bookResponse.owner = applyUserPrivacySettings(bookResponse.owner);
  }

  return bookResponse;
};

/**
 * Apply privacy settings to multiple books with owner information
 * @param {Array} books - Array of book objects with populated owner fields
 * @returns {Array} Array of books with privacy-filtered owner information
 */
const applyBookOwnerPrivacyToArray = (books) => {
  if (!Array.isArray(books)) {
    return [];
  }

  return books.map(book => applyBookOwnerPrivacy(book));
};

/**
 * Middleware to apply privacy settings to book owner information in API responses
 * This middleware should be used after book queries that populate owner information
 */
const applyBookOwnerPrivacyMiddleware = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to apply privacy settings
  res.json = function(data) {
    if (data && data.success && data.data) {
      // Handle single book response
      if (data.data.owner) {
        data.data = applyBookOwnerPrivacy(data.data);
      }
      // Handle array of books response
      else if (Array.isArray(data.data) && data.data.length > 0 && data.data[0].owner) {
        data.data = applyBookOwnerPrivacyToArray(data.data);
      }
      // Handle paginated response with books array
      else if (data.data.books && Array.isArray(data.data.books)) {
        data.data.books = applyBookOwnerPrivacyToArray(data.data.books);
      }
    }

    // Call original json method with modified data
    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  applyUserPrivacySettings,
  applyBookOwnerPrivacy,
  applyBookOwnerPrivacyToArray,
  applyBookOwnerPrivacyMiddleware
};