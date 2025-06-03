/**
 * Authentication Controller
 * Handles user authentication, registration, and profile management
 */

const { supabase, supabaseAdmin } = require('../config/database');
const { AppError, AuthenticationError, ConflictError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const { generateMemberNumber } = require('../utils/helpers');

/**
 * Register a new member
 */
const register = async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    gender,
    gymLocationId,
    planId,
    address,
    emergencyContactName,
    emergencyContactPhone
  } = req.body;

  try {
    // 1) Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We'll send verification email separately
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'member'
      }
    });

    if (authError) {
      logger.error('Auth user creation failed:', authError);
      throw new ConflictError(authError.message);
    }

    const { user } = authData;

    try {
      // 2) Create member record
      const memberData = {
        user_id: user.id,
        gym_location_id: gymLocationId,
        current_plan_id: planId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        date_of_birth: dateOfBirth,
        gender,
        membership_status: planId ? 'pending' : 'inactive', // Pending if plan selected, inactive otherwise
        address_line1: address?.line1,
        address_line2: address?.line2,
        city: address?.city,
        state: address?.state,
        postal_code: address?.postalCode,
        country: address?.country || 'US',
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone
      };

      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert([memberData])
        .select(`
          *,
          gym_locations (id, name, slug),
          membership_plans (id, name, category, price)
        `)
        .single();

      if (memberError) {
        // Cleanup: Delete auth user if member creation fails
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        logger.error('Member creation failed:', memberError);
        throw new AppError('Registration failed. Please try again.', 500);
      }

      // 3) Send welcome email with verification
      try {
        await emailService.sendWelcomeEmail({
          email: member.email,
          name: `${member.first_name} ${member.last_name}`,
          memberNumber: member.member_number,
          gymLocation: member.gym_locations?.name,
          verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${user.email_confirmation_token}`
        });
      } catch (emailError) {
        logger.warn('Welcome email failed to send:', emailError);
        // Don't fail registration if email fails
      }

      // 4) Log successful registration
      logger.auth('register', user.id, true, {
        memberNumber: member.member_number,
        gymLocationId,
        planId,
        ip: req.ip
      });

      // 5) Return success response
      res.status(201).json({
        status: 'success',
        message: 'Registration successful! Please check your email to verify your account.',
        data: {
          member: {
            id: member.id,
            memberNumber: member.member_number,
            email: member.email,
            name: `${member.first_name} ${member.last_name}`,
            membershipStatus: member.membership_status,
            gymLocation: member.gym_locations,
            membershipPlan: member.membership_plans
          },
          requiresEmailVerification: true
        }
      });

    } catch (error) {
      // Cleanup auth user if any step fails
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw error;
    }

  } catch (error) {
    logger.auth('register', null, false, {
      email,
      error: error.message,
      ip: req.ip
    });
    throw error;
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1) Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.auth('login', null, false, {
        email,
        error: error.message,
        ip: req.ip
      });
      throw new AuthenticationError(error.message);
    }

    const { user, session } = data;

    // 2) Get user profile
    const userProfile = await getUserProfile(user.id);

    // 3) Check if user account is active
    if (!userProfile.isActive) {
      throw new AuthenticationError('Your account has been deactivated. Please contact support.');
    }

    // 4) Log successful login
    logger.auth('login', user.id, true, {
      role: userProfile.role,
      gymLocationId: userProfile.gymLocationId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 5) Return success response
    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userProfile,
        session: {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at,
          expiresIn: session.expires_in
        }
      }
    });

  } catch (error) {
    logger.auth('login', null, false, {
      email,
      error: error.message,
      ip: req.ip
    });
    throw error;
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.warn('Logout error:', error);
    }

    logger.auth('logout', req.user?.userId, true, {
      ip: req.ip
    });

    res.json({
      status: 'success',
      message: 'Logout successful'
    });

  } catch (error) {
    // Always return success for logout to prevent client issues
    res.json({
      status: 'success',
      message: 'Logout successful'
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    // Get fresh user data
    const userProfile = await getUserProfile(req.user.userId);

    res.json({
      status: 'success',
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    throw new AppError('Failed to fetch user profile', 500);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  const { firstName, lastName, phone, dateOfBirth, address, emergencyContactName, emergencyContactPhone } = req.body;
  const userId = req.user.userId;

  try {
    let updateData = {};
    
    // Only include fields that are provided
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth;
    if (emergencyContactName !== undefined) updateData.emergency_contact_name = emergencyContactName;
    if (emergencyContactPhone !== undefined) updateData.emergency_contact_phone = emergencyContactPhone;
    
    // Handle address object
    if (address) {
      if (address.line1 !== undefined) updateData.address_line1 = address.line1;
      if (address.line2 !== undefined) updateData.address_line2 = address.line2;
      if (address.city !== undefined) updateData.city = address.city;
      if (address.state !== undefined) updateData.state = address.state;
      if (address.postalCode !== undefined) updateData.postal_code = address.postalCode;
      if (address.country !== undefined) updateData.country = address.country;
    }

    // Update appropriate table based on user type
    let updatedUser;
    if (req.user.role === 'member') {
      const { data, error } = await supabase
        .from('members')
        .update(updateData)
        .eq('user_id', userId)
        .select(`
          *,
          gym_locations (id, name, slug),
          membership_plans (id, name, category)
        `)
        .single();

      if (error) throw error;
      updatedUser = data;
    } else {
      const { data, error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('user_id', userId)
        .select(`
          *,
          gym_locations (id, name, slug)
        `)
        .single();

      if (error) throw error;
      updatedUser = data;
    }

    // Also update auth user metadata if name changed
    if (firstName || lastName) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          first_name: firstName || updatedUser.first_name,
          last_name: lastName || updatedUser.last_name
        }
      });
    }

    logger.info('Profile updated', {
      userId,
      updatedFields: Object.keys(updateData),
      ip: req.ip
    });

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: await getUserProfile(userId)
      }
    });

  } catch (error) {
    logger.error('Profile update failed:', {
      userId,
      error: error.message,
      ip: req.ip
    });
    throw new AppError('Failed to update profile', 500);
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  try {
    // 1) Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword
    });

    if (signInError) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // 2) Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (updateError) {
      throw new AppError('Failed to update password', 500);
    }

    logger.auth('password_change', userId, true, {
      ip: req.ip
    });

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.auth('password_change', userId, false, {
      error: error.message,
      ip: req.ip
    });
    throw error;
  }
};

/**
 * Forgot password
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      logger.warn('Password reset email failed:', error);
    }

    // Always return success to prevent email enumeration
    res.json({
      status: 'success',
      message: 'If an account with that email exists, we\'ve sent password reset instructions.'
    });

  } catch (error) {
    // Always return success for security
    res.json({
      status: 'success',
      message: 'If an account with that email exists, we\'ve sent password reset instructions.'
    });
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    res.json({
      status: 'success',
      message: 'Password reset successfully'
    });

  } catch (error) {
    throw new AuthenticationError('Failed to reset password');
  }
};

/**
 * Verify email address
 */
const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    });

    if (error) {
      throw new AuthenticationError('Invalid or expired verification token');
    }

    res.json({
      status: 'success',
      message: 'Email verified successfully'
    });

  } catch (error) {
    throw new AuthenticationError('Email verification failed');
  }
};

/**
 * Resend verification email
 */
const resendVerification = async (req, res) => {
  const { email } = req.body;

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL}/verify-email`
      }
    });

    if (error) {
      logger.warn('Resend verification failed:', error);
    }

    res.json({
      status: 'success',
      message: 'Verification email sent'
    });

  } catch (error) {
    res.json({
      status: 'success',
      message: 'Verification email sent'
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      throw new AuthenticationError('Invalid refresh token');
    }

    res.json({
      status: 'success',
      data: {
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
          expiresIn: data.session.expires_in
        }
      }
    });

  } catch (error) {
    throw new AuthenticationError('Token refresh failed');
  }
};

