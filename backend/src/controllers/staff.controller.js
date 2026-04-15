const prisma = require('../config/db');
const { hashPassword } = require('../utils/password');
const { success, ApiError } = require('../utils/apiResponse');
const { recordAudit } = require('../services/auditLog.service');
const { notify } = require('../services/notification.service');

// GET /api/staff  (admin only) - lists RECEPTIONIST, ADMIN, SUPER_ADMIN staff
async function listStaff(req, res) {
  const { role, page = '1', pageSize = '20' } = req.query;
  const userWhere = { role: { in: ['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'] } };
  if (role) userWhere.role = role;

  const take = Math.min(parseInt(pageSize, 10) || 20, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      include: { staff: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where: userWhere }),
  ]);

  const sanitized = users.map(({ passwordHash, ...rest }) => rest);
  return success(res, 200, 'Staff fetched', sanitized, {
    total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take),
  });
}

// POST /api/staff  (super_admin creates admins; admin creates receptionists)
async function createStaff(req, res) {
  const { email, password, firstName, lastName, phone, jobTitle, role } = req.body;

  if (role === 'SUPER_ADMIN' || (role === 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    throw new ApiError(403, 'Only a super admin can create administrator accounts');
  }
  if (!['ADMIN', 'RECEPTIONIST'].includes(role)) {
    throw new ApiError(422, 'role must be ADMIN or RECEPTIONIST');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'A user with this email already exists');

  const tempPassword = password || Math.random().toString(36).slice(-10);
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      status: 'ACTIVE',
      staff: { create: { firstName, lastName, phone, jobTitle } },
    },
    include: { staff: true },
  });

  await notify({
    userId: user.id,
    userEmail: user.email,
    type: 'ACCOUNT_ACTIVATED',
    customTitle: 'Your staff account has been created',
    customMessage: `Login email: ${email}, temporary password: ${tempPassword}.`,
  });

  await recordAudit({ userId: req.user.id, action: 'STAFF_CREATED', entityType: 'User', entityId: user.id, details: { role } });

  const { passwordHash: _, ...safeUser } = user;
  return success(res, 201, 'Staff account created', safeUser);
}

// PUT /api/staff/:userId
async function updateStaff(req, res) {
  const { firstName, lastName, phone, jobTitle } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.params.userId }, include: { staff: true } });
  if (!user || !user.staff) throw new ApiError(404, 'Staff member not found');

  const staff = await prisma.staff.update({
    where: { userId: req.params.userId },
    data: { firstName, lastName, phone, jobTitle },
  });

  await recordAudit({ userId: req.user.id, action: 'STAFF_UPDATED', entityType: 'Staff', entityId: staff.id });
  return success(res, 200, 'Staff updated', staff);
}

// PATCH /api/staff/:userId/status
async function setStaffStatus(req, res) {
  const { status } = req.body;
  if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
    throw new ApiError(422, 'Invalid status');
  }
  const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!target) throw new ApiError(404, 'Staff member not found');
  if (target.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    throw new ApiError(403, 'Only a super admin can modify another super admin');
  }

  const user = await prisma.user.update({ where: { id: req.params.userId }, data: { status } });
  await recordAudit({ userId: req.user.id, action: 'STAFF_STATUS_CHANGED', entityType: 'User', entityId: user.id, details: { status } });
  const { passwordHash, ...safe } = user;
  return success(res, 200, 'Staff status updated', safe);
}

// DELETE /api/staff/:userId
async function deleteStaff(req, res) {
  const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!target) throw new ApiError(404, 'Staff member not found');
  if (target.role === 'SUPER_ADMIN') throw new ApiError(403, 'Cannot delete a super admin account');

  await prisma.user.delete({ where: { id: req.params.userId } });
  await recordAudit({ userId: req.user.id, action: 'STAFF_DELETED', entityType: 'User', entityId: req.params.userId });
  return success(res, 200, 'Staff deleted');
}

module.exports = { listStaff, createStaff, updateStaff, setStaffStatus, deleteStaff };
