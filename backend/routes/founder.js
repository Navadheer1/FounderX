const express = require('express');
const router = express.Router();
const Startup = require('../models/Startup');
const JobApplication = require('../models/JobApplication');
const StartupTeamMember = require('../models/StartupTeamMember');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const StartupRoleRequest = require('../models/StartupRoleRequest');
const { protect } = require('../middleware/auth');
const { createNotification } = require('../utils/socialHelpers');

// Helper to create notifications robustly
const sendNotify = async (req, recipientId, type, entityId, entityType, messageText) => {
  try {
    await Notification.create({
      recipient: recipientId,
      recipientId: recipientId,
      sender: req.user.id,
      senderId: req.user.id,
      type,
      entityId,
      entityType,
      message: messageText,
      content: messageText,
      isRead: false
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// @desc    Get received job applications for all startups owned by this founder
// @route   GET /api/founder/applications
// @access  Private
router.get('/applications', protect, async (req, res) => {
  try {
    // Find all startups owned by this founder
    const startups = await Startup.find({ founderId: req.user.id });
    const startupIds = startups.map(s => s._id);

    const filter = { startupId: { $in: startupIds } };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const applications = await JobApplication.find(filter)
      .populate('applicantId', 'name fullName email profileImage headline skills socialLinks')
      .populate('jobId')
      .populate('startupId', 'name logo industry')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Get single job application and update status to reviewed if pending
// @route   GET /api/founder/applications/:applicationId
// @access  Private
router.get('/applications/:applicationId', protect, async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.applicationId)
      .populate('applicantId', 'name fullName email profileImage headline skills socialLinks bio location')
      .populate('jobId')
      .populate('startupId', 'name logo industry founderId');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Auth check: Make sure founder owns the startup
    if (application.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // Update status to reviewed if it was pending
    if (application.status === 'pending') {
      application.status = 'reviewed';
      application.reviewedAt = new Date();
      await application.save();
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Update application status directly (Accept, Reject, Shortlist)
// @route   PATCH /api/founder/applications/:applicationId/status
// @access  Private
router.patch('/applications/:applicationId/status', protect, async (req, res) => {
  try {
    const { status } = req.body; // shortlisted, accepted, rejected, etc.
    const application = await JobApplication.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    application.status = status;
    if (status === 'accepted') {
      application.acceptedAt = new Date();
      
      // Auto-unlock messaging upon acceptance if not already unlocked
      let conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, application.applicantId] },
        type: 'direct'
      });
      if (!conversation) {
        await Conversation.create({
          participants: [req.user.id, application.applicantId],
          initiator: req.user.id,
          type: 'direct',
          applicationId: application._id,
          startupId: application.startupId,
          status: 'accepted'
        });
      } else if (conversation.status !== 'accepted') {
        conversation.status = 'accepted';
        await conversation.save();
      }

      await sendNotify(req, application.applicantId, 'invite_accepted', application._id, 'JobApplication', `Your application to ${application.startupId.name || 'Startup'} has been accepted!`);
    } else if (status === 'rejected') {
      application.rejectedAt = new Date();
      await sendNotify(req, application.applicantId, 'invite_rejected', application._id, 'JobApplication', `Your application for the role has been rejected.`);
    }

    await application.save();

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Connect with applicant (unlocks messaging, status = connected)
// @route   POST /api/founder/applications/:applicationId/connect
// @access  Private
router.post('/applications/:applicationId/connect', protect, async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    application.status = 'connected';
    application.connectedAt = new Date();
    await application.save();

    // Unlock direct messaging by creating / updating Conversation status to 'accepted'
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, application.applicantId] },
      type: 'direct'
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, application.applicantId],
        initiator: req.user.id,
        type: 'direct',
        applicationId: application._id,
        startupId: application.startupId,
        status: 'accepted'
      });
    } else {
      conversation.status = 'accepted';
      await conversation.save();
    }

    // Send notification
    const startup = await Startup.findById(application.startupId);
    await sendNotify(req, application.applicantId, 'invite_accepted', application._id, 'JobApplication', `${req.user.fullName || req.user.name} wants to connect with you for the role at ${startup ? startup.name : 'Startup'}.`);

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Hire applicant and add to startup team
// @route   POST /api/founder/applications/:applicationId/hire
// @access  Private
router.post('/applications/:applicationId/hire', protect, async (req, res) => {
  try {
    const { teamRole, startDate, workMode, notes } = req.body;
    const application = await JobApplication.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // 1. Update application status to hired
    application.status = 'hired';
    application.hiredAt = new Date();
    await application.save();

    // 2. Add to StartupTeamMember
    const applicantUser = await User.findById(application.applicantId);
    
    let teamMember = await StartupTeamMember.findOne({
      startupId: application.startupId,
      userId: application.applicantId
    });

    if (!teamMember) {
      teamMember = await StartupTeamMember.create({
        startupId: application.startupId,
        userId: application.applicantId,
        addedBy: req.user.id,
        sourceApplicationId: application._id,
        teamRole: teamRole || 'Developer',
        workMode: workMode || 'Remote',
        startDate: startDate || new Date(),
        status: 'active',
        joinedAt: new Date(),
        // legacy fields
        role: teamRole || 'Developer',
        name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
        image: applicantUser ? applicantUser.profileImage : '',
        linkedin: applicantUser?.socialLinks?.linkedin || ''
      });
    }

    // 3. Update Startup model teamMembers array
    const startup = await Startup.findById(application.startupId);
    if (startup) {
      const isAlreadyInStartupArray = startup.teamMembers.some(
        m => m.userId && m.userId.toString() === application.applicantId.toString()
      );
      if (!isAlreadyInStartupArray) {
        startup.teamMembers.push({
          userId: application.applicantId,
          name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
          role: teamRole || 'Developer',
          image: applicantUser ? applicantUser.profileImage : '',
          linkedin: applicantUser?.socialLinks?.linkedin || ''
        });
        await startup.save();
      }

      // 4. Add applicant to Startup Group Chat
      let groupChat = await Conversation.findOne({
        type: 'group',
        startupId: startup._id
      });

      if (!groupChat) {
        // Fallback checks groupName for legacy support
        groupChat = await Conversation.findOne({
          isGroup: true,
          groupName: startup.name
        });
      }

      if (!groupChat) {
        groupChat = await Conversation.create({
          participants: [req.user.id, application.applicantId],
          initiator: req.user.id,
          type: 'group',
          isGroup: true,
          groupName: startup.name,
          groupAdmin: req.user.id,
          startupId: startup._id,
          status: 'accepted'
        });
      } else {
        if (!groupChat.participants.includes(application.applicantId)) {
          groupChat.participants.push(application.applicantId);
          await groupChat.save();
        }
      }
    }

    // 5. Send Notification
    await sendNotify(req, application.applicantId, 'invite_accepted', teamMember._id, 'User', `You have been added to the ${startup ? startup.name : 'Startup'} team as ${teamRole || 'Developer'}!`);

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Get received role requests for all startups owned by this founder
// @route   GET /api/founder/role-requests
// @access  Private
router.get('/role-requests', protect, async (req, res) => {
  try {
    const startups = await Startup.find({ founderId: req.user.id });
    const startupIds = startups.map(s => s._id);

    const filter = { startupId: { $in: startupIds } };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await StartupRoleRequest.find(filter)
      .populate('applicantId', 'name fullName email profileImage headline skills socialLinks bio location jobSeekerProfile')
      .populate('startupId', 'name logo industry')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Update custom role request status directly
// @route   PATCH /api/founder/role-requests/:requestId/status
// @access  Private
router.patch('/role-requests/:requestId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await StartupRoleRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    request.status = status;
    const startup = await Startup.findById(request.startupId);
    const startupName = startup ? startup.name : 'Startup';

    if (status === 'accepted') {
      // Auto-unlock messaging upon acceptance
      let conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, request.applicantId] },
        type: 'direct'
      });
      if (!conversation) {
        await Conversation.create({
          participants: [req.user.id, request.applicantId],
          initiator: req.user.id,
          type: 'direct',
          startupId: request.startupId,
          status: 'accepted'
        });
      } else if (conversation.status !== 'accepted') {
        conversation.status = 'accepted';
        await conversation.save();
      }

      await sendNotify(req, request.applicantId, 'invite_accepted', request._id, 'StartupRoleRequest', `Your custom role request to join ${startupName} has been accepted!`);
    } else if (status === 'rejected') {
      await sendNotify(req, request.applicantId, 'invite_rejected', request._id, 'StartupRoleRequest', `Your custom role request to join ${startupName} was not accepted.`);
    }

    await request.save();

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Connect with custom role applicant (unlocks messaging, status = connected)
// @route   POST /api/founder/role-requests/:requestId/connect
// @access  Private
router.post('/role-requests/:requestId/connect', protect, async (req, res) => {
  try {
    const request = await StartupRoleRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    request.status = 'connected';
    await request.save();

    // Unlock direct messaging
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, request.applicantId] },
      type: 'direct'
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, request.applicantId],
        initiator: req.user.id,
        type: 'direct',
        startupId: request.startupId,
        status: 'accepted'
      });
    } else {
      conversation.status = 'accepted';
      await conversation.save();
    }

    // Send notification
    const startup = await Startup.findById(request.startupId);
    await sendNotify(
      req, 
      request.applicantId, 
      'invite_accepted', 
      request._id, 
      'StartupRoleRequest', 
      `${req.user.fullName || req.user.name} wants to connect with you regarding your application to ${startup ? startup.name : 'Startup'}.`
    );

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Hire custom role applicant and add to startup team
// @route   POST /api/founder/role-requests/:requestId/hire
// @access  Private
router.post('/role-requests/:requestId/hire', protect, async (req, res) => {
  try {
    const { teamRole, startDate, workMode, notes } = req.body;
    const request = await StartupRoleRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // 1. Update request status to hired
    request.status = 'hired';
    await request.save();

    // 2. Add to StartupTeamMember
    const applicantUser = await User.findById(request.applicantId);
    
    let teamMember = await StartupTeamMember.findOne({
      startupId: request.startupId,
      userId: request.applicantId
    });

    const finalRole = teamRole || request.roleTitle || 'Team Member';

    if (!teamMember) {
      teamMember = await StartupTeamMember.create({
        startupId: request.startupId,
        userId: request.applicantId,
        addedBy: req.user.id,
        teamRole: finalRole,
        workMode: workMode || 'Remote',
        startDate: startDate || new Date(),
        status: 'active',
        joinedAt: new Date(),
        // legacy fields
        role: finalRole,
        name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
        image: applicantUser ? applicantUser.profileImage : '',
        linkedin: applicantUser?.socialLinks?.linkedin || request.linkedin || ''
      });
    }

    // 3. Update Startup model teamMembers array
    const startup = await Startup.findById(request.startupId);
    if (startup) {
      const isAlreadyInStartupArray = startup.teamMembers.some(
        m => m.userId && m.userId.toString() === request.applicantId.toString()
      );
      if (!isAlreadyInStartupArray) {
        startup.teamMembers.push({
          userId: request.applicantId,
          name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
          role: finalRole,
          image: applicantUser ? applicantUser.profileImage : '',
          linkedin: applicantUser?.socialLinks?.linkedin || request.linkedin || ''
        });
        await startup.save();
      }

      // 4. Add applicant to Startup Group Chat
      let groupChat = await Conversation.findOne({
        type: 'group',
        startupId: startup._id
      });

      if (!groupChat) {
        groupChat = await Conversation.findOne({
          isGroup: true,
          groupName: startup.name
        });
      }

      if (!groupChat) {
        groupChat = await Conversation.create({
          participants: [req.user.id, request.applicantId],
          initiator: req.user.id,
          type: 'group',
          isGroup: true,
          groupName: startup.name,
          groupAdmin: req.user.id,
          startupId: startup._id,
          status: 'accepted'
        });
      } else {
        if (!groupChat.participants.includes(request.applicantId)) {
          groupChat.participants.push(request.applicantId);
          await groupChat.save();
        }
      }
    }

    // 5. Send Notification
    await sendNotify(req, request.applicantId, 'invite_accepted', teamMember._id, 'User', `You have been added to the ${startup ? startup.name : 'Startup'} team as ${finalRole}!`);

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
