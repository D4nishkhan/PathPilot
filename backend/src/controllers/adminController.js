const { Track, Module, Topic } = require('../models/Track');
const Video = require('../models/Video');
const Note = require('../models/Note');
const { Quiz } = require('../models/Quiz');
const User = require('../models/User');
const Progress = require('../models/Progress');

// ─── Track CRUD ────────────────────────────────────────────────
const createTrack = async (req, res, next) => {
  try {
    const track = await Track.create(req.body);
    res.status(201).json({ success: true, track });
  } catch (err) { next(err); }
};

const updateTrack = async (req, res, next) => {
  try {
    const track = await Track.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!track) return res.status(404).json({ success: false, message: 'Track not found' });
    res.json({ success: true, track });
  } catch (err) { next(err); }
};

const deleteTrack = async (req, res, next) => {
  try {
    await Track.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Track deleted' });
  } catch (err) { next(err); }
};

// ─── Module CRUD ──────────────────────────────────────────────
const createModule = async (req, res, next) => {
  try {
    const mod = await Module.create(req.body);
    res.status(201).json({ success: true, module: mod });
  } catch (err) { next(err); }
};

const updateModule = async (req, res, next) => {
  try {
    const mod = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, module: mod });
  } catch (err) { next(err); }
};

const deleteModule = async (req, res, next) => {
  try {
    await Module.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Module deleted' });
  } catch (err) { next(err); }
};

// ─── Topic CRUD ───────────────────────────────────────────────
const createTopic = async (req, res, next) => {
  try {
    const topic = await Topic.create(req.body);
    res.status(201).json({ success: true, topic });
  } catch (err) { next(err); }
};

const updateTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, topic });
  } catch (err) { next(err); }
};

const deleteTopic = async (req, res, next) => {
  try {
    await Topic.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Topic deleted' });
  } catch (err) { next(err); }
};

// ─── Video CRUD ───────────────────────────────────────────────
const createVideo = async (req, res, next) => {
  try {
    const video = await Video.create(req.body);
    res.status(201).json({ success: true, video });
  } catch (err) { next(err); }
};

const updateVideo = async (req, res, next) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, video });
  } catch (err) { next(err); }
};

// ─── Notes CRUD ───────────────────────────────────────────────
const createNote = async (req, res, next) => {
  try {
    const note = await Note.create(req.body);
    res.status(201).json({ success: true, note });
  } catch (err) { next(err); }
};

const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, note });
  } catch (err) { next(err); }
};

// ─── Quiz CRUD ────────────────────────────────────────────────
const createQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.create(req.body);
    res.status(201).json({ success: true, quiz });
  } catch (err) { next(err); }
};

const updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, quiz });
  } catch (err) { next(err); }
};

// ─── User Management ─────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const total = await User.countDocuments(filter);
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
};

// ─── Admin Analytics ──────────────────────────────────────────
const getAdminAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, premiumUsers, totalTracks, totalProgress] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ plan: 'premium' }),
      Track.countDocuments(),
      Progress.countDocuments({ topicCompleted: true }),
    ]);

    const recentUsers = await User.find().select('name email plan createdAt').sort({ createdAt: -1 }).limit(10);

    // Users per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const usersByDay = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      analytics: { totalUsers, premiumUsers, totalTracks, totalProgress, recentUsers, usersByDay },
    });
  } catch (err) { next(err); }
};

// ─── Content Getters ─────────────────────────────────────────
const getAllTracks = async (req, res, next) => {
  try {
    const tracks = await Track.find().sort({ order: 1 });
    res.json({ success: true, tracks });
  } catch (err) { next(err); }
};

const getAllQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find().populate('topicId', 'title');
    res.json({ success: true, quizzes });
  } catch (err) { next(err); }
};

module.exports = {
  createTrack, updateTrack, deleteTrack,
  createModule, updateModule, deleteModule,
  createTopic, updateTopic, deleteTopic,
  createVideo, updateVideo,
  createNote, updateNote,
  createQuiz, updateQuiz,
  getAllUsers, updateUser, deleteUser,
  getAdminAnalytics, getAllTracks, getAllQuizzes,
};
