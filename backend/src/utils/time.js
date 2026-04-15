// Time-slot helpers. All appointment times are stored as "HH:mm" strings
// alongside a plain DATE (no time component) for appointmentDate, and the
// system treats every stored time as the hospital's local (facility) timezone.
// This avoids DST/timezone ambiguity: the frontend always displays and submits
// times as the hospital's local wall-clock time.

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(minutes) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Generate consecutive slots of `durationMinutes` between start and end (exclusive of end overflow).
function generateSlots(startTime, endTime, durationMinutes) {
  const slots = [];
  let cursor = toMinutes(startTime);
  const end = toMinutes(endTime);
  while (cursor + durationMinutes <= end) {
    slots.push({ start: toHHMM(cursor), end: toHHMM(cursor + durationMinutes) });
    cursor += durationMinutes;
  }
  return slots;
}

function isPastDateTime(dateStr, timeStr) {
  const now = new Date();
  const candidate = new Date(`${dateStr}T${timeStr}:00`);
  return candidate.getTime() < now.getTime();
}

function dayOfWeekFromDate(dateStr) {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const d = new Date(`${dateStr}T00:00:00`);
  return days[d.getUTCDay()];
}

module.exports = { toMinutes, toHHMM, generateSlots, isPastDateTime, dayOfWeekFromDate };
