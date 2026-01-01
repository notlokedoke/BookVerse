const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: {
      values: ['trade_request', 'trade_accepted', 'trade_declined', 'trade_completed', 'new_message'],
      message: 'Invalid notification type'
    }
  },
  relatedTrade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  message: {
    type: String,
    required: [true, 'Notification message is required']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index on recipient for efficient querying
notificationSchema.index({ recipient: 1 });

// Compound index on recipient and isRead for filtering unread notifications
notificationSchema.index({ recipient: 1, isRead: 1 });

// TTL index to automatically delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days = 2592000 seconds

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
