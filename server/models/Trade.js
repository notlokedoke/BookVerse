const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  proposer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Proposer is required']
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver is required']
  },
  requestedBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Requested book is required']
  },
  offeredBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Offered book is required']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['proposed', 'accepted', 'declined', 'completed'],
      message: 'Status must be one of: proposed, accepted, declined, completed'
    },
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
  timestamps: true
});

// Create indexes as specified in the requirements
// Index on proposer field for efficient queries of user's proposed trades
tradeSchema.index({ proposer: 1 });

// Index on receiver field for efficient queries of user's received trades
tradeSchema.index({ receiver: 1 });

// Index on status field for filtering trades by status
tradeSchema.index({ status: 1 });

// Compound index for proposer and status for efficient queries
tradeSchema.index({ proposer: 1, status: 1 });

// Compound index for receiver and status for efficient queries
tradeSchema.index({ receiver: 1, status: 1 });

// Compound index for both proposer and receiver to find all trades involving a user
tradeSchema.index({ proposer: 1, receiver: 1 });

// Index on createdAt for sorting trades by date
tradeSchema.index({ createdAt: -1 });

// Compound index for status and createdAt for efficient filtered sorting
tradeSchema.index({ status: 1, createdAt: -1 });

const Trade = mongoose.model('Trade', tradeSchema);

module.exports = Trade;
