const prisma = require('../config/db');
const { success, ApiError } = require('../utils/apiResponse');
const { recordAudit } = require('../services/auditLog.service');

async function listSpecialties(req, res) {
  const specialties = await prisma.specialty.findMany({ orderBy: { name: 'asc' } });
  return success(res, 200, 'Specialties fetched', specialties);
}

async function createSpecialty(req, res) {
  const specialty = await prisma.specialty.create({ data: req.body });
  await recordAudit({ userId: req.user.id, action: 'SPECIALTY_CREATED', entityType: 'Specialty', entityId: specialty.id });
  return success(res, 201, 'Specialty created', specialty);
}

async function updateSpecialty(req, res) {
  const specialty = await prisma.specialty.update({ where: { id: req.params.id }, data: req.body });
  await recordAudit({ userId: req.user.id, action: 'SPECIALTY_UPDATED', entityType: 'Specialty', entityId: specialty.id });
  return success(res, 200, 'Specialty updated', specialty);
}

async function deleteSpecialty(req, res) {
  await prisma.specialty.delete({ where: { id: req.params.id } });
  await recordAudit({ userId: req.user.id, action: 'SPECIALTY_DELETED', entityType: 'Specialty', entityId: req.params.id });
  return success(res, 200, 'Specialty deleted');
}

module.exports = { listSpecialties, createSpecialty, updateSpecialty, deleteSpecialty };
