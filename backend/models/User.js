const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't return password on queries by default
    },
    credits: {
      type: Number,
      default: 100, // Starting credits
      min: 0,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'banned', 'pending_verification'],
      default: 'active',
    },
    profilePicture: {
      type: String,
      default: null,
    },
    displayName: {
      type: String,
      maxlength: 50,
    },
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    dailySpinUsed: {
      type: Boolean,
      default: false,
    },
    lastSpinDate: {
      type: Date,
      default: null,
    },
    preferences: {
      language: {
        type: String,
        enum: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
        default: 'en',
      },
      ageMin: {
        type: Number,
        default: 18,
        min: 18,
      },
      ageMax: {
        type: Number,
        default: 65,
        min: 18,
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
      privateMode: {
        type: Boolean,
        default: false,
      },
    },
    stats: {
      totalChats: {
        type: Number,
        default: 0,
      },
      totalMinutes: {
        type: Number,
        default: 0,
      },
      currentStreak: {
        type: Number,
        default: 0,
      },
      lastActiveDate: {
        type: Date,
        default: null,
      },
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reportedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Middleware to hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get public profile (exclude sensitive data)
UserSchema.methods.getPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.blockedUsers;
  delete obj.reportedUsers;
  return obj;
};

// Reset daily spin at midnight
UserSchema.statics.resetDailySpins = async function () {
  return await this.updateMany(
    { dailySpinUsed: true },
    {
      dailySpinUsed: false,
      lastSpinDate: new Date(),
    }
  );
};

module.exports = mongoose.model('User', UserSchema);
