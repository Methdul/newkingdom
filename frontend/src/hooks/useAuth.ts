import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

export function useAuth(requireAuth = true) {
  const { user, isAuthenticated, isLoading, refreshToken, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // If user is stored but we need to verify the token
    if (user && !isLoading) {
      refreshToken().catch(() => {
        if (requireAuth) {
          logout();
        }
      });
    }

    // Redirect to login if auth is required but user is not authenticated
    if (requireAuth && !isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [user, isAuthenticated, isLoading, requireAuth, refreshToken, logout, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  };
}