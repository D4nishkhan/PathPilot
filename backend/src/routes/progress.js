const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { updateVideoProgress, getDashboard, getAnalytics } = require('../controllers/progressController');

router.post('/video', protect, updateVideoProgress);
router.get('/dashboard', protect, getDashboard);
router.get('/analytics', protect, getAnalytics);

module.exports = router;
