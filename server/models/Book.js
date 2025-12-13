const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Book owner is required']
  },
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Book author is required'],
    trim: true
  },
  isbn: {
    type: String,
    trim: true,
    sparse: true // Allow multiple null values but unique non-null values
  },
  genre: {
    type: String,
    required: [true, 'Book genre is required'],
    trim: true
  },
  condition: {
    type: String,
    required: [true, 'Book condition is required'],
    enum: {
      values: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
      message: 'Condition must be one of: New, Like New, Good, Fair, Poor'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  imageUrl: {
    type: String,
    required: [true, 'Book image is required']
  },
  publicationYear: {
    type: Number,
    min: [1000, 'Publication year must be valid'],
    max: [new Date().getFullYear(), 'Publication year cannot be in the future']
  },
  publisher: {
    type: String,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
bookSchema.index({ owner: 1 });
bookSchema.index({ genre: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ title: 1 });
bookSchema.index({ isAvailable: 1 });
bookSchema.index({ owner: 1, isAvailable: 1 }); // Compound index for user's available books

// Text index for search functionality
bookSchema.index({ 
  title: 'text', 
  author: 'text', 
  description: 'text' 
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;