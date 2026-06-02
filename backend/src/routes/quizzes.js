const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getQuiz, submitQuiz, getAttempts } = require('../controllers/quizController');

router.get('/:id', protect, getQuiz);
router.post('/:id/attempt', protect, submitQuiz);
router.get('/:id/attempts', protect, getAttempts);

module.exports = router;
