/**
 * Member Controller
 * Handles all member-related operations
 */

const { supabase } = require('../config/database');
const { 
  AppError, 
  NotFoundError, 
  AuthorizationError,
  ConflictError 
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { calculateEndDate, formatCurrency } = require('../utils/helpers');
const emailService = require('../services/emailService');

/**
 * Helper function to build member query with relations
 */
const buildMemberQuery = (includePrivate = false) => {
  const baseFields = `
    *,
    gym_locations (
      id,
      name,
      address,
      city,
      phone,
      email
    ),
    membership_plans (
      id,
      name,
      category,
      price,
      duration_months,
      features,
      benefits
    )
  `;

  return includePrivate ? baseFields : baseFields.replace('notes,', '');
};

/**
 * Apply filters to member query
 */
const applyMemberFilters = (query, filters) => {
  const {
    gymLocationId,
    membershipStatus,
    planId,
    search,
    startDate,
    endDate
  } = filters;

  if (gymLocationId) {
    query = query.eq('gym_location_id', gymLocationId);
  }

  if (membershipStatus) {
    query = query.eq('membership_status', membershipStatus);
  }

  if (planId) {
    query = query.eq('current_plan_id', planId);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,member_number.ilike.%${search}%`);
  }

  return query;
};

// ==============================================
// MEMBER SELF-SERVICE METHODS
// ==============================================

/**
 * Get current member's profile
 */
exports.getMyProfile = async (req, res, next) => {
  try {
    const { user } = req;

    const { data: member, error } = await supabase
      .from('members')
      .select(buildMemberQuery())
      .eq('id', user.profile.id)
      .single();

    if (error) {
      throw new NotFoundError('Member profile not found');
    }

    // Get additional member statistics
    const [paymentsResult, checkinsResult, goalsResult] = await Promise.all([
      supabase
        .from('payments')
        .select('amount, payment_date')
        .eq('member_id', member.id)
        .eq('payment_status', 'completed')
        .order('payment_date', { ascending: false })
        .limit(5),
      
      supabase
        .from('check_ins')
        .select('check_in_time, check_out_time, duration_minutes')
        .eq('member_id', member.id)
        .order('check_in_time', { ascending: false })
        .limit(10),
      
      supabase
        .from('member_goals')
        .select('*')
        .eq('member_id', member.id)
        .eq('status', 'active')
    ]);

    const memberStats = {
      totalPayments: paymentsResult.data?.length || 0,
      totalAmountPaid: paymentsResult.data?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0,
      recentCheckins: checkinsResult.data || [],
      activeGoals: goalsResult.data || [],
      averageWorkoutDuration: checkinsResult.data?.length > 0 
        ? Math.round(checkinsResult.data.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / checkinsResult.data.length)
        : 0
    };

    res.status(200).json({
      status: 'success',
      data: {
        member,
        stats: memberStats
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update current member's profile
 */
exports.updateMyProfile = async (req, res, next) => {
  try {
    const { user } = req;
    const updates = req.body;

    // Remove sensitive fields that members shouldn't update
    delete updates.membership_status;
    delete updates.current_plan_id;
    delete updates.gym_location_id;
    delete updates.member_number;

    const { data: updatedMember, error } = await supabase
      .from('members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.profile.id)
      .select(buildMemberQuery())
      .single();

    if (error) {
      throw new AppError('Failed to update profile', 500);
    }

    logger.info('Member profile updated', {
      memberId: user.profile.id,
      updatedFields: Object.keys(updates),
      ip: req.ip
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        member: updatedMember
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get current member's membership details
 */
exports.getMyMembership = async (req, res, next) => {
  try {
    const { user } = req;

    const { data: membership, error } = await supabase
      .from('membership_history')
      .select(`
        *,
        membership_plans (
          id,
          name,
          category,
          price,
          duration_months,
          features,
          benefits
        ),
        payments (
          id,
          amount,
          payment_date,
          payment_method,
          payment_status,
          invoice_number
        )
      `)
      .eq('member_id', user.profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch membership details', 500);
    }

    // Get upcoming renewal information
    const { data: currentMember } = await supabase
      .from('members')
      .select('membership_end_date, auto_renewal, current_plan_id')
      .eq('id', user.profile.id)
      .single();

    const membershipInfo = {
      history: membership || [],
      current: {
        endDate: currentMember?.membership_end_date,
        autoRenewal: currentMember?.auto_renewal,
        planId: currentMember?.current_plan_id,
        daysRemaining: currentMember?.membership_end_date 
          ? Math.ceil((new Date(currentMember.membership_end_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null
      }
    };

    res.status(200).json({
      status: 'success',
      data: {
        membership: membershipInfo
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get current member's payment history
 */
exports.getMyPayments = async (req, res, next) => {
  try {
    const { user } = req;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { data: payments, error, count } = await supabase
      .from('payments')
      .select(`
        *,
        membership_plans (
          name,
          category
        )
      `, { count: 'exact' })
      .eq('member_id', user.profile.id)
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('Failed to fetch payment history', 500);
    }

    res.status(200).json({
      status: 'success',
      data: {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get current member's check-in history
 */
exports.getMyCheckins = async (req, res, next) => {
  try {
    const { user } = req;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { data: checkins, error, count } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact' })
      .eq('member_id', user.profile.id)
      .order('check_in_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('Failed to fetch check-in history', 500);
    }

    // Calculate statistics
    const stats = {
      totalVisits: count,
      thisMonth: checkins?.filter(c => 
        new Date(c.check_in_time).getMonth() === new Date().getMonth()
      ).length || 0,
      averageDuration: checkins?.length > 0 
        ? Math.round(checkins.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / checkins.length)
        : 0
    };

    res.status(200).json({
      status: 'success',
      data: {
        checkins,
        stats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Create a new fitness goal
 */
exports.createGoal = async (req, res, next) => {
  try {
    const { user } = req;
    const goalData = {
      ...req.body,
      member_id: user.profile.id
    };

    const { data: goal, error } = await supabase
      .from('member_goals')
      .insert([goalData])
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to create goal', 500);
    }

    res.status(201).json({
      status: 'success',
      message: 'Goal created successfully',
      data: {
        goal
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update a fitness goal
 */
exports.updateGoal = async (req, res, next) => {
  try {
    const { user } = req;
    const { goalId } = req.params;
    const updates = req.body;

    const { data: goal, error } = await supabase
      .from('member_goals')
      .update(updates)
      .eq('id', goalId)
      .eq('member_id', user.profile.id)
      .select()
      .single();

    if (error) {
      throw new NotFoundError('Goal not found or access denied');
    }

    res.status(200).json({
      status: 'success',
      message: 'Goal updated successfully',
      data: {
        goal
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete a fitness goal
 */
exports.deleteGoal = async (req, res, next) => {
  try {
    const { user } = req;
    const { goalId } = req.params;

    const { error } = await supabase
      .from('member_goals')
      .delete()
      .eq('id', goalId)
      .eq('member_id', user.profile.id);

    if (error) {
      throw new NotFoundError('Goal not found or access denied');
    }

    res.status(200).json({
      status: 'success',
      message: 'Goal deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// ==============================================
// STAFF/ADMIN MEMBER MANAGEMENT METHODS
// ==============================================

/**
 * Get all members with filtering and pagination
 */
exports.getAllMembers = async (req, res, next) => {
  try {
    const { user } = req;
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'created_at', 
      sortOrder = 'desc',
      ...filters 
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('members')
      .select(buildMemberQuery(user.role === 'admin'), { count: 'exact' });

    // Apply location restriction for staff
    if (user.role === 'staff') {
      query = query.eq('gym_location_id', user.gymLocationId);
    }

    // Apply filters
    query = applyMemberFilters(query, filters);

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: members, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch members', 500);
    }

    res.status(200).json({
      status: 'success',
      data: {
        members,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        filters: filters
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get specific member by ID
 */
exports.getMemberById = async (req, res, next) => {
  try {
    const { user } = req;
    const { memberId } = req.params;

    let query = supabase
      .from('members')
      .select(buildMemberQuery(user.role === 'admin'))
      .eq('id', memberId);

    // Apply location restriction for staff
    if (user.role === 'staff') {
      query = query.eq('gym_location_id', user.gymLocationId);
    }

    const { data: member, error } = await query.single();

    if (error) {
      throw new NotFoundError('Member not found or access denied');
    }

    // Get additional member data
    const [membershipHistory, recentPayments, recentCheckins] = await Promise.all([
      supabase
        .from('membership_history')
        .select(`
          *,
          membership_plans (name, category)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(5),
      
      supabase
        .from('payments')
        .select(`
          *,
          membership_plans (name)
        `)
        .eq('member_id', memberId)
        .order('payment_date', { ascending: false })
        .limit(5),
      
      supabase
        .from('check_ins')
        .select('*')
        .eq('member_id', memberId)
        .order('check_in_time', { ascending: false })
        .limit(10)
    ]);

    const memberDetails = {
      ...member,
      membershipHistory: membershipHistory.data || [],
      recentPayments: recentPayments.data || [],
      recentCheckins: recentCheckins.data || []
    };

    res.status(200).json({
      status: 'success',
      data: {
        member: memberDetails
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update member profile
 */
exports.updateMember = async (req, res, next) => {
  try {
    const { user } = req;
    const { memberId } = req.params;
    const updates = req.body;

    // Check location access for staff
    if (user.role === 'staff') {
      const { data: member } = await supabase
        .from('members')
        .select('gym_location_id')
        .eq('id', memberId)
        .single();

      if (!member || member.gym_location_id !== user.gymLocationId) {
        throw new AuthorizationError('Access denied to this member');
      }
    }

    const { data: updatedMember, error } = await supabase
      .from('members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select(buildMemberQuery(user.role === 'admin'))
      .single();

    if (error) {
      throw new AppError('Failed to update member', 500);
    }

    logger.info('Member updated by staff', {
      memberId,
      staffId: user.id,
      updatedFields: Object.keys(updates),
      ip: req.ip
    });

    res.status(200).json({
      status: 'success',
      message: 'Member updated successfully',
      data: {
        member: updatedMember
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Suspend member
 */
exports.suspendMember = async (req, res, next) => {
  try {
    const { user } = req;
    const { memberId } = req.params;
    const { reason, duration } = req.body;

    // Check location access for staff
    if (user.role === 'staff') {
      const { data: member } = await supabase
        .from('members')
        .select('gym_location_id, membership_status')
        .eq('id', memberId)
        .single();

      if (!member || member.gym_location_id !== user.gymLocationId) {
        throw new AuthorizationError('Access denied to this member');
      }

      if (member.membership_status === 'suspended') {
        throw new ConflictError('Member is already suspended');
      }
    }

    const suspensionEndDate = duration 
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: updatedMember, error } = await supabase
      .from('members')
      .update({
        membership_status: 'suspended',
        notes: `SUSPENDED: ${reason} (by ${user.profile.first_name} ${user.profile.last_name} on ${new Date().toLocaleDateString()})${duration ? ` - Until: ${new Date(suspensionEndDate).toLocaleDateString()}` : ''}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to suspend member', 500);
    }

    // Send suspension notification email
    await emailService.sendSuspensionNotification({
      to: updatedMember.email,
      firstName: updatedMember.first_name,
      reason,
      endDate: suspensionEndDate
    });

    logger.security('member_suspended', {
      memberId,
      suspendedBy: user.id,
      reason,
      duration,
      ip: req.ip
    });

    res.status(200).json({
      status: 'success',
      message: 'Member suspended successfully',
      data: {
        member: updatedMember
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Reactivate suspended member
 */
exports.reactivateMember = async (req, res, next) => {
  try {
    const { user } = req;
    const { memberId } = req.params;
    const { notes } = req.body;

    const { data: updatedMember, error } = await supabase
      .from('members')
      .update({
        membership_status: 'active',
        notes: notes ? `REACTIVATED: ${notes} (by ${user.profile.first_name} ${user.profile.last_name} on ${new Date().toLocaleDateString()})` : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      throw new AppError('Failed to reactivate member', 500);
    }

    logger.info('Member reactivated', {
      memberId,
      reactivatedBy: user.id,
      notes,
      ip: req.ip
    });

    res.status(200).json({
      status: 'success',
      message: 'Member reactivated successfully',
      data: {
        member: updatedMember
      }
    });

  } catch (error) {
    next(error);
  }
};

// Additional methods would continue here for:
// - updateMembership
// - freezeMembership
// - unfreezeMembership
// - getMemberHistory
// - getMemberPayments
// - getMemberCheckins
// - addNote
// - deleteMember
// - bulkUpdateStatus
// - exportMembers

module.exports = exports;