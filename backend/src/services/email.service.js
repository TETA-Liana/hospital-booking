const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;
function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    });
  }
  return transporter;
}

// Sends an email if SMTP is configured; otherwise logs to console so that
// local development / demo environments still work without real SMTP creds.
async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email:dev-mode] To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }
  await t.sendMail({ from: env.smtp.from, to, subject, html });
}

module.exports = { sendEmail };
