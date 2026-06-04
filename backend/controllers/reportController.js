const Report = require('../models/Report');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private (Admin only)
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporterId', 'name email username')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update report status
// @route   PUT /api/reports/:id/status
// @access  Private (Admin only)
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Reviewed', 'Resolved', 'Dismissed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    report.status = status;
    await report.save();

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    console.error('Error updating report status:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
