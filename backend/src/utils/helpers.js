/**
 * Helper Utility Functions
 * Common utility functions used throughout the application
 */

const crypto = require('crypto');
const moment = require('moment');

/**
 * Generate random code of specified length
 */
const generateRandomCode = (length = 6, type = 'alphanumeric') => {
  const chars = {
    numeric: '0123456789',
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    hex: '0123456789ABCDEF'
  };
  
  const charset = chars[type] || chars.alphanumeric;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return result;
};

/**
 * Generate secure random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Calculate membership end date based on start date and duration
 */
const calculateEndDate = (startDate, durationMonths) => {
  return moment(startDate).add(durationMonths, 'months').format('YYYY-MM-DD');
};

/**
 * Check if membership is expiring soon
 */
const isMembershipExpiringSoon = (endDate, daysThreshold = 7) => {
  const today = moment();
  const expiry = moment(endDate);
  const daysUntilExpiry = expiry.diff(today, 'days');
  
  return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
};

/**
 * Check if membership is expired
 */
const isMembershipExpired = (endDate) => {
  return moment().isAfter(moment(endDate));
};

/**
 * Format currency amount
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Format date for display
 */
const formatDate = (date, format = 'MMMM DD, YYYY') => {
  return moment(date).format(format);
};

/**
 * Format date with relative time
 */
const formatRelativeDate = (date) => {
  return moment(date).fromNow();
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dateOfBirth) => {
  return moment().diff(moment(dateOfBirth), 'years');
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s|-|\(|\)/g, ''));
};

/**
 * Format phone number for display
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

/**
 * Sanitize string for database storage
 */
const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Generate slug from text
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Capitalize first letter of each word
 */
const titleCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Calculate workout statistics
 */
const calculateWorkoutStats = (checkins) => {
  if (!checkins || checkins.length === 0) {
    return {
      totalWorkouts: 0,
      averageDuration: 0,
      totalDuration: 0,
      workoutsThisMonth: 0,
      longestWorkout: 0
    };
  }

  const thisMonth = moment().format('YYYY-MM');
  const workoutsThisMonth = checkins.filter(c => 
    moment(c.check_in_time).format('YYYY-MM') === thisMonth
  ).length;

  const durations = checkins
    .filter(c => c.duration_minutes)
    .map(c => c.duration_minutes);

  const totalDuration = durations.reduce((sum, d) => sum + d, 0);
  const averageDuration = durations.length > 0 ? Math.round(totalDuration / durations.length) : 0;
  const longestWorkout = durations.length > 0 ? Math.max(...durations) : 0;

  return {
    totalWorkouts: checkins.length,
    averageDuration,
    totalDuration,
    workoutsThisMonth,
    longestWorkout
  };
};

/**
 * Calculate membership value metrics
 */
const calculateMembershipValue = (payments, checkins) => {
  if (!payments || payments.length === 0) return { costPerVisit: 0, totalPaid: 0 };

  const totalPaid = payments
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalVisits = checkins ? checkins.length : 0;
  const costPerVisit = totalVisits > 0 ? totalPaid / totalVisits : 0;

  return {
    totalPaid,
    costPerVisit: Math.round(costPerVisit * 100) / 100,
    totalVisits
  };
};

/**
 * Generate member number
 */
const generateMemberNumber = (gymPrefix, year, sequence) => {
  const yearSuffix = year.toString().slice(-2);
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `${gymPrefix}${yearSuffix}${paddedSequence}`;
};

/**
 * Generate invoice number
 */
const generateInvoiceNumber = (year, month, sequence) => {
  const yearSuffix = year.toString().slice(-2);
  const paddedMonth = month.toString().padStart(2, '0');
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `INV${yearSuffix}${paddedMonth}${paddedSequence}`;
};

/**
 * Validate membership plan compatibility
 */
const validatePlanUpgrade = (currentPlan, newPlan) => {
  const planHierarchy = {
    'basic': 1,
    'premium': 2,
    'vip': 3,
    'corporate': 2
  };

  const currentLevel = planHierarchy[currentPlan.category] || 0;
  const newLevel = planHierarchy[newPlan.category] || 0;

  return {
    isUpgrade: newLevel > currentLevel,
    isDowngrade: newLevel < currentLevel,
    isSameLevel: newLevel === currentLevel,
    priceDifference: parseFloat(newPlan.price) - parseFloat(currentPlan.price)
  };
};

