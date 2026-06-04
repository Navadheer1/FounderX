const Startup = require('../models/Startup');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Post = require('../models/Post');

// @desc    Get Founder Dashboard Data
// @route   GET /api/dashboard/founder
// @access  Private (Founder only)
exports.getFounderDashboard = async (req, res) => {
  try {
    const founderId = req.user.id;

    const startups = await Startup.find({ founderId });
    const products = await Product.find({ founderId });
    const orders = await Order.find({ founderId })
      .populate('userId', 'name email')
      .populate('productId', 'name price')
      .sort('-createdAt');

    const analytics = {
      totalStartups: startups.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      revenue: orders.reduce((acc, order) => acc + order.totalAmount, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        startups,
        products,
        orders,
        analytics
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Investor Dashboard Data
// @route   GET /api/dashboard/investor
// @access  Private (Investor only)
exports.getInvestorDashboard = async (req, res) => {
  try {
    // For now, we'll return all startups as "browsing" logic
    // In a real app, we'd have a "SavedStartup" model or field
    
    // Simulating "Saved" startups (fetching random 5 for demo)
    const savedStartups = await Startup.find().limit(5).populate('founderId', 'name');
    
    // Get recent pitches (videos)
    const interestedPitches = await Post.find({ type: 'video' })
      .sort('-createdAt')
      .limit(10)
      .populate('authorId', 'name')
      .populate('startupId', 'name');

    res.status(200).json({
      success: true,
      data: {
        savedStartups,
        interestedPitches
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get User Dashboard Data
// @route   GET /api/dashboard/user
// @access  Private (User only)
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const myOrders = await Order.find({ userId })
      .populate('productId', 'name price images')
      .populate('founderId', 'name')
      .sort('-createdAt');

    // Recommend products (random for now)
    const exploreProducts = await Product.find()
      .limit(10)
      .populate('founderId', 'name');

    res.status(200).json({
      success: true,
      data: {
        myOrders,
        exploreProducts
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
