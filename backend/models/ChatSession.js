const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      // in seconds
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'timeout'],
      default: 'active',
    },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        content: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        flagged: {
          type: Boolean,
          default: false,
        },
        toxicityScore: {
          type: Number,
          default: 0,
        },
      },
    ],
    reports: [
      {
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reportedUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: String,
        description: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'under_review', 'resolved', 'dismissed'],
          default: 'pending',
        },
      },
    ],
    user1Rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
    },
    user2Rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
    },
  },
  { timestamps: true }
);

// Calculate session duration on save
ChatSessionSchema.pre('save', function (next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
