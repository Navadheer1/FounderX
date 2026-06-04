const User = require('../models/User');

exports.globalSearch = async (req, res) => {
  try {
    let { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    // Strip @ if present
    q = q.trim();
    if (q.startsWith('@')) {
      q = q.substring(1);
    }

    // Perform case-insensitive search on username, name, and email
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('_id name username role profileImage isVerified')
    .limit(10);

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error during search' });
  }
};
