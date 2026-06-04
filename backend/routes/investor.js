const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth');
const {
  toggleSaveStartup,
  getWatchlist,
  sendInterestRequest,
  getInvestorRequests,
  getOpenInvestors,
  toggleOpenToInvest
} = require('../controllers/investorController');

router.get('/', optionalProtect, getOpenInvestors);
router.put('/toggle-open', protect, toggleOpenToInvest);

router.post('/save-startup/:id', protect, toggleSaveStartup);
router.get('/watchlist', protect, getWatchlist);
router.post('/interest-request', protect, sendInterestRequest);
router.get('/requests', protect, getInvestorRequests);

module.exports = router;
