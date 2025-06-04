'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Plus, 
  Search,
  Filter,
  Download,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function MembersPage() {
  const { isAdmin, isStaff } = usePermissions();

  // Placeholder data
  const memberStats = [
    {
      title: 'Total Members',
      value: '1,247',
      change: '+12% from last month',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Active Members',
      value: '1,124',
      change: '+8% from last month',
      icon: UserCheck,
      color: 'text-green-600'
    },
    {
      title: 'Expired',
      value: '89',
      change: '-5% from last month',
      icon: UserX,
      color: 'text-red-600'
    },
    {
      title: 'Expiring Soon',
      value: '34',
      change: '7 days or less',
      icon: Clock,
      color: 'text-yellow-600'
    }
  ];

  const placeholderMembers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', plan: 'Premium', joined: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', plan: 'Basic', joined: '2024-02-10' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'expired', plan: 'VIP', joined: '2023-12-05' },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', status: 'active', plan: 'Premium', joined: '2024-03-01' },
    { id: 5, name: 'Tom Brown', email: 'tom@example.com', status: 'pending', plan: 'Basic', joined: '2024-03-15' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground">
            Manage gym members and their memberships
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
              Add Member
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {memberStats.map((stat, index) => {
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

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Member Directory</CardTitle>
          <CardDescription>
            Search and filter gym members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members by name, email, or member number..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Members Table */}
          <div className="rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 font-medium border-b bg-muted/50">
              <div>Member</div>
              <div>Status</div>
              <div>Plan</div>
              <div>Joined</div>
              <div>Actions</div>
            </div>
            
            {placeholderMembers.map((member) => (
              <div key={member.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border-b last:border-b-0">
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-muted-foreground">{member.email}</div>
                </div>
                <div>
                  {getStatusBadge(member.status)}
                </div>
                <div className="text-sm">{member.plan}</div>
                <div className="text-sm">{member.joined}</div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  {(isAdmin() || isStaff()) && (
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing 5 of 1,247 members
          </div>
        </CardContent>
      </Card>
    </div>
  );
}