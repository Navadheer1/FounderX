const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['mention', 'follow', 'like', 'repost', 'reply', 'investor_interest', 'startup_follow', 'job_application', 'collaboration_request', 'investment_request', 'message_request', 'order'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  entityType: {
    type: String,
    enum: ['Post', 'Startup', 'User', 'Comment', 'Application', 'InvestmentRequest', 'Order'],
    required: true
  },
  content: {
    type: String, // Optional preview text (e.g. comment content or post snippet)
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
