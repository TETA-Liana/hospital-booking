import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdArrowBack, MdArrowForward, MdCheckCircle } from 'react-icons/md';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import { format, addDays } from 'date-fns';

const STEPS = ['Department', 'Doctor', 'Date & time', 'Reason', 'Confirm'];

export default function BookAppointment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const preselectedDoctorId = searchParams.get('doctorId');

  // Next 14 selectable days
  const dateOptions = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)),
    []
  );

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data.data));
  }, []);

  // If a doctor was preselected (came from doctor profile / list), fetch it
  // and jump straight to the date/time step.
  useEffect(() => {
    if (!preselectedDoctorId) return;
    api.get(`/doctors/${preselectedDoctorId}`).then(({ data }) => {
      setSelectedDoctor(data.data);
      setSelectedDepartment(data.data.department);
      setStep(2);
    });
  }, [preselectedDoctorId]);

  useEffect(() => {
    if (!selectedDepartment) return;
    api.get('/doctors', { params: { departmentId: selectedDepartment.id, pageSize: 50 } })
      .then(({ data }) => setDoctors(data.data));
  }, [selectedDepartment]);

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    api.get(`/doctors/${selectedDoctor.id}/slots`, { params: { date: selectedDate } })
      .then(({ data }) => setSlots(data.data))
      .finally(() => setLoadingSlots(false));
  }, [selectedDoctor, selectedDate]);

  async function submitBooking() {
    setSubmitting(true);
    try {
      const { data } = await api.post('/appointments', {
        doctorId: selectedDoctor.id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.start,
        reason,
      });
      setSuccess(data.data);
      toast.success('Appointment requested');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not book this slot. Please choose another.');
      // Refresh slots since this one may have just been taken
      if (selectedDoctor && selectedDate) {
        const { data } = await api.get(`/doctors/${selectedDoctor.id}/slots`, { params: { date: selectedDate } });
        setSlots(data.data);
        setSelectedSlot(null);
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <MdCheckCircle className="mx-auto h-14 w-14 text-brand-600" />
        <h1 className="mt-4 font-display text-2xl text-ink-800">Request submitted</h1>
        <p className="mt-2 text-ink-500">
          Your appointment with Dr. {selectedDoctor.firstName} {selectedDoctor.lastName} on{' '}
          {format(new Date(selectedDate), 'MMMM d, yyyy')} at {selectedSlot.start} is pending confirmation.
          You&rsquo;ll get a notification once the doctor responds.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="btn-secondary" onClick={() => navigate('/patient/appointments')}>View my appointments</button>
          <button className="btn-primary" onClick={() => navigate('/patient')}>Back to dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-ink-800">Book an appointment</h1>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                i <= step ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400'
              }`}>
                {i + 1}
              </div>
              <span className={`hidden text-sm sm:block ${i <= step ? 'text-ink-700' : 'text-ink-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-ink-200" />}
          </React.Fragment>
        ))}
      </div>

      <div className="card mt-6 p-6">
        {/* Step 0: Department */}
        {step === 0 && (
          <div>
            <h2 className="font-display text-lg text-ink-800">Choose a department</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {departments.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { setSelectedDepartment(d); setSelectedDoctor(null); setStep(1); }}
                  className={`rounded-lg border p-4 text-left transition-colors hover:border-brand-400 ${
                    selectedDepartment?.id === d.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200'
                  }`}
                >
                  <p className="font-medium text-ink-800">{d.name}</p>
                  <p className="text-sm text-ink-500">{d.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Doctor */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-lg text-ink-800">Choose a doctor in {selectedDepartment?.name}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {doctors.length === 0 && <p className="text-sm text-ink-400">No doctors currently available in this department.</p>}
              {doctors.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:border-brand-400 ${
                    selectedDoctor?.id === doc.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
                    {doc.firstName[0]}{doc.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-ink-800">Dr. {doc.firstName} {doc.lastName}</p>
                    <p className="text-xs text-ink-400">{doc.yearsOfExperience} yrs &middot; ${Number(doc.consultationFee).toFixed(0)}/visit</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button className="btn-ghost" onClick={() => setStep(0)}><MdArrowBack /> Back</button>
            </div>
          </div>
        )}

        {/* Step 2: Date & time */}
        {step === 2 && selectedDoctor && (
          <div>
            <h2 className="font-display text-lg text-ink-800">
              Choose a date and time with Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
            </h2>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {dateOptions.map((d) => {
                const iso = format(d, 'yyyy-MM-dd');
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    className={`flex min-w-[64px] flex-col items-center rounded-lg border px-3 py-2 text-sm ${
                      selectedDate === iso ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600'
                    }`}
                  >
                    <span className="text-xs">{format(d, 'EEE')}</span>
                    <span className="font-medium">{format(d, 'd')}</span>
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-5">
                {loadingSlots ? (
                  <LoadingState label="Loading available times..." />
                ) : slots.length === 0 ? (
                  <p className="text-sm text-ink-400">No available slots on this date. Try another day.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((s) => (
                      <button
                        key={s.start}
                        onClick={() => setSelectedSlot(s)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                          selectedSlot?.start === s.start ? 'border-brand-500 bg-brand-600 text-white' : 'border-ink-200 text-ink-700 hover:border-brand-400'
                        }`}
                      >
                        {s.start}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button className="btn-ghost" onClick={() => setStep(1)}><MdArrowBack /> Back</button>
              <button
                className="btn-primary"
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
              >
                Continue <MdArrowForward />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Reason */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-lg text-ink-800">Reason for visit</h2>
            <textarea
              className="input mt-4 h-32"
              placeholder="Briefly describe your symptoms or reason for the appointment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="mt-6 flex justify-between">
              <button className="btn-ghost" onClick={() => setStep(2)}><MdArrowBack /> Back</button>
              <button className="btn-primary" disabled={!reason.trim()} onClick={() => setStep(4)}>
                Continue <MdArrowForward />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div>
            <h2 className="font-display text-lg text-ink-800">Confirm your appointment</h2>
            <dl className="mt-4 divide-y divide-ink-100 text-sm">
              <div className="flex justify-between py-2"><dt className="text-ink-500">Department</dt><dd className="text-ink-800">{selectedDepartment?.name}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-ink-500">Doctor</dt><dd className="text-ink-800">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-ink-500">Date</dt><dd className="text-ink-800">{format(new Date(selectedDate), 'MMMM d, yyyy')}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-ink-500">Time</dt><dd className="text-ink-800">{selectedSlot.start} &ndash; {selectedSlot.end}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-ink-500">Fee</dt><dd className="text-ink-800">${Number(selectedDoctor.consultationFee).toFixed(0)}</dd></div>
              <div className="py-2"><dt className="text-ink-500">Reason</dt><dd className="mt-1 text-ink-800">{reason}</dd></div>
            </dl>
            <div className="mt-6 flex justify-between">
              <button className="btn-ghost" onClick={() => setStep(3)}><MdArrowBack /> Back</button>
              <button className="btn-primary" disabled={submitting} onClick={submitBooking}>
                {submitting ? 'Submitting...' : 'Confirm appointment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
