const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { submitRequest, getRequests, reviewRequest } = require('../controllers/verificationController');

router.post('/', protect, submitRequest);
router.get('/', protect, getRequests); // Should be admin only
router.put('/:id/review', protect, reviewRequest); // Should be admin only

module.exports = router;
