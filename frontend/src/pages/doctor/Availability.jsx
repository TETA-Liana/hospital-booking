import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MdAdd, MdDelete } from 'react-icons/md';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingState from '../../components/LoadingState.jsx';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function DoctorAvailability() {
  const { user } = useAuth();
  const doctorId = user.doctor.id;
  const [availabilities, setAvailabilities] = useState([]);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const dateForm = useForm();

  function load() {
    setLoading(true);
    api.get(`/doctors/${doctorId}/availability`).then(({ data }) => {
      setAvailabilities(data.data.availabilities);
      setUnavailableDates(data.data.unavailableDates);
    }).finally(() => setLoading(false));
  }

  useEffect(load, [doctorId]);

  async function addSlot(values) {
    try {
      await api.post(`/doctors/${doctorId}/availability`, values);
      toast.success('Availability added');
      reset({ dayOfWeek: values.dayOfWeek, startTime: '', endTime: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add availability');
    }
  }

  async function deleteSlot(id) {
    if (!confirm('Remove this availability window?')) return;
    await api.delete(`/doctors/availability/${id}`);
    load();
  }

  async function addUnavailableDate(values) {
    try {
      await api.post(`/doctors/${doctorId}/unavailable-dates`, values);
      toast.success('Date marked unavailable');
      dateForm.reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add date');
    }
  }

  async function deleteUnavailableDate(id) {
    await api.delete(`/doctors/unavailable-dates/${id}`);
    load();
  }

  if (loading) return <LoadingState />;

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = availabilities.filter((a) => a.dayOfWeek === day);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-ink-800">Manage availability</h1>

      <div className="card p-6">
        <h2 className="font-display text-lg text-ink-800">Weekly working hours</h2>
        <form onSubmit={handleSubmit(addSlot)} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Day</label>
            <select className="input" {...register('dayOfWeek', { required: true })}>
              {DAYS.map((d) => <option key={d} value={d}>{d[0] + d.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Start time</label>
            <input type="time" className="input" {...register('startTime', { required: true })} />
          </div>
          <div>
            <label className="label">End time</label>
            <input type="time" className="input" {...register('endTime', { required: true })} />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            <MdAdd /> Add
          </button>
        </form>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {DAYS.map((day) => (
            <div key={day} className="rounded-lg border border-ink-100 p-4">
              <p className="font-medium text-ink-700">{day[0] + day.slice(1).toLowerCase()}</p>
              {grouped[day].length === 0 && <p className="text-sm text-ink-400">No hours set</p>}
              {grouped[day].map((slot) => (
                <div key={slot.id} className="mt-1 flex items-center justify-between text-sm text-ink-600">
                  <span>{slot.startTime} &ndash; {slot.endTime}</span>
                  <button onClick={() => deleteSlot(slot.id)} className="text-ink-400 hover:text-red-600">
                    <MdDelete size={16} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg text-ink-800">Unavailable dates</h2>
        <p className="text-sm text-ink-500">Mark specific days off (leave, conferences, etc.) &mdash; these override your weekly hours.</p>
        <form onSubmit={dateForm.handleSubmit(addUnavailableDate)} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" {...dateForm.register('date', { required: true })} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="label">Reason (optional)</label>
            <input className="input" {...dateForm.register('reason')} />
          </div>
          <button type="submit" className="btn-primary"><MdAdd /> Add</button>
        </form>

        <div className="mt-4 space-y-2">
          {unavailableDates.length === 0 && <p className="text-sm text-ink-400">No dates marked off.</p>}
          {unavailableDates.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-4 py-2 text-sm">
              <span>{format(new Date(d.date), 'MMMM d, yyyy')} {d.reason && `— ${d.reason}`}</span>
              <button onClick={() => deleteUnavailableDate(d.id)} className="text-ink-400 hover:text-red-600">
                <MdDelete size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
