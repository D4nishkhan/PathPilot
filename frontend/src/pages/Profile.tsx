import { useState } from 'react';
import type { FormEvent } from 'react';
import { User, Lock, Zap, Star, Trophy, Shield, Edit3, Save, Loader2 } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { userAPI } from '../lib/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const LEVEL_NAMES: Record<number, string> = {
  1: 'Beginner', 2: 'Learner', 3: 'Student', 4: 'Coder',
  5: 'Explorer', 6: 'Developer', 7: 'Builder', 8: 'Engineer',
  9: 'Architect', 10: 'Builder Pro', 15: 'Expert', 20: 'Job Ready'
};

const getLevelName = (level: number) => {
  const keys = Object.keys(LEVEL_NAMES).map(Number).sort((a, b) => b - a);
  for (const k of keys) { if (level >= k) return LEVEL_NAMES[k]; }
  return 'Beginner';
};

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userAPI.updateProfile({ name });
      updateUser({ name: res.data.user.name });
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await userAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const xpThresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
  const level = user?.level || 1;
  const nextXP = xpThresholds[level] || xpThresholds[xpThresholds.length - 1];
  const xpPercent = Math.min(((user?.xp || 0) / nextXP) * 100, 100);

  return (
    <AppLayout title="Profile">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Profile Card */}
        <div className="glass-card p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase()
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field text-lg font-bold"
                    placeholder="Your name"
                    id="profile-name"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="btn-primary text-sm">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Save</>}
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className="btn-ghost text-sm">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-100">{user?.name}</h1>
                    <p className="text-slate-500 text-sm">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-sm text-yellow-400 font-medium">
                        <Star size={14} fill="currentColor" /> {getLevelName(level)}
                      </span>
                      <span className="text-slate-700">•</span>
                      <span className="text-sm text-slate-500">Level {level}</span>
                      {user?.plan === 'premium' && (
                        <span className="badge badge-premium text-xs">✨ Premium</span>
                      )}
                      {user?.role === 'admin' && (
                        <span className="badge badge-primary text-xs"><Shield size={10} /> Admin</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setEditing(true)} className="btn-ghost text-sm flex-shrink-0">
                    <Edit3 size={14} /> Edit
                  </button>
                </div>
              )}

              {/* XP Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="text-yellow-400 font-medium">{user?.xp} XP</span>
                  <span>Next level: {nextXP} XP</span>
                </div>
                <div className="xp-bar h-3">
                  <div className="xp-fill" style={{ width: `${xpPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Zap, label: 'Total XP', value: user?.xp || 0, color: 'text-yellow-400' },
            { icon: Trophy, label: 'Streak', value: `${user?.streak || 0}🔥`, color: 'text-orange-400' },
            { icon: User, label: 'Level', value: level, color: 'text-indigo-400' },
            { icon: Star, label: 'Badges', value: user?.badges?.length || 0, color: 'text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
              <div className="text-xl font-bold text-slate-100">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        {user?.badges && user.badges.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-400" /> Badges Earned
            </h3>
            <div className="flex flex-wrap gap-3">
              {user.badges.map((badge: any) => (
                <div key={badge._id} className="flex items-center gap-2 glass p-3 rounded-xl" title={badge.description}>
                  <span className="text-xl">{badge.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{badge.name}</p>
                    <p className="text-xs text-slate-600">{badge.rarity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Password Change */}
        {!user?.googleId && (
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Lock size={18} className="text-slate-400" /> Change Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-3 max-w-sm">
              <div>
                <label className="block text-sm text-slate-500 mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                  id="current-password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  id="new-password"
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" disabled={changingPassword} className="btn-primary text-sm">
                {changingPassword ? <Loader2 size={14} className="animate-spin" /> : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Subscription */}
        <div className="glass-card p-5">
          <h3 className="text-base font-semibold text-slate-200 mb-4">Subscription</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`badge ${user?.plan === 'premium' ? 'badge-premium' : 'badge-primary'}`}>
                  {user?.plan === 'premium' ? '✨ Premium' : 'Free Plan'}
                </span>
              </div>
              {user?.plan === 'premium' && user?.planExpiry && (
                <p className="text-xs text-slate-500 mt-1">
                  Expires: {new Date(user.planExpiry).toLocaleDateString()}
                </p>
              )}
            </div>
            {user?.plan === 'free' ? (
              <Link to="/pricing" className="btn-primary text-sm px-5">
                Upgrade to Premium →
              </Link>
            ) : (
              <span className="text-sm text-green-400">Active ✓</span>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
