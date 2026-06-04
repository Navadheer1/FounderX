const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    minlength: 3,
    maxlength: 30
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.linkedinId;
    },
    minlength: 6
  },
  role: {
    type: String,
    enum: ['founder', 'investor'],
    default: 'founder'
  },
  profileImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  about: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  story: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  interests: [{
    type: String,
    trim: true
  }],
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  tagline: {
    type: String,
    maxlength: 100,
    trim: true
  },
  headline: {
    type: String,
    maxlength: 100,
    trim: true
  },
  vision: {
    type: String,
    maxlength: 500,
    trim: true
  },
  experience: [{
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String,
    type: {
      type: String,
      enum: ['work', 'education', 'project'],
      default: 'work'
    }
  }],
  currentRole: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  experienceLevel: {
    type: String,
    trim: true
  },
  tools: [{
    type: String,
    trim: true
  }],
  lookingFor: [{
    type: String,
    trim: true
  }],
  lookingForDescription: {
    type: String,
    maxlength: 500
  },
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'connections'],
      default: 'public'
    },
    messagePermission: {
      type: String,
      enum: ['everyone', 'connections', 'none'],
      default: 'everyone'
    },
    showInvestmentInterests: {
      type: Boolean,
      default: true
    }
  },
  skills: [{
    type: String,
    trim: true
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  savedStartups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup'
  }],
  pinnedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  profileViews: [{
    viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  linkedinId: {
    type: String,
    unique: true,
    sparse: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationProof: {
    type: String, // URL to proof (LinkedIn, Document, etc.)
    trim: true
  },
  verificationType: {
    type: String,
    enum: ['linkedin', 'domain_email', 'document'],
    default: 'linkedin'
  },
  founderScore: {
    type: Number,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  verificationBadge: {
    type: String,
    enum: ['founder', 'investor', 'none'],
    default: 'none'
  },
  socialLinks: {
    linkedin: String,
    twitter: String,
    website: String,
    github: String,
    email: String
  },
  location: {
    country: String,
    city: String
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for role profiles
userSchema.virtual('founderProfile', {
  ref: 'FounderProfile',
  localField: '_id',
  foreignField: 'user',
  justOne: true
});

userSchema.virtual('investorProfile', {
  ref: 'InvestorProfile',
  localField: '_id',
  foreignField: 'user',
  justOne: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile data
userSchema.methods.toPublicJSON = function() {
  const data = {
    _id: this._id,
    name: this.name,
    username: this.username,
    role: this.role,
    profileImage: this.profileImage,
    coverImage: this.coverImage,
    bio: this.bio,
    headline: this.headline,
    about: this.about,
    currentRole: this.currentRole,
    industry: this.industry,
    experienceLevel: this.experienceLevel,
    tools: this.tools,
    lookingFor: this.lookingFor,
    lookingForDescription: this.lookingForDescription,
    privacySettings: this.privacySettings,
    skills: this.skills,
    followers: this.followers,
    following: this.following,
    isVerified: this.isVerified,
    verificationBadge: this.verificationBadge,
    founderScore: this.founderScore || 0,
    socialLinks: this.socialLinks,
    location: this.location,
    subscriptionPlan: this.subscriptionPlan,
    story: this.story,
    interests: this.interests,
    isProfileComplete: this.isProfileComplete,
    createdAt: this.createdAt
  };

  if (this.role === 'founder' && this.founderProfile) {
    data.roleProfile = this.founderProfile;
  } else if (this.role === 'investor' && this.investorProfile) {
    data.roleProfile = this.investorProfile;
  }

  return data;
};

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'skills': 1 });
userSchema.index({ 'location.country': 1 });

module.exports = mongoose.model('User', userSchema);
