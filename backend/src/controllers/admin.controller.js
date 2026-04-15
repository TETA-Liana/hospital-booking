const prisma = require('../config/db');
const { success } = require('../utils/apiResponse');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// GET /api/admin/dashboard
async function getDashboard(req, res) {
  const [
    totalPatients,
    totalDoctors,
    totalStaff,
    totalAppointments,
    todaysAppointments,
    pendingAppointments,
    completedAppointments,
    cancelledAppointments,
    totalDepartments,
    recentPatients,
    recentAppointments,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count(),
    prisma.user.count({ where: { role: { in: ['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'] } } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { appointmentDate: { gte: startOfToday(), lte: endOfToday() } } }),
    prisma.appointment.count({ where: { status: 'PENDING' } }),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    prisma.appointment.count({ where: { status: 'CANCELLED' } }),
    prisma.department.count({ where: { isActive: true } }),
    prisma.patient.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { email: true } } } }),
    prisma.appointment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { patient: true, doctor: true, department: true },
    }),
  ]);

  return success(res, 200, 'Dashboard stats fetched', {
    totalPatients,
    totalDoctors,
    totalStaff,
    totalAppointments,
    todaysAppointments,
    pendingAppointments,
    completedAppointments,
    cancelledAppointments,
    totalDepartments,
    recentPatients,
    recentAppointments,
  });
}

// GET /api/admin/reports?from=&to=
// Returns aggregate data suitable for charts: appointments by day, by department,
// by status, and patient registration trend.
async function getReports(req, res) {
  const { from, to } = req.query;
  const dateFilter = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);
  const where = Object.keys(dateFilter).length ? { appointmentDate: dateFilter } : {};

  const [byStatus, byDepartment, byDoctor, appointments] = await Promise.all([
    prisma.appointment.groupBy({ by: ['status'], where, _count: true }),
    prisma.appointment.groupBy({ by: ['departmentId'], where, _count: true }),
    prisma.appointment.groupBy({ by: ['doctorId'], where, _count: true }),
    prisma.appointment.findMany({ where, select: { appointmentDate: true } }),
  ]);

  const departments = await prisma.department.findMany({ where: { id: { in: byDepartment.map((d) => d.departmentId) } } });
  const doctors = await prisma.doctor.findMany({ where: { id: { in: byDoctor.map((d) => d.doctorId) } } });

  const byDepartmentNamed = byDepartment.map((d) => ({
    department: departments.find((dep) => dep.id === d.departmentId)?.name || 'Unknown',
    count: d._count,
  }));
  const byDoctorNamed = byDoctor.map((d) => ({
    doctor: (() => {
      const doc = doctors.find((doc) => doc.id === d.doctorId);
      return doc ? `${doc.firstName} ${doc.lastName}` : 'Unknown';
    })(),
    count: d._count,
  }));

  // Group by day for a trend line
  const trend = {};
  for (const a of appointments) {
    const day = a.appointmentDate.toISOString().slice(0, 10);
    trend[day] = (trend[day] || 0) + 1;
  }
  const trendArray = Object.entries(trend)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }));

  const patientRegTrend = await prisma.patient.groupBy({
    by: ['createdAt'],
    _count: true,
  });

  return success(res, 200, 'Reports fetched', {
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    byDepartment: byDepartmentNamed,
    byDoctor: byDoctorNamed,
    dailyTrend: trendArray,
    totalInRange: appointments.length,
  });
}

module.exports = { getDashboard, getReports };
