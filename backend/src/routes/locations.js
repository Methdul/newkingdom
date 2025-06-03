const express = require('express');
const router = express.Router();
const { catchAsync } = require('../middleware/errorHandler');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Gym locations - Coming soon', data: { locations: [] } });
}));

router.post('/', protect, restrictTo('admin'), catchAsync(async (req, res) => {
  res.status(201).json({ status: 'success', message: 'Create location - Coming soon', data: {} });
}));

module.exports = router;