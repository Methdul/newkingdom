#!/usr/bin/env node

/**
 * FitZone Pro - Gym Management System
 * Professional Backend Server
 * 
 * @author FitZone Team
 * @version 1.0.0
 */

// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Import configurations and utilities
const config = require('./src/config/database');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const { notFound } = require('./src/middleware/notFound');

// Import routes
const authRoutes = require('./src/routes/auth');
const memberRoutes = require('./src/routes/members');
const staffRoutes = require('./src/routes/staff');
const adminRoutes = require('./src/routes/admin');
const paymentRoutes = require('./src/routes/payments');
const planRoutes = require('./src/routes/plans');
const locationRoutes = require('./src/routes/locations');
const checkinRoutes = require('./src/routes/checkins');
const promotionRoutes = require('./src/routes/promotions');
const analyticsRoutes = require('./src/routes/analytics');
const settingsRoutes = require('./src/routes/settings');

const app = express();

// ==============================================
// SECURITY MIDDLEWARE
// ==============================================

// Enable Helmet for security headers
if (process.env.HELMET_ENABLED === 'true') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
  exposedHeaders: ['x-total-count', 'x-page-count']
};

app.use(cors(corsOptions));

// ==============================================
// GENERAL MIDDLEWARE
// ==============================================

// Enable gzip compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

app.use('/api/', limiter);

// Strict rate limiting for auth endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: {
    error: 'Too Many Authentication Attempts',
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  }
});

app.use('/api/auth/login', strictLimiter);
app.use('/api/auth/register', strictLimiter);

// ==============================================
// STATIC FILE SERVING


// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// ==============================================
// API ROUTES


const API_VERSION = process.env.API_VERSION || 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

// Health check endpoint (no rate limiting)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    features: {
      payments: process.env.ENABLE_PAYMENTS === 'true',
      sms: process.env.ENABLE_SMS === 'true',
      email: process.env.ENABLE_EMAIL === 'true',
      qr_checkin: process.env.ENABLE_QR_CHECKIN === 'true',
      analytics: process.env.ENABLE_ANALYTICS === 'true'
    }
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    api: 'FitZone Pro API',
    version: API_VERSION,
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/members`, memberRoutes);
app.use(`${API_PREFIX}/staff`, staffRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/plans`, planRoutes);
app.use(`${API_PREFIX}/locations`, locationRoutes);
app.use(`${API_PREFIX}/checkins`, checkinRoutes);
app.use(`${API_PREFIX}/promotions`, promotionRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'FitZone Pro API',
    version: API_VERSION,
    description: 'Professional Gym Management System API',
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
    },
    documentation: 'https://docs.fitzone.com/api',
    support: 'support@fitzone.com'
  });
});

// ==============================================
// ERROR HANDLING


// 404 handler for undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ==============================================


process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// ==============================================


const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 FitZone Pro API Server started`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Server running on http://${HOST}:${PORT}`);
  logger.info(`📚 API Documentation: http://${HOST}:${PORT}/api`);
  logger.info(`💚 Health Check: http://${HOST}:${PORT}/api/health`);
  logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`🛠️  Development mode enabled`);
    logger.info(`📝 Debug logs enabled`);
  }
});

module.exports = app;