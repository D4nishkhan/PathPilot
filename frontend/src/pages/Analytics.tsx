import { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, Clock, BookOpen, Trophy, Target,
  Zap, Flame, Brain, Link as LinkIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { progressAPI } from '../lib/api';
import { useAuthStore } from '../store';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { format, subDays } from 'date-fns';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressAPI.getAnalytics().then((res) => {
      setAnalytics(res.data.analytics);
    }).finally(() => setLoading(false));
  }, []);

  // Build last-14-days chart from real studyByDay data only.
  // studyByDay is keyed "YYYY-MM-DD" → minutes. Zero for days with no activity.
  // REMOVED: Math.random() fallback that generated fake study time.
  const studyChartData = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const key = format(date, 'yyyy-MM-dd');
    return {
      date: format(date, 'MMM dd'),
      minutes: analytics?.studyByDay?.[key] ?? 0,
    };
  });

  const radarData = [
    { subject: 'Videos', A: Math.min(100, (analytics?.videosCompleted || 0) * 10), fullMark: 100 },
    { subject: 'Quizzes', A: Math.min(100, analytics?.avgQuizScore || 0), fullMark: 100 },
    { subject: 'Streak', A: Math.min(100, (user?.streak || 0) * 10), fullMark: 100 },
    { subject: 'XP', A: Math.min(100, (user?.xp || 0) / 100), fullMark: 100 },
    { subject: 'Topics', A: Math.min(100, (analytics?.completed || 0) * 5), fullMark: 100 },
  ];

  const statCards = [
    { icon: BookOpen, label: 'Topics Completed', value: analytics?.completed ?? 0, sub: `of ${analytics?.totalProgress ?? 0} started`, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { icon: Target, label: 'Videos Watched', value: analytics?.videosCompleted ?? 0, sub: 'total', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Trophy, label: 'Quizzes Passed', value: analytics?.quizzesPassed ?? 0, sub: `avg ${analytics?.avgQuizScore ?? 0}%`, color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: Brain, label: 'Weak Topics', value: analytics?.weakTopics ?? 0, sub: 'need review', color: 'text-red-400', bg: 'bg-red-500/10' },
    { icon: Zap, label: 'Total XP', value: user?.xp ?? 0, sub: `Level ${user?.level}`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { icon: Flame, label: 'Best Streak', value: user?.longestStreak ?? 0, sub: 'days', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  const hasAnyActivity = studyChartData.some(d => d.minutes > 0);

  return (
    <AppLayout title="Analytics">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="text-green-400" size={26} /> Learning Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">Track your progress and identify areas to improve</p>
        </div>

        {/* Stats grid — no fake trend arrows */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="glass-card p-5">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon size={18} className={card.color} />
              </div>
              {loading ? (
                <div className="skeleton h-8 w-16 rounded mb-1" />
              ) : (
                <div className="text-2xl font-bold text-slate-100">{card.value}</div>
              )}
              <div className="text-xs text-slate-500">{card.label}</div>
              <div className="text-xs text-slate-700 mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Study Time Chart — real DB data only */}
          <div className="lg:col-span-2 glass-card p-5">
            <h3 className="text-base font-semibold text-slate-200 mb-1">Study Activity (Last 14 Days)</h3>
            <p className="text-xs text-slate-600 mb-4">Minutes studied per day from your watch history</p>
            {loading ? (
              <div className="skeleton h-48 rounded-xl" />
            ) : !hasAnyActivity ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-600">
                <BarChart3 size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No study activity yet</p>
                <p className="text-xs mt-1">Start watching videos to see your progress here</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={studyChartData}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1d35" />
                  <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    name="Study Minutes"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorMinutes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Radar Chart */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-slate-200 mb-4">Skill Radar</h3>
            {loading ? (
              <div className="skeleton h-48 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1a1d35" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar name="You" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Quiz Performance */}
        {analytics?.recentAttempts?.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-slate-200 mb-4">Recent Quiz Performance</h3>
            <div className="space-y-2">
              {analytics.recentAttempts.map((attempt: any) => (
                <div key={attempt._id} className="flex items-center gap-4 p-3 bg-white/3 rounded-xl">
                  <div className={`badge text-xs ${attempt.passed ? 'badge-success' : 'badge-error'}`}>
                    {attempt.passed ? 'Passed' : 'Failed'}
                  </div>
                  <div className="flex-1">
                    <div className="progress-bar h-1.5">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${attempt.score}%`,
                          background: attempt.passed ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ef4444, #dc2626)'
                        }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${attempt.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {attempt.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement suggestions — now with working link */}
        {(analytics?.weakTopics || 0) > 0 && (
          <div className="glass-card p-5 border-orange-500/20 bg-orange-500/5">
            <h3 className="text-base font-semibold text-orange-300 mb-2 flex items-center gap-2">
              <Brain size={18} /> Areas to Improve
            </h3>
            <p className="text-sm text-slate-400">
              You have {analytics.weakTopics} topic{analytics.weakTopics > 1 ? 's' : ''} with quiz scores below 60%.
              Consider revisiting those topics and re-taking the quizzes.
            </p>
            <Link to="/tracks" className="btn-secondary text-sm mt-3 inline-flex items-center gap-2">
              <LinkIcon size={14} /> Browse Tracks
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}