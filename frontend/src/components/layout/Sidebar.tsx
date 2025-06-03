'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  MapPin,
  UserCheck,
  Package,
  Gift,
  BarChart3,
  Settings,
  HelpCircle,
  X,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import type { NavItem } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin, isStaff, isMember } = usePermissions();

  const navigationItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      requiredRole: ['admin', 'staff', 'member'],
    },
    // Admin & Staff items
    {
      title: 'Members',
      href: '/members',
      icon: Users,
      requiredRole: ['admin', 'staff'],
    },
    {
      title: 'Payments',
      href: '/payments',
      icon: CreditCard,
      requiredRole: ['admin', 'staff'],
    },
    {
      title: 'Check-ins',
      href: '/checkins',
      icon: UserCheck,
      requiredRole: ['admin', 'staff'],
    },
    // Admin only items
    {
      title: 'Locations',
      href: '/locations',
      icon: MapPin,
      requiredRole: ['admin'],
    },
    {
      title: 'Plans',
      href: '/plans',
      icon: Package,
      requiredRole: ['admin'],
    },
    {
      title: 'Promotions',
      href: '/promotions',
      icon: Gift,
      requiredRole: ['admin'],
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      requiredRole: ['admin'],
    },
    // Member items
    {
      title: 'My Membership',
      href: '/membership',
      icon: Package,
      requiredRole: ['member'],
    },
    {
      title: 'My Payments',
      href: '/my-payments',
      icon: CreditCard,
      requiredRole: ['member'],
    },
    {
      title: 'My Check-ins',
      href: '/my-checkins',
      icon: UserCheck,
      requiredRole: ['member'],
    },
  ];

  const hasAccess = (item: NavItem): boolean => {
    if (!item.requiredRole) return true;
    
    if (isAdmin() && item.requiredRole.includes('admin')) return true;
    if (isStaff() && item.requiredRole.includes('staff')) return true;
    if (isMember() && item.requiredRole.includes('member')) return true;
    
    return false;
  };

  const filteredNavigation = navigationItems.filter(hasAccess);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 transform bg-background border-r transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <div className="flex h-16 items-center justify-between px-4 md:hidden">
          <span className="text-lg font-semibold">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close mobile sidebar on navigation
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.title}
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="space-y-1">
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <Link
              href="/help"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/help'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}