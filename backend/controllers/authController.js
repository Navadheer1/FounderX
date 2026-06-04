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
    const { name, email, password, role } = req.body;

    // Validate role
    if (role && !['founder', 'investor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be founder or investor.' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate unique username if not provided
    let username = req.body.username;
    if (!username) {
      const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      username = baseUsername;
      let isUnique = false;
      let counter = 0;

      while (!isUnique) {
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
          isUnique = true;
        } else {
          counter++;
          username = `${baseUsername}${Math.floor(Math.random() * 1000) + counter}`;
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
      name,
      email,
      password,
      role,
      username
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
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
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
      .populate('founderProfile')
      .populate('investorProfile');

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
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('founderProfile')
      .populate('investorProfile');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user.toPublicJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
