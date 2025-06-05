/**
 * Membership Plans Routes - Full Implementation
 * backend/src/routes/plans.js
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
 * @route   GET /api/v1/plans
 * @desc    Get membership plans
 * @access  Public
 */
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('category').optional().isIn(['basic', 'premium', 'vip', 'corporate']),
    query('isActive').optional().isBoolean()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { 
      page = 1, 
      limit = 50, 
      category,
      isActive = true,
      sortBy = 'sort_order',
      sortOrder = 'asc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('membership_plans')
      .select('*', { count: 'exact' });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: plans, error, count } = await query;

    if (error) {
      throw new Error('Failed to fetch membership plans');
    }

    res.status(200).json({
      status: 'success',
      data: {
        plans: plans || [],
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
 * @route   GET /api/v1/plans/:id
 * @desc    Get membership plan by ID
 * @access  Public
 */
router.get('/:id',
  param('id').isUUID(),
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const { data: plan, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !plan) {
      throw new NotFoundError('Membership plan not found');
    }

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  })
);

/**
 * @route   POST /api/v1/plans
 * @desc    Create new membership plan
 * @access  Admin only
 */
router.post('/',
  protect,
  restrictTo('admin'),
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('category').isIn(['basic', 'premium', 'vip', 'corporate']),
    body('price').isFloat({ min: 0 }),
    body('durationMonths').isInt({ min: 1, max: 24 }),
    body('description').optional().isString().trim(),
    body('features').optional().isArray(),
    body('benefits').optional().isArray(),
    body('maxGymVisits').optional().isInt({ min: 0 }),
    body('maxGuestPasses').optional().isInt({ min: 0 }),
    body('includesPersonalTraining').optional().isBoolean(),
    body('includesGroupClasses').optional().isBoolean(),
    body('isActive').optional().isBoolean()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const {
      name,
      category,
      price,
      durationMonths,
      description,
      features = [],
      benefits = [],
      maxGymVisits,
      maxGuestPasses = 0,
      includesPersonalTraining = false,
      includesGroupClasses = false,
      isActive = true
    } = req.body;

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const { data: existingPlan } = await supabase
      .from('membership_plans')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingPlan) {
      return res.status(409).json({
        status: 'error',
        message: 'A plan with this name already exists'
      });
    }

    // Get highest sort order and increment
    const { data: lastPlan } = await supabase
      .from('membership_plans')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (lastPlan?.sort_order || 0) + 1;

    const planData = {
      name,
      slug,
      category,
      description,
      price: parseFloat(price),
      duration_months: parseInt(durationMonths),
      features,
      benefits,
      max_gym_visits: maxGymVisits,
      max_guest_passes: parseInt(maxGuestPasses),
      includes_personal_training: includesPersonalTraining,
      includes_group_classes: includesGroupClasses,
      is_active: isActive,
      sort_order: sortOrder,
      created_by: req.user.id
    };

    const { data: plan, error } = await supabase
      .from('membership_plans')
      .insert([planData])
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create membership plan');
    }

    res.status(201).json({
      status: 'success',
      message: 'Membership plan created successfully',
      data: {
        plan
      }
    });
  })
);

/**
 * @route   PUT /api/v1/plans/:id
 * @desc    Update membership plan
 * @access  Admin only
 */
router.put('/:id',
  protect,
  restrictTo('admin'),
  param('id').isUUID(),
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('category').optional().isIn(['basic', 'premium', 'vip', 'corporate']),
    body('price').optional().isFloat({ min: 0 }),
    body('durationMonths').optional().isInt({ min: 1, max: 24 }),
    body('description').optional().isString().trim(),
    body('features').optional().isArray(),
    body('benefits').optional().isArray(),
    body('maxGymVisits').optional().isInt({ min: 0 }),
    body('maxGuestPasses').optional().isInt({ min: 0 }),
    body('includesPersonalTraining').optional().isBoolean(),
    body('includesGroupClasses').optional().isBoolean(),
    body('isActive').optional().isBoolean()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Check if plan exists
    const { data: existingPlan, error: checkError } = await supabase
      .from('membership_plans')
      .select('id, name, slug')
      .eq('id', id)
      .single();

    if (checkError || !existingPlan) {
      throw new NotFoundError('Membership plan not found');
    }

    // Update slug if name is changing
    if (updates.name && updates.name !== existingPlan.name) {
      const newSlug = updates.name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Check if new slug conflicts
      const { data: conflictingPlan } = await supabase
        .from('membership_plans')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', id)
        .single();

      if (conflictingPlan) {
        return res.status(409).json({
          status: 'error',
          message: 'A plan with this name already exists'
        });
      }

      updates.slug = newSlug;
    }

    // Convert camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.durationMonths) dbUpdates.duration_months = parseInt(updates.durationMonths);
    if (updates.maxGymVisits !== undefined) dbUpdates.max_gym_visits = updates.maxGymVisits;
    if (updates.maxGuestPasses !== undefined) dbUpdates.max_guest_passes = parseInt(updates.maxGuestPasses);
    if (updates.includesPersonalTraining !== undefined) dbUpdates.includes_personal_training = updates.includesPersonalTraining;
    if (updates.includesGroupClasses !== undefined) dbUpdates.includes_group_classes = updates.includesGroupClasses;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.price !== undefined) dbUpdates.price = parseFloat(updates.price);

    // Add other direct fields
    ['name', 'slug', 'category', 'description', 'features', 'benefits'].forEach(field => {
      if (updates[field] !== undefined) {
        dbUpdates[field] = updates[field];
      }
    });

    dbUpdates.updated_at = new Date().toISOString();

    const { data: plan, error } = await supabase
      .from('membership_plans')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update membership plan');
    }

    res.status(200).json({
      status: 'success',
      message: 'Membership plan updated successfully',
      data: {
        plan
      }
    });
  })
);

/**
 * @route   DELETE /api/v1/plans/:id
 * @desc    Delete membership plan
 * @access  Admin only
 */
router.delete('/:id',
  protect,
  restrictTo('admin'),
  param('id').isUUID(),
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    // Check if plan has active members
    const { data: activeMembers, count } = await supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('current_plan_id', id)
      .eq('membership_status', 'active');

    if (count > 0) {
      return res.status(409).json({
        status: 'error',
        message: `Cannot delete plan with ${count} active members. Please deactivate the plan instead.`
      });
    }

    // Soft delete by marking as inactive
    const { data: plan, error } = await supabase
      .from('membership_plans')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new NotFoundError('Membership plan not found');
    }

    res.status(200).json({
      status: 'success',
      message: 'Membership plan deleted successfully'
    });
  })
);

/**
 * @route   PUT /api/v1/plans/:id/reorder
 * @desc    Reorder membership plans
 * @access  Admin only
 */
router.put('/:id/reorder',
  protect,
  restrictTo('admin'),
  param('id').isUUID(),
  body('newOrder').isInt({ min: 1 }),
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { newOrder } = req.body;

    const { data: plan, error } = await supabase
      .from('membership_plans')
      .update({
        sort_order: newOrder,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new NotFoundError('Membership plan not found');
    }

    res.status(200).json({
      status: 'success',
      message: 'Plan order updated successfully',
      data: {
        plan
      }
    });
  })
);

module.exports = router;