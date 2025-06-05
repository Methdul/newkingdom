/**
 * Gym Locations Routes - Full Implementation
 * backend/src/routes/locations.js
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { catchAsync } = require('../middleware/errorHandler');
const { protect, restrictTo } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { supabase } = require('../config/database');
const { NotFoundError } = require('../middleware/errorHandler');

/**
 * @route   GET /api/v1/locations
 * @desc    Get gym locations
 * @access  Public
 */
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('city').optional().isString().trim(),
    query('isActive').optional().isBoolean()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { 
      page = 1, 
      limit = 50, 
      city,
      isActive = true
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('gym_locations')
      .select('*', { count: 'exact' });

    // Apply filters
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    // Apply pagination
    query = query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: locations, error, count } = await query;

    if (error) {
      throw new Error('Failed to fetch gym locations');
    }

    // For each location, get additional stats if user is admin/staff
    let locationsWithStats = locations;
    
    if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
      locationsWithStats = await Promise.all(locations.map(async (location) => {
        // Get member count
        const { count: memberCount } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('gym_location_id', location.id);

        // Get active member count
        const { count: activeMemberCount } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('gym_location_id', location.id)
          .eq('membership_status', 'active');

        // Get today's check-ins
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCheckins } = await supabase
          .from('check_ins')
          .select('id', { count: 'exact', head: true })
          .eq('gym_location_id', location.id)
          .gte('check_in_time', today + 'T00:00:00')
          .lte('check_in_time', today + 'T23:59:59');

        return {
          ...location,
          stats: {
            totalMembers: memberCount || 0,
            activeMembers: activeMemberCount || 0,
            todayCheckins: todayCheckins || 0,
            utilization: location.capacity > 0 ? Math.round(((activeMemberCount || 0) / location.capacity) * 100) : 0
          }
        };
      }));
    }

    res.status(200).json({
      status: 'success',
      data: {
        locations: locationsWithStats || [],
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
 * @route   GET /api/v1/locations/:id
 * @desc    Get location by ID
 * @access  Public
 */
router.get('/:id',
  param('id').isUUID(),
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const { data: location, error } = await supabase
      .from('gym_locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !location) {
      throw new NotFoundError('Gym location not found');
    }

    // Get additional details if user is admin/staff
    let locationWithDetails = location;

    if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
      // Get member statistics
      const { count: totalMembers } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('gym_location_id', id);

      const { count: activeMembers } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('gym_location_id', id)
        .eq('membership_status', 'active');

      // Get revenue this month
      const thisMonth = new Date();
      const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
      
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('total_amount, amount')
        .eq('gym_location_id', id)
        .eq('payment_status', 'completed')
        .gte('payment_date', thisMonthStart.toISOString().split('T')[0]);

      const monthlyRevenue = (monthlyPayments || []).reduce((sum, p) => 
        sum + parseFloat(p.total_amount || p.amount), 0);

      // Get recent check-ins
      const { data: recentCheckins } = await supabase
        .from('check_ins')
        .select(`
          id,
          check_in_time,
          check_out_time,
          members (first_name, last_name)
        `)
        .eq('gym_location_id', id)
        .order('check_in_time', { ascending: false })
        .limit(10);

      locationWithDetails = {
        ...location,
        stats: {
          totalMembers: totalMembers || 0,
          activeMembers: activeMembers || 0,
          monthlyRevenue: Math.round(monthlyRevenue),
          recentCheckins: recentCheckins || []
        }
      };
    }

    res.status(200).json({
      status: 'success',
      data: {
        location: locationWithDetails
      }
    });
  })
);

/**
 * @route   POST /api/v1/locations
 * @desc    Create new gym location
 * @access  Admin only
 */
router.post('/',
  protect,
  restrictTo('admin'),
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('address').optional().isString().trim(),
    body('city').optional().isString().trim(),
    body('state').optional().isString().trim(),
    body('country').isString().trim(),
    body('postalCode').optional().isString().trim(),
    body('phone').optional().isMobilePhone(),
    body('email').optional().isEmail(),
    body('managerName').optional().isString().trim(),
    body('capacity').isInt({ min: 1 }),
    body('operatingHours').optional().isObject(),
    body('amenities').optional().isArray(),
    body('isActive').optional().isBoolean()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const {
      name,
      address,
      city,
      state,
      country,
      postalCode,
      phone,
      email,
      managerName,
      capacity,
      operatingHours = {},
      amenities = [],
      isActive = true
    } = req.body;

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const { data: existingLocation } = await supabase
      .from('gym_locations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingLocation) {
      return res.status(409).json({
        status: 'error',
        message: 'A location with this name already exists'
      });
    }

    const locationData = {
      name,
      slug,
      address,
      city,
      state,
      country,
      postal_code: postalCode,
      phone,
      email,
      manager_name: managerName,
      capacity: parseInt(capacity),
      operating_hours: operatingHours,
      amenities,
      is_active: isActive,
      created_by: req.user.id
    };

    const { data: location, error } = await supabase
      .from('gym_locations')
      .insert([locationData])
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create gym location');
    }

    res.status(201).json({
      status: 'success',
      message: 'Gym location created successfully',
      data: {
        location
      }
    });
  })
);

