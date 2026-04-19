const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const CreditTransaction = require('../models/CreditTransaction');

// @route   GET /api/analytics/dashboard
// @desc    Get analytics dashboard data
// @access  Private (admin)
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      'stats.lastActiveDate': { $gte: thirtyDaysAgo },
    });
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });
    const bannedUsers = await User.countDocuments({ accountStatus: 'banned' });

    // Chat statistics
    const totalChats = await ChatSession.countDocuments();
    const chatsBelastMonth = await ChatSession.countDocuments({
      startTime: { $gte: thirtyDaysAgo },
    });
    const chatsToday = await ChatSession.countDocuments({
      startTime: { $gte: todayStart },
    });
    const avgDuration = await ChatSession.aggregate([
      { $match: { duration: { $gt: 0 } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
    ]);

    // Credit statistics
    const totalCreditsIssued = await CreditTransaction.aggregate([
      { $match: { amount: { $gt: 0 }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const spinsByType = await CreditTransaction.aggregate([
      { $match: { type: 'spin', status: 'completed' } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          new: newUsers,
          banned: bannedUsers,
        },
        chats: {
          total: totalChats,
          lastMonth: chatsBelastMonth,
          today: chatsToday,
          avgDuration: avgDuration[0]?.avgDuration || 0,
        },
        credits: {
          totalIssued: totalCreditsIssued[0]?.total || 0,
          spinCount: spinsByType[0]?.count || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/analytics/user-growth
// @desc    Get user growth over time
// @access  Private (admin)
exports.getUserGrowth = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      });

      data.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/analytics/chat-frequency
// @desc    Get chat frequency by hour/day
// @access  Private (admin)
exports.getChatFrequency = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const chatsByDay = await ChatSession.aggregate([
      {
        $match: {
          startTime: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
          },
          count: { $sum: 1 },
          totalMinutes: { $sum: { $divide: ['$duration', 60] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: chatsByDay,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/analytics/credit-distribution
// @desc    Get credit distribution by type
// @access  Private (admin)
exports.getCreditDistribution = async (req, res) => {
  try {
    const distribution = await CreditTransaction.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/analytics/user-retention
// @desc    Get user retention metrics
// @access  Private (admin)
exports.getUserRetention = async (req, res) => {
  try {
    const cohorts = [];

    // Get last 12 weeks
    for (let week = 0; week < 12; week++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - week * 7 - 7);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      // New users in this week
      const newUsersCount = await User.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate },
      });

      // Active users from this cohort
      const activeFromCohort = await User.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate },
        'stats.lastActiveDate': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });

      cohorts.push({
        weekStart: startDate.toISOString().split('T')[0],
        newUsers: newUsersCount,
        activeAfterWeek1: activeFromCohort,
        retentionRate:
          newUsersCount > 0 ? ((activeFromCohort / newUsersCount) * 100).toFixed(2) : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: cohorts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/analytics/top-users
// @desc    Get top users by various metrics
// @access  Private (admin)
exports.getTopUsers = async (req, res) => {
  try {
    const metric = req.query.metric || 'chats'; // chats, credits, rating

    let query;
    if (metric === 'chats') {
      query = 'stats.totalChats';
    } else if (metric === 'credits') {
      query = 'credits';
    } else if (metric === 'rating') {
      query = 'rating.average';
    }

    const topUsers = await User.find()
      .select('username credits stats rating')
      .sort({ [query]: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: topUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/analytics/system-health
// @desc    Get system health metrics
// @access  Private (admin)
exports.getSystemHealth = async (req, res) => {
  try {
    const health = {
      database: {
        userCount: await User.countDocuments(),
        sessionCount: await ChatSession.countDocuments(),
        transactionCount: await CreditTransaction.countDocuments(),
      },
      activeConnections: 0, // Would come from Socket.io manager
      errorRate: 0, // Would come from error logs
      avgResponseTime: 0, // Would come from monitoring
      uptime: process.uptime(),
    };

    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
