const prisma = require('../config/db');
const { hashPassword } = require('../utils/password');
const { success, ApiError } = require('../utils/apiResponse');
const { recordAudit } = require('../services/auditLog.service');
const { notify } = require('../services/notification.service');
const { v4: uuidv4 } = require('uuid');

const doctorInclude = {
  department: true,
  specialties: { include: { specialty: true } },
};

function shapeDoctor(doctor) {
  if (!doctor) return doctor;
  return {
    ...doctor,
    specialties: doctor.specialties?.map((s) => s.specialty) ?? [],
  };
}

// GET /api/doctors  (public: browse/search doctors)
async function listDoctors(req, res) {
  const { search, departmentId, specialtyId, page = '1', pageSize = '12', activeOnly } = req.query;

  const where = {};
  if (activeOnly !== 'false') where.isActive = true;
  if (departmentId) where.departmentId = departmentId;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (specialtyId) {
    where.specialties = { some: { specialtyId } };
  }

  const take = Math.min(parseInt(pageSize, 10) || 12, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: doctorInclude,
      orderBy: { lastName: 'asc' },
      skip,
      take,
    }),
    prisma.doctor.count({ where }),
  ]);

  return success(res, 200, 'Doctors fetched', doctors.map(shapeDoctor), {
    total,
    page: Number(page),
    pageSize: take,
    totalPages: Math.ceil(total / take),
  });
}

// GET /api/doctors/:id
async function getDoctor(req, res) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: req.params.id },
    include: doctorInclude,
  });
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  return success(res, 200, 'Doctor fetched', shapeDoctor(doctor));
}

// POST /api/doctors  (admin only)
async function createDoctor(req, res) {
  const {
    email, password, firstName, lastName, phone, gender, dateOfBirth,
    medicalLicenseNo, departmentId, specialtyIds, yearsOfExperience,
    qualification, biography, consultationFee, roomNumber, appointmentDurationMinutes,
  } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(409, 'A user with this email already exists');

  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) throw new ApiError(422, 'Invalid department');

  // If no password supplied, generate a temporary one and email it (account activation flow).
  const tempPassword = password || uuidv4().slice(0, 12);
  const passwordHash = await hashPassword(tempPassword);

  const doctorData = {
    firstName,
    lastName,
    ...(phone ? { phone } : {}),
    ...(gender ? { gender } : {}),
    ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
    medicalLicenseNo,
    departmentId,
    ...(yearsOfExperience !== undefined ? { yearsOfExperience } : {}),
    ...(qualification ? { qualification } : {}),
    ...(biography ? { biography } : {}),
    ...(consultationFee !== undefined ? { consultationFee } : {}),
    ...(roomNumber ? { roomNumber } : {}),
    ...(appointmentDurationMinutes !== undefined ? { appointmentDurationMinutes } : {}),
    ...(specialtyIds?.length ? { specialties: { create: specialtyIds.map((specialtyId) => ({ specialtyId })) } } : {}),
  };

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
      doctor: { create: doctorData },
    },
    include: { doctor: doctorInclude },
  });

  await notify({
    userId: user.id,
    userEmail: user.email,
    type: 'ACCOUNT_ACTIVATED',
    customTitle: 'Your doctor account has been created',
    customMessage: `Welcome. Your login email is ${email} and your temporary password is ${tempPassword}. Please change it after logging in.`,
  });

  await recordAudit({
    userId: req.user.id,
    action: 'DOCTOR_CREATED',
    entityType: 'Doctor',
    entityId: user.doctor.id,
    details: { email },
  });

  return success(res, 201, 'Doctor created', shapeDoctor(user.doctor));
}

// PUT /api/doctors/:id  (admin, or doctor updating own profile)
async function updateDoctor(req, res) {
  const { id } = req.params;
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  if (req.user.role === 'DOCTOR' && doctor.userId !== req.user.id) {
    throw new ApiError(403, 'You can only update your own profile');
  }

  const { specialtyIds, ...rest } = req.body;
  if (rest.dateOfBirth) rest.dateOfBirth = new Date(rest.dateOfBirth);

  const updated = await prisma.$transaction(async (tx) => {
    if (specialtyIds) {
      await tx.doctorSpecialty.deleteMany({ where: { doctorId: id } });
      if (specialtyIds.length) {
        await tx.doctorSpecialty.createMany({
          data: specialtyIds.map((specialtyId) => ({ doctorId: id, specialtyId })),
        });
      }
    }
    return tx.doctor.update({ where: { id }, data: rest, include: doctorInclude });
  });

  await recordAudit({ userId: req.user.id, action: 'DOCTOR_UPDATED', entityType: 'Doctor', entityId: id });

  return success(res, 200, 'Doctor updated', shapeDoctor(updated));
}

// PATCH /api/doctors/:id/status  (admin: activate/deactivate)
async function setDoctorStatus(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;

  const doctor = await prisma.doctor.update({ where: { id }, data: { isActive: !!isActive } });
  await recordAudit({
    userId: req.user.id,
    action: isActive ? 'DOCTOR_ACTIVATED' : 'DOCTOR_DEACTIVATED',
    entityType: 'Doctor',
    entityId: id,
  });

  return success(res, 200, 'Doctor status updated', doctor);
}

// DELETE /api/doctors/:id  (admin only)
async function deleteDoctor(req, res) {
  const { id } = req.params;
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  await prisma.user.delete({ where: { id: doctor.userId } }); // cascades to doctor

  await recordAudit({ userId: req.user.id, action: 'DOCTOR_DELETED', entityType: 'Doctor', entityId: id });

  return success(res, 200, 'Doctor deleted');
}

module.exports = {
  listDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  setDoctorStatus,
  deleteDoctor,
};
