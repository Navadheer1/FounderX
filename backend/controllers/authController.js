const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/'
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { fullName, name, email, password, role } = req.body;

    const chosenName = fullName || name;
    if (!chosenName) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    // Validate role
    if (role && !['job_seeker', 'founder', 'investor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be job_seeker, founder or investor.' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate unique username if not provided
    let username = req.body.username;
    if (!username) {
      const baseUsername = chosenName.toLowerCase().replace(/[^a-z0-9]/g, '');
      username = baseUsername || 'user';
      let isUnique = false;
      let counter = 0;

      while (!isUnique) {
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
          isUnique = true;
        } else {
          counter++;
          username = `${baseUsername || 'user'}${Math.floor(Math.random() * 1000) + counter}`;
        }
      }
    } else {
      // Check if provided username exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Create user
    const user = await User.create({
      fullName: chosenName,
      name: chosenName,
      email,
      passwordHash: password,
      role: role || 'founder',
      username,
      profileCompleted: false
    });

    if (user) {
      const token = generateToken(user._id);
      const userPublic = user.toPublicJSON();
      userPublic.token = token;

      res
        .cookie('token', token, cookieOptions)
        .status(201)
        .json(userPublic);
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    let message = 'Server Error';
    if (error.name === 'ValidationError') {
      message = Object.values(error.errors).map(val => val.message).join(', ');
    } else if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      message = `An account with this ${field} already exists.`;
    } else if (error.message) {
      message = error.message;
    }
    res.status(500).json({ message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email })
      .populate({
        path: 'founderProfile',
        populate: {
          path: 'startups',
          select: 'name logo oneLinePitch slug'
        }
      })
      .populate('investorProfile')
      .populate('jobSeekerProfile');

    if (user && (await user.comparePassword(password))) {
      const token = generateToken(user._id);
      const userPublic = user.toPublicJSON();
      userPublic.token = token;

      res
        .cookie('token', token, cookieOptions)
        .json(userPublic);
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-passwordHash -password')
      .populate({
        path: 'founderProfile',
        populate: {
          path: 'startups',
          select: 'name logo oneLinePitch slug'
        }
      })
      .populate('investorProfile')
      .populate('jobSeekerProfile');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user.toPublicJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