/**
 * Revoke all user sessions
 */
const revokeAllSessions = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Sign out all sessions for the user
    await supabaseAdmin.auth.admin.signOut(userId, 'global');

    logger.auth('revoke_all_sessions', userId, true, {
      ip: req.ip
    });

    res.json({
      status: 'success',
      message: 'All sessions revoked successfully'
    });

  } catch (error) {
    throw new AppError('Failed to revoke sessions', 500);
  }
};

// Admin-only functions

/**
 * Create staff member (Admin only)
 */
const createStaff = async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
    gymLocationId,
    department,
    salary,
    permissions
  } = req.body;

  try {
    // 1) Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Staff accounts are pre-verified
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role
      }
    });

    if (authError) {
      throw new ConflictError(authError.message);
    }

    const { user } = authData;

    try {
      // 2) Create team member record
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .insert([{
          user_id: user.id,
          gym_location_id: gymLocationId,
          role,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          department,
          salary,
          permissions: permissions || {},
          hire_date: new Date().toISOString().split('T')[0]
        }])
        .select(`
          *,
          gym_locations (id, name, slug)
        `)
        .single();

      if (teamError) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        throw new AppError('Failed to create staff member', 500);
      }

      logger.info('Staff member created', {
        createdBy: req.user.userId,
        staffId: teamMember.id,
        role,
        gymLocationId
      });

      res.status(201).json({
        status: 'success',
        message: 'Staff member created successfully',
        data: {
          staff: teamMember
        }
      });

    } catch (error) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw error;
    }

  } catch (error) {
    logger.error('Staff creation failed:', {
      error: error.message,
      createdBy: req.user.userId,
      email
    });
    throw error;
  }
};

