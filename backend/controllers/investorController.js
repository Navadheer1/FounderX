const Startup = require('../models/Startup');
const InvestmentRequest = require('../models/InvestmentRequest');
const Notification = require('../models/Notification');
const InvestorProfile = require('../models/InvestorProfile');
const User = require('../models/User');


// @desc    Toggle save/unsave a startup to investor's watchlist
// @route   POST /api/investor/save-startup/:id
// @access  Private
exports.toggleSaveStartup = async (req, res) => {
  try {
    const { id: startupId } = req.params;
    const investorId = req.user.id;

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const saveIndex = startup.saves.findIndex(save => 
      save.userId.toString() === investorId.toString()
    );

    let isSaved;
    if (saveIndex > -1) {
      // Unsaving
      startup.saves.splice(saveIndex, 1);
      isSaved = false;
    } else {
      // Saving
      startup.saves.push({ userId: investorId });
      isSaved = true;
    }

    await startup.save();

    res.status(200).json({
      success: true,
      data: { isSaved }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get investor's watchlist
// @route   GET /api/investor/watchlist
// @access  Private
exports.getWatchlist = async (req, res) => {
  try {
    const investorId = req.user.id;

    const savedStartups = await Startup.find({
      'saves.userId': investorId
    }).populate('founderId', 'name email profileImage');

    res.status(200).json({
      success: true,
      data: savedStartups
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Send interest request to startup founder
// @route   POST /api/investor/interest-request
// @access  Private
exports.sendInterestRequest = async (req, res) => {
  try {
    const { startupId, message, investmentRange } = req.body;
    const investorId = req.user.id;

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Check for duplicate request
    const existingRequest = await InvestmentRequest.findOne({
      startupId,
      investorId
    });
    if (existingRequest) {
      return res.status(400).json({ success: false, error: 'Interest request already sent' });
    }

    // Create investment request
    const interestRequest = await InvestmentRequest.create({
      startupId,
      investorId,
      founderId: startup.founderId,
      message,
      investmentRange,
      status: 'pending'
    });

    // Increment investor interest count on startup
    startup.metrics.investorInterest += 1;
    await startup.save();

    // Create notification for founder
    const io = req.app.get('io');
    const notification = await Notification.create({
      recipient: startup.founderId,
      sender: investorId,
      type: 'investment_request',
      entityId: interestRequest._id,
      entityType: 'InvestmentRequest',
      content: message
    });

    // Emit real-time notification
    if (io) {
      io.to(startup.founderId.toString()).emit('new_notification', notification);
    }

    res.status(201).json({
      success: true,
      data: interestRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get investor's sent interest requests
// @route   GET /api/investor/requests
// @access  Private
exports.getInvestorRequests = async (req, res) => {
  try {
    const investorId = req.user.id;

    const requests = await InvestmentRequest.find({ investorId })
      .populate('startupId', 'name logo')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all open/public investors
// @route   GET /api/investor
// @access  Public
exports.getOpenInvestors = async (req, res) => {
  try {
    const openProfiles = await InvestorProfile.find({
      open_to_invest: true
    }).populate('user', 'name profileImage bio email isVerified location role');

    const investors = openProfiles
      .filter(profile => profile.user)
      .map(profile => {
        const userObj = profile.user.toObject ? profile.user.toObject() : profile.user;
        return {
          _id: userObj._id,
          name: userObj.name,
          profileImage: userObj.profileImage,
          bio: profile.bio || userObj.bio || '',
          location: profile.location || (userObj.location ? `${userObj.location.city || ''}${userObj.location.city && userObj.location.country ? ', ' : ''}${userObj.location.country || ''}` : ''),
          verified: profile.verified_investor || userObj.isVerified || false,
          roleProfile: profile.toObject(),
          role: 'investor'
        };
      });

    res.status(200).json({
      success: true,
      count: investors.length,
      data: investors
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Toggle open_to_invest status
// @route   PUT /api/investor/toggle-open
// @access  Private (Investor only)
exports.toggleOpenToInvest = async (req, res) => {
  try {
    if (req.user.role !== 'investor') {
      return res.status(403).json({ success: false, error: 'Not authorized. Only investors can modify availability.' });
    }

    const { open_to_invest } = req.body;
    if (open_to_invest === undefined || typeof open_to_invest !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Please provide open_to_invest boolean value' });
    }

    let profile = await InvestorProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new InvestorProfile({ user: req.user.id });
    }

    profile.open_to_invest = open_to_invest;
    await profile.save();

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
