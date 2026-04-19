const mongoose = require('mongoose');

const CreditTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['spin', 'gift', 'purchase', 'referral', 'admin_grant', 'filter_unlock', 'daily_bonus'],
      required: true,
    },
    description: String,
    relatedSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed',
    },
    metadata: {
      reason: String,
      wheelResult: String, // e.g., "+50 from Daily Wheel"
      paymentMethod: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true, // Index for faster lookups
    },
  },
  { timestamps: true }
);

// Create index for user + createdAt to speed up transaction history queries
CreditTransactionSchema.index({ user: 1, createdAt: -1 });

// Statics to create transactions
CreditTransactionSchema.statics.createTransaction = async function (
  userId,
  amount,
  type,
  description,
  metadata = {}
) {
  const transaction = await this.create({
    user: userId,
    amount,
    type,
    description,
    metadata,
  });

  // Update user's credit balance
  const User = require('./User');
  await User.findByIdAndUpdate(userId, { $inc: { credits: amount } });

  return transaction;
};

module.exports = mongoose.model('CreditTransaction', CreditTransactionSchema);
