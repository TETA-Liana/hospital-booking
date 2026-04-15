const router = require('express').Router();
const controller = require('../controllers/staff.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', controller.listStaff);
router.post('/', controller.createStaff);
router.put('/:userId', controller.updateStaff);
router.patch('/:userId/status', controller.setStaffStatus);
router.delete('/:userId', controller.deleteStaff);

module.exports = router;
