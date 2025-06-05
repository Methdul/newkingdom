import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export function useAuth(requireAuth = true) {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const router = useRouter();
  const [hasInitialized, setHasInitialized] = useState(false);
  const redirectedRef = useRef(false); // Prevent multiple redirects

  // Initialize only once
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
    }
  }, []); // Empty dependency array - run only once

  // Handle auth requirements with redirect protection
  useEffect(() => {
    if (
      hasInitialized && 
      requireAuth && 
      !isLoading && 
      !isAuthenticated && 
      !redirectedRef.current
    ) {
      console.log('Auth required but user not authenticated, redirecting to login');
      redirectedRef.current = true;
      router.push('/auth/login');
    }
    
    // Reset redirect flag when user becomes authenticated
    if (isAuthenticated && redirectedRef.current) {
      redirectedRef.current = false;
    }
  }, [hasInitialized, requireAuth, isAuthenticated, isLoading, router]);

  // Reset redirect flag when component unmounts or when not requiring auth
  useEffect(() => {
    if (!requireAuth) {
      redirectedRef.current = false;
    }
  }, [requireAuth]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || !hasInitialized,
    logout,
  };
}