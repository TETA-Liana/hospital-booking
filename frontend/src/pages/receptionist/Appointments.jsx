import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  function load() {
    setLoading(true);
    const params = { pageSize: 100 };
    if (statusFilter !== 'ALL') params.status = statusFilter;
    api.get('/appointments', { params }).then(({ data }) => setAppointments(data.data)).finally(() => setLoading(false));
  }
  useEffect(load, [statusFilter]);

  async function cancel(id) {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel');
    }
  }

  async function checkIn(id) {
    await api.post(`/appointments/${id}/check-in`);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink-800">All appointments</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${statusFilter === f ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? <LoadingState /> : appointments.length === 0 ? <EmptyState title="No appointments" /> : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id} className="card flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium text-ink-800">{a.patient.firstName} {a.patient.lastName} &rarr; Dr. {a.doctor.firstName} {a.doctor.lastName}</p>
                  <p className="text-sm text-ink-500">{format(parseISO(a.appointmentDate), 'MMM d, yyyy')} at {a.startTime} &middot; {a.department.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  {['PENDING', 'CONFIRMED'].includes(a.status) && !a.checkedInAt && (
                    <button onClick={() => checkIn(a.id)} className="btn-secondary !px-3 !py-1.5 text-xs">Check in</button>
                  )}
                  {['PENDING', 'CONFIRMED'].includes(a.status) && (
                    <button onClick={() => cancel(a.id)} className="btn-danger !px-3 !py-1.5 text-xs">Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
