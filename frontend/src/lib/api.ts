import axios from 'axios';

// Create axios instance with baseURL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
console.log('[API] Initializing with baseURL:', API_BASE_URL);
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pathpilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pathpilot_token');
      localStorage.removeItem('pathpilot_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post(`/auth/reset-password/${token}`, { password }),
};

// ─── User API ─────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/change-password', data),
  getLeaderboard: () => api.get('/users/leaderboard'),
};

// ─── Track API ────────────────────────────────────────────────
export const trackAPI = {
  getTracks: (params?: { category?: string; difficulty?: string; search?: string }) =>
    api.get('/tracks', { params }),
  getTrack: (id: string) => api.get(`/tracks/${id}`),
  getTopic: (trackId: string, topicId: string) =>
    api.get(`/tracks/${trackId}/topics/${topicId}`),
};

// ─── Progress API ─────────────────────────────────────────────
export const progressAPI = {
  updateVideo: (data: { topicId: string; watchedPercentage: number; watchTime?: number }) =>
    api.post('/progress/video', data),
  getDashboard: () => api.get('/progress/dashboard'),
  getAnalytics: () => api.get('/progress/analytics'),
};

// ─── Quiz API ─────────────────────────────────────────────────
export const quizAPI = {
  getQuiz: (id: string) => api.get(`/quizzes/${id}`),
  submitQuiz: (id: string, answers: { questionId: string; selectedOptions: number[] }[]) =>
    api.post(`/quizzes/${id}/attempt`, { answers }),
  getAttempts: (id: string) => api.get(`/quizzes/${id}/attempts`),
};

// ─── AI API ───────────────────────────────────────────────────
export const aiAPI = {
  sendMessage: (data: { message: string; chatId?: string; context?: object }) =>
    api.post('/ai/tutor', data),
  generateRoadmap: (data: { skill: string; currentLevel: string; dailyHours: number; goal: string }) =>
    api.post('/ai/roadmap/generate', data),
  getRoadmaps: () => api.get('/ai/roadmaps'),
  getChatHistory: () => api.get('/ai/chats'),
  getChat: (id: string) => api.get(`/ai/chats/${id}`),
  startInterview: (data: { message?: string; chatId?: string; mode: string }) =>
    api.post('/ai/interview', data),
  getInterviewReport: (data: { chatId: string; mode: string }) =>
    api.post('/ai/interview/report', data),
};

// ─── Payment API ──────────────────────────────────────────────
export const paymentAPI = {
  getPlans: () => api.get('/payments/plans'),
  createOrder: (plan: string) => api.post('/payments/create-order', { plan }),
  verifyPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post('/payments/verify', data),
};

// ─── Admin API ────────────────────────────────────────────────
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getTracks: () => api.get('/admin/tracks'),
  createTrack: (data: object) => api.post('/admin/tracks', data),
  updateTrack: (id: string, data: object) => api.put(`/admin/tracks/${id}`, data),
  deleteTrack: (id: string) => api.delete(`/admin/tracks/${id}`),
  createModule: (data: object) => api.post('/admin/modules', data),
  createTopic: (data: object) => api.post('/admin/topics', data),
  createVideo: (data: object) => api.post('/admin/videos', data),
  createNote: (data: object) => api.post('/admin/notes', data),
  createQuiz: (data: object) => api.post('/admin/quizzes', data),
  getUsers: (params?: object) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: object) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
};

export default api;
