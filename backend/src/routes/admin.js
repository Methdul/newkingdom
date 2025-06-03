const express = require('express');
const router = express.Router();
const { catchAsync } = require('../middleware/errorHandler');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/dashboard', protect, restrictTo('admin'), catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Admin dashboard - Coming soon', data: {} });
}));

router.get('/analytics', protect, restrictTo('admin'), catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Admin analytics - Coming soon', data: {} });
}));

module.exports = router;