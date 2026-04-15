const router = require('express').Router();
const controller = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', controller.listNotifications);
router.put('/read-all', controller.markAllRead);
router.put('/:id/read', controller.markRead);

module.exports = router;
