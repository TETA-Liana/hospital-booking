const router = require('express').Router();
const controller = require('../controllers/patient.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST', 'DOCTOR'), controller.listPatients);
router.post('/', authorize('RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'), controller.createPatientByReceptionist);
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'), controller.getPatient);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST', 'PATIENT'), controller.updatePatient);

module.exports = router;
