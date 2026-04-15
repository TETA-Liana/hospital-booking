import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingState from '../../components/LoadingState.jsx';

export default function PatientProfile() {
  const { user, refetch } = useAuth();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const pwForm = useForm();

  useEffect(() => {
    if (user?.patient) {
      reset({
        firstName: user.patient.firstName,
        lastName: user.patient.lastName,
        phone: user.patient.phone || '',
        address: user.patient.address || '',
        emergencyContactName: user.patient.emergencyContactName || '',
        emergencyContactPhone: user.patient.emergencyContactPhone || '',
        bloodGroup: user.patient.bloodGroup || '',
      });
      setLoading(false);
    }
  }, [user, reset]);

  async function onSubmit(values) {
    try {
      await api.put(`/patients/${user.patient.id}`, values);
      await refetch();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  }

  async function onChangePassword(values) {
    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', values);
      toast.success('Password changed');
      pwForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl text-ink-800">Your profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
        <h2 className="font-display text-lg text-ink-800">Personal information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">First name</label>
            <input className="input" {...register('firstName')} />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" {...register('lastName')} />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input bg-ink-50" value={user.email} disabled />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" {...register('phone')} />
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" {...register('address')} />
        </div>
        <h3 className="pt-2 text-sm font-medium text-ink-700">Emergency contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input" {...register('emergencyContactName')} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('emergencyContactPhone')} />
          </div>
        </div>
        <div>
          <label className="label">Blood group</label>
          <input className="input" {...register('bloodGroup')} placeholder="e.g. O+" />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="card space-y-4 p-6">
        <h2 className="font-display text-lg text-ink-800">Change password</h2>
        <div>
          <label className="label">Current password</label>
          <input className="input" type="password" {...pwForm.register('currentPassword', { required: true })} />
        </div>
        <div>
          <label className="label">New password</label>
          <input className="input" type="password" {...pwForm.register('newPassword', { required: true, minLength: 8 })} />
        </div>
        <button type="submit" disabled={changingPassword} className="btn-secondary">
          {changingPassword ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
