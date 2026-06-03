import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, BookOpen, Bot, BarChart3,
  User, Trophy, LogOut, Zap, Star, ChevronRight,
  Shield, Mic, Settings, X
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../store';

const LEVEL_NAMES: Record<number, string> = {
  1: 'Beginner', 2: 'Learner', 3: 'Student', 4: 'Coder',
  5: 'Explorer', 6: 'Developer', 7: 'Builder', 8: 'Engineer',
  9: 'Architect', 10: 'Builder Pro', 20: 'Job Ready'
};

const getLevelName = (level: number) => {
  const keys = Object.keys(LEVEL_NAMES).map(Number).sort((a, b) => b - a);
  for (const k of keys) {
    if (level >= k) return LEVEL_NAMES[k];
  }
  return 'Beginner';
};

const getXPForNextLevel = (level: number) => {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000, 13000, 17000, 22000];
  return thresholds[level] || thresholds[thresholds.length - 1];
};

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/roadmap', icon: Map, label: 'Roadmap' },
  { to: '/tracks', icon: BookOpen, label: 'Learning Tracks' },
  { to: '/tutor', icon: Bot, label: 'AI Tutor' },
  { to: '/interview', icon: Mic, label: 'Mock Interview', premium: true },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const navigate = useNavigate();

  const xpForNext = getXPForNextLevel(user?.level || 1);
  const xpCurrent = user?.xp || 0;
  const xpPercent = Math.min((xpCurrent / xpForNext) * 100, 100);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // On mobile (<768 px) a nav-link tap should close the overlay.
  // On desktop the sidebar stays open after navigation.
  const handleNavClick = () => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">PathPilot</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn-ghost p-1"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        <div className="p-4">
          <div className="glass-card p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
                <div className="flex items-center gap-1">
                  <Star size={11} className="text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">
                    {getLevelName(user?.level || 1)}
                  </span>
                </div>
              </div>
              {user?.plan === 'premium' && (
                <span className="badge badge-premium ml-auto text-xs">Pro</span>
              )}
            </div>

            {/* XP Bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="text-yellow-400 font-semibold">{xpCurrent} XP</span>
                <span>Lv {user?.level || 1}</span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${xpPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Streak pill */}
        {(user?.streak || 0) > 0 && (
          <div className="px-4 mb-2">
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-semibold text-orange-400">{user?.streak} day streak!</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 pb-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, premium }) => (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${premium && user?.plan !== 'premium' ? 'opacity-60' : ''}`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {premium && user?.plan !== 'premium' && (
                <span className="text-xs badge badge-premium px-1.5 py-0.5">Pro</span>
              )}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              onClick={handleNavClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Shield size={18} />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
