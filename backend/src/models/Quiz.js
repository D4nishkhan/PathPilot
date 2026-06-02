const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
  explanation: String,
});

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'multiSelect', 'codeOutput', 'trueFalse'],
    required: true,
  },
  question: { type: String, required: true },
  code: String, // For codeOutput type
  language: { type: String, default: 'javascript' },
  options: [optionSchema],
  explanation: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  points: { type: Number, default: 10 },
});

const quizSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    title: { type: String, required: true },
    description: String,
    questions: [questionSchema],
    passingScore: { type: Number, default: 70 }, // percentage
    timeLimit: { type: Number }, // seconds, null = no limit
    maxAttempts: { type: Number, default: 0 }, // 0 = unlimited
    xpReward: { type: Number, default: 20 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOptions: [Number], // indices
        isCorrect: Boolean,
        pointsEarned: Number,
      },
    ],
    score: { type: Number, required: true }, // percentage
    totalPoints: { type: Number, default: 0 },
    earnedPoints: { type: Number, default: 0 },
    passed: { type: Boolean, required: true },
    timeTaken: { type: Number }, // seconds
    attemptNumber: { type: Number, default: 1 },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Quiz = mongoose.model('Quiz', quizSchema);
const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

module.exports = { Quiz, QuizAttempt };
