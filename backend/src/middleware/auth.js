const { verifyAccessToken } = require('../utils/jwt');
const { failure } = require('../utils/apiResponse');
const prisma = require('../config/db');

// Verifies the JWT and attaches { id, role, email, status } to req.user.
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return failure(res, 401, 'Authentication required');
  }

  const token = header.split(' ')[1];
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    return failure(res, 401, 'Invalid or expired token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return failure(res, 401, 'User no longer exists');
  if (user.status !== 'ACTIVE') {
    return failure(res, 403, 'Account is not active');
  }

  req.user = { id: user.id, role: user.role, email: user.email, status: user.status };
  next();
}

// Role-based authorization guard. Usage: authorize('ADMIN', 'SUPER_ADMIN')
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return failure(res, 401, 'Authentication required');
    if (!allowedRoles.includes(req.user.role)) {
      return failure(res, 403, 'You do not have permission to perform this action');
    }
    next();
  };
}

module.exports = { authenticate, authorize };
