const { z } = require('zod');

const departmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const specialtySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

module.exports = { departmentSchema, specialtySchema };
