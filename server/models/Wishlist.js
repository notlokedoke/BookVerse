const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  author: {
    type: String,
    trim: true
  },
  isbn: {
    type: String,
    trim: true,
    sparse: true // Allow multiple null values but unique non-null values in compound index
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create index on user field for queries as specified in requirements
wishlistSchema.index({ user: 1 });

// Create compound unique index on user and isbn as specified in requirements
// This prevents duplicate entries for the same user and ISBN combination
// Using sparse: true to allow multiple entries with null ISBN for the same user
wishlistSchema.index({ user: 1, isbn: 1 }, { unique: true, sparse: true });

// Create index on createdAt for sorting by creation date
wishlistSchema.index({ createdAt: -1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;