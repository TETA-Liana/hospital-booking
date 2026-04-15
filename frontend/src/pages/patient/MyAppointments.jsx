import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { format, parseISO, addDays } from 'date-fns';
import { MdEventBusy, MdRestore } from 'react-icons/md';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';

const TABS = ['Upcoming', 'Past', 'Cancelled'];

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Upcoming');
  const [rescheduling, setRescheduling] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState(null);

  function load() {
    setLoading(true);
    api.get('/appointments', { params: { pageSize: 100 } })
      .then(({ data }) => setAppointments(data.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const today = new Date(new Date().toDateString());
  const filtered = appointments.filter((a) => {
    const date = new Date(a.appointmentDate);
    if (tab === 'Upcoming') return ['PENDING', 'CONFIRMED'].includes(a.status) && date >= today;
    if (tab === 'Past') return ['COMPLETED', 'NO_SHOW'].includes(a.status) || (date < today && a.status !== 'CANCELLED');
    return a.status === 'CANCELLED' || a.status === 'REJECTED';
  });

  async function cancelAppointment(id) {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel appointment');
    }
  }

  function openReschedule(appt) {
    setRescheduling(appt);
    setNewDate('');
    setSlots([]);
    setNewSlot(null);
  }

  useEffect(() => {
    if (!rescheduling || !newDate) return;
    api.get(`/doctors/${rescheduling.doctorId}/slots`, { params: { date: newDate } }).then(({ data }) => setSlots(data.data));
  }, [rescheduling, newDate]);

  async function submitReschedule() {
    try {
      await api.put(`/appointments/${rescheduling.id}/reschedule`, {
        appointmentDate: newDate,
        startTime: newSlot.start,
      });
      toast.success('Appointment rescheduled');
      setRescheduling(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reschedule');
    }
  }

  const dateOptions = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  return (
    <div>
      <h1 className="font-display text-3xl text-ink-800">My appointments</h1>

      <div className="mt-6 flex gap-2 border-b border-ink-100">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState icon={MdEventBusy} title={`No ${tab.toLowerCase()} appointments`} />
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <div key={a.id} className="card flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium text-ink-800">Dr. {a.doctor.firstName} {a.doctor.lastName} &middot; {a.department.name}</p>
                  <p className="text-sm text-ink-500">
                    {format(parseISO(a.appointmentDate), 'EEEE, MMM d, yyyy')} at {a.startTime}
                  </p>
                  <p className="mt-1 text-sm text-ink-400">{a.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} />
                  {['PENDING', 'CONFIRMED'].includes(a.status) && (
                    <div className="flex gap-2">
                      <button onClick={() => openReschedule(a)} className="btn-secondary !px-3 !py-1.5 text-xs">
                        <MdRestore /> Reschedule
                      </button>
                      <button onClick={() => cancelAppointment(a.id)} className="btn-danger !px-3 !py-1.5 text-xs">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!rescheduling} onClose={() => setRescheduling(null)} title="Reschedule appointment">
        {rescheduling && (
          <div>
            <p className="text-sm text-ink-500">Dr. {rescheduling.doctor.firstName} {rescheduling.doctor.lastName}</p>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {dateOptions.map((d) => {
                const iso = format(d, 'yyyy-MM-dd');
                return (
                  <button
                    key={iso}
                    onClick={() => setNewDate(iso)}
                    className={`flex min-w-[56px] flex-col items-center rounded-lg border px-2 py-1.5 text-sm ${
                      newDate === iso ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600'
                    }`}
                  >
                    <span className="text-xs">{format(d, 'EEE')}</span>
                    <span className="font-medium">{format(d, 'd')}</span>
                  </button>
                );
              })}
            </div>
            {newDate && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {slots.length === 0 && <p className="col-span-4 text-sm text-ink-400">No slots available.</p>}
                {slots.map((s) => (
                  <button
                    key={s.start}
                    onClick={() => setNewSlot(s)}
                    className={`rounded-lg border px-2 py-1.5 text-sm ${
                      newSlot?.start === s.start ? 'border-brand-500 bg-brand-600 text-white' : 'border-ink-200'
                    }`}
                  >
                    {s.start}
                  </button>
                ))}
              </div>
            )}
            <button disabled={!newSlot} onClick={submitReschedule} className="btn-primary mt-6 w-full">
              Confirm new time
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
