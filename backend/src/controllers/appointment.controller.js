const prisma = require('../config/db');
const { success, ApiError } = require('../utils/apiResponse');
const { getAvailableSlots } = require('../services/slot.service');
const { isPastDateTime } = require('../utils/time');
const { notify } = require('../services/notification.service');
const { recordAudit } = require('../services/auditLog.service');

const appointmentInclude = {
  patient: { include: { user: { select: { email: true } } } },
  doctor: { include: { department: true, user: { select: { email: true } } } },
  department: true,
};

// Resolve the calling patient's Patient.id, or throw if the user is not a patient.
async function resolvePatientId(req, explicitPatientId) {
  if (['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    if (!explicitPatientId) throw new ApiError(422, 'patientId is required');
    return explicitPatientId;
  }
  const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
  if (!patient) throw new ApiError(403, 'Only patients can book appointments for themselves');
  return patient.id;
}

// POST /api/appointments
// Business rules enforced here:
//  - Rule 1: slot must currently be available (re-checked here, not just trusted from GET /slots)
//  - Rule 2/double-booking: unique DB constraint on (doctorId, appointmentDate, startTime) is the
//    final backstop even under race conditions; we also pre-check for a friendly error message.
//  - Rule 3: cannot book in the past
//  - Rule 11: deactivated doctors cannot receive new appointments
async function createAppointment(req, res) {
  const { patientId: bodyPatientId, doctorId, appointmentDate, startTime, reason } = req.body;

  const patientId = await resolvePatientId(req, bodyPatientId);

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  if (!doctor.isActive) throw new ApiError(422, 'This doctor is not currently accepting appointments');

  if (isPastDateTime(appointmentDate, startTime)) {
    throw new ApiError(422, 'Cannot book an appointment in the past');
  }

  const slots = await getAvailableSlots(doctorId, appointmentDate);
  const matchedSlot = slots.find((s) => s.start === startTime);
  if (!matchedSlot) {
    throw new ApiError(409, 'This slot is no longer available. Please choose another time.');
  }

  let appointment;
  try {
    appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        departmentId: doctor.departmentId,
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime: matchedSlot.end,
        reason,
        status: 'PENDING',
        createdByUserId: req.user.id,
      },
      include: appointmentInclude,
    });
  } catch (err) {
    // P2002 = unique constraint violation -> someone else grabbed this slot first
    if (err.code === 'P2002') {
      throw new ApiError(409, 'This slot was just booked by someone else. Please choose another time.');
    }
    throw err;
  }

  // Notify patient
  const patientUser = await prisma.patient.findUnique({ where: { id: patientId }, include: { user: true } });
  await notify({
    userId: patientUser.userId,
    userEmail: patientUser.user.email,
    type: 'APPOINTMENT_BOOKED',
    appointment: { id: appointment.id, appointmentDate, startTime },
  });
  // Notify doctor
  await notify({
    userId: doctor.userId,
    type: 'APPOINTMENT_BOOKED',
    appointment: { id: appointment.id, appointmentDate, startTime },
    customTitle: 'New appointment request',
    customMessage: `A new appointment request was submitted for ${appointmentDate} at ${startTime}.`,
  });

  await recordAudit({
    userId: req.user.id,
    action: 'APPOINTMENT_CREATED',
    entityType: 'Appointment',
    entityId: appointment.id,
  });

  return success(res, 201, 'Appointment request submitted', appointment);
}

// GET /api/appointments  (scoped by role)
async function listAppointments(req, res) {
  const { status, doctorId, patientId, departmentId, date, from, to, page = '1', pageSize = '20' } = req.query;
  const where = {};

  if (req.user.role === 'PATIENT') {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    where.patientId = patient.id;
  } else if (req.user.role === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    where.doctorId = doctor.id;
  } else {
    // admin/receptionist/super_admin can filter across everyone
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
  }

  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;
  if (date) where.appointmentDate = new Date(date);
  if (from || to) {
    where.appointmentDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const take = Math.min(parseInt(pageSize, 10) || 20, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'asc' }],
      skip,
      take,
    }),
    prisma.appointment.count({ where }),
  ]);

  return success(res, 200, 'Appointments fetched', appointments, {
    total,
    page: Number(page),
    pageSize: take,
    totalPages: Math.ceil(total / take),
  });
}

// GET /api/appointments/:id
async function getAppointment(req, res) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: appointmentInclude,
  });
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  await assertCanAccessAppointment(req, appointment);

  return success(res, 200, 'Appointment fetched', appointment);
}

// Rule 8/9: patients only see their own; doctors only see their own
async function assertCanAccessAppointment(req, appointment) {
  if (['ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'].includes(req.user.role)) return;

  if (req.user.role === 'PATIENT') {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient || patient.id !== appointment.patientId) {
      throw new ApiError(403, 'You can only access your own appointments');
    }
  } else if (req.user.role === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor || doctor.id !== appointment.doctorId) {
      throw new ApiError(403, 'You can only access appointments assigned to you');
    }
  }
}

