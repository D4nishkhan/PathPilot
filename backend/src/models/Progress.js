const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },

    // Video progress
    watchedPercentage: { type: Number, default: 0, min: 0, max: 100 },
    videoCompleted: { type: Boolean, default: false },
    watchTime: { type: Number, default: 0 }, // total seconds watched

    // Quiz progress
    quizPassed: { type: Boolean, default: false },
    quizScore: { type: Number, default: 0 },
    quizAttempts: { type: Number, default: 0 },

    // Notes
    notesRead: { type: Boolean, default: false },

    // Overall topic
    topicCompleted: { type: Boolean, default: false },
    completedAt: Date,

    // Study time per session
    studySessions: [
      {
        date: { type: Date, default: Date.now },
        duration: Number, // minutes
      },
    ],
  },
  { timestamps: true }
);

// Compound index for fast lookups
progressSchema.index({ userId: 1, topicId: 1 }, { unique: true });
progressSchema.index({ userId: 1, trackId: 1 });

module.exports = mongoose.model('Progress', progressSchema);
