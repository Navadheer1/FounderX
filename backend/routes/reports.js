const express = require('express');
const router = express.Router();
const { getReports, updateReportStatus } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getReports);
router.put('/:id/status', updateReportStatus);

module.exports = router;
