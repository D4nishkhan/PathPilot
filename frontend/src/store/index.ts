import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/index';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token) => {
        console.log('[Store.setAuth] Called with:', { user, token });
        localStorage.setItem('pathpilot_token', token);
        set({ user, token, isAuthenticated: true });
        console.log('[Store.setAuth] Store updated - new state:', { user, token, isAuthenticated: true });
        console.log('[Store.setAuth] localStorage "pathpilot-auth":', localStorage.getItem('pathpilot-auth'));
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },

      logout: () => {
        localStorage.removeItem('pathpilot_token');
        localStorage.removeItem('pathpilot_user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'pathpilot-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Log store hydration
console.log('[Store] Initial state on app load:', useAuthStore.getState());
console.log('[Store] Persisted data in localStorage:', localStorage.getItem('pathpilot-auth'));

// ─── UI State ──────────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Open by default on desktop (≥768 px), closed on mobile.
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));