// PUT /api/appointments/:id/status  (doctor confirms/rejects/completes; admin/receptionist can too)
async function updateStatus(req, res) {
  const { status, cancelReason, doctorNotes } = req.body;
  const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id }, include: appointmentInclude });
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  await assertCanAccessAppointment(req, appointment);

  if (req.user.role === 'DOCTOR' && !['CONFIRMED', 'REJECTED', 'COMPLETED', 'NO_SHOW'].includes(status)) {
    throw new ApiError(403, 'Doctors cannot set this status');
  }

  // Rule 4: cannot cancel a completed appointment
  if (appointment.status === 'COMPLETED' && status === 'CANCELLED') {
    throw new ApiError(422, 'A completed appointment cannot be cancelled');
  }
  if (['CANCELLED', 'REJECTED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
    throw new ApiError(422, `Appointment is already ${appointment.status.toLowerCase()} and cannot be changed`);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status,
      cancelReason: status === 'CANCELLED' || status === 'REJECTED' ? cancelReason : undefined,
      doctorNotes: doctorNotes !== undefined ? doctorNotes : undefined,
    },
    include: appointmentInclude,
  });

  const notifTypeMap = {
    CONFIRMED: 'APPOINTMENT_CONFIRMED',
    REJECTED: 'APPOINTMENT_REJECTED',
    CANCELLED: 'APPOINTMENT_CANCELLED',
    COMPLETED: 'APPOINTMENT_COMPLETED',
  };
  if (notifTypeMap[status]) {
    await notify({
      userId: updated.patient.userId,
      userEmail: updated.patient.user?.email,
      type: notifTypeMap[status],
      appointment: { id: updated.id, appointmentDate: updated.appointmentDate.toISOString().slice(0, 10), startTime: updated.startTime },
    });
  }

  await recordAudit({
    userId: req.user.id,
    action: `APPOINTMENT_${status}`,
    entityType: 'Appointment',
    entityId: updated.id,
  });

  return success(res, 200, 'Appointment status updated', updated);
}

// PUT /api/appointments/:id/reschedule
async function reschedule(req, res) {
  const { appointmentDate, startTime } = req.body;
  const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id }, include: appointmentInclude });
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  await assertCanAccessAppointment(req, appointment);

  if (['CANCELLED', 'REJECTED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
    throw new ApiError(422, `Cannot reschedule an appointment that is ${appointment.status.toLowerCase()}`);
  }
  if (isPastDateTime(appointmentDate, startTime)) {
    throw new ApiError(422, 'Cannot reschedule to a time in the past');
  }

  const slots = await getAvailableSlots(appointment.doctorId, appointmentDate);
  const matchedSlot = slots.find((s) => s.start === startTime);
  if (!matchedSlot) throw new ApiError(409, 'That slot is not available');

  let updated;
  try {
    updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime: matchedSlot.end,
        status: 'PENDING',
      },
      include: appointmentInclude,
    });
  } catch (err) {
    if (err.code === 'P2002') throw new ApiError(409, 'That slot was just booked by someone else');
    throw err;
  }

  await notify({
    userId: updated.patient.userId,
    userEmail: updated.patient.user?.email,
    type: 'APPOINTMENT_RESCHEDULED',
    appointment: { id: updated.id, appointmentDate, startTime },
  });

  await recordAudit({ userId: req.user.id, action: 'APPOINTMENT_RESCHEDULED', entityType: 'Appointment', entityId: updated.id });

  return success(res, 200, 'Appointment rescheduled', updated);
}

// DELETE /api/appointments/:id  (cancel)
async function cancelAppointment(req, res) {
  const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id }, include: appointmentInclude });
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  await assertCanAccessAppointment(req, appointment);

  if (appointment.status === 'COMPLETED') {
    throw new ApiError(422, 'A completed appointment cannot be cancelled');
  }
  if (appointment.status === 'CANCELLED') {
    throw new ApiError(422, 'Appointment is already cancelled');
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: 'CANCELLED', cancelReason: req.body?.cancelReason },
    include: appointmentInclude,
  });

  await notify({
    userId: updated.doctor.userId,
    type: 'APPOINTMENT_CANCELLED',
    appointment: { id: updated.id, appointmentDate: updated.appointmentDate.toISOString().slice(0, 10), startTime: updated.startTime },
  });

  await recordAudit({ userId: req.user.id, action: 'APPOINTMENT_CANCELLED', entityType: 'Appointment', entityId: updated.id });

  return success(res, 200, 'Appointment cancelled', updated);
}

// POST /api/appointments/:id/check-in  (receptionist)
async function checkIn(req, res) {
  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { checkedInAt: new Date() },
    include: appointmentInclude,
  });
  await recordAudit({ userId: req.user.id, action: 'APPOINTMENT_CHECKED_IN', entityType: 'Appointment', entityId: appointment.id });
  return success(res, 200, 'Patient checked in', appointment);
}

module.exports = {
  createAppointment,
  listAppointments,
  getAppointment,
  updateStatus,
  reschedule,
  cancelAppointment,
  checkIn,
};
