import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, token, refreshToken }) => {
        set({ user, token, refreshToken, isAuthenticated: true });
      },

      updateUser: (updates) => {
        set((state) => ({ user: { ...state.user, ...updates } }));
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },

      isHost: () => get().user?.role === 'host' || get().user?.isHost,
      isAdmin: () => get().user?.role === 'admin',
      isGuest: () => get().user?.role === 'guest',
    }),
    {
      name: 'mulundstays-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