/**
 * @route   PUT /api/v1/locations/:id
 * @desc    Update gym location
 * @access  Admin only
 */
router.put('/:id',
  protect,
  restrictTo('admin'),
  param('id').isUUID(),
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('address').optional().isString().trim(),
    body('city').optional().isString().trim(),
    body('state').optional().isString().trim(),
    body('country').optional().isString().trim(),
    body('postalCode').optional().isString().trim(),
    body('phone').optional().isMobilePhone(),
    body('email').optional().isEmail(),
    body('managerName').optional().isString().trim(),
    body('capacity').optional().isInt({ min: 1 }),
    body('operatingHours').optional().isObject(),
    body('amenities').optional().isArray(),
    body('isActive').optional().isBoolean()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Check if location exists
    const { data: existingLocation, error: checkError } = await supabase
      .from('gym_locations')
      .select('id, name, slug')
      .eq('id', id)
      .single();

    if (checkError || !existingLocation) {
      throw new NotFoundError('Gym location not found');
    }

    // Update slug if name is changing
    if (updates.name && updates.name !== existingLocation.name) {
      const newSlug = updates.name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Check if new slug conflicts
      const { data: conflictingLocation } = await supabase
        .from('gym_locations')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', id)
        .single();

      if (conflictingLocation) {
        return res.status(409).json({
          status: 'error',
          message: 'A location with this name already exists'
        });
      }

      updates.slug = newSlug;
    }

    // Convert camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.postalCode) dbUpdates.postal_code = updates.postalCode;
    if (updates.managerName) dbUpdates.manager_name = updates.managerName;
    if (updates.operatingHours) dbUpdates.operating_hours = updates.operatingHours;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.capacity) dbUpdates.capacity = parseInt(updates.capacity);

    // Add other direct fields
    ['name', 'slug', 'address', 'city', 'state', 'country', 'phone', 'email', 'amenities'].forEach(field => {
      if (updates[field] !== undefined) {
        dbUpdates[field] = updates[field];
      }
    });

    dbUpdates.updated_at = new Date().toISOString();

    const { data: location, error } = await supabase
      .from('gym_locations')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update gym location');
    }

    res.status(200).json({
      status: 'success',
      message: 'Gym location updated successfully',
      data: {
        location
      }
    });
  })
);

/**
 * @route   DELETE /api/v1/locations/:id
 * @desc    Delete gym location
 * @access  Admin only
 */
router.delete('/:id',
  protect,
  restrictTo('admin'),
  param('id').isUUID(),
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    // Check if location has active members
    const { count: activeMembers } = await supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('gym_location_id', id)
      .eq('membership_status', 'active');

    if (activeMembers > 0) {
      return res.status(409).json({
        status: 'error',
        message: `Cannot delete location with ${activeMembers} active members. Please deactivate the location instead.`
      });
    }

    // Check if location has staff members
    const { count: staffMembers } = await supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('gym_location_id', id)
      .eq('is_active', true);

    if (staffMembers > 0) {
      return res.status(409).json({
        status: 'error',
        message: `Cannot delete location with ${staffMembers} active staff members.`
      });
    }

    // Soft delete by marking as inactive
    const { data: location, error } = await supabase
      .from('gym_locations')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new NotFoundError('Gym location not found');
    }

    res.status(200).json({
      status: 'success',
      message: 'Gym location deleted successfully'
    });
  })
);

/**
 * @route   GET /api/v1/locations/:id/members
 * @desc    Get members for a specific location
 * @access  Admin/Staff (own location only for staff)
 */
router.get('/:id/members',
  protect,
  restrictTo('admin', 'staff'),
  param('id').isUUID(),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['active', 'inactive', 'suspended', 'expired', 'cancelled'])
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    // Check location access for staff
    if (req.user.role === 'staff' && req.user.gymLocationId !== id) {
      throw new AuthorizationError('Access denied to this location');
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('members')
      .select(`
        id,
        member_number,
        first_name,
        last_name,
        email,
        membership_status,
        membership_start_date,
        membership_end_date,
        membership_plans (name, category)
      `, { count: 'exact' })
      .eq('gym_location_id', id);

    if (status) {
      query = query.eq('membership_status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: members, error, count } = await query;

    if (error) {
      throw new Error('Failed to fetch location members');
    }

    res.status(200).json({
      status: 'success',
      data: {
        members: members || [],
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

module.exports = router;