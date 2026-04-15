import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';

export default function AdminSettings() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => {
      reset({
        hospital_name: data.data.hospital_name || '',
        default_appointment_duration_minutes: data.data.default_appointment_duration_minutes || 30,
      });
    }).finally(() => setLoading(false));
  }, [reset]);

  async function onSubmit(values) {
    try {
      await api.put('/admin/settings', values);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save settings');
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl text-ink-800">System settings</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="label">Hospital name</label>
          <input className="input" {...register('hospital_name')} />
        </div>
        <div>
          <label className="label">Default appointment duration (minutes)</label>
          <input type="number" className="input" {...register('default_appointment_duration_minutes')} />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
