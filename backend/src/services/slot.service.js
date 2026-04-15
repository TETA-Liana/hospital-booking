const prisma = require('../config/db');
const { generateSlots, dayOfWeekFromDate } = require('../utils/time');

// Computes the list of bookable time slots for a doctor on a given date,
// factoring in: weekly recurring availability, one-off unavailable dates,
// holidays, and appointments that already occupy a slot.
async function getAvailableSlots(doctorId, dateStr) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor || !doctor.isActive) return [];

  // Holiday check
  const holiday = await prisma.holiday.findFirst({ where: { date: new Date(dateStr) } });
  if (holiday) return [];

  // Doctor-specific unavailable date check
  const unavailable = await prisma.doctorUnavailableDate.findFirst({
    where: { doctorId, date: new Date(dateStr) },
  });
  if (unavailable) return [];

  const dow = dayOfWeekFromDate(dateStr);
  const availabilities = await prisma.doctorAvailability.findMany({
    where: { doctorId, dayOfWeek: dow, isActive: true },
  });
  if (availabilities.length === 0) return [];

  let candidateSlots = [];
  for (const window of availabilities) {
    candidateSlots = candidateSlots.concat(
      generateSlots(window.startTime, window.endTime, doctor.appointmentDurationMinutes)
    );
  }

  // Remove slots already booked (any status that occupies the slot:
  // PENDING, CONFIRMED count as occupied; REJECTED/CANCELLED free it up)
  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: new Date(dateStr),
      status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
    },
    select: { startTime: true },
  });
  const bookedTimes = new Set(bookedAppointments.map((a) => a.startTime));

  // Remove past slots if the date is today
  const now = new Date();
  const isToday = dateStr === now.toISOString().slice(0, 10);

  return candidateSlots
    .filter((s) => !bookedTimes.has(s.start))
    .filter((s) => {
      if (!isToday) return true;
      const [h, m] = s.start.split(':').map(Number);
      const slotDate = new Date();
      slotDate.setHours(h, m, 0, 0);
      return slotDate.getTime() > now.getTime();
    });
}

module.exports = { getAvailableSlots };
