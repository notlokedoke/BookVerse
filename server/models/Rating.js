const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  trade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade',
    required: [true, 'Trade is required']
  },
  rater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rater is required']
  },
  ratedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rated user is required']
  },
  stars: {
    type: Number,
    required: [true, 'Stars rating is required'],
    min: [1, 'Rating must be at least 1 star'],
    max: [5, 'Rating cannot exceed 5 stars'],
    validate: {
      validator: Number.isInteger,
      message: 'Stars must be an integer value'
    }
  },
  comment: {
    type: String,
    trim: true,
    required: function() {
      // Comment is required if stars <= 3
      return this.stars <= 3;
    },
    validate: {
      validator: function(v) {
        // If stars <= 3, comment must be provided and not empty
        if (this.stars <= 3) {
          return v && v.trim().length > 0;
        }
        return true;
      },
      message: 'Comment is required for ratings of 3 stars or lower'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We're manually handling createdAt
});

// Create compound unique index on trade and rater to prevent duplicate ratings
// A user can only rate a specific trade once
ratingSchema.index({ trade: 1, rater: 1 }, { unique: true });

// Create index on ratedUser for efficient queries when calculating average rating
ratingSchema.index({ ratedUser: 1 });

// Create index on trade for efficient queries of ratings by trade
ratingSchema.index({ trade: 1 });

// Create index on rater for queries of ratings given by a user
ratingSchema.index({ rater: 1 });

// Create index on createdAt for sorting ratings by date
ratingSchema.index({ createdAt: -1 });

// Create compound index on ratedUser and createdAt for efficient sorted queries
ratingSchema.index({ ratedUser: 1, createdAt: -1 });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
