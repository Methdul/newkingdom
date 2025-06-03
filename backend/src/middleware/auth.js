/**
 * Authentication Middleware
 * Handles JWT token verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const { catchAsync, AuthenticationError, AuthorizationError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Extract token from request headers
 */
const extractToken = (req) => {
  let token = null;
  
  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check cookies as fallback
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  
  // Check x-access-token header
  else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }
  
  return token;
};

/**
 * Verify JWT token and get user information
 */
const verifyToken = async (token) => {
  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new AuthenticationError('Invalid or expired token');
    }
    
    return user;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token expired');
    }
    throw error;
  }
};

/**
 * Get user profile and role information
 */
const getUserProfile = async (userId) => {
  try {
    // First check if user is a team member (staff/admin)
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select(`
        id,
        role,
        gym_location_id,
        first_name,
        last_name,
        email,
        is_active,
        permissions,
        gym_locations (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (teamMember && !teamError) {
      return {
        id: teamMember.id,
        userId,
        role: teamMember.role,
        type: 'team_member',
        gymLocationId: teamMember.gym_location_id,
        name: `${teamMember.first_name} ${teamMember.last_name}`,
        email: teamMember.email,
        permissions: teamMember.permissions || {},
        gymLocation: teamMember.gym_locations,
        isActive: teamMember.is_active
      };
    }

    // Check if user is a member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select(`
        id,
        member_number,
        gym_location_id,
        current_plan_id,
        first_name,
        last_name,
        email,
        membership_status,
        membership_start_date,
        membership_end_date,
        auto_renewal,
        gym_locations (
          id,
          name,
          slug
        ),
        membership_plans (
          id,
          name,
          category
        )
      `)
      .eq('user_id', userId)
      .single();

    if (member && !memberError) {
      return {
        id: member.id,
        userId,
        role: 'member',
        type: 'member',
        memberNumber: member.member_number,
        gymLocationId: member.gym_location_id,
        planId: member.current_plan_id,
        name: `${member.first_name} ${member.last_name}`,
        email: member.email,
        membershipStatus: member.membership_status,
        membershipStartDate: member.membership_start_date,
        membershipEndDate: member.membership_end_date,
        autoRenewal: member.auto_renewal,
        gymLocation: member.gym_locations,
        membershipPlan: member.membership_plans,
        isActive: ['active', 'pending'].includes(member.membership_status)
      };
    }

    throw new AuthenticationError('User profile not found');
  } catch (error) {
    logger.error('Error fetching user profile:', { userId, error: error.message });
    throw error;
  }
};

/**
 * Main authentication middleware
 * Protects routes that require authentication
 */
const protect = catchAsync(async (req, res, next) => {
  // 1) Get token from request
  const token = extractToken(req);
  
  if (!token) {
    throw new AuthenticationError('Access denied. No token provided.');
  }

  // 2) Verify token
  const user = await verifyToken(token);

  // 3) Get user profile and role information
  const userProfile = await getUserProfile(user.id);

  // 4) Check if user is active
  if (!userProfile.isActive) {
    throw new AuthenticationError('Your account has been deactivated. Please contact support.');
  }

  // 5) Attach user to request object
  req.user = userProfile;
  req.token = token;

  // 6) Log authentication success
  logger.auth('login', user.id, true, {
    role: userProfile.role,
    gymLocationId: userProfile.gymLocationId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  next();
});

/**
 * Role-based access control middleware
 * Restricts access based on user roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      logger.security('Unauthorized access attempt', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      throw new AuthorizationError(
        `Access denied. Required role: ${roles.join(' or ')}`
      );
    }

    next();
  };
};

/**
 * Permission-based access control middleware
 * Restricts access based on specific permissions
 */
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Admins have all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has required permissions
    const userPermissions = req.user.permissions || {};
    const hasPermission = permissions.some(permission => 
      userPermissions[permission] === true
    );

    if (!hasPermission) {
      logger.security('Insufficient permissions', {
        userId: req.user.userId,
        userRole: req.user.role,
        userPermissions: Object.keys(userPermissions),
        requiredPermissions: permissions,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip
      });

      throw new AuthorizationError(
        `Insufficient permissions. Required: ${permissions.join(' or ')}`
      );
    }

    next();
  };
};

/**
 * Gym location access control middleware
 * Ensures users can only access their assigned gym location
 */
const restrictToGymLocation = (req, res, next) => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  // Admins can access all locations
  if (req.user.role === 'admin') {
    return next();
  }

  // Get gym location ID from request (params, query, or body)
  const requestedLocationId = req.params.gymLocationId || 
                             req.query.gymLocationId || 
                             req.body.gymLocationId;

  // Staff can only access their assigned location
  if (req.user.role === 'staff') {
    if (requestedLocationId && requestedLocationId !== req.user.gymLocationId) {
      throw new AuthorizationError('Access denied to this gym location');
    }
  }

  // Members can only access their gym location
  if (req.user.role === 'member') {
    if (requestedLocationId && requestedLocationId !== req.user.gymLocationId) {
      throw new AuthorizationError('Access denied to this gym location');
    }
  }

  next();
};

/**
 * Active membership middleware
 * Ensures members have active membership
 */
const requireActiveMembership = (req, res, next) => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  // Only apply to members
  if (req.user.role === 'member') {
    if (req.user.membershipStatus !== 'active') {
      throw new AuthorizationError(
        'Active membership required. Please renew your membership.'
      );
    }

    // Check if membership has expired
    if (req.user.membershipEndDate && new Date(req.user.membershipEndDate) < new Date()) {
      throw new AuthorizationError(
        'Your membership has expired. Please renew to continue.'
      );
    }
  }

  next();
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require authentication
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  const token = extractToken(req);
  
  if (token) {
    try {
      const user = await verifyToken(token);
      const userProfile = await getUserProfile(user.id);
      
      if (userProfile.isActive) {
        req.user = userProfile;
        req.token = token;
      }
    } catch (error) {
      // Ignore authentication errors for optional auth
      logger.debug('Optional auth failed:', error.message);
    }
  }

  next();
});

/**
 * Rate limiting based on user role
 */
const roleBasedRateLimit = (limits = {}) => {
  const defaultLimits = {
    admin: 1000,
    staff: 500,
    member: 100,
    anonymous: 50
  };

  const roleLimits = { ...defaultLimits, ...limits };

  return (req, res, next) => {
    const userRole = req.user?.role || 'anonymous';
    const limit = roleLimits[userRole];

    // Set rate limit based on user role
    req.rateLimit = {
      max: limit,
      windowMs: 15 * 60 * 1000 // 15 minutes
    };

    next();
  };
};

/**
 * IP-based access control
 */
const restrictToIPs = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      logger.security('IP access denied', {
        clientIP,
        allowedIPs,
        path: req.originalUrl,
        method: req.method
      });

      throw new AuthorizationError('Access denied from this IP address');
    }

    next();
  };
};

module.exports = {
  protect,
  restrictTo,
  requirePermission,
  restrictToGymLocation,
  requireActiveMembership,
  optionalAuth,
  roleBasedRateLimit,
  restrictToIPs,
  extractToken,
  verifyToken,
  getUserProfile
};