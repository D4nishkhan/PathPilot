import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen, ChevronDown, ChevronRight, Play, FileText,
  CheckCircle, Lock, Clock, Trophy, ArrowLeft, Zap
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { trackAPI } from '../lib/api';
import type { Track, Module, Topic, Progress } from '../types/index';

export default function TrackDetail() {
  const { id } = useParams<{ id: string }>();
  const [track, setTrack] = useState<Track | null>(null);
  const [modules, setModules] = useState<(Module & { topics: Topic[] })[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    trackAPI.getTrack(id).then((res) => {
      setTrack(res.data.track);
      setModules(res.data.modules);
      setProgressMap(res.data.progressMap || {});
      // Expand first module by default
      if (res.data.modules.length > 0) {
        setExpandedModules(new Set([res.data.modules[0]._id]));
      }
    }).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load track');
    }).finally(() => setLoading(false));
  }, [id]);

  const toggleModule = (modId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(modId)) next.delete(modId);
      else next.add(modId);
      return next;
    });
  };

  const getTopicStatus = (topic: Topic, topicIndex: number, module: Module & { topics: Topic[] }) => {
    const progress = progressMap[topic._id];
    if (progress?.topicCompleted) return 'completed';
    if (topicIndex === 0) return 'available';
    const prevTopic = module.topics[topicIndex - 1];
    const prevProgress = progressMap[prevTopic?._id];
    if (prevProgress?.topicCompleted) return 'available';
    return 'locked';
  };

  const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0);
  const completedTopics = Object.values(progressMap).filter(p => p.topicCompleted).length;
  const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  if (loading) return (
    <AppLayout>
      <div className="space-y-4">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-24 rounded-xl" />
        <div className="skeleton h-24 rounded-xl" />
      </div>
    </AppLayout>
  );

  if (error || !track) return (
    <AppLayout>
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error || 'Track not found'}</p>
        <Link to="/tracks" className="btn-secondary">Back to Tracks</Link>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <Link to="/tracks" className="btn-ghost mb-4 inline-flex">
          <ArrowLeft size={16} /> All Tracks
        </Link>

        {/* Track Header */}
        <div className="glass-card p-6 mb-5">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 text-4xl">
              📚
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-slate-100">{track.title}</h1>
                {track.isPremium && <span className="badge badge-premium">✨ Premium</span>}
                <span className={`badge text-xs ${track.difficulty === 'beginner' ? 'badge-success' : track.difficulty === 'intermediate' ? 'badge-warning' : 'badge-error'}`}>
                  {track.difficulty}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-4">{track.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><BookOpen size={14} /> {totalTopics} Topics</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {track.estimatedHours}h Estimated</span>
                <span className="flex items-center gap-1"><Trophy size={14} /> {track.enrolledCount.toLocaleString()} Enrolled</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>{completedTopics}/{totalTopics} topics completed</span>
              <span className="text-indigo-400 font-semibold">{progressPct}%</span>
            </div>
            <div className="progress-bar h-2">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" /> Completed</span>
          <span className="flex items-center gap-1.5"><Play size={12} className="text-indigo-400" /> Available</span>
          <span className="flex items-center gap-1.5"><Lock size={12} className="text-slate-600" /> Locked</span>
        </div>

        {/* Modules Accordion */}
        <div className="space-y-3">
          {modules.map((mod) => (
            <div key={mod._id} className="glass-card overflow-hidden">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(mod._id)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                    <BookOpen size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">{mod.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {mod.topics.length} topics •{' '}
                      {mod.topics.filter(t => progressMap[t._id]?.topicCompleted).length} completed
                    </p>
                  </div>
                </div>
                {expandedModules.has(mod._id)
                  ? <ChevronDown size={16} className="text-slate-500" />
                  : <ChevronRight size={16} className="text-slate-500" />
                }
              </button>

              {/* Topics List */}
              {expandedModules.has(mod._id) && (
                <div className="border-t border-white/5">
                  {mod.topics.map((topic, tIdx) => {
                    const status = getTopicStatus(topic, tIdx, mod);
                    const isLocked = status === 'locked';
                    const isCompleted = status === 'completed';
                    const progress = progressMap[topic._id];

                    return (
                      <div key={topic._id} className={`flex items-center gap-4 p-3 px-5 border-b border-white/3 last:border-0 ${isLocked ? 'opacity-50' : 'hover:bg-white/3'} transition-colors`}>
                        {/* Status icon */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                          {isCompleted ? (
                            <CheckCircle size={20} className="text-green-400" />
                          ) : isLocked ? (
                            <Lock size={16} className="text-slate-600" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                          )}
                        </div>

                        {/* Topic info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isCompleted ? 'text-green-300' : isLocked ? 'text-slate-600' : 'text-slate-200'}`}>
                            {topic.title}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {topic.videoId && <span className="flex items-center gap-1 text-xs text-slate-600"><Play size={10} /> Video</span>}
                            {topic.noteId && <span className="flex items-center gap-1 text-xs text-slate-600"><FileText size={10} /> Notes</span>}
                            {topic.quizId && <span className="flex items-center gap-1 text-xs text-slate-600"><CheckCircle size={10} /> Quiz</span>}
                          </div>
                        </div>

                        {/* XP reward */}
                        <div className="flex items-center gap-1 text-xs text-yellow-500 flex-shrink-0">
                          <Zap size={11} /> +{topic.xpReward}
                        </div>

                        {/* Video progress bar */}
                        {progress?.watchedPercentage !== undefined && progress.watchedPercentage > 0 && !isCompleted && (
                          <div className="w-16">
                            <div className="progress-bar h-1">
                              <div className="progress-fill" style={{ width: `${progress.watchedPercentage}%` }} />
                            </div>
                            <p className="text-xs text-slate-600 text-right mt-0.5">{Math.round(progress.watchedPercentage)}%</p>
                          </div>
                        )}

                        {/* Action button */}
                        {!isLocked && (
                          <Link to={`/tracks/${id}/topics/${topic._id}`} className="btn-primary text-xs py-1.5 px-3 flex-shrink-0">
                            {isCompleted ? 'Review' : 'Start'}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
