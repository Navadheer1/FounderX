require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Startup = require('./models/Startup');
const FounderProfile = require('./models/FounderProfile');
const InvestorProfile = require('./models/InvestorProfile');

async function migrate() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/founderx';
  console.log('Connecting to database:', uri);
  
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB.');

    // 1. Migrate Startups
    console.log('Migrating Startups...');
    const startups = await Startup.find();
    let updatedStartupsCount = 0;
    for (const startup of startups) {
      let modified = false;
      if (startup.is_public === undefined) {
        startup.is_public = true;
        modified = true;
      }
      if (startup.is_active === undefined) {
        startup.is_active = true;
        modified = true;
      }
      if (startup.is_verified === undefined) {
        startup.is_verified = startup.verified || startup.isVerified || false;
        modified = true;
      }
      if (modified) {
        await startup.save();
        updatedStartupsCount++;
      }
    }
    console.log(`✅ Migrated ${updatedStartupsCount}/${startups.length} startups.`);

    // 2. Migrate Founders & Create Profiles
    console.log('Migrating Founder profiles...');
    const founders = await User.find({ role: 'founder' });
    let createdFounderProfilesCount = 0;
    for (const founder of founders) {
      let profile = await FounderProfile.findOne({ user: founder._id });
      if (!profile) {
        profile = new FounderProfile({
          user: founder._id,
          startups: []
        });
        createdFounderProfilesCount++;
      }
      
      // Associate existing startups of this founder
      const founderStartups = await Startup.find({ founderId: founder._id });
      for (const startup of founderStartups) {
        if (!profile.startups.includes(startup._id)) {
          profile.startups.push(startup._id);
        }
      }
      await profile.save();
    }
    console.log(`✅ Created/updated ${createdFounderProfilesCount} Founder profiles.`);

    // 3. Migrate Investors & Create Profiles
    console.log('Migrating Investor profiles...');
    const investors = await User.find({ role: 'investor' });
    let createdInvestorProfilesCount = 0;
    for (const investor of investors) {
      let profile = await InvestorProfile.findOne({ user: investor._id });
      if (!profile) {
        profile = new InvestorProfile({
          user: investor._id,
          open_to_invest: true,
          activelyInvesting: true,
          investorType: 'Angel',
          portfolio: []
        });
        createdInvestorProfilesCount++;
      } else {
        if (profile.open_to_invest === undefined) {
          profile.open_to_invest = true;
          await profile.save();
        }
      }
      await profile.save();
    }
    console.log(`✅ Created/updated ${createdInvestorProfilesCount} Investor profiles.`);

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
