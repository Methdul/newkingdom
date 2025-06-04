/**
 * Not Found Middleware
 * Handles 404 errors for unmatched routes
 */

const { NotFoundError } = require('./errorHandler');

const notFound = (req, res, next) => {
  const message = `Route ${req.method} ${req.originalUrl} not found`;
  const error = new NotFoundError(message);
  next(error);
};

module.exports = {
  notFound
};