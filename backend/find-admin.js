const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/founderx', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB.');

    // Look for admins
    const admins = await User.find({ role: 'admin' });
    if (admins.length > 0) {
      console.log('Found existing admin accounts:');
      admins.forEach(admin => {
        console.log(`- Email: ${admin.email}, Username: ${admin.username}, Name: ${admin.name}`);
      });
    } else {
      console.log('No admin accounts found. Creating a default admin account...');
      const adminEmail = 'admin@founderx.com';
      const adminPassword = 'adminpassword123';
      
      const adminUser = await User.create({
        fullName: 'System Administrator',
        name: 'System Administrator',
        email: adminEmail,
        passwordHash: adminPassword,
        role: 'admin',
        username: 'admin',
        profileCompleted: true,
        isProfileComplete: true
      });
      
      console.log('✅ Created default admin account:');
      console.log(`- Email: ${adminEmail}`);
      console.log(`- Password: ${adminPassword}`);
      console.log(`- Username: ${adminUser.username}`);
    }
  } catch (error) {
    console.error('Error checking/creating admin:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkAdmin();
