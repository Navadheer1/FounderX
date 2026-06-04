const rateLimit = require('express-rate-limit');

// Rate limiter for follow/unfollow actions
// Allow 20 follow/unfollow actions per 15 minutes to prevent spam
exports.followLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many follow requests, please try again after 15 minutes'
  }
});
