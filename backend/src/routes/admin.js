const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

const admin = [protect, adminOnly];

// Analytics
router.get('/analytics', ...admin, ctrl.getAdminAnalytics);

// Tracks
router.get('/tracks', ...admin, ctrl.getAllTracks);
router.post('/tracks', ...admin, ctrl.createTrack);
router.put('/tracks/:id', ...admin, ctrl.updateTrack);
router.delete('/tracks/:id', ...admin, ctrl.deleteTrack);

// Modules
router.post('/modules', ...admin, ctrl.createModule);
router.put('/modules/:id', ...admin, ctrl.updateModule);
router.delete('/modules/:id', ...admin, ctrl.deleteModule);

// Topics
router.post('/topics', ...admin, ctrl.createTopic);
router.put('/topics/:id', ...admin, ctrl.updateTopic);
router.delete('/topics/:id', ...admin, ctrl.deleteTopic);

// Videos
router.post('/videos', ...admin, ctrl.createVideo);
router.put('/videos/:id', ...admin, ctrl.updateVideo);

// Notes
router.post('/notes', ...admin, ctrl.createNote);
router.put('/notes/:id', ...admin, ctrl.updateNote);

// Quizzes
router.get('/quizzes', ...admin, ctrl.getAllQuizzes);
router.post('/quizzes', ...admin, ctrl.createQuiz);
router.put('/quizzes/:id', ...admin, ctrl.updateQuiz);

// Users
router.get('/users', ...admin, ctrl.getAllUsers);
router.put('/users/:id', ...admin, ctrl.updateUser);
router.delete('/users/:id', ...admin, ctrl.deleteUser);

module.exports = router;
