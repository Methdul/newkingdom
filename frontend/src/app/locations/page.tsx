'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Plus, 
  Edit,
  Phone,
  Mail,
  Clock,
  Users,
  Settings,
  BarChart3,
  Wifi,
  Car,
  Dumbbell,
  Waves
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function LocationsPage() {
  const { isAdmin } = usePermissions();

  // Placeholder data
  const locationStats = [
    {
      title: 'Total Locations',
      value: '3',
      change: 'All operational',
      icon: MapPin,
      color: 'text-blue-600'
    },
    {
      title: 'Total Members',
      value: '1,247',
      change: 'Across all locations',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Avg. Utilization',
      value: '68%',
      change: '+5% from last month',
      icon: BarChart3,
      color: 'text-yellow-600'
    },
    {
      title: 'Total Revenue',
      value: '$125,750',
      change: '+12% from last month',
      icon: BarChart3,
      color: 'text-green-600'
    }
  ];

  const locations = [
    {
      id: 1,
      name: 'FitZone Downtown',
      address: '123 Main Street, Downtown, City 12345',
      phone: '+1 (555) 123-4567',
      email: 'downtown@fitzone.com',
      manager: 'Sarah Johnson',
      members: 485,
      capacity: 600,
      utilization: 81,
      status: 'active',
      hours: 'Mon-Fri: 5:00 AM - 11:00 PM, Sat-Sun: 6:00 AM - 10:00 PM',
      amenities: ['Pool', 'Sauna', 'Parking', 'WiFi', 'Personal Training', 'Group Classes'],
      revenue: 48500,
      established: '2020-01-15'
    },
    {
      id: 2,
      name: 'FitZone Westside',
      address: '456 Oak Avenue, Westside, City 12346',
      phone: '+1 (555) 234-5678',
      email: 'westside@fitzone.com',
      manager: 'Mike Wilson',
      members: 392,
      capacity: 450,
      utilization: 87,
      status: 'active',
      hours: 'Mon-Fri: 5:30 AM - 10:00 PM, Sat-Sun: 6:00 AM - 9:00 PM',
      amenities: ['Sauna', 'Parking', 'WiFi', 'Personal Training', 'Group Classes'],
      revenue: 39200,
      established: '2021-06-20'
    },
    {
      id: 3,
      name: 'FitZone Eastgate',
      address: '789 Pine Street, Eastgate, City 12347',
      phone: '+1 (555) 345-6789',
      email: 'eastgate@fitzone.com',
      manager: 'Lisa Chen',
      members: 370,
      capacity: 500,
      utilization: 74,
      status: 'active',
      hours: 'Mon-Fri: 6:00 AM - 10:00 PM, Sat-Sun: 7:00 AM - 9:00 PM',
      amenities: ['Parking', 'WiFi', 'Personal Training', 'Group Classes', 'Juice Bar'],
      revenue: 37000,
      established: '2022-03-10'
    }
  ];

  const getAmenityIcon = (amenity: string) => {
    const icons: Record<string, any> = {
      'Pool': Waves,
      'Sauna': Settings,
      'Parking': Car,
      'WiFi': Wifi,
      'Personal Training': Dumbbell,
      'Group Classes': Users,
      'Juice Bar': Settings
    };
    return icons[amenity] || Settings;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'maintenance':
        return <Badge variant="secondary">Maintenance</Badge>;
      case 'closed':
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-red-600';
    if (utilization >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Locations</h2>
          <p className="text-muted-foreground">
            Manage gym locations and their settings
          </p>
        </div>
        {isAdmin() && (
          <div className="flex space-x-2">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Global Settings
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {locationStats.map((stat, index) => {
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

      {/* Locations Grid */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    {location.name}
                  </CardTitle>
                  <CardDescription>{location.address}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(location.status)}
                  {isAdmin() && (
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      {location.phone}
                    </div>
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      {location.email}
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      Manager: {location.manager}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">{location.hours}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Members</span>
                        <span>{location.members}/{location.capacity}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(location.members / location.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Utilization</span>
                        <span className={getUtilizationColor(location.utilization)}>
                          {location.utilization}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            location.utilization >= 80 ? 'bg-red-600' :
                            location.utilization >= 60 ? 'bg-yellow-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${location.utilization}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Monthly Revenue: </span>
                      <span className="font-medium">${location.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Amenities</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {location.amenities.map((amenity, index) => {
                      const AmenityIcon = getAmenityIcon(amenity);
                      return (
                        <div key={index} className="flex items-center text-sm">
                          <AmenityIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {amenity}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Established: {new Date(location.established).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}