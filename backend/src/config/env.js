require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  jwt: {
    secret: required('JWT_SECRET', 'dev_secret_change_me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || 'Hospital Booking <no-reply@example.com>',
  },

  seedAdmin: {
    email: process.env.SEED_ADMIN_EMAIL || 'admin@hospital.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
  },

  defaultAppointmentDurationMinutes: parseInt(
    process.env.DEFAULT_APPOINTMENT_DURATION_MINUTES || '30',
    10
  ),
};
