const router = require('express').Router();
const controller = require('../controllers/appointment.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
} = require('../validators/appointment.validator');

router.use(authenticate);

router.get('/', controller.listAppointments);
router.get('/:id', controller.getAppointment);
router.post(
  '/',
  authorize('PATIENT', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'),
  validate(createAppointmentSchema),
  controller.createAppointment
);
router.put(
  '/:id/status',
  authorize('DOCTOR', 'ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'),
  validate(updateAppointmentStatusSchema),
  controller.updateStatus
);
router.put(
  '/:id/reschedule',
  authorize('PATIENT', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'),
  validate(rescheduleAppointmentSchema),
  controller.reschedule
);
router.delete('/:id', authorize('PATIENT', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'), controller.cancelAppointment);
router.post('/:id/check-in', authorize('RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'), controller.checkIn);

module.exports = router;
