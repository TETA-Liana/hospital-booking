import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';

export default function CreateAppointment() {
  const navigate = useNavigate();
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');

  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dateOptions = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data.data));
  }, []);

  useEffect(() => {
    if (!patientSearch) return setPatients([]);
    const timeout = setTimeout(() => {
      api.get('/patients', { params: { search: patientSearch, pageSize: 8 } }).then(({ data }) => setPatients(data.data));
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch]);

  useEffect(() => {
    if (!departmentId) return setDoctors([]);
    api.get('/doctors', { params: { departmentId, pageSize: 50 } }).then(({ data }) => setDoctors(data.data));
  }, [departmentId]);

  useEffect(() => {
    if (!doctorId || !date) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    api.get(`/doctors/${doctorId}/slots`, { params: { date } }).then(({ data }) => setSlots(data.data)).finally(() => setLoadingSlots(false));
  }, [doctorId, date]);

  async function submit() {
    setSubmitting(true);
    try {
      await api.post('/appointments', {
        patientId: selectedPatient.id,
        doctorId,
        appointmentDate: date,
        startTime: selectedSlot.start,
        reason,
      });
      toast.success('Appointment created');
      navigate('/receptionist/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create appointment');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = selectedPatient && doctorId && date && selectedSlot && reason.trim();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-ink-800">Create an appointment</h1>
      <p className="mt-1 text-ink-500">Book on behalf of a registered patient.</p>

      <div className="card mt-6 space-y-6 p-6">
        <div>
          <label className="label">Find patient</label>
          {selectedPatient ? (
            <div className="flex items-center justify-between rounded-lg border border-brand-300 bg-brand-50 px-3 py-2">
              <span className="text-sm text-ink-800">{selectedPatient.firstName} {selectedPatient.lastName} &middot; {selectedPatient.user?.email}</span>
              <button className="text-xs text-brand-700 hover:underline" onClick={() => setSelectedPatient(null)}>Change</button>
            </div>
          ) : (
            <>
              <input
                className="input"
                placeholder="Search by name, email, or phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
              {patients.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-ink-100">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPatient(p); setPatientSearch(''); setPatients([]); }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-ink-50"
                    >
                      {p.firstName} {p.lastName} &middot; {p.user?.email}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Department</label>
            <select className="input" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setDoctorId(''); }}>
              <option value="">Select department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Doctor</label>
            <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} disabled={!departmentId}>
              <option value="">Select doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
            </select>
          </div>
        </div>

        {doctorId && (
          <div>
            <label className="label">Date</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dateOptions.map((d) => {
                const iso = format(d, 'yyyy-MM-dd');
                return (
                  <button
                    key={iso}
                    onClick={() => setDate(iso)}
                    className={`flex min-w-[56px] flex-col items-center rounded-lg border px-2 py-1.5 text-sm ${
                      date === iso ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200'
                    }`}
                  >
                    <span className="text-xs">{format(d, 'EEE')}</span>
                    <span className="font-medium">{format(d, 'd')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {date && (
          loadingSlots ? <LoadingState label="Loading slots..." /> : (
            <div>
              <label className="label">Available times</label>
              <div className="grid grid-cols-4 gap-2">
                {slots.length === 0 && <p className="col-span-4 text-sm text-ink-400">No slots available.</p>}
                {slots.map((s) => (
                  <button
                    key={s.start}
                    onClick={() => setSelectedSlot(s)}
                    className={`rounded-lg border px-2 py-1.5 text-sm ${
                      selectedSlot?.start === s.start ? 'border-brand-500 bg-brand-600 text-white' : 'border-ink-200'
                    }`}
                  >
                    {s.start}
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        <div>
          <label className="label">Reason for visit</label>
          <textarea className="input h-24" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <button disabled={!canSubmit || submitting} onClick={submit} className="btn-primary w-full">
          {submitting ? 'Creating...' : 'Create appointment'}
        </button>
      </div>
    </div>
  );
}
