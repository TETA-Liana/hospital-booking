import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdLocalHospital } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const password = watch('password');

  async function onSubmit(values) {
    setServerError('');
    try {
      await registerUser({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        gender: values.gender || undefined,
      });
      toast.success('Account created');
      navigate('/patient', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed.');
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-lg p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <MdLocalHospital className="h-8 w-8 text-brand-600" />
          <h1 className="mt-2 font-display text-2xl text-ink-800">Create your patient account</h1>
          <p className="mt-1 text-sm text-ink-500">Book and manage appointments online.</p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{serverError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">First name</label>
              <input className="input" {...register('firstName', { required: 'Required' })} />
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label">Last name</label>
              <input className="input" {...register('lastName', { required: 'Required' })} />
              {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" {...register('email', { required: 'Required' })} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Phone</label>
              <input className="input" {...register('phone')} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" {...register('gender')}>
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              {...register('password', {
                required: 'Required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input
              className="input"
              type="password"
              {...register('confirmPassword', {
                required: 'Required',
                validate: (v) => v === password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account? <Link to="/login" className="font-medium text-brand-700 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
