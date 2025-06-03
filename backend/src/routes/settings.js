const express = require('express');
const router = express.Router();
const { catchAsync } = require('../middleware/errorHandler');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', protect, catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Settings - Coming soon', data: { settings: {} } });
}));

router.put('/', protect, restrictTo('admin'), catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Update settings - Coming soon', data: {} });
}));

module.exports = router;