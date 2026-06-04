const Watchlist = require('../models/Watchlist');
const Startup = require('../models/Startup');

// @desc    Add startup to watchlist
// @route   POST /api/watchlist/add
// @access  Private
exports.addToWatchlist = async (req, res) => {
  try {
    const { startupId } = req.body;
    const investorId = req.user.id;

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const watchlistItem = await Watchlist.create({
      investorId,
      startupId
    });

    res.status(201).json({
      success: true,
      data: watchlistItem
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Startup already in watchlist' });
    }
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Remove startup from watchlist
// @route   DELETE /api/watchlist/remove/:startupId
// @access  Private
exports.removeFromWatchlist = async (req, res) => {
  try {
    const { startupId } = req.params;
    const investorId = req.user.id;

    const result = await Watchlist.findOneAndDelete({
      investorId,
      startupId
    });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Startup not in watchlist' });
    }

    res.status(200).json({
      success: true,
      message: 'Removed from watchlist'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get investor's watchlist
// @route   GET /api/watchlist
// @access  Private
exports.getWatchlist = async (req, res) => {
  try {
    const investorId = req.user.id;

    const watchlist = await Watchlist.find({ investorId })
      .populate('startupId')
      .sort('-createdAt');

    const startups = watchlist.map(item => item.startupId);

    res.status(200).json({
      success: true,
      data: startups
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Check if startup is in watchlist
// @route   GET /api/watchlist/check/:startupId
// @access  Private
exports.checkWatchlist = async (req, res) => {
  try {
    const { startupId } = req.params;
    const investorId = req.user.id;

    const exists = await Watchlist.exists({
      investorId,
      startupId
    });

    res.status(200).json({
      success: true,
      data: { isSaved: !!exists }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get watchlist count
// @route   GET /api/watchlist/count
// @access  Private
exports.getWatchlistCount = async (req, res) => {
  try {
    const investorId = req.user.id;
    const count = await Watchlist.countDocuments({ investorId });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
