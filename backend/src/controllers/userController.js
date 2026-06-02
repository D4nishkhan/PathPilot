const User = require('../models/User');
const Progress = require('../models/Progress');
const { QuizAttempt } = require('../models/Quiz');

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password -resetPasswordToken -resetPasswordExpire')
    .populate('badges');
  res.json({ success: true, user });
};

// @desc    Update profile
// @route   PUT /api/users/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
const getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'student' })
      .select('name avatar xp level streak badges')
      .sort({ xp: -1 })
      .limit(50)
      .populate('badges', 'name icon color');
    res.json({ success: true, leaderboard: users });
  } catch (err) {
    next(err);
  }
};

// @desc    Award XP to user (internal util)
const awardXP = async (userId, xpAmount) => {
  const user = await User.findById(userId);
  if (!user) return;
  user.xp += xpAmount;
  user.level = user.calculateLevel();
  await user.save();
  return user;
};

module.exports = { getProfile, updateProfile, changePassword, getLeaderboard, awardXP };
