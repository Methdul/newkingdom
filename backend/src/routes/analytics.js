const express = require('express');
const router = express.Router();
const { catchAsync } = require('../middleware/errorHandler');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/revenue', protect, restrictTo('admin', 'staff'), catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Revenue analytics - Coming soon', data: {} });
}));

router.get('/members', protect, restrictTo('admin', 'staff'), catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Member analytics - Coming soon', data: {} });
}));

module.exports = router;