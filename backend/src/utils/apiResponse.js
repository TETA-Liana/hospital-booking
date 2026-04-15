// Consistent API response shape used across all controllers.

function success(res, statusCode, message, data = null, meta = undefined) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
}

function failure(res, statusCode, message, errors = undefined) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

class ApiError extends Error {
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

module.exports = { success, failure, ApiError };
