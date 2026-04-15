const prisma = require('../config/db');
const { sendEmail } = require('./email.service');

const TEMPLATES = {
  APPOINTMENT_BOOKED: (a) => ({
    title: 'Appointment requested',
    message: `Your appointment request for ${a.appointmentDate} at ${a.startTime} has been submitted and is pending confirmation.`,
  }),
  APPOINTMENT_CONFIRMED: (a) => ({
    title: 'Appointment confirmed',
    message: `Your appointment on ${a.appointmentDate} at ${a.startTime} has been confirmed.`,
  }),
  APPOINTMENT_REJECTED: (a) => ({
    title: 'Appointment rejected',
    message: `Your appointment request for ${a.appointmentDate} at ${a.startTime} was rejected.`,
  }),
  APPOINTMENT_CANCELLED: (a) => ({
    title: 'Appointment cancelled',
    message: `The appointment on ${a.appointmentDate} at ${a.startTime} has been cancelled.`,
  }),
  APPOINTMENT_RESCHEDULED: (a) => ({
    title: 'Appointment rescheduled',
    message: `Your appointment has been rescheduled to ${a.appointmentDate} at ${a.startTime}.`,
  }),
  APPOINTMENT_REMINDER: (a) => ({
    title: 'Upcoming appointment reminder',
    message: `Reminder: you have an appointment on ${a.appointmentDate} at ${a.startTime}.`,
  }),
  APPOINTMENT_COMPLETED: (a) => ({
    title: 'Appointment completed',
    message: `Your appointment on ${a.appointmentDate} has been marked as completed.`,
  }),
  ACCOUNT_ACTIVATED: () => ({
    title: 'Account activated',
    message: 'Your account has been activated. You can now log in.',
  }),
};

// Creates an in-app notification and (best-effort) sends an email.
// `type` must match a NotificationType enum value.
async function notify({ userId, userEmail, type, appointment, customTitle, customMessage }) {
  const template = TEMPLATES[type];
  const generated = template && appointment ? template(appointment) : {};
  const title = customTitle || generated.title || 'Notification';
  const message = customMessage || generated.message || '';

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      appointmentId: appointment?.id,
    },
  });

  if (userEmail) {
    sendEmail({ to: userEmail, subject: title, html: `<p>${message}</p>` }).catch((err) =>
      console.error('Email send failed:', err.message)
    );
  }

  return notification;
}

module.exports = { notify };
