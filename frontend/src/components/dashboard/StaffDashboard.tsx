'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard, 
  UserCheck, 
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useApi';
import { LoadingCard } from '@/components/ui/loading';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Helper function to get status-specific data from analytics
const getStatusCount = (statusDistribution: Array<{status: string; count: number; percentage: number}> | undefined, status: string): number => {
  return statusDistribution?.find(item => item.status === status)?.count || 0;
};

export function StaffDashboard() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = useAnalytics({
    gymLocationId: user?.gymLocationId
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const todayStats = [
    {
      title: 'Check-ins Today',
      value: analytics?.checkins?.today || 0,
      icon: UserCheck,
      description: 'Members checked in'
    },
    {
      title: 'Revenue This Month',
      value: formatCurrency(analytics?.revenue?.thisMonth || 0),
      icon: CreditCard,
      description: 'Monthly revenue'
    },
    {
      title: 'Active Members',
      value: analytics?.members?.active || 0,
      icon: Users,
      description: 'In your location'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening at {user?.gymLocation?.name || 'your location'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/members">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Link>
          </Button>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {todayStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Recent Check-ins
            </CardTitle>
            <CardDescription>
              Latest member check-ins at your location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for recent check-ins */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Member {i + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      Checked in at {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
            </div>
            <Button asChild variant="ghost" className="w-full mt-4">
              <Link href="/checkins">
                View All Check-ins <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for daily operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/members/new">
                <Plus className="mr-2 h-4 w-4" />
                Register New Member
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/payments/new">
                <CreditCard className="mr-2 h-4 w-4" />
                Process Payment
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/checkins">
                <UserCheck className="mr-2 h-4 w-4" />
                Manual Check-in
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/members">
                <Users className="mr-2 h-4 w-4" />
                View All Members
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Member Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Member Status Overview</CardTitle>
          <CardDescription>
            Current membership status distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics?.members?.active || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {getStatusCount(analytics?.members?.statusDistribution, 'expiring_soon')}
              </div>
              <div className="text-sm text-muted-foreground">Expiring Soon</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {getStatusCount(analytics?.members?.statusDistribution, 'expired')}
              </div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {analytics?.members?.inactive || 0}
              </div>
              <div className="text-sm text-muted-foreground">Inactive</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}