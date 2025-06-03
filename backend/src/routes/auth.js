/**
 * Authentication Routes
 * Handles user registration, login, and authentication
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { catchAsync } = require('../middleware/errorHandler');
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validation');
const { protect, restrictTo } = require('../middleware/auth');

// ==============================================
// VALIDATION RULES
// ==============================================

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('gymLocationId')
    .isUUID()
    .withMessage('Please select a valid gym location'),
  body('planId')
    .optional()
    .isUUID()
    .withMessage('Please select a valid membership plan'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .custom((value) => {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      if (age < 16) {
        throw new Error('You must be at least 16 years old to register');
      }
      return true;
    }),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Please select a valid gender option')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
];

// ==============================================
// PUBLIC ROUTES (No Authentication Required)
// ==============================================

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new member
 * @access  Public
 */
router.post('/register', 
  registerValidation,
  validateRequest,
  catchAsync(authController.register)
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  loginValidation,
  validateRequest,
  catchAsync(authController.login)
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password',
  forgotPasswordValidation,
  validateRequest,
  catchAsync(authController.forgotPassword)
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  resetPasswordValidation,
  validateRequest,
  catchAsync(authController.resetPassword)
);

/**
 * @route   POST /api/v1/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email/:token',
  param('token').notEmpty().withMessage('Verification token is required'),
  validateRequest,
  catchAsync(authController.verifyEmail)
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post('/resend-verification',
  body('email').isEmail().normalizeEmail(),
  validateRequest,
  catchAsync(authController.resendVerification)
);

// ==============================================
// PROTECTED ROUTES (Authentication Required)
// ==============================================

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  protect,
  catchAsync(authController.getProfile)
);

/**
 * @route   PUT /api/v1/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me',
  protect,
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[a-zA-Z\s]+$/),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[a-zA-Z\s]+$/),
    body('phone')
      .optional()
      .isMobilePhone(),
    body('dateOfBirth')
      .optional()
      .isISO8601()
  ],
  validateRequest,
  catchAsync(authController.updateProfile)
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  protect,
  changePasswordValidation,
  validateRequest,
  catchAsync(authController.changePassword)
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  protect,
  catchAsync(authController.logout)
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Private
 */
router.post('/refresh-token',
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  validateRequest,
  catchAsync(authController.refreshToken)
);

/**
 * @route   POST /api/v1/auth/revoke-all-sessions
 * @desc    Revoke all user sessions
 * @access  Private
 */
router.post('/revoke-all-sessions',
  protect,
  catchAsync(authController.revokeAllSessions)
);

// ==============================================



/**
 * @route   POST /api/v1/auth/admin/create-staff
 * @desc    Create new staff member
 * @access  Admin only
 */
router.post('/admin/create-staff',
  protect,
  restrictTo('admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['admin', 'staff']),
    body('gymLocationId').optional().isUUID(),
    ...registerValidation.slice(2, 4) // firstName and lastName validation
  ],
  validateRequest,
  catchAsync(authController.createStaff)
);

/**
 * @route   PUT /api/v1/auth/admin/users/:userId/status
 * @desc    Update user status (activate/deactivate)
 * @access  Admin only
 */
router.put('/admin/users/:userId/status',
  protect,
  restrictTo('admin'),
  [
    param('userId').isUUID(),
    body('isActive').isBoolean()
  ],
  validateRequest,
  catchAsync(authController.updateUserStatus)
);

/**
 * @route   GET /api/v1/auth/admin/users
 * @desc    Get all users with pagination
 * @access  Admin only
 */
router.get('/admin/users',
  protect,
  restrictTo('admin'),
  catchAsync(authController.getAllUsers)
);

/**
 * @route   DELETE /api/v1/auth/admin/users/:userId
 * @desc    Delete user account
 * @access  Admin only
 */
router.delete('/admin/users/:userId',
  protect,
  restrictTo('admin'),
  param('userId').isUUID(),
  validateRequest,
  catchAsync(authController.deleteUser)
);

module.exports = router;