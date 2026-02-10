const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    required: function() {
      // Password is required only if not using Google OAuth
      return !this.googleId;
    },
    minlength: [8, 'Password must be at least 8 characters long']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  city: {
    type: String,
    required: function() {
      // City is not required for Google OAuth users
      return false;
    },
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
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
userSchema.index({ email: 1 }, { unique: true });

// Create index on googleId for OAuth lookups
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

// Create index on city field for filtering
userSchema.index({ city: 1 });

// Create compound index for privacy-aware city searches
userSchema.index({ city: 1, 'privacySettings.showCity': 1 });

// Create index on averageRating for sorting
userSchema.index({ averageRating: -1 });

// Create index on createdAt for sorting by registration date
userSchema.index({ createdAt: -1 });

// Pre-save hook to hash password before saving to database
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt with 10 rounds
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
