const express = require('express');
const router = express.Router();
const { catchAsync } = require('../middleware/errorHandler');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', protect, restrictTo('admin', 'staff'), catchAsync(async (req, res) => {
  res.json({ status: 'success', message: 'Staff routes - Coming soon', data: { staff: [] } });
}));

module.exports = router;