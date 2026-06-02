import { useEffect, useState } from 'react';
import { Trophy, Crown, Flame, Star } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { userAPI } from '../lib/api';
import { useAuthStore } from '../store';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getLeaderboard().then((res) => {
      setLeaderboard(res.data.leaderboard);
    }).finally(() => setLoading(false));
  }, []);

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <AppLayout title="Leaderboard">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Trophy className="text-yellow-400" size={26} /> Leaderboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">Top learners ranked by XP points</p>
        </div>

        {/* Top 3 podium */}
        {!loading && leaderboard.length >= 3 && (
          <div className="glass-card p-5 mb-5">
            <div className="flex items-end justify-center gap-4">
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map((leader, i) => {
                const actualRank = i === 1 ? 0 : i === 0 ? 1 : 2;
                const heights = ['h-20', 'h-28', 'h-16'];
                return (
                  <div key={leader._id} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
                      {leader.name?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{leader.name?.split(' ')[0]}</p>
                    <p className="text-xs text-yellow-400">{leader.xp} XP</p>
                    <div className={`${heights[i]} w-16 rounded-t-xl flex items-center justify-center text-xl ${
                      actualRank === 0 ? 'bg-yellow-500/20 border-t-2 border-yellow-500' :
                      actualRank === 1 ? 'bg-slate-400/10 border-t-2 border-slate-400' :
                      'bg-orange-800/20 border-t-2 border-orange-700'
                    }`}>
                      {getMedal(actualRank)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full list */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : (
            leaderboard.map((leader, index) => {
              const isMe = leader._id === user?._id;
              return (
                <div
                  key={leader._id}
                  className={`flex items-center gap-4 p-4 border-b border-white/3 last:border-0 transition-colors ${
                    isMe ? 'bg-indigo-500/10' : 'hover:bg-white/3'
                  }`}
                >
                  <div className="w-8 text-center font-bold text-base">
                    {getMedal(index)}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                    {leader.avatar ? (
                      <img src={leader.avatar} alt={leader.name} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      leader.name?.[0]?.toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-200 truncate">{leader.name}</p>
                      {isMe && <span className="badge badge-primary text-xs">You</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-600">Level {leader.level}</span>
                      {leader.streak > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-orange-400">
                          <Flame size={10} /> {leader.streak}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-yellow-400 font-bold">
                    <Star size={14} fill="currentColor" />
                    <span className="text-sm">{leader.xp.toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
