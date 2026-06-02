import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Zap } from 'lucide-react';
import { authAPI } from '../lib/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google sign-in failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token) {
      localStorage.setItem('pathpilot_token', token);
      authAPI.getMe().then((res) => {
        setAuth(res.data.user, token);
        toast.success('Signed in successfully! 🚀');
        navigate('/dashboard');
      }).catch(() => {
        toast.error('Authentication failed');
        navigate('/login');
      });
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#06070f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
          <Zap size={28} className="text-white" />
        </div>
        <Loader2 size={24} className="text-indigo-400 animate-spin mx-auto mb-3" />
        <p className="text-slate-400">Signing you in...</p>
      </div>
    </div>
  );
}
