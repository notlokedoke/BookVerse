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
  },
  imageUrl: {
    type: String,
    trim: true
  },
  // Track if this was added from a book listing (vs manual entry)
  sourceBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    default: null
  },
  // Track fulfillment
  fulfilledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade',
    default: null
  },
  fulfilledAt: {
    type: Date,
    default: null
  },
  // Priority level (1-5, where 5 is highest)
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  // Public visibility
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create index on user field for queries as specified in requirements
wishlistSchema.index({ user: 1 });

// Compound unique index on user + isbn, only applied when isbn is a non-null string.
// sparse: true on a compound index still indexes null isbn values (because user is always
// present), causing E11000 for any second book without an isbn per user.
// partialFilterExpression correctly skips documents where isbn is absent or null.
wishlistSchema.index(
  { user: 1, isbn: 1 },
  { unique: true, partialFilterExpression: { isbn: { $exists: true, $type: 'string' } } }
);

// Create index on createdAt for sorting by creation date
wishlistSchema.index({ createdAt: -1 });

// Support the wishlist-match query on new book creation (title + author lookup)
wishlistSchema.index({ title: 1, author: 1 });

// Support ISBN-based wishlist matching
wishlistSchema.index({ isbn: 1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;