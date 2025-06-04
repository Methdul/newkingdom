'use client';

import { useAuthStore } from '@/stores/auth';
import { getAuthToken } from '@/lib/api';
import Cookies from 'js-cookie';

export function DebugAuth() {
  const { user, isAuthenticated, token } = useAuthStore();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const authToken = getAuthToken();
  const refreshToken = Cookies.get('refresh-token');

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white text-xs rounded-lg max-w-sm">
      <h4 className="font-bold mb-2">Auth Debug</h4>
      <div className="space-y-1">
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>User: {user?.email || 'None'}</div>
        <div>Role: {user?.role || 'None'}</div>
        <div>Store Token: {token ? '✅' : '❌'}</div>
        <div>Cookie Token: {authToken ? '✅' : '❌'}</div>
        <div>Refresh Token: {refreshToken ? '✅' : '❌'}</div>
      </div>
    </div>
  );
}