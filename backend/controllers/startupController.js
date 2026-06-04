const Startup = require('../models/Startup');
const Post = require('../models/Post');
const Application = require('../models/Application');
const InvestmentRequest = require('../models/InvestmentRequest');
const Report = require('../models/Report');
const User = require('../models/User');
const mongoose = require('mongoose');
const FounderProfile = require('../models/FounderProfile');


// @desc    Get Startup Badge (SVG) and Track View
// @route   GET /api/startups/:id/badge
// @access  Public
exports.getStartupBadge = async (req, res) => {
  try {
    let startup;
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);

    if (isObjectId) {
      startup = await Startup.findById(req.params.id);
    } else {
      startup = await Startup.findOne({ slug: req.params.id });
    }

    if (!startup) {
      // Return a generic badge if not found, or 404
      // For user experience, better to return generic than broken image
      return res.status(404).send('Startup Not Found');
    }

    // Increment badge views
    startup.badgeViews = (startup.badgeViews || 0) + 1;
    await startup.save({ validateBeforeSave: false }); // Skip validation for speed

    // Generate SVG Badge
    const width = 200;
    const height = 60;
    const color = '#2563EB'; // Blue-600
    
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" rx="10" fill="white" stroke="${color}" stroke-width="2"/>
        <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6B7280">Built on</text>
        <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${color}">FounderX</text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error');
  }
};

// @desc    Create a new startup
// @route   POST /api/startups
// @access  Private (Founder only)
const { createNotification } = require('../utils/socialHelpers');

