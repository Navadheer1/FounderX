const Question = require('../models/Question');
const User = require('../models/User');
const Startup = require('../models/Startup');

// @desc    Ask a question (Anonymous or Signed)
// @route   POST /api/questions
// @access  Public (but we track IP if needed, currently just optional Auth)
exports.askQuestion = async (req, res) => {
  try {
    const { content, targetId, targetType, isAnonymous } = req.body;

    // Validate target
    if (targetType === 'User') {
      const user = await User.findById(targetId);
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    } else if (targetType === 'Startup') {
      const startup = await Startup.findById(targetId);
      if (!startup) return res.status(404).json({ success: false, error: 'Startup not found' });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid target type' });
    }

    // Rate limiting check could go here

    const question = await Question.create({
      content,
      targetId,
      targetType,
      authorId: (req.user && !isAnonymous) ? req.user.id : null
    });

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get public questions for a target
// @route   GET /api/questions/:targetType/:targetId
// @access  Public
exports.getQuestions = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    // Only show answered questions publicly, or ones explicitly marked public
    // And ensure not hidden
    const query = {
      targetType: targetType.charAt(0).toUpperCase() + targetType.slice(1), // Capitalize
      targetId,
      isPublic: true,
      isHidden: false
    };

    const questions = await Question.find(query)
      .sort({ answeredAt: -1, createdAt: -1 })
      .populate('authorId', 'name username profileImage'); // Populate if signed

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get inbox (unanswered questions)
// @route   GET /api/questions/inbox
// @access  Private
exports.getInbox = async (req, res) => {
  try {
    // User's personal questions
    const userQuestions = await Question.find({
      targetId: req.user.id,
      targetType: 'User',
      answer: { $exists: false }, // Unanswered
      isHidden: false
    }).sort({ createdAt: -1 });

    // User's startups questions
    // Find startups where user is founder
    const startups = await Startup.find({ founderId: req.user.id });
    const startupIds = startups.map(s => s._id);

    const startupQuestions = await Question.find({
      targetId: { $in: startupIds },
      targetType: 'Startup',
      answer: { $exists: false },
      isHidden: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        user: userQuestions,
        startups: startupQuestions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Answer a question
// @route   PUT /api/questions/:id/answer
// @access  Private
exports.answerQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    // Verify ownership
    let isOwner = false;
    if (question.targetType === 'User') {
      if (question.targetId.toString() === req.user.id) isOwner = true;
    } else if (question.targetType === 'Startup') {
      const startup = await Startup.findById(question.targetId);
      if (startup && startup.founderId.toString() === req.user.id) isOwner = true;
    }

    if (!isOwner) {
      return res.status(401).json({ success: false, error: 'Not authorized to answer this question' });
    }

    question.answer = req.body.answer;
    question.answeredAt = Date.now();
    question.isPublic = true; // Make public upon answering

    await question.save();

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Hide a question
// @route   PUT /api/questions/:id/hide
// @access  Private
exports.hideQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    // Verify ownership
    let isOwner = false;
    if (question.targetType === 'User') {
      if (question.targetId.toString() === req.user.id) isOwner = true;
    } else if (question.targetType === 'Startup') {
      const startup = await Startup.findById(question.targetId);
      if (startup && startup.founderId.toString() === req.user.id) isOwner = true;
    }

    if (!isOwner) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    question.isHidden = true;
    await question.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};
