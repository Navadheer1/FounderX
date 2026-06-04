const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  checkWatchlist,
  getWatchlistCount
} = require('../controllers/watchlistController');

router.post('/add', protect, addToWatchlist);
router.delete('/remove/:startupId', protect, removeFromWatchlist);
router.get('/', protect, getWatchlist);
router.get('/check/:startupId', protect, checkWatchlist);
router.get('/count', protect, getWatchlistCount);

module.exports = router;
