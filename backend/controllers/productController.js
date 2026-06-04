const Product = require('../models/Product');
const Startup = require('../models/Startup');

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, images, startupId, stock, lowStockThreshold, category } = req.body;

    // Verify startup ownership
    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }
    if (startup.founderId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to add products to this startup' });
    }

    const product = await Product.create({
      founderId: req.user.id,
      startupId,
      name,
      description,
      price,
      images,
      category,
      stock: stock || 0,
      lowStockThreshold: lowStockThreshold || 5,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Verify ownership
    if (product.founderId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this product' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all products (or filter by startup)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    let query = {};
    
    if (req.query.startupId) {
      query.startupId = req.query.startupId;
    }

    const products = await Product.find(query)
      .populate('startupId', 'name logo')
      .populate('founderId', 'name');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('startupId', 'name logo')
      .populate('founderId', 'name');

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
