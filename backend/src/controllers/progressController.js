const Progress = require('../models/Progress');
const { Topic, Module, Track } = require('../models/Track');
const { awardXP } = require('./userController');
const User = require('../models/User');
const { checkAndAwardBadges } = require('../services/badgeService');

// @desc    Update video progress
// @route   POST /api/progress/video
// @access  Private
const updateVideoProgress = async (req, res, next) => {
  try {
    const { topicId, watchedPercentage, watchTime } = req.body;
    const userId = req.user._id;

    const topic = await Topic.findById(topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    let progress = await Progress.findOne({ userId, topicId });
    if (!progress) {
      progress = new Progress({
        userId,
        topicId,
        moduleId: topic.moduleId,
        trackId: topic.trackId,
      });
    }

    progress.watchedPercentage = Math.max(progress.watchedPercentage, watchedPercentage);
    if (watchTime) {
      progress.watchTime += watchTime;
      // Track study session for analytics chart
      progress.studySessions.push({ date: new Date(), duration: Math.round(watchTime / 60) });
    }

    // Mark video completed at >= 80%
    const justCompleted = !progress.videoCompleted && progress.watchedPercentage >= 80;
    if (justCompleted) {
      progress.videoCompleted = true;
      await awardXP(userId, 10);
      await User.findByIdAndUpdate(userId, { $inc: { videosCompleted: 1 } });
    }

    // BUG-02 FIX: Mark topic completed when:
    //   - Video is done AND quiz is passed (topics with quiz)
    //   - Video is done AND topic has no quiz (video-only topics)
    const topicHasQuiz = !!topic.quizId;
    const quizRequirementMet = !topicHasQuiz || progress.quizPassed;
    if (progress.videoCompleted && quizRequirementMet && !progress.topicCompleted) {
      progress.topicCompleted = true;
      progress.completedAt = new Date();
      await awardXP(userId, topic.xpReward || 30);
    }

    // Update streak on activity
    const user = await User.findById(userId);
    user.updateStreak();
    user.level = user.calculateLevel();
    await user.save();

    await progress.save();

    // Check and award badges (fire-and-forget — never blocks response)
    if (justCompleted || progress.topicCompleted) {
      checkAndAwardBadges(userId).catch(() => {});
    }

    res.json({
      success: true,
      progress,
      justCompleted,
      topicCompleted: progress.topicCompleted,
      xpAwarded: justCompleted ? 10 : 0,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/progress/dashboard
// @access  Private
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const allProgress = await Progress.find({ userId }).populate('topicId', 'title').populate('trackId', 'title thumbnail slug');

    const completedTopics = allProgress.filter((p) => p.topicCompleted).length;
    const completedVideos = allProgress.filter((p) => p.videoCompleted).length;
    const totalStudyTime = allProgress.reduce((sum, p) => sum + (p.watchTime || 0), 0);

    // Group by track
    const trackProgress = {};
    for (const p of allProgress) {
      if (!p.trackId) continue;
      const key = p.trackId._id.toString();
      if (!trackProgress[key]) {
        trackProgress[key] = { track: p.trackId, completed: 0, total: 0 };
      }
      trackProgress[key].total++;
      if (p.topicCompleted) trackProgress[key].completed++;
    }

    // Recent activity (last 7 sessions)
    const recentActivity = allProgress
      .filter((p) => p.updatedAt)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10)
      .map((p) => ({
        topicTitle: p.topicId?.title,
        trackTitle: p.trackId?.title,
        date: p.updatedAt,
        completed: p.topicCompleted,
      }));

    // Study time per day (last 30 days)
    const studyByDay = {};
    for (const p of allProgress) {
      if (p.studySessions) {
        for (const session of p.studySessions) {
          const day = new Date(session.date).toISOString().split('T')[0];
          studyByDay[day] = (studyByDay[day] || 0) + (session.duration || 0);
        }
      }
    }

    res.json({
      success: true,
      stats: {
        completedTopics,
        completedVideos,
        totalStudyTime: Math.round(totalStudyTime / 60), // minutes
        xp: req.user.xp,
        level: req.user.level,
        streak: req.user.streak,
        longestStreak: req.user.longestStreak,
      },
      trackProgress: Object.values(trackProgress),
      recentActivity,
      studyByDay,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get analytics data
// @route   GET /api/progress/analytics
// @access  Private
const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const allProgress = await Progress.find({ userId });
    const { QuizAttempt } = require('../models/Quiz');
    const quizAttempts = await QuizAttempt.find({ userId }).sort({ createdAt: -1 }).limit(50);

    const weakTopics = allProgress.filter((p) => p.quizScore < 60 && p.quizAttempts > 0).length;
    const avgQuizScore =
      quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length)
        : 0;

    // Build studyByDay: keyed "YYYY-MM-DD" → total minutes.
    // Used by the Analytics chart. Replaces the broken videosPerWeek approach
    // that returned week-start keys while the frontend iterated daily keys,
    // causing all days to fall back to Math.random() fake data.
    const studyByDay = {};
    for (const p of allProgress) {
      if (p.studySessions && p.studySessions.length > 0) {
        for (const session of p.studySessions) {
          if (!session.date) continue;
          const day = new Date(session.date).toISOString().split('T')[0];
          studyByDay[day] = (studyByDay[day] || 0) + (session.duration || 0);
        }
      }
    }

    res.json({
      success: true,
      analytics: {
        totalProgress: allProgress.length,
        completed: allProgress.filter((p) => p.topicCompleted).length,
        videosCompleted: allProgress.filter((p) => p.videoCompleted).length,
        quizzesPassed: allProgress.filter((p) => p.quizPassed).length,
        weakTopics,
        avgQuizScore,
        studyByDay,
        recentAttempts: quizAttempts.slice(0, 5),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateVideoProgress, getDashboard, getAnalytics };