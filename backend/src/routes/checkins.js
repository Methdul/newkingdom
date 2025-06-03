const express = require('express');
const router = express.Router();
const { catchAsync } = require('../middleware/errorHandler');
const { protect, restrictTo, requireActiveMembership } = require('../middleware/auth');

router.post('/', protect, requireActiveMembership, catchAsync(async (req, res) => {
  res.status(201).json({ status: 'success', message: 'Check-in endpoint - Coming soon', data: {} });
}));

router.get('/my-history', protect, requireActiveMembership, catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Check-in history - Coming soon', data: { checkins: [] } });
}));

module.exports = router;