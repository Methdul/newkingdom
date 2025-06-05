/**
 * Promotions Routes - Full Implementation
 * backend/src/routes/promotions.js
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
 * @route   GET /api/v1/promotions
 * @desc    Get promotions
 * @access  Public (active only) / Admin+Staff (all)
 */
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('isActive').optional().isBoolean(),
    query('search').optional().isString().trim()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      isActive,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('promotions')
      .select('*', { count: 'exact' });

    // For public access, only show active promotions within date range
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);
    } else {
      // Apply filters for admin/staff
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: promotions, error, count } = await query;

    if (error) {
      throw new Error('Failed to fetch promotions');
    }

    res.status(200).json({
      status: 'success',
      data: {
        promotions: promotions || [],
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
 * @route   GET /api/v1/promotions/:id
 * @desc    Get promotion by ID
 * @access  Public (if active) / Admin+Staff (all)
 */
router.get('/:id',
  param('id').isUUID(),
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    let query = supabase
      .from('promotions')
      .select('*')
      .eq('id', id);

    // For public access, only show active promotions within date range
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);
    }

    const { data: promotion, error } = await query.single();

    if (error || !promotion) {
      throw new NotFoundError('Promotion not found');
    }

    res.status(200).json({
      status: 'success',
      data: {
        promotion
      }
    });
  })
);

/**
 * @route   GET /api/v1/promotions/code/:code
 * @desc    Validate promotion code
 * @access  Public
 */
router.get('/code/:code',
  param('code').isString().trim().isLength({ min: 1 }),
  validateRequest,
  catchAsync(async (req, res) => {
    const { code } = req.params;
    const now = new Date().toISOString();

    const { data: promotion, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .single();

    if (error || !promotion) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid or expired promotion code'
      });
    }

    // Check usage limit
    if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
      return res.status(409).json({
        status: 'error',
        message: 'Promotion code has reached its usage limit'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        promotion: {
          id: promotion.id,
          code: promotion.code,
          title: promotion.title,
          description: promotion.description,
          discount_type: promotion.discount_type,
          discount_value: promotion.discount_value,
          applicable_plans: promotion.applicable_plans
        }
      }
    });
  })
);

/**
 * @route   POST /api/v1/promotions
 * @desc    Create new promotion
 * @access  Admin only
 */
router.post('/',
  protect,
  restrictTo('admin'),
  [
    body('code').trim().isLength({ min: 3, max: 20 }).matches(/^[A-Z0-9_-]+$/),
    body('title').trim().isLength({ min: 3, max: 100 }),
    body('description').optional().isString().trim(),
    body('discountType').isIn(['percentage', 'fixed_amount']),
    body('discountValue').isFloat({ min: 0 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('usageLimit').optional().isInt({ min: 1 }),
    body('applicablePlans').optional().isArray(),
    body('isActive').optional().isBoolean()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      usageLimit,
      applicablePlans = [],
      isActive = true
    } = req.body;

    // Validate date range
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        status: 'error',
        message: 'End date must be after start date'
      });
    }

    // Validate discount value based on type
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'Percentage discount cannot exceed 100%'
      });
    }

    // Check if code already exists
    const { data: existingPromotion } = await supabase
      .from('promotions')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existingPromotion) {
      return res.status(409).json({
        status: 'error',
        message: 'Promotion code already exists'
      });
    }

    const promotionData = {
      code: code.toUpperCase(),
      title,
      description,
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      start_date: startDate,
      end_date: endDate,
      usage_limit: usageLimit,
      used_count: 0,
      applicable_plans: applicablePlans,
      is_active: isActive,
      created_by: req.user.id
    };

    const { data: promotion, error } = await supabase
      .from('promotions')
      .insert([promotionData])
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create promotion');
    }

    res.status(201).json({
      status: 'success',
      message: 'Promotion created successfully',
      data: {
        promotion
      }
    });
  })
);

/**
 * @route   PUT /api/v1/promotions/:id
 * @desc    Update promotion
 * @access  Admin only
 */
