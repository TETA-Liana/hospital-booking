const router = require('express').Router();
const controller = require('../controllers/admin.controller');
const auditController = require('../controllers/auditLog.controller');
const settingsController = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', controller.getDashboard);
router.get('/reports', controller.getReports);
router.get('/audit-logs', auditController.listAuditLogs);
router.get('/settings', settingsController.listSettings);
router.put('/settings', settingsController.updateSettings);

module.exports = router;
