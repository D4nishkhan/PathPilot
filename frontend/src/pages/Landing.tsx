import { Link } from 'react-router-dom';
import {
  Zap, Map, BookOpen, Bot, BarChart3, Shield,
  ArrowRight, CheckCircle, Star, Users, Trophy,
  Play, Mic, Brain, Target, ChevronRight
} from 'lucide-react';

const features = [
  { icon: Map, title: 'AI Roadmap Generator', desc: 'Get a personalized, week-by-week learning plan built by AI based on your goals and skill level.', color: 'from-indigo-500 to-purple-600' },
  { icon: BookOpen, title: 'Curated Learning Tracks', desc: 'Structured tracks for MERN, Java Backend, DSA, Data Analytics — built by experts, not algorithm.', color: 'from-purple-500 to-pink-600' },
  { icon: Bot, title: 'AI Tutor 24/7', desc: 'Ask any programming question and get a detailed explanation, code example, and real-world use case.', color: 'from-blue-500 to-cyan-600' },
  { icon: Play, title: 'Distraction-Free Video', desc: 'YouTube videos without recommendations. Pure focus mode.', color: 'from-green-500 to-emerald-600' },
  { icon: Shield, title: 'Locked Progression', desc: 'Can\'t skip ahead. Each topic unlocks only after you pass the video and quiz. Learn deeply.', color: 'from-orange-500 to-amber-600' },
  { icon: Mic, title: 'Mock Interviews', desc: 'AI interviews you for Java, MERN, DSA or HR roles. Get scored and receive a detailed report.', color: 'from-red-500 to-rose-600' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Track study time, quiz performance, weak topics, videos completed — all in one dashboard.', color: 'from-teal-500 to-cyan-600' },
  { icon: Trophy, title: 'Gamification', desc: 'Earn XP, level up from Beginner to Job Ready, collect badges and compete on leaderboards.', color: 'from-yellow-500 to-amber-500' },
];

const tracks = [
  { name: 'Java Backend', icon: '☕', topics: 85, hours: '120h', level: 'Beginner → Advanced' },
  { name: 'MERN Stack', icon: '🌿', topics: 92, hours: '150h', level: 'Beginner → Advanced' },
  { name: 'Data Analytics', icon: '📊', topics: 64, hours: '80h', level: 'Beginner → Intermediate' },
  { name: 'DSA Mastery', icon: '🧮', topics: 120, hours: '200h', level: 'Beginner → Advanced' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Got placed at TCS', text: 'PathPilot\'s locked progression kept me disciplined. The AI Tutor explained concepts better than any YouTube tutorial.', avatar: 'P' },
  { name: 'Rahul Verma', role: 'SDE at Startup', text: 'The mock interviews were incredibly realistic. It found my weak spots and helped me improve before my actual interviews.', avatar: 'R' },
  { name: 'Anjali Singh', role: 'MERN Developer', text: 'I stopped hopping between 50 YouTube channels. PathPilot gave me a clear path and I followed it. That\'s all it took.', avatar: 'A' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#06070f] text-slate-200 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">PathPilot</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/#features" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">Features</Link>
            <Link to="/#tracks" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">Tracks</Link>
            <Link to="/pricing" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/signup" className="btn-primary text-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 hero-grid">
        {/* Glowing orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 badge badge-primary mb-6 px-4 py-2 text-sm">
            <Zap size={14} className="text-indigo-400" />
            AI-Powered Learning OS for Students
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            From Beginner to{' '}
            <span className="gradient-text">Job-Ready</span>
            <br />Without the Chaos
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            PathPilot is a complete learning platform that gives you a personalized roadmap, distraction-free videos, an AI tutor, quizzes, mock interviews — and keeps you accountable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup" className="btn-primary text-base px-8 py-4">
              Start Learning Free <ArrowRight size={18} />
            </Link>
            <Link to="/pricing" className="btn-secondary text-base px-8 py-4">
              View Plans <ChevronRight size={18} />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { label: 'Students', value: '50K+' },
              { label: 'Topics', value: '500+' },
              { label: 'Placement Rate', value: '78%' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Get Hired</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Stop jumping between 10 different platforms. PathPilot has it all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="glass-card p-5 group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-semibold text-slate-200 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section id="tracks" className="py-20 px-4 bg-[#0d0f1e]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Start with a <span className="gradient-text">Learning Track</span>
            </h2>
            <p className="text-slate-400">Choose your domain and get a structured, expert-curated path</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tracks.map((t) => (
              <div key={t.name} className="glass-card p-6 group cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{t.icon}</div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">{t.name}</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>📚 {t.topics} Topics</span>
                    <span>⏱ {t.hours}</span>
                  </div>
                  <div className="badge badge-primary text-xs">{t.level}</div>
                </div>
                <Link to="/signup" className="btn-primary w-full mt-4 text-sm justify-center">
                  Start Track →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How PathPilot Works</h2>
          </div>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Tell us your goal', desc: 'Enter your skill, level, and daily study hours. Our AI creates a personalized roadmap.' },
              { step: '02', title: 'Follow the path', desc: 'Learn topic by topic. Each topic has a video, notes, and a quiz. Can\'t skip — locked progression.' },
              { step: '03', title: 'Get help anytime', desc: 'Stuck? Ask the AI Tutor. Get explanations, code examples, and real-world use cases instantly.' },
              { step: '04', title: 'Practice and get hired', desc: 'Take mock interviews, get a performance report, fix weaknesses, and land your dream job.' },
            ].map((item) => (
              <div key={item.step} className="glass-card p-6 flex gap-6 items-start group">
                <div className="text-4xl font-black gradient-text opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-1">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-[#0d0f1e]/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Students Love PathPilot</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card p-6">
                <div className="flex items-center gap-2 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{t.name}</p>
                    <p className="text-xs text-green-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10" />
            <div className="relative">
              <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-slate-400 text-lg mb-8">Join 50,000+ students who stopped watching random YouTube tutorials and started learning with a plan.</p>
              <Link to="/signup" className="btn-primary text-base px-8 py-4">
                Start for Free — No Credit Card <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-indigo-500" />
            <span className="font-semibold text-slate-400">PathPilot</span>
            <span>© 2024</span>
          </div>
          <div className="flex gap-6">
            <Link to="/pricing" className="hover:text-slate-400 transition-colors">Pricing</Link>
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
