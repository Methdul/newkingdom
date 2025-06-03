const express = require('express');
const router = express.Router();
const { catchAsync } = require('../middleware/errorHandler');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Membership plans - Coming soon', data: { plans: [] } });
}));

router.post('/', protect, restrictTo('admin'), catchAsync(async (req, res) => {
  res.status(201).json({ status: 'success', message: 'Create plan - Coming soon', data: {} });
}));

module.exports = router;