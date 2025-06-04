#!/usr/bin/env node

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express();

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads
app.use('/uploads', express.static(uploadsDir));

// API Version
const API_VERSION = process.env.API_VERSION || 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    features: {
      payments: process.env.ENABLE_PAYMENTS === 'true',
      sms: process.env.ENABLE_SMS === 'true',
      email: process.env.ENABLE_EMAIL === 'true',
      qr_checkin: process.env.ENABLE_QR_CHECKIN === 'true',
      analytics: process.env.ENABLE_ANALYTICS === 'true'
    }
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    api: 'FitZone Pro API',
    version: API_VERSION,
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Safe route loading
const loadRoute = (routePath, routeName) => {
  try {
    const route = require(routePath);
    if (route && (typeof route === 'function' || typeof route.use === 'function')) {
      console.log(`✅ Loaded ${routeName} route`);
      return route;
    } else {
      console.log(`❌ Invalid ${routeName} route`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Failed to load ${routeName} route:`, error.message);
    return null;
  }
};

// Load routes
console.log('Loading routes...');
const authRoutes = loadRoute('./src/routes/auth', 'auth');
const memberRoutes = loadRoute('./src/routes/members', 'members');
const staffRoutes = loadRoute('./src/routes/staff', 'staff');
const adminRoutes = loadRoute('./src/routes/admin', 'admin');
const paymentRoutes = loadRoute('./src/routes/payments', 'payments');
const planRoutes = loadRoute('./src/routes/plans', 'plans');
const locationRoutes = loadRoute('./src/routes/locations', 'locations');
const checkinRoutes = loadRoute('./src/routes/checkins', 'checkins');
const promotionRoutes = loadRoute('./src/routes/promotions', 'promotions');
const analyticsRoutes = loadRoute('./src/routes/analytics', 'analytics');
const settingsRoutes = loadRoute('./src/routes/settings', 'settings');

// Mount routes
if (authRoutes) app.use(`${API_PREFIX}/auth`, authRoutes);
if (memberRoutes) app.use(`${API_PREFIX}/members`, memberRoutes);
if (staffRoutes) app.use(`${API_PREFIX}/staff`, staffRoutes);
if (adminRoutes) app.use(`${API_PREFIX}/admin`, adminRoutes);
if (paymentRoutes) app.use(`${API_PREFIX}/payments`, paymentRoutes);
if (planRoutes) app.use(`${API_PREFIX}/plans`, planRoutes);
if (locationRoutes) app.use(`${API_PREFIX}/locations`, locationRoutes);
if (checkinRoutes) app.use(`${API_PREFIX}/checkins`, checkinRoutes);
if (promotionRoutes) app.use(`${API_PREFIX}/promotions`, promotionRoutes);
if (analyticsRoutes) app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
if (settingsRoutes) app.use(`${API_PREFIX}/settings`, settingsRoutes);

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'FitZone Pro API',
    version: API_VERSION,
    description: 'Professional Gym Management System API',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      members: `${API_PREFIX}/members`,
      staff: `${API_PREFIX}/staff`,
      admin: `${API_PREFIX}/admin`,
      payments: `${API_PREFIX}/payments`,
      plans: `${API_PREFIX}/plans`,
      locations: `${API_PREFIX}/locations`,
      checkins: `${API_PREFIX}/checkins`,
      promotions: `${API_PREFIX}/promotions`,
      analytics: `${API_PREFIX}/analytics`,
      settings: `${API_PREFIX}/settings`
    }
  });
});

// Basic error handling
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Something went wrong!'
  });
});

// Start server
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 FitZone Pro API Server started`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server running on http://${HOST}:${PORT}`);
  console.log(`📚 API Documentation: http://${HOST}:${PORT}/api`);
  console.log(`💚 Health Check: http://${HOST}:${PORT}/api/health`);
  console.log(`🔐 Auth endpoint: http://${HOST}:${PORT}${API_PREFIX}/auth`);
  console.log(`🔗 Frontend URL: http://localhost:3000`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;