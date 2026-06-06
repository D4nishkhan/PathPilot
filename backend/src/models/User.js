const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    planExpiry: { type: Date },

    // Gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    longestStreak: { type: Number, default: 0 },

    // Stats
    totalStudyTime: { type: Number, default: 0 }, // minutes
    videosCompleted: { type: Number, default: 0 },
    quizzesPassed: { type: Number, default: 0 },

    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: String,
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────
// email is already indexed via unique:true in the schema field definition.
// Additional indexes for common query patterns:
userSchema.index({ xp: -1 });            // leaderboard: sort by XP descending
userSchema.index({ plan: 1 });           // admin queries filter by plan
userSchema.index({ role: 1 });           // admin queries filter by role
userSchema.index({ createdAt: -1 });     // admin analytics: newest users first

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get level from XP
userSchema.methods.calculateLevel = function () {
  const xpThresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000, 13000, 17000, 22000];
  let level = 1;
  for (let i = 0; i < xpThresholds.length; i++) {
    if (this.xp >= xpThresholds[i]) level = i + 1;
  }
  return level;
};

// Update streak
userSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!this.lastActiveDate) {
    this.streak = 1;
  } else {
    const lastActive = new Date(this.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    const diff = (today - lastActive) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      this.streak += 1;
    } else if (diff > 1) {
      this.streak = 1;
    }
  }
  if (this.streak > this.longestStreak) this.longestStreak = this.streak;
  this.lastActiveDate = new Date();
};

module.exports = mongoose.model('User', userSchema);