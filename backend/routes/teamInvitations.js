const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createInvitation,
  getInvitations,
  updateInvitationStatus
} = require('../controllers/teamInvitationController');

router.use(protect);

router.route('/')
  .post(createInvitation)
  .get(getInvitations);

router.route('/:id/status')
  .put(updateInvitationStatus);

module.exports = router;
