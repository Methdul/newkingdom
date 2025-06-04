'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      // Debug: Check auth state
      const authStorage = localStorage.getItem('auth-storage');
      const parsedAuth = authStorage ? JSON.parse(authStorage) : null;
      
      setAuthState(parsedAuth);
      
      console.log('Auth state:', parsedAuth);
      
      if (parsedAuth?.state?.isAuthenticated) {
        console.log('User authenticated, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('User not authenticated, redirecting to login');
        router.push('/auth/login');
      }
    } catch (err: any) {
      console.error('Homepage error:', err);
      setError(err.message);
    }
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/auth/login'}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Redirecting...</p>
        {authState && (
          <pre className="mt-4 text-xs text-left bg-gray-100 p-2 rounded">
            {JSON.stringify(authState, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}