const express = require('express');
const router = express.Router();
const { catchAsync } = require('../middleware/errorHandler');
const { protect, restrictTo } = require('../middleware/auth');

// Root analytics endpoint that combines all analytics data
router.get('/', protect, restrictTo('admin', 'staff'), catchAsync(async (req, res) => {
  // Mock analytics data structure matching the frontend expectations
  const analyticsData = {
    revenue: {
      total: 125750,
      thisMonth: 18450,
      lastMonth: 16200,
      today: 1580,
      growth: 12.5,
      chart: [
        { date: '2024-01-01', amount: 15000 },
        { date: '2024-02-01', amount: 16200 },
        { date: '2024-03-01', amount: 18450 },
      ]
    },
    members: {
      total: 1247,
      active: 1124,
      inactive: 123,
      newThisMonth: 45,
      growth: 8.2,
      expiringSoon: 34,
      expired: 89,
      statusDistribution: [
        { status: 'active', count: 1124, percentage: 90.1 },
        { status: 'expired', count: 89, percentage: 7.1 },
        { status: 'expiring_soon', count: 34, percentage: 2.8 }
      ]
    },
    checkins: {
      today: 156,
      thisWeek: 892,
      avgDaily: 127,
      peakHours: [
        { hour: 6, count: 45 },
        { hour: 7, count: 120 },
        { hour: 17, count: 134 },
        { hour: 18, count: 156 }
      ]
    },
    topPlans: [
      {
        plan: {
          id: '1',
          name: 'Premium',
          category: 'premium',
          price: 99.99,
          durationMonths: 1
        },
        memberCount: 387,
        revenue: 38700
      }
    ]
  };

  res.json({ 
    status: 'success', 
    data: analyticsData
  });
}));

router.get('/revenue', protect, restrictTo('admin', 'staff'), catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Revenue analytics - Coming soon', data: {} });
}));

router.get('/members', protect, restrictTo('admin', 'staff'), catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Member analytics - Coming soon', data: {} });
}));

module.exports = router;