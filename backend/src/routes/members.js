/**
 * Members Routes - Full Implementation
 * backend/src/routes/members.js
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { catchAsync } = require('../middleware/errorHandler');
const { protect, restrictTo, restrictToGymLocation } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { supabase } = require('../config/database');
const { NotFoundError, AuthorizationError } = require('../middleware/errorHandler');

/**
 * @route   GET /api/v1/members
 * @desc    Get members list with pagination and filters
 * @access  Staff/Admin
 */
router.get('/',
  protect,
  restrictTo('admin', 'staff'),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('gymLocationId').optional().isUUID(),
    query('status').optional().isIn(['active', 'inactive', 'suspended', 'expired', 'cancelled']),
    query('search').optional().isString().trim()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      gymLocationId,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('members')
      .select(`
        id,
        member_number,
        first_name,
        last_name,
        email,
        phone,
        membership_status,
        membership_start_date,
        membership_end_date,
        created_at,
        updated_at,
        gym_locations (
          id,
          name,
          city
        ),
        membership_plans (
          id,
          name,
          category,
          price
        )
      `, { count: 'exact' });

    // Apply location restriction for staff
    if (req.user.role === 'staff') {
      query = query.eq('gym_location_id', req.user.gymLocationId);
    } else if (gymLocationId) {
      query = query.eq('gym_location_id', gymLocationId);
    }

    // Apply filters
    if (status) {
      query = query.eq('membership_status', status);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,member_number.ilike.%${search}%`);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: members, error, count } = await query;

    if (error) {
      throw new Error('Failed to fetch members');
    }

    res.status(200).json({
      status: 'success',
      data: {
        items: members || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: offset + limit < (count || 0),
          hasPrev: page > 1
        }
      }
    });
  })
);

/**
 * @route   GET /api/v1/members/:id
 * @desc    Get member by ID
 * @access  Staff/Admin/Own Member
 */
router.get('/:id',
  protect,
  param('id').isUUID(),
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    let query = supabase
      .from('members')
      .select(`
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
          features
        )
      `)
      .eq('id', id);

    // Apply location restriction for staff
    if (req.user.role === 'staff') {
      query = query.eq('gym_location_id', req.user.gymLocationId);
    }

    const { data: member, error } = await query.single();

    if (error || !member) {
      throw new NotFoundError('Member not found');
    }

    res.status(200).json({
      status: 'success',
      data: {
        member
      }
    });
  })
);

/**
 * @route   POST /api/v1/members
 * @desc    Create new member
 * @access  Staff/Admin
 */
router.post('/',
  protect,
  restrictTo('admin', 'staff'),
  [
    body('firstName').trim().isLength({ min: 2, max: 50 }).matches(/^[a-zA-Z\s]+$/),
    body('lastName').trim().isLength({ min: 2, max: 50 }).matches(/^[a-zA-Z\s]+$/),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone(),
    body('gymLocationId').isUUID(),
    body('planId').optional().isUUID(),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say'])
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      gymLocationId,
      planId,
      dateOfBirth,
      gender,
      address
    } = req.body;

    // Check if email already exists
    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .single();

    if (existingMember) {
      return res.status(409).json({
        status: 'error',
        message: 'Member with this email already exists'
      });
    }

    // Generate member number
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gym_location_id', gymLocationId);

    const memberNumber = `GM${year.toString().slice(-2)}${(count + 1).toString().padStart(4, '0')}`;

    const memberData = {
      member_number: memberNumber,
      gym_location_id: gymLocationId,
      current_plan_id: planId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      date_of_birth: dateOfBirth,
      gender,
      membership_status: planId ? 'active' : 'inactive',
      membership_start_date: planId ? new Date().toISOString().split('T')[0] : null,
      membership_end_date: planId ? new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] : null,
      address_line1: address?.line1,
      address_line2: address?.line2,
      city: address?.city,
      state: address?.state,
      postal_code: address?.postalCode,
      country: address?.country || 'US',
      created_by: req.user.id
    };

    const { data: member, error } = await supabase
      .from('members')
      .insert([memberData])
      .select(`
        *,
        gym_locations (
          id,
          name,
          city
        ),
        membership_plans (
          id,
          name,
          category,
          price
        )
      `)
      .single();

    if (error) {
      throw new Error('Failed to create member');
    }

    res.status(201).json({
      status: 'success',
      message: 'Member created successfully',
      data: {
        member
      }
    });
  })
);

/**
 * @route   PUT /api/v1/members/:id
 * @desc    Update member
 * @access  Staff/Admin
 */
router.put('/:id',
  protect,
  restrictTo('admin', 'staff'),
  param('id').isUUID(),
  [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }).matches(/^[a-zA-Z\s]+$/),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 }).matches(/^[a-zA-Z\s]+$/),
    body('phone').optional().isMobilePhone(),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say'])
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated through this endpoint
    delete updates.email;
    delete updates.member_number;
    delete updates.gym_location_id;

    // Check member exists and user has access
    let checkQuery = supabase
      .from('members')
      .select('id, gym_location_id')
      .eq('id', id);

    if (req.user.role === 'staff') {
      checkQuery = checkQuery.eq('gym_location_id', req.user.gymLocationId);
    }

    const { data: existingMember, error: checkError } = await checkQuery.single();

    if (checkError || !existingMember) {
      throw new NotFoundError('Member not found or access denied');
    }

    const { data: member, error } = await supabase
      .from('members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        gym_locations (
          id,
          name,
          city
        ),
        membership_plans (
          id,
          name,
          category,
          price
        )
      `)
      .single();

    if (error) {
      throw new Error('Failed to update member');
    }

    res.status(200).json({
      status: 'success',
      message: 'Member updated successfully',
      data: {
        member
      }
    });
  })
);

/**
 * @route   POST /api/v1/members/:id/suspend
 * @desc    Suspend member
 * @access  Staff/Admin
 */
router.post('/:id/suspend',
  protect,
  restrictTo('admin', 'staff'),
  param('id').isUUID(),
  body('reason').optional().isString().trim(),
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: member, error } = await supabase
      .from('members')
      .update({
        membership_status: 'suspended',
        notes: reason ? `Suspended: ${reason} (by ${req.user.name} on ${new Date().toLocaleDateString()})` : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to suspend member');
    }

    res.status(200).json({
      status: 'success',
      message: 'Member suspended successfully',
      data: {
        member
      }
    });
  })
);

/**
 * @route   POST /api/v1/members/:id/activate
 * @desc    Activate member
 * @access  Staff/Admin
 */
router.post('/:id/activate',
  protect,
  restrictTo('admin', 'staff'),
  param('id').isUUID(),
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const { data: member, error } = await supabase
      .from('members')
      .update({
        membership_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to activate member');
    }

    res.status(200).json({
      status: 'success',
      message: 'Member activated successfully',
      data: {
        member
      }
    });
  })
);

module.exports = router;