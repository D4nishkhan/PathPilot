const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, required: true }, // emoji or icon name
    color: { type: String, default: '#6366f1' },
    condition: {
      type: { type: String, enum: ['xp', 'streak', 'videos', 'quizzes', 'track', 'level', 'custom'] },
      threshold: Number,
      trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
    },
    xpReward: { type: Number, default: 50 },
    rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySubscriptionId: String,
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'active',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    amount: Number, // in paise
    currency: { type: String, default: 'INR' },
    paymentHistory: [
      {
        paymentId: String,
        amount: Number,
        date: Date,
        status: String,
      },
    ],
  },
  { timestamps: true }
);

const Badge = mongoose.model('Badge', badgeSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = { Badge, Subscription };
