const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getRecommendations, buildUserProfile } = require('../utils/recommendations');
const { applyBookOwnerPrivacyToArray } = require('../utils/privacy');

/**
 * @route   GET /api/recommendations
 * @desc    Get personalized book recommendations for authenticated user
 * @access  Private (requires authentication)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50, min 1

    // Generate recommendations
    const recommendations = await getRecommendations(req.userId, limitNum);

    // Apply privacy settings to book owners
    const recommendationsWithPrivacy = applyBookOwnerPrivacyToArray(recommendations);

    res.json({
      success: true,
      data: {
        recommendations: recommendationsWithPrivacy,
        count: recommendationsWithPrivacy.length
      },
      message: 'Recommendations generated successfully'
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to generate recommendations',
        code: 'RECOMMENDATION_ERROR'
      }
    });
  }
});

/**
 * @route   GET /api/recommendations/profile
 * @desc    Get user's preference profile (for debugging/transparency)
 * @access  Private (requires authentication)
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await buildUserProfile(req.userId);

    // Format for response
    const formattedProfile = {
      topGenres: profile.favoriteGenres.slice(0, 5).map(g => g.genre),
      topAuthors: profile.favoriteAuthors.slice(0, 5).map(a => a.author),
      wishlistCount: profile.wishlistBooks.length,
      receivedBooksCount: profile.receivedBooks.length,
      ownedBooksCount: profile.ownedBooks.length
    };

    res.json({
      success: true,
      data: formattedProfile,
      message: 'User preference profile retrieved successfully'
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to retrieve preference profile',
        code: 'PROFILE_ERROR'
      }
    });
  }
});

module.exports = router;
