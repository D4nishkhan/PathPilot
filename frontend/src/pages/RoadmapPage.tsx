import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Map, Loader2, Sparkles, Calendar, Clock,
  ChevronRight, Target, BookOpen, CheckCircle,
  ArrowRight, Plus
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { aiAPI } from '../lib/api';
import type { Roadmap } from '../types/index';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { format } from 'date-fns';

const SKILLS = ['Java Backend', 'MERN Stack', 'React', 'Python', 'Data Analytics', 'DSA & Algorithms', 'DevOps', 'Flutter', 'Machine Learning', 'System Design'];
const LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'Little to no experience' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience, know the basics' },
  { value: 'advanced', label: 'Advanced', desc: 'Solid foundation, ready to specialize' },
];

export default function RoadmapPage() {
  const { user } = useAuthStore();
  const [skill, setSkill] = useState('');
  const [currentLevel, setCurrentLevel] = useState('beginner');
  const [dailyHours, setDailyHours] = useState(2);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

  const loadRoadmaps = async () => {
    try {
      const res = await aiAPI.getRoadmaps();
      setRoadmaps(res.data.roadmaps);
      if (res.data.roadmaps.length > 0 && !selectedRoadmap) {
        setSelectedRoadmap(res.data.roadmaps[0]);
      }
    } finally {
      setLoadingList(false);
    }
  };

  useState(() => { loadRoadmaps(); });

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!skill.trim() || !goal.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await aiAPI.generateRoadmap({ skill, currentLevel, dailyHours, goal });
      setRoadmaps([res.data.roadmap, ...roadmaps]);
      setSelectedRoadmap(res.data.roadmap);
      setShowForm(false);
      toast.success('Roadmap generated! 🗺️');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (err.response?.data?.code === 'UPGRADE_REQUIRED') {
        toast.error('Upgrade to Premium for unlimited roadmaps!');
      } else {
        toast.error(msg || 'Failed to generate roadmap');
      }
    } finally {
      setLoading(false);
    }
  };

  const resourceTypeColor = (type: string) => {
    const map: Record<string, string> = {
      video: 'text-red-400 bg-red-500/10',
      reading: 'text-blue-400 bg-blue-500/10',
      practice: 'text-green-400 bg-green-500/10',
      project: 'text-purple-400 bg-purple-500/10',
    };
    return map[type] || 'text-slate-400 bg-slate-500/10';
  };

  return (
    <AppLayout title="AI Roadmap">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Map className="text-indigo-400" size={26} /> Your Roadmaps
            </h1>
            <p className="text-slate-500 text-sm mt-1">AI-generated personalized learning paths</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={user?.plan === 'free' && roadmaps.length >= 1}
            className="btn-primary text-sm"
            title={user?.plan === 'free' && roadmaps.length >= 1 ? 'Upgrade to Premium for more roadmaps' : ''}
          >
            <Plus size={16} /> New Roadmap
            {user?.plan === 'free' && roadmaps.length >= 1 && (
              <span className="badge badge-premium text-xs ml-1">Pro</span>
            )}
          </button>
        </div>

        {/* Generation Form */}
        {(showForm || (roadmaps.length === 0 && !loadingList)) && (
          <div className="glass-card p-6 mb-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={20} className="text-purple-400" />
              <h2 className="text-lg font-semibold text-slate-200">Generate Your Roadmap</h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">What do you want to learn?</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
                  {SKILLS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSkill(s)}
                      className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                        skill === s
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300'
                          : 'border-white/10 text-slate-500 hover:border-indigo-500/40 hover:text-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  className="input-field mt-2"
                  placeholder="Or type a custom skill..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Your current level</label>
                <div className="grid grid-cols-3 gap-3">
                  {LEVELS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setCurrentLevel(l.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        currentLevel === l.value
                          ? 'border-indigo-500 bg-indigo-500/15'
                          : 'border-white/10 hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-200">{l.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Daily study hours: <span className="text-indigo-400">{dailyHours}h</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>30 min</span>
                    <span>8 hours</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Your goal</label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Get a job at a startup"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3">
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> Generating with AI...</>
                  ) : (
                    <><Sparkles size={18} /> Generate My Roadmap</>
                  )}
                </button>
                {showForm && roadmaps.length > 0 && (
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Roadmap list + detail view */}
        {roadmaps.length > 0 && !showForm && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Roadmap List */}
            <div className="space-y-3">
              {roadmaps.map((r) => (
                <button
                  key={r._id}
                  onClick={() => setSelectedRoadmap(r)}
                  className={`w-full text-left glass-card p-4 transition-all ${
                    selectedRoadmap?._id === r._id ? 'border-indigo-500/50 bg-indigo-500/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-200 line-clamp-1">{r.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.totalWeeks} weeks • {r.dailyHours}h/day</p>
                    </div>
                    <span className={`badge text-xs ${r.status === 'active' ? 'badge-success' : 'badge-primary'}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-2 progress-bar">
                    <div className="progress-fill" style={{ width: `${r.progressPercent}%` }} />
                  </div>
                  <p className="text-xs text-indigo-400 mt-1">{r.progressPercent}% complete</p>
                </button>
              ))}
            </div>

            {/* Roadmap Detail */}
            {selectedRoadmap && (
              <div className="lg:col-span-3 space-y-5 animate-fade-in-up">
                {/* Header */}
                <div className="glass-card p-6">
                  <h2 className="text-xl font-bold text-slate-100 mb-2">{selectedRoadmap.title}</h2>
                  {selectedRoadmap.aiSummary && (
                    <p className="text-slate-400 text-sm mb-4">{selectedRoadmap.aiSummary}</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: BookOpen, label: 'Skill', value: selectedRoadmap.skill },
                      { icon: Target, label: 'Level', value: selectedRoadmap.currentLevel },
                      { icon: Clock, label: 'Daily', value: `${selectedRoadmap.dailyHours}h` },
                      { icon: Calendar, label: 'Duration', value: `${selectedRoadmap.totalWeeks} weeks` },
                    ].map((info) => (
                      <div key={info.label} className="bg-white/3 rounded-xl p-3 text-center">
                        <info.icon size={16} className="text-indigo-400 mx-auto mb-1" />
                        <div className="text-xs text-slate-500">{info.label}</div>
                        <div className="text-sm font-semibold text-slate-200 mt-0.5 capitalize">{info.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly breakdown */}
                <div className="space-y-3">
                  {selectedRoadmap.weeks.map((week) => (
                    <div key={week.weekNumber} className="glass-card overflow-hidden">
                      <button
                        onClick={() => setExpandedWeek(expandedWeek === week.weekNumber ? null : week.weekNumber)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/3 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="badge badge-primary text-xs">Week {week.weekNumber}</span>
                            <span className="text-sm font-semibold text-slate-200">{week.title}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">🎯 {week.milestone}</p>
                        </div>
                        <ChevronRight
                          size={16}
                          className={`text-slate-600 transition-transform ${expandedWeek === week.weekNumber ? 'rotate-90' : ''}`}
                        />
                      </button>

                      {expandedWeek === week.weekNumber && (
                        <div className="px-4 pb-4 border-t border-white/5 pt-3 animate-fade-in-up">
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {week.goals.map((g, i) => (
                              <span key={i} className="badge badge-primary text-xs">{g}</span>
                            ))}
                          </div>
                          <div className="space-y-2">
                            {week.tasks.map((task, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-white/3 rounded-xl">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                                  {task.day}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-200">{task.title}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-xs text-slate-600">{task.estimatedHours}h</span>
                                  <span className={`badge text-xs ${resourceTypeColor(task.resourceType)}`}>
                                    {task.resourceType}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Resources */}
                {selectedRoadmap.resources && selectedRoadmap.resources.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recommended Resources</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedRoadmap.resources.map((res, i) => (
                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-3 p-3 bg-white/3 rounded-xl hover:bg-white/6 transition-colors group">
                          <BookOpen size={16} className="text-indigo-400" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-200 truncate">{res.title}</p>
                            <p className="text-xs text-slate-600">{res.type}</p>
                          </div>
                          <ArrowRight size={14} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
