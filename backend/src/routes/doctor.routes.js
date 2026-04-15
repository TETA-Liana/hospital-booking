const router = require('express').Router();
const controller = require('../controllers/doctor.controller');
const availabilityController = require('../controllers/availability.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { createDoctorSchema, updateDoctorSchema } = require('../validators/doctor.validator');
const { availabilitySchema, unavailableDateSchema } = require('../validators/availability.validator');

// Public: browse doctors
router.get('/', controller.listDoctors);
router.get('/:id', controller.getDoctor);
router.get('/:id/availability', availabilityController.getWeeklyAvailability);
router.get('/:id/slots', availabilityController.getAvailableSlots);

// Admin only: create/delete
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate(createDoctorSchema), controller.createDoctor);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.deleteDoctor);
router.patch('/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), controller.setDoctorStatus);

// Admin or the doctor themself
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'DOCTOR'), validate(updateDoctorSchema), controller.updateDoctor);

// Doctor manages their own weekly availability + unavailable dates
router.post(
  '/:id/availability',
  authenticate,
  authorize('DOCTOR', 'ADMIN', 'SUPER_ADMIN'),
  validate(availabilitySchema),
  availabilityController.addAvailability
);
router.put(
  '/availability/:availabilityId',
  authenticate,
  authorize('DOCTOR', 'ADMIN', 'SUPER_ADMIN'),
  validate(availabilitySchema),
  availabilityController.updateAvailability
);
router.delete(
  '/availability/:availabilityId',
  authenticate,
  authorize('DOCTOR', 'ADMIN', 'SUPER_ADMIN'),
  availabilityController.deleteAvailability
);
router.post(
  '/:id/unavailable-dates',
  authenticate,
  authorize('DOCTOR', 'ADMIN', 'SUPER_ADMIN'),
  validate(unavailableDateSchema),
  availabilityController.addUnavailableDate
);
router.delete(
  '/unavailable-dates/:dateId',
  authenticate,
  authorize('DOCTOR', 'ADMIN', 'SUPER_ADMIN'),
  availabilityController.deleteUnavailableDate
);

module.exports = router;
