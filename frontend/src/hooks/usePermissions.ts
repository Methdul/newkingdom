import { useAuth } from './useAuth';
import type { UserRole } from '@/types';

export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admins have all permissions
    if (user.role === 'admin') return true;
    
    // Check team member permissions
    if (user.type === 'team_member') {
      const teamMember = user as any; // Type assertion for permissions
      return teamMember.permissions?.[permission] === true;
    }
    
    return false;
  };

  const canAccessGymLocation = (gymLocationId: string): boolean => {
    if (!user) return false;
    
    // Admins can access all locations
    if (user.role === 'admin') return true;
    
    // Others can only access their assigned location
    return user.gymLocationId === gymLocationId;
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isStaff = (): boolean => hasRole(['admin', 'staff']);
  const isMember = (): boolean => hasRole('member');

  return {
    user,
    hasRole,
    hasPermission,
    canAccessGymLocation,
    isAdmin,
    isStaff,
    isMember,
  };
}