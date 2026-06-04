const mongoose = require('mongoose');

const founderProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  startups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup'
  }],
  startupDescription: {
    type: String,
    maxlength: 1000
  },
  pitchDeckUrl: {
    type: String // URL to PDF
  },
  pitchVideoUrl: {
    type: String // YouTube/Vimeo URL
  },
  equityOffering: {
    type: Number, // Percentage 0-100
    min: 0,
    max: 100
  },
  traction: {
    users: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }, // Monthly Revenue
    growthRate: { type: Number, default: 0 } // Percentage
  },
  website: String,
  socialLinks: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FounderProfile', founderProfileSchema);
