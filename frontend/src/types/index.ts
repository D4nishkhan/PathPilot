export type User = {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'admin';
  plan: 'free' | 'premium';
  planExpiry?: string;
  xp: number;
  level: number;
  streak: number;
  longestStreak?: number;
  badges?: Badge[];
  totalStudyTime?: number;
  videosCompleted?: number;
  quizzesPassed?: number;
  googleId?: string;
  createdAt?: string;
}

export type Track = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPremium: boolean;
  estimatedHours: number;
  tags: string[];
  isPublished: boolean;
  enrolledCount: number;
  rating: number;
}

export type Module = {
  _id: string;
  trackId: string;
  title: string;
  description?: string;
  order: number;
  topics?: Topic[];
}

export type Topic = {
  _id: string;
  moduleId: string;
  trackId: string;
  title: string;
  description?: string;
  order: number;
  videoId?: Video;
  noteId?: Note;
  quizId?: Quiz | string;
  xpReward: number;
}

export type Video = {
  _id: string;
  youtubeId: string;
  title: string;
  description?: string;
  duration: number;
  thumbnailUrl?: string;
}

export type Note = {
  _id: string;
  topicId: string;
  title: string;
  content: string;
  cheatsheet?: string;
  keyPoints: string[];
  codeExamples?: { language: string; title: string; code: string; explanation: string }[];
  estimatedReadTime: number;
}

export type QuizOption = {
  _id: string;
  text: string;
  isCorrect?: boolean;
  explanation?: string;
}

export type QuizQuestion = {
  _id: string;
  type: 'mcq' | 'multiSelect' | 'codeOutput' | 'trueFalse';
  question: string;
  code?: string;
  language?: string;
  options: QuizOption[];
  explanation?: string;
  difficulty: string;
  points: number;
}

export type Quiz = {
  _id: string;
  topicId: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  xpReward: number;
}

export type QuizAttempt = {
  _id: string;
  score: number;
  passed: boolean;
  attemptNumber: number;
  createdAt: string;
  answers: {
    questionId: string;
    selectedOptions: number[];
    isCorrect: boolean;
    correctOptions: number[];
    explanation?: string;
  }[];
}

export type Progress = {
  _id: string;
  topicId: string;
  watchedPercentage: number;
  videoCompleted: boolean;
  quizPassed: boolean;
  quizScore: number;
  topicCompleted: boolean;
  notesRead: boolean;
}

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export type AIChat = {
  _id: string;
  title: string;
  sessionType: 'tutor' | 'interview' | 'roadmap';
  messages: ChatMessage[];
  totalMessages: number;
  updatedAt: string;
}

export type RoadmapWeek = {
  weekNumber: number;
  title: string;
  goals: string[];
  milestone: string;
  tasks: {
    day: number;
    title: string;
    description: string;
    estimatedHours: number;
    resourceType: string;
    completed: boolean;
  }[];
}

export type Roadmap = {
  _id: string;
  title: string;
  skill: string;
  currentLevel: string;
  dailyHours: number;
  goal: string;
  weeks: RoadmapWeek[];
  totalWeeks: number;
  estimatedCompletionDate: string;
  progressPercent: number;
  status: 'active' | 'completed' | 'paused';
  aiSummary?: string;
  resources?: { title: string; url: string; type: string }[];
  createdAt: string;
}

export type Badge = {
  _id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export type DashboardStats = {
  completedTopics: number;
  completedVideos: number;
  totalStudyTime: number;
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
}
