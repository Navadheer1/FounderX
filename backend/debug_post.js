const mongoose = require('mongoose');
const User = require('./models/User');
const Startup = require('./models/Startup');
const Post = require('./models/Post');
const Comment = require('./models/Comment'); // Likely needed too

async function testPostModel() {
  try {
    await mongoose.connect('mongodb://localhost:27017/founderx', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB');

    // Fetch real post
    const postId = '6974ee6d48dd2aa610ec0143'; // From logs
    console.log('Fetching post:', postId);
    
    const post = await Post.findById(postId)
      .populate('authorId', 'name profileImage role verificationBadge username')
      .populate('startupId', 'name logo')
      .populate({
        path: 'comments',
        populate: { path: 'userId', select: 'name profileImage' }
      })
      .populate({
        path: 'repostOf',
        populate: { path: 'authorId', select: 'name username profileImage' }
      })
      .populate({
        path: 'parentPostId',
        populate: { path: 'authorId', select: 'name username profileImage' }
      });

    if (!post) {
      console.log('Post not found');
      return;
    }

    console.log('Post found');
    
    try {
      const investorId = new mongoose.Types.ObjectId();
      const json = post.toPublicJSON(investorId);
      console.log('toPublicJSON result success');
      console.log('investorInterestCount:', json.investorInterestCount);
    } catch (err) {
      console.error('toPublicJSON FAILED:', err);
      console.error(err.stack);
    }

  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testPostModel();