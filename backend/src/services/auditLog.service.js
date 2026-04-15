const prisma = require('../config/db');

// Records an entry in the audit log. Never throws - a logging failure
// must not block the primary action.
async function recordAudit({ userId, action, entityType, entityId, details, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        details: details || undefined,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Failed to record audit log:', err.message);
  }
}

module.exports = { recordAudit };
