const prisma = require('../config/db');
const { success, ApiError } = require('../utils/apiResponse');
const { getAvailableSlots: computeSlots } = require('../services/slot.service');
const { recordAudit } = require('../services/auditLog.service');

async function assertOwnerOrAdmin(req, doctorId) {
  if (['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) return;
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor || doctor.userId !== req.user.id) {
    throw new ApiError(403, 'You can only manage your own availability');
  }
}

// GET /api/doctors/:id/availability
async function getWeeklyAvailability(req, res) {
  const availabilities = await prisma.doctorAvailability.findMany({
    where: { doctorId: req.params.id, isActive: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
  const unavailableDates = await prisma.doctorUnavailableDate.findMany({
    where: { doctorId: req.params.id, date: { gte: new Date() } },
    orderBy: { date: 'asc' },
  });
  return success(res, 200, 'Availability fetched', { availabilities, unavailableDates });
}

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
async function getAvailableSlots(req, res) {
  const { date } = req.query;
  if (!date) throw new ApiError(400, 'date query parameter is required (YYYY-MM-DD)');
  const slots = await computeSlots(req.params.id, date);
  return success(res, 200, 'Slots fetched', slots);
}

// POST /api/doctors/:id/availability
async function addAvailability(req, res) {
  await assertOwnerOrAdmin(req, req.params.id);
  const availability = await prisma.doctorAvailability.create({
    data: { doctorId: req.params.id, ...req.body },
  });
  await recordAudit({ userId: req.user.id, action: 'AVAILABILITY_ADDED', entityType: 'DoctorAvailability', entityId: availability.id });
  return success(res, 201, 'Availability added', availability);
}

// PUT /api/doctors/availability/:availabilityId
async function updateAvailability(req, res) {
  const existing = await prisma.doctorAvailability.findUnique({ where: { id: req.params.availabilityId } });
  if (!existing) throw new ApiError(404, 'Availability not found');
  await assertOwnerOrAdmin(req, existing.doctorId);

  const updated = await prisma.doctorAvailability.update({
    where: { id: req.params.availabilityId },
    data: req.body,
  });
  await recordAudit({ userId: req.user.id, action: 'AVAILABILITY_UPDATED', entityType: 'DoctorAvailability', entityId: updated.id });
  return success(res, 200, 'Availability updated', updated);
}

// DELETE /api/doctors/availability/:availabilityId
async function deleteAvailability(req, res) {
  const existing = await prisma.doctorAvailability.findUnique({ where: { id: req.params.availabilityId } });
  if (!existing) throw new ApiError(404, 'Availability not found');
  await assertOwnerOrAdmin(req, existing.doctorId);

  await prisma.doctorAvailability.delete({ where: { id: req.params.availabilityId } });
  await recordAudit({ userId: req.user.id, action: 'AVAILABILITY_DELETED', entityType: 'DoctorAvailability', entityId: req.params.availabilityId });
  return success(res, 200, 'Availability deleted');
}

// POST /api/doctors/:id/unavailable-dates
async function addUnavailableDate(req, res) {
  await assertOwnerOrAdmin(req, req.params.id);
  const record = await prisma.doctorUnavailableDate.create({
    data: {
      doctorId: req.params.id,
      date: new Date(req.body.date),
      reason: req.body.reason,
    },
  });
  return success(res, 201, 'Unavailable date added', record);
}

// DELETE /api/doctors/unavailable-dates/:dateId
async function deleteUnavailableDate(req, res) {
  const existing = await prisma.doctorUnavailableDate.findUnique({ where: { id: req.params.dateId } });
  if (!existing) throw new ApiError(404, 'Record not found');
  await assertOwnerOrAdmin(req, existing.doctorId);
  await prisma.doctorUnavailableDate.delete({ where: { id: req.params.dateId } });
  return success(res, 200, 'Unavailable date removed');
}

module.exports = {
  getWeeklyAvailability,
  getAvailableSlots,
  addAvailability,
  updateAvailability,
  deleteAvailability,
  addUnavailableDate,
  deleteUnavailableDate,
};
