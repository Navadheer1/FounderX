const User = require('../models/User');
const Startup = require('../models/Startup');
const Post = require('../models/Post');

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

    const regex = { $regex: q, $options: 'i' };

    // Perform searches in parallel
    const [users, startups, posts] = await Promise.all([
      User.find({
        $or: [
          { username: regex },
          { name: regex },
          { email: regex }
        ]
      })
      .select('_id name username role profileImage isVerified')
      .limit(10),

      Startup.find({
        $or: [
          { name: regex },
          { oneLinePitch: regex },
          { description: regex },
          { industry: regex }
        ]
      })
      .select('_id name logo oneLinePitch industry stage')
      .limit(10),

      Post.find({
        $or: [
          { content: regex },
          { tags: regex }
        ]
      })
      .populate('authorId', 'name username profileImage')
      .select('_id authorId content contentType createdAt')
      .limit(10)
    ]);

    res.json({
      success: true,
      data: {
        users,
        startups,
        posts
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error during search' });
  }
};
