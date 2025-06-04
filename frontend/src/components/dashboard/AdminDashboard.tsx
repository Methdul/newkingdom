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
import { useRouter } from 'next/navigation';

// Define the change type more strictly
type ChangeType = 'positive' | 'negative' | 'neutral';

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  changeType: ChangeType;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export function AdminDashboard() {
  const { data: analytics, isLoading } = useAnalytics();
  const router = useRouter();

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

  const statsCards: StatCard[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics?.revenue?.total || 0),
      change: `+${analytics?.revenue?.growth || 0}%`,
      changeType: 'positive',
      icon: DollarSign,
      description: 'From last month'
    },
    {
      title: 'Active Members',
      value: analytics?.members?.active || 0,
      change: `+${analytics?.members?.growth || 0}%`,
      changeType: 'positive',
      icon: Users,
      description: 'From last month'
    },
    {
      title: 'Check-ins Today',
      value: analytics?.checkins?.today || 0,
      change: analytics?.checkins?.avgDaily ? `Avg: ${analytics.checkins.avgDaily}` : '',
      changeType: 'neutral',
      icon: UserCheck,
      description: 'Daily average'
    },
    {
      title: 'Total Locations',
      value: '3',
      change: '',
      changeType: 'neutral',
      icon: Building,
      description: 'Active locations'
    }
  ];

  // Helper function to get change text color
  const getChangeTextColor = (changeType: ChangeType): string => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
      default:
        return 'text-muted-foreground';
    }
  };

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
          <Button onClick={() => router.push('/members')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
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
                    <span className={getChangeTextColor(stat.changeType)}>
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

      {/* Quick Actions - FIXED: Removed nested links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/members')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manage Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Add, edit, and manage member accounts
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-primary">View Members</span>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/payments')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Process Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Handle membership payments and renewals
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-primary">View Payments</span>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/analytics')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              View detailed reports and analytics
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-primary">View Analytics</span>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/locations')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Manage gym locations and settings
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-primary">View Locations</span>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}