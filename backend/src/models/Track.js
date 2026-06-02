const mongoose = require('mongoose');

// ─── Track Schema ─────────────────────────────────────────────
const trackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    thumbnail: { type: String },
    category: {
      type: String,
      enum: ['backend', 'frontend', 'fullstack', 'data', 'devops', 'mobile', 'dsa', 'ai'],
      required: true,
    },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    isPremium: { type: Boolean, default: false },
    estimatedHours: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    tags: [String],
    isPublished: { type: Boolean, default: false },
    enrolledCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true }
);

// ─── Module Schema ─────────────────────────────────────────────
const moduleSchema = new mongoose.Schema(
  {
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    title: { type: String, required: true },
    description: String,
    order: { type: Number, required: true },
    estimatedHours: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── Topic Schema ──────────────────────────────────────────────
const topicSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    title: { type: String, required: true },
    description: String,
    order: { type: Number, required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    xpReward: { type: Number, default: 30 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Track = mongoose.model('Track', trackSchema);
const Module = mongoose.model('Module', moduleSchema);
const Topic = mongoose.model('Topic', topicSchema);

module.exports = { Track, Module, Topic };
