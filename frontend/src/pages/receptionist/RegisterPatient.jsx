import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function RegisterPatient() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();

  async function onSubmit(values) {
    try {
      await api.post('/patients', values);
      toast.success('Patient registered. Login details were emailed to them.');
      navigate('/receptionist/patients');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-ink-800">Register a patient</h1>
      <p className="mt-1 text-ink-500">Create an account on behalf of a walk-in or phone patient.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card mt-6 space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">First name</label>
            <input className="input" {...register('firstName', { required: true })} />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" {...register('lastName', { required: true })} />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" {...register('email', { required: true })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input className="input" type="date" {...register('dateOfBirth')} />
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" {...register('address')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Emergency contact name</label>
            <input className="input" {...register('emergencyContactName')} />
          </div>
          <div>
            <label className="label">Emergency contact phone</label>
            <input className="input" {...register('emergencyContactPhone')} />
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Registering...' : 'Register patient'}
        </button>
      </form>
    </div>
  );
}
