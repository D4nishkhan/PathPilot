const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  codeBlocks: [
    {
      language: String,
      code: String,
    },
  ],
});

const aiChatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionType: {
      type: String,
      enum: ['tutor', 'interview', 'roadmap'],
      default: 'tutor',
    },
    title: { type: String, default: 'New Chat' },
    messages: [messageSchema],
    context: {
      topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
      trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
      language: String,
    },
    totalMessages: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Interview report schema
const interviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mode: {
      type: String,
      enum: ['java', 'mern', 'dsa', 'hr', 'system-design'],
      required: true,
    },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIChat' },
    questions: [
      {
        question: String,
        userAnswer: String,
        aiEvaluation: String,
        score: { type: Number, min: 0, max: 10 },
        feedback: String,
      },
    ],
    overallScore: { type: Number, min: 0, max: 100 },
    report: {
      strengths: [String],
      weaknesses: [String],
      suggestions: [String],
      verdict: String,
    },
    duration: Number, // minutes
    completedAt: Date,
  },
  { timestamps: true }
);

const AIChat = mongoose.model('AIChat', aiChatSchema);
const Interview = mongoose.model('Interview', interviewSchema);

module.exports = { AIChat, Interview };
