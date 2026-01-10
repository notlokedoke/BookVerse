const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  trade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade',
    required: [true, 'Trade is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [1000, 'Message content cannot exceed 1000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We're manually handling createdAt
});

// Create index on trade field for efficient queries of trade messages
messageSchema.index({ trade: 1 });

// Create compound index on trade and createdAt for efficient chronological sorting
messageSchema.index({ trade: 1, createdAt: 1 });

// Create index on sender for queries by sender
messageSchema.index({ sender: 1 });

// Create index on createdAt for general sorting
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
