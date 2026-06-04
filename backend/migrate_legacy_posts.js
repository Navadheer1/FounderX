const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('./models/Post');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

const migrateLegacyPosts = async () => {
  await connectDB();

  try {
    console.log('Starting Legacy Post Migration...');

    // 1. Migrate Text Posts -> Tweet
    const textResult = await Post.updateMany(
      { 
        $or: [
            { contentType: { $exists: false } },
            { contentType: null }
        ],
        type: 'text' 
      },
      { $set: { contentType: 'tweet', isLongForm: false } }
    );
    console.log(`Migrated ${textResult.modifiedCount} text posts to 'tweet'.`);

    // 2. Migrate Image Posts -> Post
    const imageResult = await Post.updateMany(
      { 
        $or: [
            { contentType: { $exists: false } },
            { contentType: null }
        ],
        type: 'image' 
      },
      { $set: { contentType: 'post', isLongForm: false } }
    );
    console.log(`Migrated ${imageResult.modifiedCount} image posts to 'post'.`);

    // 3. Migrate Video Posts -> vtweet (Default)
    // We default to vtweet (short form) to ensure they appear in the main feed.
    // Users/Admin can manually change to 'video' (Watch) if needed later.
    const videoResult = await Post.updateMany(
      { 
        $or: [
            { contentType: { $exists: false } },
            { contentType: null }
        ],
        type: 'video' 
      },
      { $set: { contentType: 'vtweet', isLongForm: false } }
    );
    console.log(`Migrated ${videoResult.modifiedCount} video posts to 'vtweet'.`);

    // 4. Verify no posts are left without contentType
    const remaining = await Post.countDocuments({ 
        $or: [
            { contentType: { $exists: false } },
            { contentType: null }
        ]
    });

    if (remaining === 0) {
        console.log('✅ All legacy posts successfully migrated!');
    } else {
        console.warn(`⚠️ ${remaining} posts still lack contentType. Check manual intervention.`);
    }

    process.exit();
  } catch (error) {
    console.error('Migration Error:', error);
    process.exit(1);
  }
};

migrateLegacyPosts();
