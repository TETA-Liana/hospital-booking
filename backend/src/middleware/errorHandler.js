const { ApiError } = require('../utils/apiResponse');

// Central error handler. Prisma errors and known ApiErrors are converted
// to consistent, user-friendly JSON responses. Never leaks stack traces
// or internal config in production.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target?.join(', ') || 'value'} already exists`,
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
}

module.exports = { errorHandler, notFoundHandler };
