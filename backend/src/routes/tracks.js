const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTracks, getTrack, getTopic } = require('../controllers/trackController');

router.get('/', getTracks);
router.get('/:id', protect, getTrack);
router.get('/:trackId/topics/:topicId', protect, getTopic);

module.exports = router;
