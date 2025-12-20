/**
 * Token blacklist utility for JWT invalidation
 * In production, this should use Redis or a database for persistence
 */

// In-memory blacklist (for development/testing)
// In production, use Redis or database
const blacklistedTokens = new Set();

/**
 * Add a token to the blacklist
 * @param {string} token - JWT token to blacklist
 */
const blacklistToken = (token) => {
  blacklistedTokens.add(token);
  
  // Optional: Clean up expired tokens periodically
  // This is a simple implementation - in production use a more sophisticated approach
  if (blacklistedTokens.size > 10000) {
    // Clear old tokens (this is a simple approach)
    blacklistedTokens.clear();
  }
};

/**
 * Check if a token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is blacklisted
 */
const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

/**
 * Get the number of blacklisted tokens (for monitoring)
 * @returns {number} - Number of blacklisted tokens
 */
const getBlacklistSize = () => {
  return blacklistedTokens.size;
};

/**
 * Clear all blacklisted tokens (for testing)
 */
const clearBlacklist = () => {
  blacklistedTokens.clear();
};

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
  getBlacklistSize,
  clearBlacklist
};