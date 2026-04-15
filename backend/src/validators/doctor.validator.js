const { z } = require('zod');

const createDoctorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  dateOfBirth: z.string().optional(),
  medicalLicenseNo: z.string().min(1),
  departmentId: z.string().uuid(),
  specialtyIds: z.array(z.string().uuid()).optional().default([]),
  yearsOfExperience: z.number().int().min(0).optional(),
  qualification: z.string().optional(),
  biography: z.string().optional(),
  consultationFee: z.number().min(0).optional(),
  roomNumber: z.string().optional(),
  appointmentDurationMinutes: z.number().int().min(5).max(240).optional(),
});

const updateDoctorSchema = createDoctorSchema.partial().omit({ password: true });

module.exports = { createDoctorSchema, updateDoctorSchema };
