const { Quiz, QuizAttempt } = require('../models/Quiz');
const Progress = require('../models/Progress');
const { awardXP } = require('./userController');
const User = require('../models/User');
const { checkAndAwardBadges } = require('../services/badgeService');

// @desc    Get quiz by topic
// @route   GET /api/quizzes/:id
// @access  Private
const getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    // Don't send correct answers to client
    const quizData = quiz.toObject();
    quizData.questions = quizData.questions.map((q) => ({
      ...q,
      options: q.options.map((o) => ({ _id: o._id, text: o.text })),
    }));
    res.json({ success: true, quiz: quizData });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:id/attempt
// @access  Private
const submitQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const { answers } = req.body; // [{questionId, selectedOptions}]
    const userId = req.user._id;

    // Count previous attempts
    const prevAttempts = await QuizAttempt.countDocuments({ userId, quizId: quiz._id });
    if (quiz.maxAttempts > 0 && prevAttempts >= quiz.maxAttempts) {
      return res.status(400).json({ success: false, message: 'Maximum attempts reached' });
    }

    // Evaluate answers
    let totalPoints = 0;
    let earnedPoints = 0;
    const evaluatedAnswers = quiz.questions.map((question) => {
      totalPoints += question.points;
      const userAnswer = answers.find((a) => a.questionId === question._id.toString());
      const selectedOptions = userAnswer?.selectedOptions || [];

      let isCorrect = false;
      const correctIndices = question.options
        .map((opt, idx) => (opt.isCorrect ? idx : -1))
        .filter((idx) => idx !== -1);

      if (question.type === 'mcq' || question.type === 'trueFalse') {
        isCorrect = selectedOptions.length === 1 && correctIndices.includes(selectedOptions[0]);
      } else if (question.type === 'multiSelect') {
        const sortedSelected = [...selectedOptions].sort();
        const sortedCorrect = [...correctIndices].sort();
        isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
      } else if (question.type === 'codeOutput') {
        isCorrect = selectedOptions.length === 1 && correctIndices.includes(selectedOptions[0]);
      }

      const pts = isCorrect ? question.points : 0;
      earnedPoints += pts;

      return {
        questionId: question._id,
        selectedOptions,
        isCorrect,
        pointsEarned: pts,
        explanation: question.explanation,
        correctOptions: correctIndices,
      };
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;

    // Save attempt
    const attempt = await QuizAttempt.create({
      userId,
      quizId: quiz._id,
      topicId: quiz.topicId,
      answers: evaluatedAnswers,
      score,
      totalPoints,
      earnedPoints,
      passed,
      attemptNumber: prevAttempts + 1,
    });

    // Update progress
    let progress = await Progress.findOne({ userId, topicId: quiz.topicId });
    if (progress) {
      progress.quizAttempts += 1;
      const wasAlreadyPassed = progress.quizPassed;
      if (passed && (!wasAlreadyPassed || score > progress.quizScore)) {
        // Award XP only on first pass
        if (!wasAlreadyPassed) {
          await awardXP(userId, quiz.xpReward || 20);
          await User.findByIdAndUpdate(userId, { $inc: { quizzesPassed: 1 } });
        }
        progress.quizPassed = true;
        progress.quizScore = score;
      }
      // BUG-02 FIX: Mark topic completed when video + quiz both done
      if (progress.videoCompleted && progress.quizPassed && !progress.topicCompleted) {
        progress.topicCompleted = true;
        progress.completedAt = new Date();
        const { Topic } = require('../models/Track');
        const topic = await Topic.findById(quiz.topicId);
        await awardXP(userId, topic?.xpReward || 30);
      }
      await progress.save();

      // Check and award badges after quiz completion (fire-and-forget)
      if (passed) {
        checkAndAwardBadges(userId).catch(() => {});
      }
    }

    res.json({
      success: true,
      attempt: {
        ...attempt.toObject(),
        answers: evaluatedAnswers,
      },
      score,
      passed,
      passingScore: quiz.passingScore,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get quiz attempts for user
// @route   GET /api/quizzes/:id/attempts
// @access  Private
const getAttempts = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find({
      userId: req.user._id,
      quizId: req.params.id,
    }).sort({ createdAt: -1 });
    res.json({ success: true, attempts });
  } catch (err) {
    next(err);
  }
};

module.exports = { getQuiz, submitQuiz, getAttempts };
