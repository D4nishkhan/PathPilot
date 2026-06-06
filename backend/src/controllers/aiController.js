const { AIChat, Interview } = require('../models/AIChat');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const geminiService = require('../services/geminiService');

// AI message limits for free users
const FREE_TUTOR_LIMIT = 10;

// @desc    Send message to AI Tutor
// @route   POST /api/ai/tutor
// @access  Private
const tutorMessage = async (req, res, next) => {
  try {
    const { message, chatId, context } = req.body;
    const userId = req.user._id;

    // Input validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }
    if (trimmedMessage.length > 4000) {
      return res.status(400).json({ success: false, message: 'Message is too long. Maximum 4000 characters.' });
    }

    // Check daily message limit for free users
    if (req.user.plan !== 'premium' && req.user.role !== 'admin') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayChats = await AIChat.find({
        userId,
        sessionType: 'tutor',
        updatedAt: { $gte: today },
      });
      const todayMessages = todayChats.reduce((sum, c) => sum + c.messages.filter(m => m.role === 'user').length, 0);
      if (todayMessages >= FREE_TUTOR_LIMIT) {
        return res.status(403).json({
          success: false,
          message: `Free plan allows ${FREE_TUTOR_LIMIT} messages/day. Upgrade to Premium for unlimited access.`,
          code: 'UPGRADE_REQUIRED',
        });
      }
    }

    // Get or create chat session
    let chat;
    if (chatId) {
      chat = await AIChat.findOne({ _id: chatId, userId });
    }
    if (!chat) {
      chat = new AIChat({ userId, sessionType: 'tutor', title: trimmedMessage.substring(0, 50) });
    }

    // Add user message
    chat.messages.push({ role: 'user', content: trimmedMessage });

    // Get AI response
    const aiResponse = await geminiService.tutorChat(
      chat.messages.map(m => ({ role: m.role, content: m.content })),
      context
    );

    // Add AI response
    chat.messages.push({ role: 'assistant', content: aiResponse });
    chat.totalMessages = chat.messages.length;
    await chat.save();

    res.json({ success: true, chatId: chat._id, response: aiResponse });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate AI Roadmap
// @route   POST /api/ai/roadmap
// @access  Private
const generateRoadmap = async (req, res, next) => {
  try {
    const { skill, currentLevel, dailyHours, goal } = req.body;
    const userId = req.user._id;

    // Check roadmap limit for free users
    if (req.user.plan !== 'premium' && req.user.role !== 'admin') {
      const roadmapCount = await Roadmap.countDocuments({ userId });
      if (roadmapCount >= 1) {
        return res.status(403).json({
          success: false,
          message: 'Free plan allows 1 roadmap. Upgrade to Premium for unlimited roadmaps.',
          code: 'UPGRADE_REQUIRED',
        });
      }
    }

    const roadmapData = await geminiService.generateRoadmap({ skill, currentLevel, dailyHours, goal });

// Normalize resources
roadmapData.resources = (roadmapData.resources || []).map(r => ({
  ...r,
  type: ['book', 'course', 'docs', 'video', 'tool'].includes(r.type)
    ? r.type
    : 'docs'
}));

// Normalize task resource types
roadmapData.weeks?.forEach(week => {
  week.tasks?.forEach(task => {
    if (!['video', 'reading', 'practice', 'project'].includes(task.resourceType)) {
      task.resourceType = 'reading';
    }
  });
});

    const roadmap = await Roadmap.create({
      userId,
      title: roadmapData.title,
      skill,
      currentLevel,
      dailyHours,
      goal,
      weeks: roadmapData.weeks,
      totalWeeks: roadmapData.totalWeeks,
      estimatedCompletionDate: new Date(roadmapData.estimatedCompletionDate),
      aiSummary: roadmapData.aiSummary,
      resources: roadmapData.resources || [],
    });

    res.status(201).json({ success: true, roadmap });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's roadmaps
// @route   GET /api/ai/roadmaps
// @access  Private
const getRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, roadmaps });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's chat history
// @route   GET /api/ai/chats
// @access  Private
const getChatHistory = async (req, res, next) => {
  try {
    const chats = await AIChat.find({ userId: req.user._id })
      .select('title sessionType totalMessages updatedAt')
      .sort({ updatedAt: -1 })
      .limit(20);
    res.json({ success: true, chats });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single chat
// @route   GET /api/ai/chats/:id
// @access  Private
const getChat = async (req, res, next) => {
  try {
    const chat = await AIChat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    res.json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

// @desc    Start/continue mock interview
// @route   POST /api/ai/interview
// @access  Premium
const mockInterview = async (req, res, next) => {
  try {
    const { message, chatId, mode, interviewId } = req.body;
    const userId = req.user._id;

    let chat;
    if (chatId) {
      chat = await AIChat.findOne({ _id: chatId, userId });
    }
    if (!chat) {
      chat = new AIChat({ userId, sessionType: 'interview', title: `${mode.toUpperCase()} Interview` });
    }

    if (message) {
      chat.messages.push({ role: 'user', content: message });
    }

    const questionCount = chat.messages.filter(m => m.role === 'user').length;
    const aiResponse = await geminiService.conductInterview(
      chat.messages.map(m => ({ role: m.role, content: m.content })),
      mode,
      questionCount
    );

    chat.messages.push({ role: 'assistant', content: aiResponse });
    chat.totalMessages = chat.messages.length;
    await chat.save();

    res.json({ success: true, chatId: chat._id, response: aiResponse, questionCount });
  } catch (err) {
    next(err);
  }
};

// @desc    Finish interview and get report
// @route   POST /api/ai/interview/report
// @access  Premium
const getInterviewReport = async (req, res, next) => {
  try {
    const { chatId, mode } = req.body;
    const userId = req.user._id;

    const chat = await AIChat.findOne({ _id: chatId, userId });
    if (!chat) return res.status(404).json({ success: false, message: 'Interview session not found' });

    // Extract Q&A pairs
    const questions = [];
    const msgs = chat.messages;
    for (let i = 0; i < msgs.length - 1; i++) {
      if (msgs[i].role === 'assistant' && msgs[i + 1]?.role === 'user') {
        questions.push({ question: msgs[i].content, userAnswer: msgs[i + 1].content });
      }
    }

    const reportData = await geminiService.generateInterviewReport(questions);

    // Save interview record
    const interview = await Interview.create({
      userId,
      mode,
      chatId: chat._id,
      questions,
      overallScore: reportData.overallScore,
      report: reportData.report,
      completedAt: new Date(),
    });

    res.json({ success: true, interview, report: reportData });
  } catch (err) {
    next(err);
  }
};

module.exports = { tutorMessage, generateRoadmap, getRoadmaps, getChatHistory, getChat, mockInterview, getInterviewReport };