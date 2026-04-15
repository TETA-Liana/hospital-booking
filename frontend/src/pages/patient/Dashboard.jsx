import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdArrowForward, MdEventAvailable } from 'react-icons/md';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { format, parseISO } from 'date-fns';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/appointments', { params: { pageSize: 50 } })
      .then(({ data }) => setAppointments(data.data))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = appointments
    .filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status) && new Date(a.appointmentDate) >= new Date(now.toDateString()))
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
  const next = upcoming[0];

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-800">Welcome back</h1>
        <p className="text-ink-500">Here&rsquo;s what&rsquo;s coming up for you.</p>
      </div>

      {next ? (
        <div className="card flex flex-col justify-between gap-4 bg-brand-600 p-6 text-white sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-wide text-brand-100">Your next appointment</p>
            <p className="mt-1 font-display text-2xl">
              Dr. {next.doctor.firstName} {next.doctor.lastName} &middot; {next.department.name}
            </p>
            <p className="mt-1 text-brand-100">
              {format(parseISO(next.appointmentDate), 'EEEE, MMMM d, yyyy')} at {next.startTime}
            </p>
          </div>
          <StatusBadge status={next.status} />
        </div>
      ) : (
        <EmptyState
          icon={MdEventAvailable}
          title="No upcoming appointments"
          description="Book your next visit with any of our specialists in just a couple of clicks."
          action={<Link to="/patient/book" className="btn-primary">Book an appointment <MdArrowForward /></Link>}
        />
      )}

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink-800">Upcoming appointments</h2>
          <Link to="/patient/appointments" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-400">Nothing scheduled yet.</p>
        ) : (
          <div className="divide-y divide-ink-100">
            {upcoming.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-ink-700">Dr. {a.doctor.firstName} {a.doctor.lastName}</p>
                  <p className="text-sm text-ink-400">
                    {format(parseISO(a.appointmentDate), 'MMM d, yyyy')} at {a.startTime} &middot; {a.department.name}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
