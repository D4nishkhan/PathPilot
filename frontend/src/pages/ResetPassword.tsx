import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../lib/api';

type State = 'idle' | 'loading' | 'success' | 'error';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Token must exist or redirect immediately
  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  const passwordStrength = (): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: '', color: '', width: '0%' };
    if (password.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '20%' };
    if (password.length < 8) return { label: 'Weak', color: 'bg-orange-500', width: '40%' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return { label: 'Fair', color: 'bg-yellow-500', width: '60%' };
    if (password.length >= 10 && /[^a-zA-Z0-9]/.test(password))
      return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
    return { label: 'Good', color: 'bg-green-500', width: '80%' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (!token) return;

    setState('loading');
    try {
      await authAPI.resetPassword(token, password);
      setState('success');
      toast.success('Password reset successfully! Redirecting to login…');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Link is invalid or has expired';
      setErrorMsg(msg);
      setState('error');
      toast.error(msg);
    }
  };

  const strength = passwordStrength();

  /* ── Success State ────────────────────────────────── */
  if (state === 'success') {
    return (
      <div className="min-h-screen bg-[#06070f] flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your password has been updated. Redirecting you to login…
          </p>
          <Link to="/login" className="btn-primary inline-block px-6 py-2 rounded-xl text-sm font-semibold">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  /* ── Main Form ────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#06070f] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">PathPilot</span>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={22} className="text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Set New Password</h1>
            <p className="text-slate-400 text-sm">
              Choose a strong password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); setState('idle'); }}
                  placeholder="At least 6 characters"
                  required
                  className="input-field w-full pr-11"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  {strength.label && (
                    <p className="text-xs mt-1 text-slate-400">
                      Strength: <span className="font-medium text-slate-200">{strength.label}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="reset-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(''); setState('idle'); }}
                  placeholder="Re-enter your password"
                  required
                  className={`input-field w-full pr-11 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-red-500/50 focus:border-red-500/70'
                      : confirmPassword && confirmPassword === password
                      ? 'border-emerald-500/50 focus:border-emerald-500/70'
                      : ''
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <XCircle size={12} /> Passwords do not match
                </p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Passwords match
                </p>
              )}
            </div>

            {/* Error message */}
            {(state === 'error' || errorMsg) && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-300 text-sm">{errorMsg}</p>
              </div>
            )}

            {/* Submit */}
            <button
              id="reset-password-submit"
              type="submit"
              disabled={state === 'loading'}
              className="btn-primary w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {state === 'loading' ? (
                <><Loader2 size={16} className="animate-spin" /> Resetting Password…</>
              ) : (
                <><KeyRound size={16} /> Reset Password</>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
