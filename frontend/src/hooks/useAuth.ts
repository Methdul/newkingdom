import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export function useAuth(requireAuth = true) {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const router = useRouter();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Simple initialization - don't force token refresh on every load
    const initializeAuth = () => {
      if (!hasInitialized) {
        setHasInitialized(true);
      }
    };

    initializeAuth();
  }, [hasInitialized]);

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