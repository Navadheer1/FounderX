const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');
const Startup = require('../models/Startup');

exports.submitRequest = async (req, res) => {
  try {
    const { targetType, targetId, type, proof } = req.body;

    // Validate ownership
    if (targetType === 'User') {
        if (targetId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        await User.findByIdAndUpdate(targetId, {
            verificationStatus: 'pending',
            verificationProof: proof,
            verificationType: type
        });
    } else if (targetType === 'Startup') {
        const startup = await Startup.findById(targetId);
        if (!startup) {
            return res.status(404).json({ success: false, error: 'Startup not found' });
        }
        if (startup.founderId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        await Startup.findByIdAndUpdate(targetId, {
            verificationStatus: 'pending',
            verificationProof: proof
        });
    }

    const request = await VerificationRequest.create({
      requesterId: req.user.id,
      targetType,
      targetId,
      type,
      proof
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getRequests = async (req, res) => {
    try {
        const requests = await VerificationRequest.find({ status: 'pending' })
            .populate('requesterId', 'name email')
            .sort('-createdAt');
        
        // We can't easily populate polymorphic targetId in one go with simple mongoose unless we use specific strategies, 
        // but let's try to fetch them or let the frontend handle it by ID if needed.
        // Or we can iterate and populate manually if needed.
        // For now, let's return the requests.
        
        res.status(200).json({ success: true, data: requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.reviewRequest = async (req, res) => {
    try {
        const { status, adminComment } = req.body; // 'approved' or 'rejected'
        const request = await VerificationRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        request.status = status;
        request.adminComment = adminComment;
        request.reviewedBy = req.user.id;
        request.reviewedAt = Date.now();
        await request.save();

        const updateData = {
            verificationStatus: status === 'approved' ? 'verified' : 'rejected',
            isVerified: status === 'approved'
        };

        if (request.targetType === 'User') {
            await User.findByIdAndUpdate(request.targetId, updateData);
        } else {
            await Startup.findByIdAndUpdate(request.targetId, updateData);
        }

        res.status(200).json({ success: true, data: request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
