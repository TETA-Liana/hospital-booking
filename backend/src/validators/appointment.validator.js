const { z } = require('zod');

const createAppointmentSchema = z.object({
  patientId: z.string().uuid().optional(), // optional: receptionist/admin creating on behalf of a patient
  doctorId: z.string().uuid(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Expected HH:mm'),
  reason: z.string().min(1),
});

const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const updateAppointmentStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  cancelReason: z.string().optional(),
  doctorNotes: z.string().optional(),
});

module.exports = {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
};
