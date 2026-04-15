import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    const params = { pageSize: 100 };
    if (statusFilter !== 'ALL') params.status = statusFilter;
    api.get('/appointments', { params }).then(({ data }) => setAppointments(data.data)).finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink-800">All appointments</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${statusFilter === f ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'}`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="card mt-6 overflow-x-auto">
        {loading ? <LoadingState /> : appointments.length === 0 ? <EmptyState title="No appointments" /> : (
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 text-left text-ink-500">
              <tr><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Doctor</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-ink-800">{a.patient.firstName} {a.patient.lastName}</td>
                  <td className="px-4 py-3 text-ink-500">Dr. {a.doctor.firstName} {a.doctor.lastName}</td>
                  <td className="px-4 py-3 text-ink-500">{a.department.name}</td>
                  <td className="px-4 py-3 text-ink-500">{format(parseISO(a.appointmentDate), 'MMM d, yyyy')} {a.startTime}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
