'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CreditCard, 
  Plus, 
  Search,
  Filter,
  Download,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency } from '@/lib/utils';

export default function PaymentsPage() {
  const { isAdmin, isStaff } = usePermissions();

  // Placeholder data
  const paymentStats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(125750),
      change: '+12% from last month',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'This Month',
      value: formatCurrency(18450),
      change: '+8% from last month',
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(2340),
      change: '12 payments pending',
      icon: AlertCircle,
      color: 'text-yellow-600'
    },
    {
      title: 'Completed Today',
      value: formatCurrency(1580),
      change: '8 transactions',
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  const placeholderPayments = [
    { 
      id: 'PAY-001', 
      member: 'John Doe', 
      amount: 99.99, 
      method: 'Credit Card', 
      status: 'completed', 
      date: '2024-03-15',
      plan: 'Premium Monthly'
    },
    { 
      id: 'PAY-002', 
      member: 'Jane Smith', 
      amount: 49.99, 
      method: 'Bank Transfer', 
      status: 'completed', 
      date: '2024-03-14',
      plan: 'Basic Monthly'
    },
    { 
      id: 'PAY-003', 
      member: 'Mike Johnson', 
      amount: 199.99, 
      method: 'Cash', 
      status: 'pending', 
      date: '2024-03-13',
      plan: 'VIP Monthly'
    },
    { 
      id: 'PAY-004', 
      member: 'Sarah Wilson', 
      amount: 299.99, 
      method: 'Credit Card', 
      status: 'completed', 
      date: '2024-03-12',
      plan: 'Annual Premium'
    },
    { 
      id: 'PAY-005', 
      member: 'Tom Brown', 
      amount: 49.99, 
      method: 'Online', 
      status: 'failed', 
      date: '2024-03-11',
      plan: 'Basic Monthly'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      'Credit Card': 'bg-blue-100 text-blue-800',
      'Bank Transfer': 'bg-green-100 text-green-800',
      'Cash': 'bg-yellow-100 text-yellow-800',
      'Online': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[method] || 'bg-gray-100 text-gray-800'}`}>
        {method}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">
            Manage membership payments and transactions
          </p>
        </div>
        {(isAdmin() || isStaff()) && (
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Process Payment
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {paymentStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Recent transactions and payment records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments by member, ID, or amount..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Payments Table */}
          <div className="rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 font-medium border-b bg-muted/50">
              <div>Payment ID</div>
              <div>Member</div>
              <div>Amount</div>
              <div>Method</div>
              <div>Status</div>
              <div>Date</div>
              <div>Actions</div>
            </div>
            
            {placeholderPayments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border-b last:border-b-0">
                <div className="font-mono text-sm">{payment.id}</div>
                <div>
                  <div className="font-medium">{payment.member}</div>
                  <div className="text-sm text-muted-foreground">{payment.plan}</div>
                </div>
                <div className="font-medium">{formatCurrency(payment.amount)}</div>
                <div>{getMethodBadge(payment.method)}</div>
                <div>{getStatusBadge(payment.status)}</div>
                <div className="text-sm">{payment.date}</div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  {payment.status === 'pending' && (isAdmin() || isStaff()) && (
                    <Button variant="outline" size="sm">
                      Process
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing 5 of 156 payments
          </div>
        </CardContent>
      </Card>
    </div>
  );
}