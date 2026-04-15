const prisma = require('../config/db');
const { hashPassword } = require('../utils/password');
const { success, ApiError } = require('../utils/apiResponse');
const { recordAudit } = require('../services/auditLog.service');
const { notify } = require('../services/notification.service');

// GET /api/patients  (admin, receptionist, doctor-with-appointment context)
async function listPatients(req, res) {
  const { search, page = '1', pageSize = '20' } = req.query;
  const where = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const take = Math.min(parseInt(pageSize, 10) || 20, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: { user: { select: { email: true, status: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.patient.count({ where }),
  ]);

  return success(res, 200, 'Patients fetched', patients, {
    total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take),
  });
}

// GET /api/patients/:id
async function getPatient(req, res) {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { email: true, status: true } } },
  });
  if (!patient) throw new ApiError(404, 'Patient not found');

  if (req.user.role === 'PATIENT' && patient.userId !== req.user.id) {
    throw new ApiError(403, 'You can only view your own profile');
  }

  return success(res, 200, 'Patient fetched', patient);
}

// PUT /api/patients/:id
async function updatePatient(req, res) {
  const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
  if (!patient) throw new ApiError(404, 'Patient not found');

  if (req.user.role === 'PATIENT' && patient.userId !== req.user.id) {
    throw new ApiError(403, 'You can only update your own profile');
  }

  const data = { ...req.body };
  if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);

  const updated = await prisma.patient.update({ where: { id: req.params.id }, data });
  return success(res, 200, 'Patient updated', updated);
}

// POST /api/patients  (receptionist registers a patient on behalf of the hospital)
async function createPatientByReceptionist(req, res) {
  const { email, password, firstName, lastName, phone, dateOfBirth, gender, address, emergencyContactName, emergencyContactPhone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'A user with this email already exists');

  const tempPassword = password || Math.random().toString(36).slice(-10);
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      patient: {
        create: {
          firstName, lastName, phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender, address, emergencyContactName, emergencyContactPhone,
        },
      },
    },
    include: { patient: true },
  });

  await notify({
    userId: user.id,
    userEmail: user.email,
    type: 'ACCOUNT_ACTIVATED',
    customTitle: 'Your patient account has been created',
    customMessage: `An account was created for you at the hospital. Login email: ${email}, temporary password: ${tempPassword}.`,
  });

  await recordAudit({ userId: req.user.id, action: 'PATIENT_REGISTERED_BY_STAFF', entityType: 'Patient', entityId: user.patient.id });

  return success(res, 201, 'Patient registered', user.patient);
}

module.exports = { listPatients, getPatient, updatePatient, createPatientByReceptionist };
