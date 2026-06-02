const { Track, Module, Topic } = require('../models/Track');
const Progress = require('../models/Progress');

// @desc    Get all published tracks
// @route   GET /api/tracks
// @access  Public
const getTracks = async (req, res, next) => {
  try {
    const { category, difficulty, search } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tracks = await Track.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, tracks });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single track with modules and topics
// @route   GET /api/tracks/:id
// @access  Private
const getTrack = async (req, res, next) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ success: false, message: 'Track not found' });

    // Check premium access
    if (track.isPremium && req.user?.plan !== 'premium' && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Premium required', code: 'UPGRADE_REQUIRED' });
    }

    const modules = await Module.find({ trackId: track._id, isPublished: true }).sort({ order: 1 });

    const modulesWithTopics = await Promise.all(
      modules.map(async (mod) => {
        const topics = await Topic.find({ moduleId: mod._id, isPublished: true })
          .sort({ order: 1 })
          .populate('videoId', 'title duration thumbnailUrl youtubeId')
          .populate('quizId', 'title passingScore questions')
          .populate('noteId', 'title estimatedReadTime');
        return { ...mod.toObject(), topics };
      })
    );

    // Get user progress if logged in
    let progressMap = {};
    if (req.user) {
      const progresses = await Progress.find({ userId: req.user._id, trackId: track._id });
      progresses.forEach((p) => {
        progressMap[p.topicId.toString()] = p;
      });
    }

    res.json({ success: true, track, modules: modulesWithTopics, progressMap });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single topic with full content
// @route   GET /api/tracks/:trackId/topics/:topicId
// @access  Private
const getTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.topicId)
      .populate('videoId')
      .populate('quizId')
      .populate('noteId');

    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    // Check if topic is locked (locked progression)
    const currentTopicIndex = topic.order;
    if (currentTopicIndex > 1) {
      const prevTopic = await Topic.findOne({
        moduleId: topic.moduleId,
        order: currentTopicIndex - 1,
      });
      if (prevTopic && req.user) {
        const prevProgress = await Progress.findOne({
          userId: req.user._id,
          topicId: prevTopic._id,
        });
        if (!prevProgress?.topicCompleted) {
          return res.status(403).json({
            success: false,
            message: 'Complete the previous topic first',
            code: 'TOPIC_LOCKED',
          });
        }
      }
    }

    const progress = req.user
      ? await Progress.findOne({ userId: req.user._id, topicId: topic._id })
      : null;

    res.json({ success: true, topic, progress });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTracks, getTrack, getTopic };
