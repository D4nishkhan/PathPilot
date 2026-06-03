import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, Zap, Search } from 'lucide-react';
import { useAuthStore, useUIStore } from '../store';

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="h-16 glass border-b border-white/5 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="btn-ghost p-2"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        {title && (
          <h1 className="text-lg font-semibold text-slate-200 hidden sm:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* XP badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5">
          <Zap size={14} className="text-yellow-400" />
          <span className="text-sm font-semibold text-yellow-400">{user?.xp || 0} XP</span>
        </div>

        {/* Streak */}
        {(user?.streak || 0) > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5">
            <span className="text-sm">🔥</span>
            <span className="text-sm font-semibold text-orange-400">{user?.streak}</span>
          </div>
        )}

        {/* Avatar */}
        <Link to="/profile">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white cursor-pointer hover:scale-105 transition-transform">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
