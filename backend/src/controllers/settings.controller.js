const prisma = require('../config/db');
const { success } = require('../utils/apiResponse');
const { recordAudit } = require('../services/auditLog.service');

// GET /api/admin/settings
async function listSettings(req, res) {
  const settings = await prisma.systemSetting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return success(res, 200, 'Settings fetched', map);
}

// PUT /api/admin/settings   body: { [key]: value, ... }
async function updateSettings(req, res) {
  const entries = Object.entries(req.body);
  await Promise.all(
    entries.map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );
  await recordAudit({ userId: req.user.id, action: 'SETTINGS_UPDATED', entityType: 'SystemSetting', details: req.body });
  return success(res, 200, 'Settings updated');
}

module.exports = { listSettings, updateSettings };
