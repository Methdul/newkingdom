/**
 * Validation Middleware
 * Handles request validation using express-validator
 */

const { validationResult, body, param, query } = require('express-validator');
const { ValidationError } = require('./errorHandler');
const { supabase } = require('../config/database');

/**
 * Process validation results
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    throw new ValidationError('Validation failed', formattedErrors);
  }
  
  next();
};

/**
 * Common validation rules
 */
const commonValidations = {
  // UUID validation
  uuid: (field = 'id') => 
    param(field).isUUID().withMessage(`${field} must be a valid UUID`),

  // Email validation
  email: (field = 'email', required = true) => {
    const validator = body(field);
    if (required) {
      return validator
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address');
    }
    return validator
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address');
  },

  // Phone validation
  phone: (field = 'phone', required = false) => {
    const validator = body(field);
    if (required) {
      return validator
        .isMobilePhone()
        .withMessage('Please provide a valid phone number');
    }
    return validator
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number');
  },

  // Name validation
  name: (field, min = 2, max = 50, required = true) => {
    const validator = body(field);
    const chain = required ? validator : validator.optional();
    return chain
      .trim()
      .isLength({ min, max })
      .withMessage(`${field} must be between ${min} and ${max} characters`)
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage(`${field} can only contain letters and spaces`);
  },

  // Password validation
  password: (field = 'password', minLength = 8) =>
    body(field)
      .isLength({ min: minLength })
      .withMessage(`Password must be at least ${minLength} characters long`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  // Date validation
  date: (field, required = false) => {
    const validator = body(field);
    if (required) {
      return validator
        .isISO8601()
        .withMessage(`${field} must be a valid date`);
    }
    return validator
      .optional()
      .isISO8601()
      .withMessage(`${field} must be a valid date`);
  },

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('sortBy')
      .optional()
      .isString()
      .withMessage('Sort field must be a string'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either asc or desc')
  ],

  // Amount validation (for payments)
  amount: (field = 'amount', min = 0.01) =>
    body(field)
      .isFloat({ min })
      .withMessage(`${field} must be a valid amount greater than ${min}`)
      .toFloat(),

  // Enum validation
  enum: (field, values, required = true) => {
    const validator = body(field);
    const chain = required ? validator : validator.optional();
    return chain
      .isIn(values)
      .withMessage(`${field} must be one of: ${values.join(', ')}`);
  }
};

/**
 * Custom validators for database existence checks
 */
const customValidators = {
  // Check if gym location exists and is active
  gymLocationExists: (field = 'gymLocationId') =>
    body(field)
      .isUUID()
      .custom(async (value) => {
        const { data, error } = await supabase
          .from('gym_locations')
          .select('id, name, is_active')
          .eq('id', value)
          .single();

        if (error || !data) {
          throw new Error('Gym location not found');
        }

        if (!data.is_active) {
          throw new Error('Gym location is not active');
        }

        return true;
      }),

  // Check if membership plan exists and is active
  membershipPlanExists: (field = 'planId') =>
    body(field)
      .isUUID()
      .custom(async (value) => {
        const { data, error } = await supabase
          .from('membership_plans')
          .select('id, name, is_active, price')
          .eq('id', value)
          .single();

        if (error || !data) {
          throw new Error('Membership plan not found');
        }

        if (!data.is_active) {
          throw new Error('Membership plan is not active');
        }

        return true;
      }),

  // Check if member exists
  memberExists: (field = 'memberId') =>
    body(field)
      .isUUID()
      .custom(async (value) => {
        const { data, error } = await supabase
          .from('members')
          .select('id, first_name, last_name')
          .eq('id', value)
          .single();

        if (error || !data) {
          throw new Error('Member not found');
        }

        return true;
      }),

  // Check if email is unique
  emailUnique: (field = 'email', excludeUserId = null) =>
    body(field)
      .custom(async (value, { req }) => {
        // Check in auth.users table
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = authUsers.users.find(user => 
          user.email === value && (!excludeUserId || user.id !== excludeUserId)
        );

        if (existingAuthUser) {
          throw new Error('Email already registered');
        }

        // Check in members table
        let memberQuery = supabase
          .from('members')
          .select('id, email')
          .eq('email', value);

        if (excludeUserId) {
          memberQuery = memberQuery.neq('user_id', excludeUserId);
        }

        const { data: members } = await memberQuery;
        if (members && members.length > 0) {
          throw new Error('Email already registered');
        }

        // Check in team_members table
        let teamQuery = supabase
          .from('team_members')
          .select('id, email')
          .eq('email', value);

        if (excludeUserId) {
          teamQuery = teamQuery.neq('user_id', excludeUserId);
        }

        const { data: teamMembers } = await teamQuery;
        if (teamMembers && teamMembers.length > 0) {
          throw new Error('Email already registered');
        }

        return true;
      }),

  // Validate promotion code
  promotionCodeValid: (field = 'promotionCode') =>
    body(field)
      .optional()
      .custom(async (value) => {
        if (!value) return true;

        const { data, error } = await supabase
          .from('promotions')
          .select('id, code, is_active, start_date, end_date, usage_limit, used_count')
          .eq('code', value.toUpperCase())
          .single();

        if (error || !data) {
          throw new Error('Invalid promotion code');
        }

        if (!data.is_active) {
          throw new Error('Promotion code is no longer active');
        }

        const now = new Date();
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);

        if (now < startDate || now > endDate) {
          throw new Error('Promotion code is not valid at this time');
        }

        if (data.usage_limit && data.used_count >= data.usage_limit) {
          throw new Error('Promotion code has reached its usage limit');
        }

        return true;
      }),

  // Validate payment amount against plan price
  validatePaymentAmount: (amountField = 'amount', planField = 'planId') =>
    body(amountField)
      .custom(async (value, { req }) => {
        const planId = req.body[planField];
        if (!planId) return true; // Will be caught by other validators

        const { data: plan } = await supabase
          .from('membership_plans')
          .select('price')
          .eq('id', planId)
          .single();

        if (!plan) return true; // Will be caught by other validators

        const planPrice = parseFloat(plan.price);
        const paidAmount = parseFloat(value);

        // Allow some flexibility for discounts (minimum 10% of plan price)
        const minAmount = planPrice * 0.1;
        const maxAmount = planPrice * 1.1; // Allow 10% extra for fees

        if (paidAmount < minAmount || paidAmount > maxAmount) {
          throw new Error(
            `Payment amount must be between $${minAmount.toFixed(2)} and $${maxAmount.toFixed(2)} for the selected plan`
          );
        }

        return true;
      }),

  // Age validation
  minimumAge: (field = 'dateOfBirth', minAge = 16) =>
    body(field)
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < minAge) {
          throw new Error(`You must be at least ${minAge} years old`);
        }

        return true;
      })
};

