'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Calendar, 
  Target,
  TrendingUp,
  QrCode,
  Clock,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { useMyCheckIns, usePayments } from '@/hooks/useApi';
import { LoadingCard } from '@/components/ui/loading';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export function MemberDashboard() {
  const { user } = useAuth();
  const { data: checkinsData, isLoading: checkinsLoading } = useMyCheckIns({ limit: 5 });
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments({ 
    memberId: user?.id,
    limit: 3 
  });

  const memberData = user as any; // Type assertion for member-specific properties

  const membershipProgress = memberData?.membershipEndDate ? 
    Math.max(0, Math.min(100, 
      ((new Date().getTime() - new Date(memberData.membershipStartDate).getTime()) / 
       (new Date(memberData.membershipEndDate).getTime() - new Date(memberData.membershipStartDate).getTime())) * 100
    )) : 0;

  const daysRemaining = memberData?.membershipEndDate ? 
    Math.max(0, Math.ceil((new Date(memberData.membershipEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'destructive';
      case 'expiring_soon': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.firstName}!</h2>
          <p className="text-muted-foreground">
            Track your fitness journey and manage your membership
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <QrCode className="mr-2 h-4 w-4" />
            Check-in QR
          </Button>
        </div>
      </div>

      {/* Membership Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Membership Status</span>
              <Badge variant={getStatusColor(memberData?.membershipStatus) as any}>
                {memberData?.membershipStatus}
              </Badge>
            </CardTitle>
            <CardDescription>
              {memberData?.membershipPlan?.name} plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Membership Period</span>
                <span>{daysRemaining} days remaining</span>
              </div>
              <Progress value={membershipProgress} className="h-2" />
            </div>
            <div className="flex justify-between text-sm">
              <span>Started: {formatDate(memberData?.membershipStartDate)}</span>
              <span>Expires: {formatDate(memberData?.membershipEndDate)}</span>
            </div>
            {daysRemaining <= 7 && (
              <Button asChild className="w-full">
                <Link href="/membership/renew">
                  Renew Membership
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              This Month's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Check-ins</span>
                <span className="text-2xl font-bold">
                  {checkinsData?.data?.items?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Goal</span>
                <span className="text-sm text-muted-foreground">20 visits</span>
              </div>
              <Progress value={(checkinsData?.data?.items?.length || 0) / 20 * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {20 - (checkinsData?.data?.items?.length || 0)} more visits to reach your goal
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Recent Check-ins
            </CardTitle>
            <CardDescription>Your latest gym visits</CardDescription>
          </CardHeader>
          <CardContent>
            {checkinsLoading ? (
              <LoadingCard />
            ) : (
              <div className="space-y-4">
                {checkinsData?.data?.items?.slice(0, 5).map((checkin: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {formatDate(checkin.checkInTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {checkin.durationMinutes ? 
                          `${Math.floor(checkin.durationMinutes / 60)}h ${checkin.durationMinutes % 60}m` : 
                          'In progress'
                        }
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No check-ins yet. Start your fitness journey today!
                  </p>
                )}
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/my-checkins">
                    View All Check-ins <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Payment History
            </CardTitle>
            <CardDescription>Recent membership payments</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <LoadingCard />
            ) : (
              <div className="space-y-4">
                {paymentsData?.data?.items?.slice(0, 3).map((payment: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {formatCurrency(payment.totalAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                      </p>
                    </div>
                    <Badge variant="success">Paid</Badge>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No payment history available
                  </p>
                )}
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/my-payments">
                    View All Payments <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/membership">
                <Award className="h-6 w-6" />
                <span>My Membership</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/my-payments">
                <CreditCard className="h-6 w-6" />
                <span>Payment History</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/my-checkins">
                <Clock className="h-6 w-6" />
                <span>Check-in History</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link href="/profile">
                <Target className="h-6 w-6" />
                <span>Profile Settings</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}