'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Target,
  Download,
  RefreshCcw
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const { isAdmin } = usePermissions();

  // Placeholder data
  const kpiData = [
    {
      title: 'Revenue Growth',
      value: '+24.5%',
      subtext: 'vs last month',
      icon: TrendingUp,
      color: 'text-green-600',
      trend: 'up'
    },
    {
      title: 'Member Growth',
      value: '+12.3%',
      subtext: 'vs last month',
      icon: Users,
      color: 'text-blue-600',
      trend: 'up'
    },
    {
      title: 'Avg. Revenue per Member',
      value: formatCurrency(95.50),
      subtext: '+8.2% vs last month',
      icon: DollarSign,
      color: 'text-green-600',
      trend: 'up'
    },
    {
      title: 'Churn Rate',
      value: '2.8%',
      subtext: '-0.5% vs last month',
      icon: TrendingDown,
      color: 'text-red-600',
      trend: 'down'
    }
  ];

  const membershipData = [
    { plan: 'Basic', count: 445, percentage: 35.7, revenue: 22250 },
    { plan: 'Premium', count: 387, percentage: 31.0, revenue: 38700 },
    { plan: 'VIP', count: 289, percentage: 23.2, revenue: 57800 },
    { plan: 'Corporate', count: 126, percentage: 10.1, revenue: 25200 }
  ];

  const checkinData = [
    { time: '6:00 AM', count: 45 },
    { time: '7:00 AM', count: 120 },
    { time: '8:00 AM', count: 89 },
    { time: '9:00 AM', count: 67 },
    { time: '12:00 PM', count: 78 },
    { time: '5:00 PM', count: 134 },
    { time: '6:00 PM', count: 156 },
    { time: '7:00 PM', count: 98 }
  ];

  const recentMetrics = [
    { metric: 'New signups today', value: '12', change: '+25%' },
    { metric: 'Average session duration', value: '72 min', change: '+5%' },
    { metric: 'Equipment utilization', value: '84%', change: '+2%' },
    { metric: 'Member satisfaction', value: '4.8/5', change: '+0.2' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Business insights and performance metrics
          </p>
        </div>
        {isAdmin() && (
          <div className="flex space-x-2">
            <Button variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">{kpi.subtext}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Revenue Trend
            </CardTitle>
            <CardDescription>
              Monthly revenue over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border rounded-lg bg-muted/10">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Revenue chart will be implemented here</p>
                <p className="text-sm mt-1">Integration with Chart.js or Recharts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-in Pattern */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Peak Hours
            </CardTitle>
            <CardDescription>
              Member check-in patterns by hour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checkinData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{data.time}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(data.count / 156) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{data.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Membership Plans Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-4 w-4" />
            Membership Plans Performance
          </CardTitle>
          <CardDescription>
            Revenue and member distribution by plan type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {membershipData.map((plan, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="font-medium">{plan.plan}</div>
                  <Badge variant="outline">{plan.count} members</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(plan.revenue)}</div>
                    <div className="text-sm text-muted-foreground">{plan.percentage}% of total</div>
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${plan.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Metrics</CardTitle>
          <CardDescription>
            Real-time performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recentMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.metric}</div>
                <div className="text-xs text-green-600 mt-1">{metric.change}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}