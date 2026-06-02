/**
 * badgeService.js
 * Checks all active badges against the user's current stats
 * and awards any that have just been earned. Called after XP
 * changes (video completion, quiz pass, topic completion).
 */
const { Badge } = require('../models/Badge');
const User = require('../models/User');
const Progress = require('../models/Progress');

/**
 * Check and award any newly-earned badges for a user.
 * @param {ObjectId|string} userId
 * @returns {Promise<Array>} Array of newly awarded badge documents
 */
const checkAndAwardBadges = async (userId) => {
  try {
    const user = await User.findById(userId).populate('badges');
    if (!user) return [];

    // IDs of badges the user already has
    const earnedIds = new Set(user.badges.map((b) => b._id.toString()));

    // Fetch all active badges not yet earned
    const allBadges = await Badge.find({ isActive: true });
    const unearnedBadges = allBadges.filter((b) => !earnedIds.has(b._id.toString()));
    if (unearnedBadges.length === 0) return [];

    // Gather user stats needed for condition evaluation
    const [completedTopics, videosCount, quizzesPassed] = await Promise.all([
      Progress.countDocuments({ userId, topicCompleted: true }),
      Progress.countDocuments({ userId, videoCompleted: true }),
      Progress.countDocuments({ userId, quizPassed: true }),
    ]);

    const stats = {
      xp: user.xp,
      streak: user.streak,
      level: user.level,
      videos: videosCount,
      quizzes: quizzesPassed,
      topics: completedTopics,
    };

    const newlyEarned = [];

    for (const badge of unearnedBadges) {
      if (!badge.condition?.type) continue;

      let earned = false;
      const threshold = badge.condition.threshold || 0;

      switch (badge.condition.type) {
        case 'xp':
          earned = stats.xp >= threshold;
          break;
        case 'streak':
          earned = stats.streak >= threshold;
          break;
        case 'videos':
          earned = stats.videos >= threshold;
          break;
        case 'quizzes':
          earned = stats.quizzes >= threshold;
          break;
        case 'level':
          earned = stats.level >= threshold;
          break;
        case 'track':
          if (badge.condition.trackId) {
            const trackTopics = await Progress.countDocuments({
              userId,
              trackId: badge.condition.trackId,
              topicCompleted: true,
            });
            // Award when at least 1 topic in the track is completed
            // (full-track completion is when all topics done — needs separate query)
            earned = trackTopics >= threshold;
          }
          break;
        case 'custom':
          // Custom badges are awarded manually via admin
          break;
        default:
          break;
      }

      if (earned) {
        newlyEarned.push(badge);
      }
    }

    if (newlyEarned.length === 0) return [];

    // Award the badges and bonus XP
    const badgeIds = newlyEarned.map((b) => b._id);
    const totalBonusXP = newlyEarned.reduce((sum, b) => sum + (b.xpReward || 0), 0);

    await User.findByIdAndUpdate(userId, {
      $addToSet: { badges: { $each: badgeIds } },
      $inc: { xp: totalBonusXP },
    });

    // Recalculate level after bonus XP
    const updatedUser = await User.findById(userId);
    if (updatedUser) {
      updatedUser.level = updatedUser.calculateLevel();
      await updatedUser.save();
    }

    return newlyEarned;
  } catch (err) {
    // Badge award should never crash the request — log and continue
    console.error('[badgeService] checkAndAwardBadges error:', err.message);
    return [];
  }
};

module.exports = { checkAndAwardBadges };
