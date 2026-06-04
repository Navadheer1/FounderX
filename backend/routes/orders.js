const express = require('express');
const router = express.Router();
const { lockStock, lockStockBatch, createOrder, getMyOrders, releaseStock } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/lock', protect, lockStock);
router.post('/lock-batch', protect, lockStockBatch);
router.post('/', protect, createOrder);
router.post('/release', protect, releaseStock);
router.get('/myorders', protect, getMyOrders);

module.exports = router;
