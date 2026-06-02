import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, HelpCircle, CheckCircle, Play, Zap, Lock, ChevronRight } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { trackAPI, progressAPI } from '../lib/api';
import type { Topic, Progress, Note, Video } from '../types/index';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type Tab = 'video' | 'notes' | 'quiz';

export default function VideoPlayer() {
  const { trackId, topicId } = useParams<{ trackId: string; topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('video');
  const [watchedPct, setWatchedPct] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!trackId || !topicId) return;
    trackAPI.getTopic(trackId, topicId).then((res) => {
      setTopic(res.data.topic);
      setProgress(res.data.progress);
      if (res.data.progress?.watchedPercentage) {
        setWatchedPct(res.data.progress.watchedPercentage);
      }
    }).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load topic');
    }).finally(() => setLoading(false));
  }, [trackId, topicId]);

  const video = topic?.videoId as Video | undefined;
  const note = topic?.noteId as Note | undefined;

  // Simulate progress tracking via postMessage to YouTube iframe
  const trackProgress = useCallback(async () => {
    if (!topic || !video) return;
    // In a real app we'd use YouTube IFrame API. Simulate 1% progress every 5s while tab is active
    setWatchedPct(prev => {
      const next = Math.min(prev + 0.5, 100);
      if (next > prev) {
        progressAPI.updateVideo({
          topicId: topic._id,
          watchedPercentage: next,
          watchTime: 5,
        }).then((res) => {
          if (res.data.justCompleted) {
            toast.success(`Video completed! +10 XP 🎉`);
            setXpEarned(e => e + 10);
            setProgress(res.data.progress);
          }
        }).catch(() => {});
      }
      return next;
    });
  }, [topic, video]);

  // Start tracking when video tab is active
  useEffect(() => {
    if (tab === 'video' && !progress?.videoCompleted) {
      progressInterval.current = setInterval(trackProgress, 5000);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [tab, progress?.videoCompleted, trackProgress]);

  if (loading) return (
    <AppLayout>
      <div className="space-y-4">
        <div className="skeleton h-12 w-48 rounded-xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    </AppLayout>
  );

  if (error || !topic) return (
    <AppLayout>
      <div className="text-center py-20">
        {error?.includes('locked') ? (
          <div>
            <Lock size={48} className="text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-300 mb-2">Topic Locked</h2>
            <p className="text-slate-500 mb-6">Complete the previous topic first to unlock this one.</p>
            <Link to={`/tracks/${trackId}`} className="btn-primary">Back to Track</Link>
          </div>
        ) : (
          <div>
            <p className="text-red-400 mb-4">{error || 'Topic not found'}</p>
            <Link to={`/tracks/${trackId}`} className="btn-secondary">Back to Track</Link>
          </div>
        )}
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link to={`/tracks/${trackId}`} className="btn-ghost p-2">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-100 truncate">{topic.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {progress?.topicCompleted && (
                <span className="badge badge-success text-xs">✓ Completed</span>
              )}
              <span className="flex items-center gap-1 text-xs text-yellow-500">
                <Zap size={11} /> +{topic.xpReward} XP
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 glass p-1 rounded-xl w-fit">
          {[
            { key: 'video' as Tab, icon: Play, label: 'Video' },
            { key: 'notes' as Tab, icon: FileText, label: 'Notes' },
            { key: 'quiz' as Tab, icon: HelpCircle, label: 'Quiz' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? 'bg-indigo-500 text-white shadow'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={15} />
              {label}
              {key === 'notes' && note && <span className="badge badge-primary text-xs ml-1">{note.estimatedReadTime}m</span>}
              {key === 'quiz' && topic.quizId && progress?.quizPassed && (
                <CheckCircle size={12} className="text-green-400" />
              )}
            </button>
          ))}
        </div>

        {/* Video progress bar */}
        {tab === 'video' && video && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Watch Progress (80% to complete)</span>
              <span className={watchedPct >= 80 ? 'text-green-400' : 'text-indigo-400'}>{Math.round(watchedPct)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${watchedPct}%`,
                  background: watchedPct >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' : undefined
                }}
              />
            </div>
          </div>
        )}

        {/* Video Tab */}
        {tab === 'video' && (
          <div className="space-y-4">
            {video ? (
              <div className="glass-card overflow-hidden">
                {/* YouTube embed - NO recommendations (rel=0, controls but no related) */}
                <div className="relative aspect-video bg-black">
                  <iframe
                    ref={iframeRef}
                    src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&fs=1&cc_load_policy=0&iv_load_policy=3`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-base font-semibold text-slate-200">{video.title}</h2>
                  {video.description && <p className="text-sm text-slate-500 mt-1">{video.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
                    <span>Duration: {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}</span>
                    {progress?.videoCompleted && (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle size={12} /> Video completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <Play size={40} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">No video for this topic</p>
              </div>
            )}

            {/* Unlock next info */}
            {!progress?.topicCompleted && (
              <div className="glass-card p-4 border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-start gap-3">
                  <Lock size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-300">Unlock Requirements</p>
                    <div className="flex gap-4 mt-1.5 text-xs text-slate-500">
                      <span className={`flex items-center gap-1 ${watchedPct >= 80 || progress?.videoCompleted ? 'text-green-400' : ''}`}>
                        {watchedPct >= 80 || progress?.videoCompleted ? <CheckCircle size={12} /> : <Play size={12} />}
                        Watch 80% of video
                      </span>
                      <span className={`flex items-center gap-1 ${progress?.quizPassed ? 'text-green-400' : ''}`}>
                        {progress?.quizPassed ? <CheckCircle size={12} /> : <HelpCircle size={12} />}
                        Pass quiz (70%+)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {tab === 'notes' && (
          <div className="space-y-4">
            {note ? (
              <>
                <div className="glass-card p-6">
                  <h2 className="text-xl font-bold text-slate-100 mb-4">{note.title}</h2>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                  </div>
                </div>

                {note.keyPoints.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="text-base font-semibold text-slate-200 mb-3">🔑 Key Points</h3>
                    <ul className="space-y-2">
                      {note.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                          <CheckCircle size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {note.cheatsheet && (
                  <div className="glass-card p-5">
                    <h3 className="text-base font-semibold text-slate-200 mb-3">⚡ Cheatsheet</h3>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{note.cheatsheet}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {note.codeExamples && note.codeExamples.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="text-base font-semibold text-slate-200 mb-3">💻 Code Examples</h3>
                    <div className="space-y-4">
                      {note.codeExamples.map((ex, i) => (
                        <div key={i}>
                          <p className="text-sm font-medium text-slate-300 mb-2">{ex.title}</p>
                          <pre className="p-4 rounded-xl text-sm overflow-x-auto">
                            <code>{ex.code}</code>
                          </pre>
                          {ex.explanation && (
                            <p className="text-xs text-slate-500 mt-2">{ex.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card p-12 text-center">
                <FileText size={40} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">No notes for this topic</p>
              </div>
            )}
          </div>
        )}

        {/* Quiz Tab */}
        {tab === 'quiz' && topic.quizId && (
          <div className="glass-card p-6 text-center">
            <HelpCircle size={40} className="text-indigo-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-200 mb-2">Ready for the Quiz?</h2>
            <p className="text-slate-500 mb-2">Pass with 70% or more to complete this topic</p>
            {progress?.quizPassed ? (
              <div className="mb-4">
                <span className="badge badge-success">✓ Passed with {progress.quizScore}%</span>
              </div>
            ) : !progress?.videoCompleted && watchedPct < 80 ? (
              <div className="mb-4">
                <span className="badge badge-warning">Watch 80% of the video first</span>
              </div>
            ) : null}
            <Link
              to={`/quiz/${(topic.quizId as any)._id || topic.quizId}`}
              className="btn-primary text-sm px-6 py-3"
            >
              {progress?.quizPassed ? 'Retake Quiz' : 'Start Quiz'} <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
