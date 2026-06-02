import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Filter, Clock, Users, Star, Lock, ChevronRight } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { trackAPI } from '../lib/api';
import type { Track } from '../types/index';
import { useAuthStore } from '../store';

const CATEGORIES = ['all', 'backend', 'frontend', 'fullstack', 'data', 'devops', 'dsa', 'mobile', 'ai'];
const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'];

const CATEGORY_ICONS: Record<string, string> = {
  backend: '⚙️', frontend: '🎨', fullstack: '🌐', data: '📊',
  devops: '🚀', dsa: '🧮', mobile: '📱', ai: '🤖', all: '✨'
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'badge-success',
  intermediate: 'badge-warning',
  advanced: 'badge-error',
};

export default function TracksPage() {
  const { user } = useAuthStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');

  useEffect(() => {
    const params: any = {};
    if (category !== 'all') params.category = category;
    if (difficulty !== 'all') params.difficulty = difficulty;
    if (search) params.search = search;

    trackAPI.getTracks(params).then((res) => {
      setTracks(res.data.tracks);
    }).finally(() => setLoading(false));
  }, [category, difficulty, search]);

  return (
    <AppLayout title="Learning Tracks">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="text-blue-400" size={26} /> Learning Tracks
          </h1>
          <p className="text-slate-500 text-sm mt-1">Expert-curated paths to take you from zero to hired</p>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
              placeholder="Search tracks..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                    : 'bg-white/5 border border-white/10 text-slate-500 hover:text-slate-300'
                }`}
              >
                {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  difficulty === d
                    ? 'bg-white/10 border border-white/20 text-slate-200'
                    : 'bg-white/3 border border-white/8 text-slate-600 hover:text-slate-400'
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tracks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-5 skeleton h-56" />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">No tracks found. Try adjusting filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map((track) => {
              const locked = track.isPremium && user?.plan !== 'premium' && user?.role !== 'admin';
              return (
                <div key={track._id} className={`glass-card p-5 group ${locked ? 'opacity-80' : ''}`}>
                  {/* Thumbnail */}
                  <div className="relative h-32 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                    {track.thumbnail ? (
                      <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">{CATEGORY_ICONS[track.category] || '📚'}</span>
                    )}
                    {locked && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Lock size={24} className="text-yellow-400" />
                      </div>
                    )}
                    {track.isPremium && (
                      <div className="absolute top-2 right-2">
                        <span className="badge badge-premium text-xs">✨ Premium</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {track.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{track.shortDescription || track.description}</p>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`badge text-xs ${DIFFICULTY_COLORS[track.difficulty]}`}>{track.difficulty}</span>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Clock size={11} /> {track.estimatedHours}h
                    </span>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Users size={11} /> {track.enrolledCount.toLocaleString()}
                    </span>
                  </div>

                  {locked ? (
                    <Link to="/pricing" className="btn-primary w-full justify-center text-sm py-2.5">
                      <Lock size={14} /> Unlock with Premium
                    </Link>
                  ) : (
                    <Link to={`/tracks/${track._id}`} className="btn-primary w-full justify-center text-sm py-2.5">
                      Start Track <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
