const express = require('express');
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getConversations,
  getMessages,
  acceptRequest,
  declineRequest,
  markRead,
  reactToMessage,
  editMessage,
  deleteMessage,
  checkCanChat
} = require('../controllers/messageController');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(sendMessage);

router.route('/conversations')
  .get(getConversations);

router.route('/can-chat/:userId')
  .get(checkCanChat);

router.route('/:conversationId')
  .get(getMessages);

router.route('/:id/accept')
  .put(acceptRequest);

router.route('/:id/decline')
  .put(declineRequest);

router.route('/:id/read')
  .put(markRead);

router.route('/message/:id')
  .put(editMessage)
  .delete(deleteMessage);

router.route('/message/:id/react')
  .post(reactToMessage);

module.exports = router;
