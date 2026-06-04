const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId, // If applying for a specific job/internship
  },
  type: {
    type: String,
    enum: ['Job', 'Internship', 'Collaboration'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: String,
  resumeUrl: String,
  portfolioUrl: String,
  collaborationDetails: {
    skills: [String],
    idea: String,
    availability: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Application', applicationSchema);
