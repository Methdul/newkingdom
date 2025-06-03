const express = require('express');
const router = express.Router();
const { catchAsync } = require('../middleware/errorHandler');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', protect, catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Payments routes - Coming soon', data: { payments: [] } });
}));

router.post('/', protect, restrictTo('admin', 'staff'), catchAsync(async (req, res) => {
  res.status(201).json({ status: 'success', message: 'Create payment - Coming soon', data: {} });
}));

module.exports = router;