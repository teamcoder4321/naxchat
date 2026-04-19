const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');

// @route   GET /api/credits/balance
// @desc    Get user's credit balance
// @access  Private
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      credits: user.credits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   GET /api/credits/history
// @desc    Get user's credit transaction history
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await CreditTransaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CreditTransaction.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      transactions,
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

// @route   POST /api/credits/spin-wheel
// @desc    Spin the daily wheel
// @access  Private
exports.spinWheel = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Check if user already spun today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.dailySpinUsed) {
      const lastSpin = new Date(user.lastSpinDate);
      lastSpin.setHours(0, 0, 0, 0);

      if (lastSpin.getTime() === today.getTime()) {
        return res.status(400).json({
          success: false,
          message: 'You have already spun the wheel today. Come back tomorrow!',
        });
      }
    }

    // Generate random prize (server-side to prevent cheating)
    const prizes = [
      { amount: 5, label: '+5' },
      { amount: 10, label: '+10' },
      { amount: 15, label: '+15' },
      { amount: 25, label: '+25' },
      { amount: 30, label: '+30' },
      { amount: 50, label: '+50' },
      { amount: 100, label: '+100' },
      { amount: 500, label: 'JACKPOT +500' },
    ];

    const prize = prizes[Math.floor(Math.random() * prizes.length)];

    // Create transaction
    await CreditTransaction.createTransaction(
      user._id,
      prize.amount,
      'spin',
      'Daily Wheel Spin',
      { wheelResult: prize.label }
    );

    // Update spin status
    user.dailySpinUsed = true;
    user.lastSpinDate = new Date();
    await user.save();

    // Get updated user
    const updatedUser = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      won: prize.amount,
      label: prize.label,
      newBalance: updatedUser.credits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   POST /api/credits/spend
// @desc    Spend credits (for features/filters)
// @access  Private
exports.spendCredits = async (req, res) => {
  try {
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    const user = await User.findById(req.user.id);

    if (user.credits < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits',
      });
    }

    // Create transaction
    await CreditTransaction.createTransaction(user._id, -amount, 'purchase', reason);

    // Get updated user
    const updatedUser = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      spent: amount,
      newBalance: updatedUser.credits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @route   POST /api/credits/grant
// @desc    Admin grant credits to user
// @access  Private (admin only)
exports.grantCredits = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and amount',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Create transaction
    await CreditTransaction.createTransaction(
      userId,
      amount,
      'admin_grant',
      reason || 'Admin grant'
    );

    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      granted: amount,
      newBalance: updatedUser.credits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
