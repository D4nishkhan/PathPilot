import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06070f] flex items-center justify-center px-4 hero-grid">
      <div className="w-full max-w-md animate-fade-in-up">
        <Link to="/login" className="btn-ghost mb-6 inline-flex">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              {sent ? <CheckCircle size={22} className="text-white" /> : <Mail size={22} className="text-white" />}
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              {sent ? 'Check your email' : 'Forgot password?'}
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              {sent
                ? `We sent a reset link to ${email}. Check your inbox (and spam folder).`
                : 'Enter your email and we\'ll send you a reset link.'
              }
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <Link to="/login" className="btn-primary w-full justify-center py-3 block text-center">
                Back to Login
              </Link>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="btn-ghost w-full justify-center"
              >
                Try different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