router.put('/:id',
  protect,
  restrictTo('admin'),
  param('id').isUUID(),
  [
    body('code').optional().trim().isLength({ min: 3, max: 20 }).matches(/^[A-Z0-9_-]+$/),
    body('title').optional().trim().isLength({ min: 3, max: 100 }),
    body('description').optional().isString().trim(),
    body('discountType').optional().isIn(['percentage', 'fixed_amount']),
    body('discountValue').optional().isFloat({ min: 0 }),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('usageLimit').optional().isInt({ min: 1 }),
    body('applicablePlans').optional().isArray(),
    body('isActive').optional().isBoolean()
  ],
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Check if promotion exists
    const { data: existingPromotion, error: checkError } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingPromotion) {
      throw new NotFoundError('Promotion not found');
    }

    // Validate date range if dates are being updated
    const startDate = updates.startDate || existingPromotion.start_date;
    const endDate = updates.endDate || existingPromotion.end_date;
    
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        status: 'error',
        message: 'End date must be after start date'
      });
    }

    // Validate discount value based on type
    const discountType = updates.discountType || existingPromotion.discount_type;
    const discountValue = updates.discountValue || existingPromotion.discount_value;
    
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'Percentage discount cannot exceed 100%'
      });
    }

    // Check if code conflicts (if code is being updated)
    if (updates.code && updates.code.toUpperCase() !== existingPromotion.code) {
      const { data: conflictingPromotion } = await supabase
        .from('promotions')
        .select('id')
        .eq('code', updates.code.toUpperCase())
        .neq('id', id)
        .single();

      if (conflictingPromotion) {
        return res.status(409).json({
          status: 'error',
          message: 'Promotion code already exists'
        });
      }
    }

    // Convert camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.code) dbUpdates.code = updates.code.toUpperCase();
    if (updates.discountType) dbUpdates.discount_type = updates.discountType;
    if (updates.discountValue !== undefined) dbUpdates.discount_value = parseFloat(updates.discountValue);
    if (updates.startDate) dbUpdates.start_date = updates.startDate;
    if (updates.endDate) dbUpdates.end_date = updates.endDate;
    if (updates.usageLimit !== undefined) dbUpdates.usage_limit = updates.usageLimit;
    if (updates.applicablePlans) dbUpdates.applicable_plans = updates.applicablePlans;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    // Add other direct fields
    ['title', 'description'].forEach(field => {
      if (updates[field] !== undefined) {
        dbUpdates[field] = updates[field];
      }
    });

    dbUpdates.updated_at = new Date().toISOString();

    const { data: promotion, error } = await supabase
      .from('promotions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update promotion');
    }

    res.status(200).json({
      status: 'success',
      message: 'Promotion updated successfully',
      data: {
        promotion
      }
    });
  })
);

/**
 * @route   DELETE /api/v1/promotions/:id
 * @desc    Delete promotion
 * @access  Admin only
 */
router.delete('/:id',
  protect,
  restrictTo('admin'),
  param('id').isUUID(),
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    // Check if promotion has been used
    const { data: existingPromotion } = await supabase
      .from('promotions')
      .select('used_count')
      .eq('id', id)
      .single();

    if (!existingPromotion) {
      throw new NotFoundError('Promotion not found');
    }

    if (existingPromotion.used_count > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Cannot delete promotion that has been used. Please deactivate it instead.'
      });
    }

    // Hard delete if not used
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('Failed to delete promotion');
    }

    res.status(200).json({
      status: 'success',
      message: 'Promotion deleted successfully'
    });
  })
);

/**
 * @route   POST /api/v1/promotions/:id/use
 * @desc    Mark promotion as used (increment usage count)
 * @access  Staff/Admin
 */
router.post('/:id/use',
  protect,
  restrictTo('admin', 'staff'),
  param('id').isUUID(),
  validateRequest,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const { data: promotion, error } = await supabase
      .from('promotions')
      .select('used_count, usage_limit')
      .eq('id', id)
      .single();

    if (error || !promotion) {
      throw new NotFoundError('Promotion not found');
    }

    // Check usage limit
    if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
      return res.status(409).json({
        status: 'error',
        message: 'Promotion has reached its usage limit'
      });
    }

    const { data: updatedPromotion, error: updateError } = await supabase
      .from('promotions')
      .update({
        used_count: promotion.used_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update promotion usage');
    }

    res.status(200).json({
      status: 'success',
      message: 'Promotion usage recorded',
      data: {
        promotion: updatedPromotion
      }
    });
  })
);

module.exports = router;