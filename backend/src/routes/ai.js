const express = require('express');
const router = express.Router();
const { protect, premiumOnly } = require('../middleware/auth');
const {
  tutorMessage, generateRoadmap, getRoadmaps,
  getChatHistory, getChat, mockInterview, getInterviewReport
} = require('../controllers/aiController');

router.post('/tutor', protect, tutorMessage);
router.post('/roadmap/generate', protect, generateRoadmap);
router.get('/roadmaps', protect, getRoadmaps);
router.get('/chats', protect, getChatHistory);
router.get('/chats/:id', protect, getChat);
router.post('/interview', protect, premiumOnly, mockInterview);
router.post('/interview/report', protect, premiumOnly, getInterviewReport);

module.exports = router;
