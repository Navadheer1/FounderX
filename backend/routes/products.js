const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProduct, updateProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(getProducts)
  .post(protect, authorize('founder', 'admin'), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('founder', 'admin'), updateProduct);

module.exports = router;
