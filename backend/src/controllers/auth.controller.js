const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { success, failure, ApiError } = require('../utils/apiResponse');
const { recordAudit } = require('../services/auditLog.service');
const { notify } = require('../services/notification.service');
const { sendEmail } = require('../services/email.service');
const env = require('../config/env');

function issueTokens(user) {
  const payload = { sub: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
}

async function storeRefreshToken(userId, token) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
}

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// POST /api/auth/register  (patients self-register)
async function register(req, res) {
  const { email, password, firstName, lastName, phone, dateOfBirth, gender } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      patient: {
        create: {
          firstName,
          lastName,
          phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
        },
      },
    },
    include: { patient: true },
  });

  const tokens = issueTokens(user);
  await storeRefreshToken(user.id, tokens.refreshToken);
  await recordAudit({ userId: user.id, action: 'PATIENT_REGISTERED', entityType: 'User', entityId: user.id });

  return success(res, 201, 'Registration successful', {
    user: sanitizeUser(user),
    ...tokens,
  });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { patient: true, doctor: true, staff: true },
  });
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const validPassword = await verifyPassword(user.passwordHash, password);
  if (!validPassword) throw new ApiError(401, 'Invalid email or password');

  if (user.status === 'PENDING_APPROVAL') {
    throw new ApiError(403, 'Your account is pending approval');
  }
  if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
    throw new ApiError(403, 'Your account is not active. Please contact the hospital administrator.');
  }

  const tokens = issueTokens(user);
  await storeRefreshToken(user.id, tokens.refreshToken);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await recordAudit({ userId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id });

  return success(res, 200, 'Login successful', {
    user: sanitizeUser(user),
    ...tokens,
  });
}

// POST /api/auth/refresh
async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'Refresh token required');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token is no longer valid');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new ApiError(401, 'User no longer exists');

  const tokens = issueTokens(user);
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  await storeRefreshToken(user.id, tokens.refreshToken);

  return success(res, 200, 'Token refreshed', tokens);
}

// POST /api/auth/logout
async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revoked: true } });
  }
  return success(res, 200, 'Logged out successfully');
}

// GET /api/auth/me
async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      patient: true,
      doctor: { include: { department: true, specialties: { include: { specialty: true } } } },
      staff: true,
    },
  });
  return success(res, 200, 'Current user', sanitizeUser(user));
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond success to avoid leaking which emails are registered.
  if (!user) return success(res, 200, 'If that email exists, a reset link has been sent');

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

  const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
  });

  return success(res, 200, 'If that email exists, a reset link has been sent');
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  const { token, password } = req.body;

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    throw new ApiError(400, 'Reset link is invalid or has expired');
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } }),
    prisma.refreshToken.updateMany({ where: { userId: resetToken.userId }, data: { revoked: true } }),
  ]);

  await recordAudit({ userId: resetToken.userId, action: 'PASSWORD_RESET', entityType: 'User', entityId: resetToken.userId });

  return success(res, 200, 'Password has been reset. Please log in with your new password.');
}

// POST /api/auth/change-password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const valid = await verifyPassword(user.passwordHash, currentPassword);
  if (!valid) throw new ApiError(400, 'Current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await recordAudit({ userId: user.id, action: 'PASSWORD_CHANGED', entityType: 'User', entityId: user.id });

  return success(res, 200, 'Password changed successfully');
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
};
