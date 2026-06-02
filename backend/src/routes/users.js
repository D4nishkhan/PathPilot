const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword, getLeaderboard } = require('../controllers/userController');

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
