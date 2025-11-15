const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Email validation regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  privacySettings: {
    showCity: {
      type: Boolean,
      default: true
    }
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Create index on email field for efficient queries and uniqueness
userSchema.index({ email: 1 });

// Create index on city field for filtering
userSchema.index({ city: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
