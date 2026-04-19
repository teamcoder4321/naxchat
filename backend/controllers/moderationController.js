const ChatSession = require('../models/ChatSession');
const User = require('../models/User');

// @route   POST /api/moderation/report
// @desc    Report a user
// @access  Private
exports.reportUser = async (req, res) => {
  try {
    const { reportedUserId, reason, description, sessionId } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reportedUserId and reason',
      });
    }

    // Find the chat session if provided
    let chatSession = null;
    if (sessionId) {
      chatSession = await ChatSession.findById(sessionId);
    }

    // Add report to session if available
    if (chatSession) {
      chatSession.reports.push({
        reportedBy: req.user.id,
        reportedUser: reportedUserId,
        reason,
        description,
        status: 'pending',
      });
      await chatSession.save();
    }

    // Add to user's reported list
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { reportedUsers: reportedUserId },
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our team will review it within 24 hours.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   POST /api/moderation/block
// @desc    Block a user
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const { blockedUserId } = req.body;

    if (!blockedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide blockedUserId',
      });
    }

    // Add to blocked list
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { blockedUsers: blockedUserId },
    });

    res.status(200).json({
      success: true,
      message: 'User blocked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   DELETE /api/moderation/unblock/:userId
// @desc    Unblock a user
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { blockedUsers: userId },
    });

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/moderation/blocked
// @desc    Get list of blocked users
// @access  Private
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('blockedUsers', 'username email');

    res.status(200).json({
      success: true,
      blockedUsers: user.blockedUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   POST /api/moderation/ban/:userId
// @desc    Ban a user (admin only)
// @access  Private (admin)
exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        accountStatus: 'banned',
        banReason: reason || 'No reason provided',
        bannedAt: new Date(),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `User ${user.username} has been banned`,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   POST /api/moderation/suspend/:userId
// @desc    Suspend a user (admin only)
// @access  Private (admin)
exports.suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, days = 7 } = req.body;

    const suspendUntil = new Date();
    suspendUntil.setDate(suspendUntil.getDate() + days);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        accountStatus: 'suspended',
        suspendReason: reason || 'No reason provided',
        suspendedAt: new Date(),
        suspendUntil,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `User ${user.username} has been suspended until ${suspendUntil.toDateString()}`,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/moderation/session/:sessionId
// @desc    Get chat session for review
// @access  Private (admin)
exports.getSessionForReview = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findById(sessionId)
      .populate('user1', 'username email')
      .populate('user2', 'username email')
      .populate('reports.reportedBy', 'username')
      .populate('reports.reportedUser', 'username');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/moderation/reports
// @desc    Get all pending reports (admin only)
// @access  Private (admin)
exports.getPendingReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const skip = (page - 1) * limit;

    const sessions = await ChatSession.find({ 'reports.status': status })
      .populate('user1', 'username email')
      .populate('user2', 'username email')
      .populate('reports.reportedBy', 'username')
      .populate('reports.reportedUser', 'username')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChatSession.countDocuments({ 'reports.status': status });

    const reports = [];
    sessions.forEach((session) => {
      session.reports
        .filter((r) => r.status === status)
        .forEach((report) => {
          reports.push({
            ...report.toObject(),
            sessionId: session._id,
            duration: session.duration,
          });
        });
    });

    res.status(200).json({
      success: true,
      reports,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   PUT /api/moderation/report/:reportId/status
// @desc    Update report status (admin only)
// @access  Private (admin)
exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, resolution } = req.body;

    const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const result = await ChatSession.findOneAndUpdate(
      { 'reports._id': reportId },
      {
        $set: {
          'reports.$.status': status,
          'reports.$.resolution': resolution || '',
          'reports.$.resolvedAt': new Date(),
        },
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report status updated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