/**
 * Update user status (Admin only)
 */
const updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { isActive } = req.body;

  try {
    // Update in appropriate table
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (member) {
      await supabase
        .from('members')
        .update({ 
          membership_status: isActive ? 'active' : 'suspended' 
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('team_members')
        .update({ is_active: isActive })
        .eq('user_id', userId);
    }

    logger.info('User status updated', {
      updatedBy: req.user.userId,
      userId,
      isActive
    });

    res.json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    throw new AppError('Failed to update user status', 500);
  }
};

/**
 * Get all users (Admin only)
 */
const getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, role, status, search } = req.query;

  try {
    // Implementation would include pagination and filtering
    // This is a simplified version
    const { data: members } = await supabase
      .from('members')
      .select(`
        *,
        gym_locations (name),
        membership_plans (name, category)
      `)
      .range((page - 1) * limit, page * limit - 1);

    const { data: staff } = await supabase
      .from('team_members')
      .select(`
        *,
        gym_locations (name)
      `)
      .range((page - 1) * limit, page * limit - 1);

    res.json({
      status: 'success',
      data: {
        members,
        staff,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    throw new AppError('Failed to fetch users', 500);
  }
};

/**
 * Delete user account (Admin only)
 */
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // This would include proper cleanup of related records
    await supabaseAdmin.auth.admin.deleteUser(userId);

    logger.info('User deleted', {
      deletedBy: req.user.userId,
      userId
    });

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });

  } catch (error) {
    throw new AppError('Failed to delete user', 500);
  }
};

// Helper function to get user profile
const getUserProfile = async (userId) => {
  // Check if user is a team member
  const { data: teamMember } = await supabase
    .from('team_members')
    .select(`
      id,
      employee_id,
      role,
      gym_location_id,
      first_name,
      last_name,
      email,
      phone,
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

  if (teamMember) {
    return {
      id: teamMember.id,
      userId,
      role: teamMember.role,
      type: 'team_member',
      employeeId: teamMember.employee_id,
      gymLocationId: teamMember.gym_location_id,
      name: `${teamMember.first_name} ${teamMember.last_name}`,
      firstName: teamMember.first_name,
      lastName: teamMember.last_name,
      email: teamMember.email,
      phone: teamMember.phone,
      permissions: teamMember.permissions || {},
      gymLocation: teamMember.gym_locations,
      isActive: teamMember.is_active
    };
  }

  // Check if user is a member
  const { data: member } = await supabase
    .from('members')
    .select(`
      id,
      member_number,
      gym_location_id,
      current_plan_id,
      first_name,
      last_name,
      email,
      phone,
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
        category,
        price
      )
    `)
    .eq('user_id', userId)
    .single();

  if (member) {
    return {
      id: member.id,
      userId,
      role: 'member',
      type: 'member',
      memberNumber: member.member_number,
      gymLocationId: member.gym_location_id,
      planId: member.current_plan_id,
      name: `${member.first_name} ${member.last_name}`,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone,
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
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  refreshToken,
  revokeAllSessions,
  createStaff,
  updateUserStatus,
  getAllUsers,
  deleteUser
};