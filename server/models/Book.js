const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: {
      values: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
      message: 'Condition must be one of: New, Like New, Good, Fair, Poor'
    }
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    trim: true
  },
  isbn: {
    type: String,
    trim: true,
    sparse: true // Allow multiple null values but unique non-null values
  },
  description: {
    type: String,
    trim: true
  },
  publicationYear: {
    type: Number,
    min: [1000, 'Publication year must be a valid year'],
    max: [new Date().getFullYear() + 1, 'Publication year cannot be in the future']
  },
  publisher: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  googleBooksImageUrl: {
    type: String,
    default: null
  },
  frontImageUrl: {
    type: String,
    default: null
  },
  backImageUrl: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes as specified in the requirements
// Index on owner field for efficient queries of user's books
bookSchema.index({ owner: 1 });

// Index on genre field for filtering
bookSchema.index({ genre: 1 });

// Index on author field for filtering and search
bookSchema.index({ author: 1 });

// Index on title field for search
bookSchema.index({ title: 1 });

// Compound index for owner and availability for efficient queries
bookSchema.index({ owner: 1, isAvailable: 1 });

// Text index for search functionality on title and author
bookSchema.index({ 
  title: 'text', 
  author: 'text' 
}, {
  weights: {
    title: 10,
    author: 5
  }
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;