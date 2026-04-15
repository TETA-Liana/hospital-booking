const prisma = require('../config/db');
const { success, ApiError } = require('../utils/apiResponse');
const { recordAudit } = require('../services/auditLog.service');

async function listDepartments(req, res) {
  const { activeOnly } = req.query;
  const where = activeOnly === 'false' ? {} : { isActive: true };
  const departments = await prisma.department.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { _count: { select: { doctors: true } } },
  });
  return success(res, 200, 'Departments fetched', departments);
}

async function getDepartment(req, res) {
  const department = await prisma.department.findUnique({
    where: { id: req.params.id },
    include: { doctors: { where: { isActive: true } } },
  });
  if (!department) throw new ApiError(404, 'Department not found');
  return success(res, 200, 'Department fetched', department);
}

async function createDepartment(req, res) {
  const department = await prisma.department.create({ data: req.body });
  await recordAudit({ userId: req.user.id, action: 'DEPARTMENT_CREATED', entityType: 'Department', entityId: department.id });
  return success(res, 201, 'Department created', department);
}

async function updateDepartment(req, res) {
  const department = await prisma.department.update({ where: { id: req.params.id }, data: req.body });
  await recordAudit({ userId: req.user.id, action: 'DEPARTMENT_UPDATED', entityType: 'Department', entityId: department.id });
  return success(res, 200, 'Department updated', department);
}

async function deleteDepartment(req, res) {
  const doctorCount = await prisma.doctor.count({ where: { departmentId: req.params.id } });
  if (doctorCount > 0) {
    // Soft-deactivate instead of hard delete if doctors are attached
    const department = await prisma.department.update({ where: { id: req.params.id }, data: { isActive: false } });
    await recordAudit({ userId: req.user.id, action: 'DEPARTMENT_DEACTIVATED', entityType: 'Department', entityId: department.id });
    return success(res, 200, 'Department has doctors assigned, so it was deactivated instead of deleted', department);
  }
  await prisma.department.delete({ where: { id: req.params.id } });
  await recordAudit({ userId: req.user.id, action: 'DEPARTMENT_DELETED', entityType: 'Department', entityId: req.params.id });
  return success(res, 200, 'Department deleted');
}

module.exports = { listDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
