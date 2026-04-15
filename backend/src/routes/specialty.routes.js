const router = require('express').Router();
const controller = require('../controllers/specialty.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { specialtySchema } = require('../validators/department.validator');

router.get('/', controller.listSpecialties);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(specialtySchema), controller.createSpecialty);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(specialtySchema), controller.updateSpecialty);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.deleteSpecialty);

module.exports = router;
