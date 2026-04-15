import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';

export default function DoctorProfileEdit() {
  const { user, refetch } = useAuth();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const pwForm = useForm();

  useEffect(() => {
    if (user?.doctor) {
      reset({
        firstName: user.doctor.firstName,
        lastName: user.doctor.lastName,
        phone: user.doctor.phone || '',
        qualification: user.doctor.qualification || '',
        biography: user.doctor.biography || '',
        yearsOfExperience: user.doctor.yearsOfExperience,
        consultationFee: Number(user.doctor.consultationFee),
        roomNumber: user.doctor.roomNumber || '',
        appointmentDurationMinutes: user.doctor.appointmentDurationMinutes,
      });
    }
  }, [user, reset]);

  async function onSubmit(values) {
    try {
      await api.put(`/doctors/${user.doctor.id}`, {
        ...values,
        yearsOfExperience: Number(values.yearsOfExperience),
        consultationFee: Number(values.consultationFee),
        appointmentDurationMinutes: Number(values.appointmentDurationMinutes),
      });
      await refetch();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  }

  async function onChangePassword(values) {
    try {
      await api.post('/auth/change-password', values);
      toast.success('Password changed');
      pwForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    }
  }

  if (!user?.doctor) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl text-ink-800">Your profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">First name</label><input className="input" {...register('firstName')} /></div>
          <div><label className="label">Last name</label><input className="input" {...register('lastName')} /></div>
        </div>
        <div><label className="label">Email</label><input className="input bg-ink-50" value={user.email} disabled /></div>
        <div><label className="label">Phone</label><input className="input" {...register('phone')} /></div>
        <div><label className="label">Qualification</label><input className="input" {...register('qualification')} /></div>
        <div><label className="label">Biography</label><textarea className="input h-28" {...register('biography')} /></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label">Years of experience</label><input type="number" className="input" {...register('yearsOfExperience')} /></div>
          <div><label className="label">Consultation fee ($)</label><input type="number" step="0.01" className="input" {...register('consultationFee')} /></div>
          <div><label className="label">Room number</label><input className="input" {...register('roomNumber')} /></div>
        </div>
        <div className="max-w-xs">
          <label className="label">Appointment duration (minutes)</label>
          <input type="number" className="input" {...register('appointmentDurationMinutes')} />
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting ? 'Saving...' : 'Save changes'}</button>
      </form>

      <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="card space-y-4 p-6">
        <h2 className="font-display text-lg text-ink-800">Change password</h2>
        <div><label className="label">Current password</label><input className="input" type="password" {...pwForm.register('currentPassword', { required: true })} /></div>
        <div><label className="label">New password</label><input className="input" type="password" {...pwForm.register('newPassword', { required: true, minLength: 8 })} /></div>
        <button type="submit" className="btn-secondary">Update password</button>
      </form>
    </div>
  );
}
