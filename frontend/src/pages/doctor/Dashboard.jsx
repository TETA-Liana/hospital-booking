import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { MdEventNote } from 'react-icons/md';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/appointments', { params: { pageSize: 100 } }).then(({ data }) => setAppointments(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const today = appointments.filter((a) => a.appointmentDate.slice(0, 10) === todayStr);
  const pending = appointments.filter((a) => a.status === 'PENDING');
  const upcoming = appointments.filter((a) => a.status === 'CONFIRMED' && a.appointmentDate.slice(0, 10) >= todayStr);
  const completed = appointments.filter((a) => a.status === 'COMPLETED');
  const cancelled = appointments.filter((a) => ['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(a.status));

  const stats = [
    ['Today', today.length],
    ['Pending requests', pending.length],
    ['Upcoming', upcoming.length],
    ['Completed', completed.length],
    ['Cancelled/No-show', cancelled.length],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-800">Your dashboard</h1>
        <p className="text-ink-500">A quick look at your schedule.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-ink-500">{label}</p>
            <p className="mt-1 font-display text-3xl text-ink-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink-800">Today&rsquo;s appointments</h2>
          <Link to="/doctor/appointments" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>
        </div>
        {today.length === 0 ? (
          <EmptyState icon={MdEventNote} title="Nothing scheduled today" />
        ) : (
          <div className="divide-y divide-ink-100">
            {today.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-ink-700">{a.patient.firstName} {a.patient.lastName}</p>
                  <p className="text-sm text-ink-400">{a.startTime} &middot; {a.reason}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div className="card border-amber-200 p-6">
          <h2 className="font-display text-lg text-ink-800">Pending requests</h2>
          <p className="mt-1 text-sm text-ink-500">{pending.length} appointment(s) waiting for your response.</p>
          <Link to="/doctor/appointments?status=PENDING" className="btn-primary mt-3 inline-flex">Review requests</Link>
        </div>
      )}
    </div>
  );
}
