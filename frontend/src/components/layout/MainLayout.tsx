'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/stores/app';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { LoadingPage } from '@/components/ui/loading';
import { Toaster } from 'react-hot-toast';
import { DebugAuth } from '@/components/debug/DebugAuth';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return <LoadingPage message="Loading FitZone Pro..." />;
  }

  if (!user) {
    return <LoadingPage message="Redirecting to login..." />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => toggleSidebar()} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
        
      />
      {process.env.NODE_ENV === 'development' && <DebugAuth />}
    </div>
  );
}