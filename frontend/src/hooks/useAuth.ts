import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export function useAuth(requireAuth = true) {
  const { user, isAuthenticated, isLoading, refreshToken, logout } = useAuthStore();
  const router = useRouter();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        if (user && !isLoading && !hasInitialized) {
          await refreshToken();
          setHasInitialized(true);
        } else if (!user && !isLoading && !hasInitialized) {
          setHasInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (requireAuth) {
          logout();
        }
        setHasInitialized(true);
      }
    };

    initializeAuth();
  }, [user, isLoading, requireAuth, refreshToken, logout, hasInitialized]);

  useEffect(() => {
    // Handle auth requirements
    if (hasInitialized && requireAuth && !isLoading && !isAuthenticated) {
      console.log('Auth required but user not authenticated, redirecting to login');
      router.push('/auth/login');
    }
  }, [hasInitialized, requireAuth, isAuthenticated, isLoading, router]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || !hasInitialized,
    logout,
  };
}