const { z } = require('zod');

const availabilitySchema = z.object({
  dayOfWeek: z.enum([
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
}).refine((d) => d.startTime < d.endTime, {
  message: 'startTime must be before endTime',
  path: ['endTime'],
});

const unavailableDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});

module.exports = { availabilitySchema, unavailableDateSchema };
