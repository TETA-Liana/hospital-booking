import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const COLORS = ['#279d8f', '#f59e0b', '#ef4444', '#556076', '#79d5c8'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!stats) return null;

  const cards = [
    ['Total patients', stats.totalPatients],
    ['Total doctors', stats.totalDoctors],
    ['Total staff', stats.totalStaff],
    ['Departments', stats.totalDepartments],
    ['Total appointments', stats.totalAppointments],
    ["Today's appointments", stats.todaysAppointments],
    ['Pending', stats.pendingAppointments],
    ['Completed', stats.completedAppointments],
    ['Cancelled', stats.cancelledAppointments],
  ];

  const pieData = [
    { name: 'Pending', value: stats.pendingAppointments },
    { name: 'Completed', value: stats.completedAppointments },
    { name: 'Cancelled', value: stats.cancelledAppointments },
    { name: 'Other', value: Math.max(stats.totalAppointments - stats.pendingAppointments - stats.completedAppointments - stats.cancelledAppointments, 0) },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-800">Admin dashboard</h1>
        <p className="text-ink-500">Hospital-wide overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-ink-500">{label}</p>
            <p className="mt-1 font-display text-3xl text-ink-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-lg text-ink-800">Appointment status breakdown</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg text-ink-800">Recent registrations</h2>
          <div className="mt-4 divide-y divide-ink-100">
            {stats.recentPatients.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink-700">{p.firstName} {p.lastName}</span>
                <span className="text-ink-400">{format(parseISO(p.createdAt), 'MMM d')}</span>
              </div>
            ))}
            {stats.recentPatients.length === 0 && <p className="text-sm text-ink-400">No recent registrations.</p>}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg text-ink-800">Recent appointments</h2>
        <div className="mt-4 divide-y divide-ink-100">
          {stats.recentAppointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink-700">
                {a.patient.firstName} {a.patient.lastName} &rarr; Dr. {a.doctor.firstName} {a.doctor.lastName}
              </span>
              <StatusBadge status={a.status} />
            </div>
          ))}
          {stats.recentAppointments.length === 0 && <p className="text-sm text-ink-400">No recent appointments.</p>}
        </div>
      </div>
    </div>
  );
}