/**
 * Calculate prorated amount for plan changes
 */
const calculateProratedAmount = (currentPlan, newPlan, daysRemaining, totalDays) => {
  const currentPlanDailyRate = parseFloat(currentPlan.price) / totalDays;
  const newPlanDailyRate = parseFloat(newPlan.price) / totalDays;
  
  const refundAmount = currentPlanDailyRate * daysRemaining;
  const newPlanAmount = newPlanDailyRate * daysRemaining;
  
  return {
    refundAmount: Math.round(refundAmount * 100) / 100,
    chargeAmount: Math.round(newPlanAmount * 100) / 100,
    netAmount: Math.round((newPlanAmount - refundAmount) * 100) / 100
  };
};

/**
 * Generate QR code data for member check-in
 */
const generateMemberQRData = (memberId, locationId, timestamp = Date.now()) => {
  const data = {
    memberId,
    locationId,
    timestamp,
    type: 'checkin'
  };
  
  return Buffer.from(JSON.stringify(data)).toString('base64');
};

/**
 * Decode QR code data
 */
const decodeMemberQRData = (qrData) => {
  try {
    const decoded = Buffer.from(qrData, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

/**
 * Get business days between two dates
 */
const getBusinessDaysBetween = (startDate, endDate) => {
  const start = moment(startDate);
  const end = moment(endDate);
  let businessDays = 0;
  
  const current = start.clone();
  while (current.isSameOrBefore(end)) {
    if (current.day() !== 0 && current.day() !== 6) { // Not Sunday (0) or Saturday (6)
      businessDays++;
    }
    current.add(1, 'day');
  }
  
  return businessDays;
};

/**
 * Validate membership renewal eligibility
 */
const validateRenewalEligibility = (member, plan) => {
  const issues = [];
  
  if (member.membership_status === 'suspended') {
    issues.push('Member is currently suspended');
  }
  
  if (member.membership_status === 'cancelled') {
    issues.push('Member has cancelled their membership');
  }
  
  if (!plan.is_active) {
    issues.push('Selected membership plan is not active');
  }
  
  return {
    isEligible: issues.length === 0,
    issues
  };
};

/**
 * Format duration in minutes to human readable format
 */
const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
};

/**
 * Get membership status color for UI
 */
const getMembershipStatusColor = (status) => {
  const colors = {
    'active': '#10b981',      // green
    'inactive': '#6b7280',    // gray
    'suspended': '#f59e0b',   // amber
    'expired': '#ef4444',     // red
    'cancelled': '#ef4444',   // red
    'pending': '#3b82f6'      // blue
  };
  
  return colors[status] || colors.inactive;
};

/**
 * Calculate next billing date
 */
const calculateNextBillingDate = (startDate, billingCycle = 'monthly') => {
  const cycles = {
    'weekly': 1,
    'monthly': 1,
    'quarterly': 3,
    'semi-annual': 6,
    'annual': 12
  };
  
  const months = cycles[billingCycle] || 1;
  return moment(startDate).add(months, 'months').format('YYYY-MM-DD');
};

module.exports = {
  generateRandomCode,
  generateSecureToken,
  calculateEndDate,
  isMembershipExpiringSoon,
  isMembershipExpired,
  formatCurrency,
  formatDate,
  formatRelativeDate,
  calculateAge,
  isValidEmail,
  isValidPhone,
  formatPhoneNumber,
  sanitizeString,
  generateSlug,
  titleCase,
  calculateWorkoutStats,
  calculateMembershipValue,
  generateMemberNumber,
  generateInvoiceNumber,
  validatePlanUpgrade,
  calculateProratedAmount,
  generateMemberQRData,
  decodeMemberQRData,
  getBusinessDaysBetween,
  validateRenewalEligibility,
  formatDuration,
  getMembershipStatusColor,
  calculateNextBillingDate
};