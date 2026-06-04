const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Startup = require('./models/Startup');
const InvestorProfile = require('./models/InvestorProfile');
const FounderProfile = require('./models/FounderProfile');
const JobSeekerProfile = require('./models/JobSeekerProfile');
const JobApplication = require('./models/JobApplication');
const StartupRoleRequest = require('./models/StartupRoleRequest');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const Notification = require('./models/Notification');
const Report = require('./models/Report');
const Follow = require('./models/Follow');
const Watchlist = require('./models/Watchlist');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/founderx', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB.');

    // 1. Identify users to delete
    const usersToDelete = await User.find({
      $or: [
        { email: { $regex: '@test\\.com$', $options: 'i' } },
        { email: { $regex: '@example\\.com$', $options: 'i' } },
        { fullName: { $regex: 'test|moderation|update|upload', $options: 'i' } },
        { username: { $regex: 'test', $options: 'i' } }
      ],
      // Protect administrator account
      email: { $ne: 'admin@founderx.com' }
    });

    const deleteIds = usersToDelete.map(u => u._id);
    console.log(`Found ${usersToDelete.length} test/fake accounts to delete:`);
    usersToDelete.forEach(u => {
      console.log(`- Email: ${u.email}, Name: ${u.fullName}, Username: ${u.username}`);
    });

    if (deleteIds.length === 0) {
      console.log('No test/fake accounts found.');
      return;
    }

    // 2. Perform deletions across all collections to maintain referential integrity
    console.log('\nPurging associated data...');
    
    // User accounts
    const userDelResult = await User.deleteMany({ _id: { $in: deleteIds } });
    console.log(`- Deleted ${userDelResult.deletedCount} User profiles`);

    // Startup profiles
    const startupDelResult = await Startup.deleteMany({ founderId: { $in: deleteIds } });
    console.log(`- Deleted ${startupDelResult.deletedCount} Startups`);

    // Roles profiles
    const founderProfileDel = await FounderProfile.deleteMany({ userId: { $in: deleteIds } });
    const investorProfileDel = await InvestorProfile.deleteMany({ userId: { $in: deleteIds } });
    const seekerProfileDel = await JobSeekerProfile.deleteMany({ userId: { $in: deleteIds } });
    console.log(`- Deleted ${founderProfileDel.deletedCount + investorProfileDel.deletedCount + seekerProfileDel.deletedCount} role profiles`);

    // Applications & requests
    const jobAppDel = await JobApplication.deleteMany({
      $or: [
        { applicantId: { $in: deleteIds } },
        { founderId: { $in: deleteIds } }
      ]
    });
    const roleReqDel = await StartupRoleRequest.deleteMany({
      $or: [
        { applicantId: { $in: deleteIds } },
        { founderId: { $in: deleteIds } }
      ]
    });
    console.log(`- Deleted ${jobAppDel.deletedCount + roleReqDel.deletedCount} applications/requests`);

    // Posts & Comments
    const postDelResult = await Post.deleteMany({ authorId: { $in: deleteIds } });
    const commentDelResult = await Comment.deleteMany({ authorId: { $in: deleteIds } });
    console.log(`- Deleted ${postDelResult.deletedCount} posts and ${commentDelResult.deletedCount} comments`);

    // Messages & Conversations
    const msgDel = await Message.deleteMany({
      $or: [
        { sender: { $in: deleteIds } },
        { recipient: { $in: deleteIds } }
      ]
    });
    const convDel = await Conversation.deleteMany({
      participants: { $in: deleteIds }
    });
    console.log(`- Deleted ${msgDel.deletedCount} messages and ${convDel.deletedCount} conversation threads`);

    // Notifications
    const notifyDel = await Notification.deleteMany({
      $or: [
        { recipient: { $in: deleteIds } },
        { sender: { $in: deleteIds } }
      ]
    });
    console.log(`- Deleted ${notifyDel.deletedCount} notifications`);

    // Watchlists & Follows
    const followDel = await Follow.deleteMany({
      $or: [
        { follower: { $in: deleteIds } },
        { following: { $in: deleteIds } }
      ]
    });
    const watchlistDel = await Watchlist.deleteMany({ userId: { $in: deleteIds } });
    console.log(`- Deleted ${followDel.deletedCount} follows and ${watchlistDel.deletedCount} watchlists`);

    // Reports
    const reportDel = await Report.deleteMany({
      $or: [
        { reporterId: { $in: deleteIds } },
        { targetId: { $in: deleteIds } }
      ]
    });
    console.log(`- Deleted ${reportDel.deletedCount} incident reports`);

    console.log('\n✅ Database clean-up successfully completed!');
  } catch (error) {
    console.error('Error executing database cleanup:', error);
  } finally {
    await mongoose.connection.close();
  }
}

cleanup();
