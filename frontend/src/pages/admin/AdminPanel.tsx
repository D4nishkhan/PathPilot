import { useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, BarChart3, Plus,
  Trash2, Edit3, Shield, Save, Loader2, X, ChevronRight, Settings
} from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import { adminAPI } from '../../lib/api';
import toast from 'react-hot-toast';

// ─── Admin Dashboard ───────────────────────────────────────────
function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics().then(res => setAnalytics(res.data.analytics))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Users', value: analytics?.totalUsers, icon: Users, color: 'text-indigo-400' },
    { label: 'Premium Users', value: analytics?.premiumUsers, icon: Shield, color: 'text-yellow-400' },
    { label: 'Total Tracks', value: analytics?.totalTracks, icon: BookOpen, color: 'text-blue-400' },
    { label: 'Topics Completed', value: analytics?.totalProgress, icon: BarChart3, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-100">Admin Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-card p-5">
            <s.icon size={20} className={s.color} />
            <div className="text-3xl font-bold text-slate-100 mt-3">
              {loading ? <div className="skeleton h-8 w-16 rounded" /> : (s.value || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="glass-card p-5">
        <h3 className="text-base font-semibold text-slate-200 mb-4">Recent Signups</h3>
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}</div>
        ) : (
          <div className="space-y-2">
            {(analytics?.recentUsers || []).map((u: any) => (
              <div key={u._id} className="flex items-center gap-3 p-2 hover:bg-white/3 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {u.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{u.name}</p>
                  <p className="text-xs text-slate-600">{u.email}</p>
                </div>
                <span className={`badge text-xs ${u.plan === 'premium' ? 'badge-premium' : 'badge-primary'}`}>
                  {u.plan}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Tracks ─────────────────────────────────────────────
function AdminTracks() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', description: '', category: 'backend', difficulty: 'beginner', estimatedHours: 40, isPremium: false, isPublished: false });
  const [saving, setSaving] = useState(false);

  const load = () => adminAPI.getTracks().then(res => setTracks(res.data.tracks)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.slug) { toast.error('Title and slug required'); return; }
    setSaving(true);
    try {
      await adminAPI.createTrack(form);
      toast.success('Track created!');
      setShowForm(false);
      setForm({ title: '', slug: '', description: '', category: 'backend', difficulty: 'beginner', estimatedHours: 40, isPremium: false, isPublished: false });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this track?')) return;
    try {
      await adminAPI.deleteTrack(id);
      toast.success('Track deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const handleTogglePublish = async (track: any) => {
    try {
      await adminAPI.updateTrack(track._id, { isPublished: !track.isPublished });
      toast.success(track.isPublished ? 'Track unpublished' : 'Track published!');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">Learning Tracks</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus size={16} /> Add Track
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-200">Create New Track</h3>
            <button onClick={() => setShowForm(false)} className="btn-ghost p-1"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Title *</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Java Backend" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Slug *</label>
              <input className="input-field" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="java-backend" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Description</label>
              <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {['backend','frontend','fullstack','data','devops','dsa','mobile','ai'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Difficulty</label>
              <select className="input-field" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Estimated Hours</label>
              <input type="number" className="input-field" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPremium} onChange={e => setForm({ ...form, isPremium: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
                <span className="text-sm text-slate-400">Premium</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
                <span className="text-sm text-slate-400">Published</span>
              </label>
            </div>
          </div>
          <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm mt-4">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Create Track</>}
          </button>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : tracks.length === 0 ? (
          <div className="p-12 text-center"><BookOpen size={40} className="text-slate-700 mx-auto mb-3" /><p className="text-slate-500">No tracks yet</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-600 uppercase">
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4 hidden sm:table-cell">Category</th>
                <th className="text-left p-4 hidden md:table-cell">Difficulty</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track._id} className="border-b border-white/3 last:border-0 hover:bg-white/3">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-slate-200">{track.title}</p>
                      <p className="text-xs text-slate-600">{track.estimatedHours}h · {track.enrolledCount} enrolled</p>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell"><span className="badge badge-primary text-xs">{track.category}</span></td>
                  <td className="p-4 hidden md:table-cell"><span className="text-xs text-slate-500 capitalize">{track.difficulty}</span></td>
                  <td className="p-4">
                    <button onClick={() => handleTogglePublish(track)} className={`badge text-xs cursor-pointer ${track.isPublished ? 'badge-success' : 'badge-warning'}`}>
                      {track.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(track._id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Admin Users ──────────────────────────────────────────────
function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => adminAPI.getUsers({ search }).then(res => setUsers(res.data.users)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try { await adminAPI.deleteUser(id); toast.success('User deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleRoleChange = async (user: any) => {
    try {
      await adminAPI.updateUser(user._id, { role: user.role === 'admin' ? 'student' : 'admin' });
      toast.success('Role updated');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">Users</h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="input-field w-64 text-sm"
        />
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-600 uppercase">
                <th className="text-left p-4">User</th>
                <th className="text-left p-4 hidden sm:table-cell">Plan</th>
                <th className="text-left p-4 hidden md:table-cell">XP / Level</th>
                <th className="text-left p-4 hidden lg:table-cell">Role</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-white/3 last:border-0 hover:bg-white/3">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-slate-200">{u.name}</p>
                      <p className="text-xs text-slate-600">{u.email}</p>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className={`badge text-xs ${u.plan === 'premium' ? 'badge-premium' : 'badge-primary'}`}>{u.plan}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell text-xs text-slate-500">{u.xp} XP · Lv {u.level}</td>
                  <td className="p-4 hidden lg:table-cell">
                    <button onClick={() => handleRoleChange(u)} className={`badge text-xs cursor-pointer ${u.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>
                      {u.role}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(u._id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Layout ─────────────────────────────────────────
export default function AdminPanel() {
  const adminNav = [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/tracks', icon: BookOpen, label: 'Tracks' },
    { to: '/admin/users', icon: Users, label: 'Users' },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Admin header */}
        <div className="glass-card p-4 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Admin Panel</h1>
            <p className="text-xs text-slate-500">Manage content, users, and platform settings</p>
          </div>
        </div>

        {/* Admin sub-nav */}
        <div className="flex gap-2 mb-5 glass p-1 rounded-xl w-fit">
          {adminNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Route content */}
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="tracks" element={<AdminTracks />} />
          <Route path="users" element={<AdminUsers />} />
        </Routes>
      </div>
    </AppLayout>
  );
}
