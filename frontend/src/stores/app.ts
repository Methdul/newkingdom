import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, Notification } from '@/types';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: true,
      notifications: [],

      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme });
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          
          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
          } else {
            root.classList.add(theme);
          }
        }
      },

      toggleSidebar: () => {
        set({ sidebarOpen: !get().sidebarOpen });
      },

      addNotification: (notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification: Notification = { ...notification, id };
        
        set({
          notifications: [...get().notifications, newNotification],
        });

        // Auto-remove notification after duration
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }
      },

      removeNotification: (id: string) => {
        set({
          notifications: get().notifications.filter(n => n.id !== id),
        });
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
