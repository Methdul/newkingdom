/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

const logger = require('../utils/logger');

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

// Error response formatter
const sendErrorResponse = (res, error, statusCode = 500) => {
  const response = {
    status: 'error',
    message: error.message || 'Internal server error',
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.error = error;
  }

  // Add validation errors if present
  if (error.errors && Array.isArray(error.errors)) {
    response.errors = error.errors;
  }

  res.status(statusCode).json(response);
};

// Handle different types of errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'unknown';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message,
    value: el.value
  }));
  const message = 'Invalid input data';
  return new ValidationError(message, errors);
};

const handleJWTError = () => new AuthenticationError('Invalid token. Please log in again!');
const handleJWTExpiredError = () => new AuthenticationError('Your token has expired! Please log in again.');

const handleSupabaseError = (err) => {
  // Handle Supabase specific errors
  if (err.code === '23505') {
    return new ConflictError('Duplicate entry. This record already exists.');
  }
  
  if (err.code === '23503') {
    return new AppError('Referenced record does not exist.', 400);
  }
  
  if (err.code === '42P01') {
    return new AppError('Database table does not exist.', 500);
  }

  if (err.code === 'PGRST301') {
    return new NotFoundError('Record not found.');
  }

  // Generic database error
  return new AppError('Database operation failed.', 500);
};

// Development error response
const sendErrorDev = (err, res) => {
  logger.error('Development Error:', {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode
  });

  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.error('Operational Error:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack
    });

    const response = {
      status: err.status || 'error',
      message: err.message
    };

    // Add validation errors if present
    if (err.errors && Array.isArray(err.errors)) {
      response.errors = err.errors;
    }

    res.status(err.statusCode || 500).json(response);
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('System Error:', {
      error: err.message,
      stack: err.stack
    });

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  logger.error('Global Error Handler:', {
    message: err.message,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: err.stack
  });

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    // Handle Supabase errors
    if (error.code && typeof error.code === 'string' && error.code.length === 5) {
      error = handleSupabaseError(error);
    }

    sendErrorProd(error, res);
  }
};

// Async error handler wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Unhandled route handler
const notFound = (req, res, next) => {
  const err = new NotFoundError(`Can't find ${req.originalUrl} on this server!`);
  next(err);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  globalErrorHandler,
  catchAsync,
  notFound,
  sendErrorResponse
};