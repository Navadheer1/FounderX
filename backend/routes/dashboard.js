const express = require('express');
const router = express.Router();
const {
  getFounderDashboard,
  getInvestorDashboard,
  getUserDashboard
} = require('../controllers/dashboardController');

const { protect, authorize } = require('../middleware/auth');

router.get('/founder', protect, authorize('founder'), getFounderDashboard);
router.get('/investor', protect, authorize('investor'), getInvestorDashboard);
router.get('/user', protect, authorize('user', 'founder', 'investor'), getUserDashboard); // Founders/Investors can also act as users

module.exports = router;
