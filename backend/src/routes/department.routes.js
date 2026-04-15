const router = require('express').Router();
const controller = require('../controllers/department.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { departmentSchema } = require('../validators/department.validator');

router.get('/', controller.listDepartments);
router.get('/:id', controller.getDepartment);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(departmentSchema), controller.createDepartment);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(departmentSchema), controller.updateDepartment);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.deleteDepartment);

module.exports = router;
