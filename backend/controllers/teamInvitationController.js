const TeamInvitation = require('../models/TeamInvitation');
const Startup = require('../models/Startup');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { createNotification } = require('../utils/socialHelpers');

// @desc    Create a new team/co-founder invitation
// @route   POST /api/team-invitations
// @access  Private (Founder only)
exports.createInvitation = async (req, res) => {
  try {
    const { startupId, recipientId, role, message } = req.body;
    const senderId = req.user.id;

    if (!startupId || !recipientId) {
      return res.status(400).json({ success: false, error: 'Startup ID and Recipient ID are required' });
    }

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Verify sender owns the startup
    if (startup.founderId.toString() !== senderId.toString()) {
      return res.status(403).json({ success: false, error: 'Only the startup founder can invite team members' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, error: 'Recipient user not found' });
    }

    // Check if recipient is already in team
    const isAlreadyMember = startup.teamMembers.some(member => member.userId && member.userId.toString() === recipientId.toString());
    if (isAlreadyMember) {
      return res.status(400).json({ success: false, error: 'User is already a member of this startup' });
    }

    // Check for duplicate pending request
    const existingInvite = await TeamInvitation.findOne({
      startupId,
      recipientId,
      status: 'pending'
    });

    if (existingInvite) {
      return res.status(400).json({ success: false, error: 'Invitation already pending for this user' });
    }

    const invitation = await TeamInvitation.create({
      startupId,
      senderId,
      recipientId,
      role: role || 'co-founder',
      message: message || '',
      status: 'pending'
    });

    // Create notification for recipient
    await createNotification({
      recipient: recipientId,
      sender: senderId,
      type: 'co_founder_invite',
      entityId: invitation._id,
      entityType: 'TeamInvitation',
      content: `Invited you to join ${startup.name} as a ${role || 'co-founder'}`
    }, req.app.get('io'));

    res.status(201).json({
      success: true,
      data: invitation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get sent/received team invitations
// @route   GET /api/team-invitations
// @access  Private
exports.getInvitations = async (req, res) => {
  try {
    const userId = req.user.id;

    const invitations = await TeamInvitation.find({
      $or: [
        { recipientId: userId },
        { senderId: userId }
      ]
    })
    .populate('startupId', 'name logo oneLinePitch')
    .populate('senderId', 'name profileImage role')
    .populate('recipientId', 'name profileImage role')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update invitation status (Accept/Reject)
// @route   PUT /api/team-invitations/:id/status
// @access  Private
exports.updateInvitationStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted', 'rejected'
    const invitationId = req.params.id;
    const userId = req.user.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const invite = await TeamInvitation.findById(invitationId);
    if (!invite) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    // Verify user is the recipient of the invite
    if (invite.recipientId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to respond to this invitation' });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Invitation already responded to' });
    }

    invite.status = status;
    await invite.save();

    const startup = await Startup.findById(invite.startupId);
    const recipient = await User.findById(userId);

    if (status === 'accepted') {
      // Add user to teamMembers
      if (startup) {
        const alreadyMember = startup.teamMembers.some(member => member.userId && member.userId.toString() === userId.toString());
        if (!alreadyMember) {
          startup.teamMembers.push({
            userId: recipient._id,
            name: recipient.name,
            role: invite.role === 'co-founder' ? 'Co-founder' : 'Team Member',
            image: recipient.profileImage,
            linkedin: recipient.socialLinks?.linkedin || ''
          });
          await startup.save();
        }

        // Auto-provision Startup Group Chat
        // Find existing group chat for this startup
        let groupChat = await Conversation.findOne({
          isGroup: true,
          groupName: startup.name,
          groupAdmin: invite.senderId
        });

        const participants = [invite.senderId, userId];
        // Collect existing team members
        startup.teamMembers.forEach(m => {
          if (m.userId && !participants.includes(m.userId.toString())) {
            participants.push(m.userId.toString());
          }
        });

        if (!groupChat) {
          groupChat = await Conversation.create({
            participants,
            initiator: invite.senderId,
            status: 'accepted',
            isGroup: true,
            groupName: startup.name,
            groupAdmin: invite.senderId,
            unreadCount: {}
          });

          // Create system message in group chat
          await Message.create({
            conversationId: groupChat._id,
            sender: invite.senderId,
            content: `Startup group chat created for ${startup.name}. Welcome to the team!`,
            type: 'text',
            readBy: [invite.senderId]
          });
        } else {
          // Update participants to include the new member
          groupChat.participants = participants;
          await groupChat.save();

          // Create join announcement
          await Message.create({
            conversationId: groupChat._id,
            sender: invite.senderId,
            content: `${recipient.name} joined the startup team as a ${invite.role}.`,
            type: 'text',
            readBy: [invite.senderId]
          });
        }
      }

      // Notify founder
      await createNotification({
        recipient: invite.senderId,
        sender: userId,
        type: 'invite_accepted',
        entityId: invite._id,
        entityType: 'TeamInvitation',
        content: `${recipient.name} accepted your invitation to join ${startup.name}`
      }, req.app.get('io'));

    } else {
      // Rejected
      // Notify founder
      await createNotification({
        recipient: invite.senderId,
        sender: userId,
        type: 'invite_rejected',
        entityId: invite._id,
        entityType: 'TeamInvitation',
        content: `${recipient.name} declined your invitation to join ${startup.name}`
      }, req.app.get('io'));
    }

    res.status(200).json({
      success: true,
      data: invite
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
