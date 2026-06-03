import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Target, Clock, Flame, Zap, Star,
  Trophy, ChevronRight, TrendingUp, CheckCircle,
  Play, BarChart3, ArrowRight, Calendar
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { progressAPI } from '../lib/api';
import { useAuthStore } from '../store';
import type { DashboardStats } from '../types/index';
import { formatDistanceToNow } from 'date-fns';

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

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trackProgress, setTrackProgress] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('[Dashboard] MOUNTED - user from store:', user);
  console.log('[Dashboard] MOUNTED - full store state:', useAuthStore.getState());

  useEffect(() => {
    console.log('[Dashboard] useEffect - Fetching dashboard data');
    progressAPI.getDashboard().then((res) => {
      console.log('[Dashboard] getDashboard response:', res.data);
      setStats(res.data.stats);
      setTrackProgress(res.data.trackProgress);
      setRecentActivity(res.data.recentActivity);
    }).catch((err) => {
      console.error('[Dashboard] getDashboard error:', err);
    }).finally(() => setLoading(false));
  }, []);

  const xpThresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
  const currentXP = user?.xp || 0;
  const level = user?.level || 1;
  const nextXP = xpThresholds[level] || xpThresholds[xpThresholds.length - 1];
  const xpPercent = Math.min((currentXP / nextXP) * 100, 100);

  const statCards = [
    { icon: Target, label: 'Topics Completed', value: stats?.completedTopics ?? 0, color: 'text-indigo-400', bg: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-500/20' },
    { icon: Play, label: 'Videos Watched', value: stats?.completedVideos ?? 0, color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/20' },
    { icon: Clock, label: 'Study Time (min)', value: stats?.totalStudyTime ?? 0, color: 'text-green-400', bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/20' },
    { icon: Flame, label: 'Day Streak', value: stats?.streak ?? 0, color: 'text-orange-400', bg: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/20' },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome + XP */}
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                Welcome back, {user?.name?.split(' ')[0]} 👋
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                {user?.streak ? `🔥 ${user.streak} day streak! Keep going.` : "Start today's study session"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-slate-500">Level {level} • {getLevelName(level)}</div>
                <div className="text-xl font-bold gradient-text-gold">{currentXP} XP</div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-2xl text-white">
                {level}
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-600 mb-1.5">
              <span>{currentXP} XP</span>
              <span>{nextXP} XP for Level {level + 1}</span>
            </div>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className={`glass-card p-5 bg-gradient-to-br ${card.bg} border ${card.border}`}>
              <card.icon size={22} className={card.color} />
              <div className="text-3xl font-bold text-slate-100 mt-3">
                {loading ? <div className="skeleton h-8 w-16 rounded" /> : card.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Track Progress */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-200">Learning Tracks</h3>
              <Link to="/tracks" className="btn-ghost text-sm">View all <ChevronRight size={14} /></Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : trackProgress.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen size={40} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">You haven't started any tracks yet</p>
                <Link to="/tracks" className="btn-primary text-sm">Browse Tracks →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {trackProgress.map((tp) => {
                  const pct = tp.total > 0 ? Math.round((tp.completed / tp.total) * 100) : 0;
                  return (
                    <div key={tp.track._id} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={18} className="text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1.5">
                          <p className="text-sm font-medium text-slate-200 truncate">{tp.track.title}</p>
                          <span className="text-sm font-semibold text-indigo-400 flex-shrink-0 ml-2">{pct}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{tp.completed}/{tp.total} topics</p>
                      </div>
                      <Link to={`/tracks/${tp.track._id}`} className="btn-ghost p-2 flex-shrink-0">
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions + Recent activity */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { to: '/roadmap', icon: Target, label: 'Generate Roadmap', color: 'text-indigo-400' },
                  { to: '/tracks', icon: BookOpen, label: 'Browse Tracks', color: 'text-blue-400' },
                  { to: '/tutor', icon: Zap, label: 'Ask AI Tutor', color: 'text-purple-400' },
                  { to: '/analytics', icon: BarChart3, label: 'View Analytics', color: 'text-green-400' },
                ].map(({ to, icon: Icon, label, color }) => (
                  <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                    <Icon size={18} className={color} />
                    <span className="text-sm text-slate-400 group-hover:text-slate-200">{label}</span>
                    <ArrowRight size={14} className="text-slate-700 ml-auto group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Activity</h3>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-600 text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${a.completed ? 'bg-green-500/10' : 'bg-indigo-500/10'}`}>
                        {a.completed ? <CheckCircle size={14} className="text-green-400" /> : <Play size={14} className="text-indigo-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-300 truncate">{a.topicTitle || 'Topic'}</p>
                        <p className="text-xs text-slate-600">{a.date ? formatDistanceToNow(new Date(a.date), { addSuffix: true }) : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Premium CTA for free users */}
        {user?.plan === 'free' && (
          <div className="glass-card p-6 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-indigo-500/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="badge badge-premium mb-2">✨ Go Premium</div>
                <h3 className="text-lg font-semibold text-slate-100">Unlock Your Full Potential</h3>
                <p className="text-sm text-slate-400 mt-1">Unlimited AI Tutor, all tracks, mock interviews, and advanced analytics.</p>
              </div>
              <Link to="/pricing" className="btn-primary text-sm flex-shrink-0 px-6 py-3">
                Upgrade for ₹499/mo →
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
