const mongoose = require('mongoose');

const investorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  investorType: {
    type: String,
    enum: ['Angel', 'VC', 'Accelerator', 'Family Office', 'Corporate'],
    default: 'Angel'
  },
  preferredIndustries: [{
    type: String
  }],
  ticketSize: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  preferredStages: [{
    type: String, // e.g., 'Pre-Seed', 'Seed', 'Series A'
  }],
  portfolio: [{
    name: String,
    website: String,
    logo: String
  }],
  activelyInvesting: {
    type: Boolean,
    default: true
  },
  open_to_invest: {
    type: Boolean,
    default: true
  },
  investor_type: {
    type: String
  },
  investment_focus: {
    type: String
  },
  preferred_industries: [{
    type: String
  }],
  ticket_size_min: {
    type: Number,
    default: 0
  },
  ticket_size_max: {
    type: Number,
    default: 0
  },
  location: {
    type: String
  },
  bio: {
    type: String
  },
  portfolio_count: {
    type: Number,
    default: 0
  },
  verified_investor: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InvestorProfile', investorProfileSchema);
