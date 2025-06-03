import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { User, LoginForm, AuthState } from '@/types';
import { toast } from 'react-hot-toast';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginForm) => {
        try {
          set({ isLoading: true });
          const response = await api.login(credentials);
          
          set({
            user: response.user,
            token: response.session.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          toast.success(`Welcome back, ${response.user.firstName}!`);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      },

      refreshToken: async () => {
        try {
          const response = await api.getProfile();
          set({
            user: response.user,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);