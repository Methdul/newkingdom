'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';
import { MemberDashboard } from '@/components/dashboard/MemberDashboard';
import { LoadingPage } from '@/components/ui/loading';

export default function DashboardPage() {
  const { user, isAdmin, isStaff, isMember } = usePermissions();

  if (!user) {
    return <LoadingPage message="Loading dashboard..." />;
  }

  if (isAdmin()) {
    return <AdminDashboard />;
  }

  if (isStaff()) {
    return <StaffDashboard />;
  }

  if (isMember()) {
    return <MemberDashboard />;
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to access this dashboard.</p>
      </div>
    </div>
  );
}