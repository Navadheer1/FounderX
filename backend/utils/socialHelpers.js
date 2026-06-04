const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a new notification
 * @param {Object} data - { recipient, sender, type, entityId, entityType, content }
 * @param {Object} io - Socket.io instance (optional)
 */
exports.createNotification = async (data, io = null) => {
  try {
    if (data.recipient.toString() === data.sender.toString()) return; // Don't notify self actions
    const notification = await Notification.create(data);
    
    // Real-time notification
    if (io) {
        const populatedNotification = await Notification.findById(notification._id)
          .populate('sender', 'name username profileImage')
          .populate('entityId');
        
        io.to(data.recipient.toString()).emit('new_notification', populatedNotification);
    }
  } catch (error) {
    console.error('Notification creation failed:', error);
  }
};

/**
 * Extract mentions and hashtags from content
 * @param {String} content
 * @returns {Object} { mentions: [userIds], hashtags: [strings] }
 */
exports.parseMentionsAndHashtags = async (content) => {
  const mentions = [];
  const hashtags = [];
  
  // Extract Hashtags
  const hashtagRegex = /#(\w+)/g;
  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1]);
  }

  // Extract Mentions (@username) - Assuming username field exists or we match by name (fallback)
  // Ideally, we should match by username. For now, we will try to find users by username.
  const mentionRegex = /@(\w+)/g;
  const potentialUsernames = [];
  while ((match = mentionRegex.exec(content)) !== null) {
    potentialUsernames.push(match[1]);
  }

  if (potentialUsernames.length > 0) {
    const users = await User.find({ username: { $in: potentialUsernames } }).select('_id');
    users.forEach(user => mentions.push(user._id));
  }

  return { mentions, hashtags };
};
