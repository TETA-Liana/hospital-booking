import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { MdEventNote, MdPersonAdd, MdAssignment } from 'react-icons/md';

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    api.get('/appointments', { params: { date: todayStr, pageSize: 100 } })
      .then(({ data }) => setAppointments(data.data))
      .finally(() => setLoading(false));
  }, []);

  async function checkIn(id) {
    await api.post(`/appointments/${id}/check-in`);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, checkedInAt: new Date().toISOString() } : a)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-800">Front desk</h1>
        <p className="text-ink-500">Today&rsquo;s schedule and quick actions.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/receptionist/register-patient" className="btn-primary"><MdPersonAdd /> Register patient</Link>
        <Link to="/receptionist/create-appointment" className="btn-secondary"><MdAssignment /> Create appointment</Link>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg text-ink-800">Today&rsquo;s appointments</h2>
        {loading ? (
          <LoadingState />
        ) : appointments.length === 0 ? (
          <EmptyState icon={MdEventNote} title="Nothing scheduled today" />
        ) : (
          <div className="mt-4 divide-y divide-ink-100">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-ink-700">{a.patient.firstName} {a.patient.lastName}</p>
                  <p className="text-sm text-ink-400">
                    {a.startTime} &middot; Dr. {a.doctor.firstName} {a.doctor.lastName} &middot; {a.department.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  {a.checkedInAt ? (
                    <span className="text-xs text-brand-600">Checked in</span>
                  ) : (
                    <button onClick={() => checkIn(a.id)} className="btn-secondary !px-3 !py-1.5 text-xs">Check in</button>
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
