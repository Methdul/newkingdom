'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  MapPin, 
  Plus,
  ArrowUpRight,
  DollarSign,
  UserCheck,
  Building
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useApi';
import { LoadingCard } from '@/components/ui/loading';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export function AdminDashboard() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics?.revenue?.total || 0),
      change: `+${analytics?.revenue?.growth || 0}%`,
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'From last month'
    },
    {
      title: 'Active Members',
      value: analytics?.members?.active || 0,
      change: `+${analytics?.members?.growth || 0}%`,
      changeType: 'positive' as const,
      icon: Users,
      description: 'From last month'
    },
    {
      title: 'Check-ins Today',
      value: analytics?.checkins?.today || 0,
      change: analytics?.checkins?.avgDaily ? `Avg: ${analytics.checkins.avgDaily}` : '',
      changeType: 'neutral' as const,
      icon: UserCheck,
      description: 'Daily average'
    },
    {
      title: 'Total Locations',
      value: '3',
      change: '',
      changeType: 'neutral' as const,
      icon: Building,
      description: 'Active locations'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your gym management system
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <p className="text-xs text-muted-foreground">
                    <span className={
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 
                      'text-muted-foreground'
                    }>
                      {stat.change}
                    </span>
                    {' '}
                    {stat.description}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly revenue for the current year
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Revenue chart will be implemented here
            </div>
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Members</CardTitle>
            <CardDescription>
              Latest member registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for recent members */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Member {i + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(new Date())}
                    </p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manage Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Add, edit, and manage member accounts
            </p>
            <Button asChild variant="ghost" className="w-full mt-2">
              <Link href="/members">
                View Members <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Process Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Handle membership payments and renewals
            </p>
            <Button asChild variant="ghost" className="w-full mt-2">
              <Link href="/payments">
                View Payments <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              View detailed reports and analytics
            </p>
            <Button asChild variant="ghost" className="w-full mt-2">
              <Link href="/analytics">
                View Analytics <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Manage gym locations and settings
            </p>
            <Button asChild variant="ghost" className="w-full mt-2">
              <Link href="/locations">
                View Locations <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===== frontend/src/components/dashboard/StaffDashboard.tsx =====
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
      title: 'Payments Today',
      value: formatCurrency(analytics?.revenue?.today || 0),
      icon: CreditCard,
      description: 'Revenue collected'
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
            Welcome back! Here's what's happening at {user?.gymLocation?.name}
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
                {analytics?.members?.expiringSoon || 0}
              </div>
              <div className="text-sm text-muted-foreground">Expiring Soon</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {analytics?.members?.expired || 0}
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