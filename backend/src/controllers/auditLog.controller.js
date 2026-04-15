const prisma = require('../config/db');
const { success } = require('../utils/apiResponse');

// GET /api/admin/audit-logs
async function listAuditLogs(req, res) {
  const { userId, entityType, action, page = '1', pageSize = '30' } = req.query;
  const where = {};
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;

  const take = Math.min(parseInt(pageSize, 10) || 30, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return success(res, 200, 'Audit logs fetched', logs, {
    total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take),
  });
}

module.exports = { listAuditLogs };