exports.createStartup = async (req, res) => {
  try {
    // Add user to req.body
    req.body.founderId = req.user.id;

    if (!req.body.contactEmail && req.user && req.user.email) {
      req.body.contactEmail = req.user.email;
    }

    // Check for existing startup for this user if needed (optional rule)
    // const publishedStartup = await Startup.findOne({ founderId: req.user.id });
    // if (publishedStartup && req.user.role !== 'admin') {
    //   return res.status(400).json({ success: false, error: 'You have already published a startup' });
    // }

    const startup = await Startup.create(req.body);

    // Link startup to FounderProfile
    let founderProfile = await FounderProfile.findOne({ user: req.user.id });
    if (!founderProfile) {
      founderProfile = new FounderProfile({ user: req.user.id });
    }
    if (!founderProfile.startups.includes(startup._id)) {
      founderProfile.startups.push(startup._id);
    }
    await founderProfile.save();

    res.status(201).json({
      success: true,
      data: startup
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all startups
// @route   GET /api/startups
// @access  Public
exports.getStartups = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Parse query string to JSON
    let queryObj = JSON.parse(queryStr);

    // Only show public and active startups
    queryObj.is_public = true;
    queryObj.is_active = true;

    // Add search functionality
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      queryObj.$or = [
        { name: searchRegex },
        { oneLinePitch: searchRegex },
        { industry: searchRegex }
      ];
    }

    // Finding resource
    query = Startup.find(queryObj).populate('founderId', 'name email profileImage');

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Startup.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const startups = await query;

    // Convert to public JSON
    const startupsWithStatus = startups.map(startup => 
      startup.toPublicJSON(req.user ? req.user : null)
    );

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: startups.length,
      pagination,
      data: startupsWithStatus
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single startup
// @route   GET /api/startups/:id
// @access  Public
exports.getStartup = async (req, res) => {
  try {
    let startup;
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);

    if (isObjectId) {
      startup = await Startup.findById(req.params.id).populate('founderId', 'name email profileImage bio followers');
    } else {
      startup = await Startup.findOne({ slug: req.params.id }).populate('founderId', 'name email profileImage bio followers');
    }

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Increment views
    // await startup.incrementViews(); // Commented out temporarily if method missing

    res.status(200).json({
      success: true,
      data: startup
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};


// @desc    Toggle Save/Unsave a startup
// @route   PUT /api/startups/save/:id
// @access  Private
exports.toggleSaveStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const user = await User.findById(req.user.id);
    
    // Check if already saved
    const isSaved = user.savedStartups.includes(req.params.id);

    if (isSaved) {
      // Unsave
      user.savedStartups = user.savedStartups.filter(
        id => id.toString() !== req.params.id
      );
      
      // Remove from startup saves
      if (startup.saves) {
        startup.saves = startup.saves.filter(
          save => save.userId.toString() !== req.user.id
        );
      }
    } else {
      // Save
      user.savedStartups.push(req.params.id);
      
      // Add to startup saves
      if (!startup.saves) startup.saves = [];
      startup.saves.push({ userId: req.user.id });
    }

    await user.save();
    await startup.save();

    res.status(200).json({
      success: true,
      data: !isSaved, // true if saved, false if unsaved
      message: isSaved ? 'Startup removed from bookmarks' : 'Startup saved to bookmarks'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Report Startup
// @route   POST /api/startups/:id/report
// @access  Private
exports.reportStartup = async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const report = await Report.create({
      targetId: req.params.id,
      targetType: 'Startup',
      reporterId: req.user.id,
      reason,
      description
    });

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Startup Analytics
// @route   GET /api/startups/:id/analytics
// @access  Private (Founder only)
exports.getStartupAnalytics = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Check ownership
    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const applicationsCount = await Application.countDocuments({ startupId: req.params.id });
    const investmentRequestsCount = await InvestmentRequest.countDocuments({ startupId: req.params.id });

    // Mock data for timeline if not available
    const timeline = [
      { date: '2023-01', views: 10, applications: 0 },
      { date: '2023-02', views: 25, applications: 1 },
      { date: '2023-03', views: 40, applications: 2 },
      { date: '2023-04', views: 60, applications: 5 }
    ];

    res.status(200).json({
      success: true,
      data: {
        views: startup.metrics?.views || 0,
        investorInterest: startup.metrics?.investorInterest || 0,
        applications: applicationsCount,
        investmentRequests: investmentRequestsCount,
        timeline
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update startup
// @route   PUT /api/startups/:id
// @access  Private (Founder only)
exports.updateStartup = async (req, res) => {
  try {
    let startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Make sure user is startup owner
    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to update this startup' });
    }

    startup = await Startup.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: startup
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete startup
// @route   DELETE /api/startups/:id
// @access  Private (Founder only)
exports.deleteStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Make sure user is startup owner
    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this startup' });
    }

    await startup.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Apply for Job/Internship/Collaboration
// @route   POST /api/startups/:id/apply
// @access  Private
exports.applyToStartup = async (req, res) => {
  try {
    const { type, message, resumeUrl, portfolioUrl, collaborationDetails, jobId } = req.body;
    
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Check if already applied (simple check)
    const existingApp = await Application.findOne({
      startupId: req.params.id,
      applicantId: req.user.id,
      type: type,
      jobId: jobId // Optional
    });

    if (existingApp) {
      return res.status(400).json({ success: false, error: 'You have already applied' });
    }

    const application = await Application.create({
      startupId: req.params.id,
      applicantId: req.user.id,
      jobId,
      type,
      message,
      resumeUrl,
      portfolioUrl,
      collaborationDetails
    });

    // Notify founder (Logic for notification would go here)

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Request Investment
// @route   POST /api/startups/:id/invest
// @access  Private (Investor only - theoretically, but we'll check role)
exports.requestInvestment = async (req, res) => {
  try {
    const { message, requestPitchDeck } = req.body;
    
    // Check role? Or allow anyone to express interest? 
    // Requirement says "Only logged-in users can... Request investment". 
    // Usually only investors. But let's stick to logged-in users for now or check 'investor' role.
    // if (req.user.role !== 'investor') ...

    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const existingRequest = await InvestmentRequest.findOne({
      startupId: req.params.id,
      investorId: req.user.id
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, error: 'You have already expressed interest' });
    }

    const request = await InvestmentRequest.create({
      startupId: req.params.id,
      investorId: req.user.id,
      message,
      requestPitchDeck
    });

    // Notify founder
    await createNotification({
      recipient: startup.founderId,
      sender: req.user.id,
      type: 'investment_request',
      entityId: request._id,
      entityType: 'InvestmentRequest',
      content: `New investment interest from ${req.user.name}`
    }, req.app.get('io'));

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Startup Applications
// @route   GET /api/startups/:id/applications
// @access  Private (Founder only)
exports.getStartupApplications = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const applications = await Application.find({ startupId: req.params.id })
      .populate('applicantId', 'name email profileImage headline')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Startup Investment Requests
// @route   GET /api/startups/:id/investment-requests
// @access  Private (Founder only)
exports.getStartupInvestmentRequests = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const requests = await InvestmentRequest.find({ startupId: req.params.id })
      .populate('investorId', 'name email profileImage headline')
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

// @desc    Update Application Status
// @route   PUT /api/startups/applications/:id/status
// @access  Private (Founder only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body; // pending, accepted, rejected
    
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const startup = await Startup.findById(application.startupId);
    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update Investment Request Status
// @route   PUT /api/startups/investment-requests/:id/status
// @access  Private (Founder only)
exports.updateInvestmentRequestStatus = async (req, res) => {
  try {
    const { status } = req.body; // pending, accepted, rejected, contacted
    
    const request = await InvestmentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const startup = await Startup.findById(request.startupId);
    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    request.status = status;
    await request.save();

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