/**
 * Validation rule sets for different entities
 */
const validationSets = {
  member: {
    create: [
      commonValidations.email('email', true),
      customValidators.emailUnique('email'),
      commonValidations.name('firstName'),
      commonValidations.name('lastName'),
      commonValidations.phone('phone', false),
      commonValidations.date('dateOfBirth', false),
      customValidators.minimumAge('dateOfBirth', 16),
      commonValidations.enum('gender', ['male', 'female', 'other', 'prefer_not_to_say'], false),
      customValidators.gymLocationExists('gymLocationId'),
      customValidators.membershipPlanExists('planId')
    ],
    
    update: [
      commonValidations.name('firstName', 2, 50, false),
      commonValidations.name('lastName', 2, 50, false),
      commonValidations.phone('phone', false),
      commonValidations.date('dateOfBirth', false),
      customValidators.minimumAge('dateOfBirth', 16),
      commonValidations.enum('gender', ['male', 'female', 'other', 'prefer_not_to_say'], false)
    ]
  },

  payment: {
    create: [
      customValidators.memberExists('memberId'),
      customValidators.membershipPlanExists('planId'),
      commonValidations.amount('amount'),
      commonValidations.enum('paymentMethod', ['cash', 'card', 'bank_transfer', 'online', 'stripe'], true),
      customValidators.validatePaymentAmount('amount', 'planId'),
      customValidators.promotionCodeValid('promotionCode')
    ]
  },

  staff: {
    create: [
      commonValidations.email('email', true),
      customValidators.emailUnique('email'),
      commonValidations.name('firstName'),
      commonValidations.name('lastName'),
      commonValidations.phone('phone', false),
      commonValidations.enum('role', ['admin', 'staff'], true),
      customValidators.gymLocationExists('gymLocationId')
    ],
    
    update: [
      commonValidations.name('firstName', 2, 50, false),
      commonValidations.name('lastName', 2, 50, false),
      commonValidations.phone('phone', false),
      commonValidations.enum('role', ['admin', 'staff'], false),
      customValidators.gymLocationExists('gymLocationId')
    ]
  }
};

module.exports = {
  validateRequest,
  commonValidations,
  customValidators,
  validationSets
};