const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  proposer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  offeredBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['proposed', 'accepted', 'declined', 'completed'],
    default: 'proposed'
  },
  proposedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Indexes for efficient querying
tradeSchema.index({ proposer: 1 });
tradeSchema.index({ receiver: 1 });
tradeSchema.index({ status: 1 });
tradeSchema.index({ proposer: 1, status: 1 });
tradeSchema.index({ receiver: 1, status: 1 });
tradeSchema.index({ requestedBook: 1 });
tradeSchema.index({ offeredBook: 1 });

module.exports = mongoose.model('Trade', tradeSchema);