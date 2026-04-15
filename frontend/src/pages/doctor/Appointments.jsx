import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';
import { MdEventNote } from 'react-icons/md';

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'];

export default function DoctorAppointments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [detail, setDetail] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  function load() {
    setLoading(true);
    const params = { pageSize: 100 };
    if (statusFilter !== 'ALL') params.status = statusFilter;
    api.get('/appointments', { params }).then(({ data }) => setAppointments(data.data)).finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  function changeFilter(f) {
    setStatusFilter(f);
    setSearchParams(f === 'ALL' ? {} : { status: f });
  }

  async function updateStatus(id, status, extra = {}) {
    try {
      await api.put(`/appointments/${id}/status`, { status, ...extra });
      toast.success(`Appointment ${status.toLowerCase()}`);
      load();
      setDetail(null);
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update appointment');
    }
  }

  async function saveNotes() {
    await updateStatus(detail.id, detail.status, { doctorNotes: notesDraft });
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink-800">Appointments</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              statusFilter === f ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingState />
        ) : appointments.length === 0 ? (
          <EmptyState icon={MdEventNote} title="No appointments in this view" />
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id} className="card flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <button className="text-left" onClick={() => { setDetail(a); setNotesDraft(a.doctorNotes || ''); }}>
                  <p className="font-medium text-ink-800">{a.patient.firstName} {a.patient.lastName}</p>
                  <p className="text-sm text-ink-500">
                    {format(parseISO(a.appointmentDate), 'EEE, MMM d, yyyy')} at {a.startTime}
                  </p>
                  <p className="mt-1 text-sm text-ink-400 line-clamp-1">{a.reason}</p>
                </button>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  {a.status === 'PENDING' && (
                    <>
                      <button onClick={() => updateStatus(a.id, 'CONFIRMED')} className="btn-primary !px-3 !py-1.5 text-xs">Confirm</button>
                      <button onClick={() => setRejectingId(a.id)} className="btn-danger !px-3 !py-1.5 text-xs">Reject</button>
                    </>
                  )}
                  {a.status === 'CONFIRMED' && (
                    <>
                      <button onClick={() => updateStatus(a.id, 'COMPLETED')} className="btn-secondary !px-3 !py-1.5 text-xs">Mark completed</button>
                      <button onClick={() => updateStatus(a.id, 'NO_SHOW')} className="btn-ghost !px-3 !py-1.5 text-xs">No-show</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Appointment details" size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><p className="text-ink-400">Patient</p><p className="font-medium text-ink-800">{detail.patient.firstName} {detail.patient.lastName}</p></div>
              <div><p className="text-ink-400">Date &amp; time</p><p className="font-medium text-ink-800">{format(parseISO(detail.appointmentDate), 'MMM d, yyyy')} at {detail.startTime}</p></div>
              <div><p className="text-ink-400">Status</p><StatusBadge status={detail.status} /></div>
              <div><p className="text-ink-400">Reason</p><p className="font-medium text-ink-800">{detail.reason}</p></div>
            </div>
            <div>
              <label className="label">Private notes (visible only to hospital staff)</label>
              <textarea className="input h-28" value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} />
              <button onClick={saveNotes} className="btn-secondary mt-2">Save notes</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!rejectingId} onClose={() => setRejectingId(null)} title="Reject appointment">
        <label className="label">Reason (optional, shared with the patient)</label>
        <textarea className="input h-24" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        <button
          className="btn-danger mt-4 w-full"
          onClick={() => updateStatus(rejectingId, 'REJECTED', { cancelReason: rejectReason })}
        >
          Confirm rejection
        </button>
      </Modal>
    </div>
  );
}
