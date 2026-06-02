import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import { Loader2, Zap } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Pricing from './pages/Pricing';
import AuthCallback from './pages/AuthCallback';

// App pages
import Dashboard from './pages/Dashboard';
import RoadmapPage from './pages/RoadmapPage';
import TracksPage from './pages/TracksPage';
import TrackDetail from './pages/TrackDetail';
import VideoPlayer from './pages/VideoPlayer';
import AITutor from './pages/AITutor';
import QuizPage from './pages/QuizPage';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import MockInterview from './pages/MockInterview';
import AdminPanel from './pages/admin/AdminPanel';

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#06070f] flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
        <Zap size={22} className="text-white" />
      </div>
      <Loader2 size={20} className="text-indigo-400 animate-spin mx-auto" />
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#131629',
            color: '#e2e8f0',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#131629' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#131629' },
          },
        }}
      />

      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/roadmap" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
          <Route path="/tracks" element={<ProtectedRoute><TracksPage /></ProtectedRoute>} />
          <Route path="/tracks/:id" element={<ProtectedRoute><TrackDetail /></ProtectedRoute>} />
          <Route path="/tracks/:trackId/topics/:topicId" element={<ProtectedRoute><VideoPlayer /></ProtectedRoute>} />
          <Route path="/tutor" element={<ProtectedRoute><AITutor /></ProtectedRoute>} />
          <Route path="/quiz/:id" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

          {/* Premium routes */}
          <Route path="/interview" element={<ProtectedRoute requirePremium><MockInterview /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/*" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
