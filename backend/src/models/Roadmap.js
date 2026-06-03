const mongoose = require('mongoose');

const weekTaskSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: String,
  estimatedHours: { type: Number, default: 1 },
  resourceType: { type: String, enum: ['video', 'reading', 'practice', 'project'] },
  completed: { type: Boolean, default: false },
});

const weekSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  title: { type: String, required: true },
  goals: [String],
  tasks: [weekTaskSchema],
  milestone: String,
});

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true },
    skill: { type: String, required: true },
    currentLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    dailyHours: { type: Number, required: true, min: 0.5, max: 12 },
    goal: { type: String, required: true },
    weeks: [weekSchema],
    totalWeeks: { type: Number },
    estimatedCompletionDate: { type: Date },
    currentWeek: { type: Number, default: 1 },
    progressPercent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
    aiSummary: { type: String },
    resources: [
      {
        title: String,
        url: String,
        type: { type: String, enum: ['book', 'course', 'docs', 'video', 'tool', 'reading'] },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roadmap', roadmapSchema);
