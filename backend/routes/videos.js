const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  uploadVideo,
  getVideos,
  getVideoById,
  likeVideo,
  commentVideo,
  incrementView,
  deleteVideo,
  analyzeVideoPitch,
  addInvestorInterest,
  generateLaunchPost,
  getFounderDashboardInterests,
  getVideoStats
} = require('../controllers/videoController');

// Multer memory storage configuration for streaming to Cloudinary or writing buffer locally
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB limits
  }
});

// Configure upload fields for multipart form-data
const uploadFields = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Routes
router.post('/upload', protect, uploadFields, uploadVideo);
router.get('/', getVideos);
router.get('/stats', getVideoStats);
router.get('/dashboard/investor-interests', protect, getFounderDashboardInterests);
router.get('/:id', getVideoById);
router.delete('/:id', protect, deleteVideo);
router.post('/:id/like', protect, likeVideo);
router.post('/:id/comment', protect, commentVideo);
router.post('/:id/view', incrementView);
router.post('/:id/analyze', protect, analyzeVideoPitch);
router.post('/:id/interest', protect, addInvestorInterest);
router.post('/:id/generate-post', protect, generateLaunchPost);

module.exports = router;
