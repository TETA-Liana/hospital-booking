import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdLocalHospital } from 'react-icons/md';
import api from '../../services/api';

export default function ResetPassword() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const password = watch('password');

  async function onSubmit(values) {
    try {
      await api.post('/auth/reset-password', { token, password: values.password });
      toast.success('Password reset. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link is invalid or expired.');
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 text-center">
        <div className="card max-w-md p-8">
          <p className="text-ink-600">This reset link is missing its token. Please request a new one.</p>
          <Link to="/forgot-password" className="btn-primary mt-4 inline-flex">Request new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <MdLocalHospital className="h-8 w-8 text-brand-600" />
          <h1 className="mt-2 font-display text-2xl text-ink-800">Set a new password</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">New password</label>
            <input
              className="input"
              type="password"
              {...register('password', { required: true, minLength: { value: 8, message: 'At least 8 characters' } })}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input
              className="input"
              type="password"
              {...register('confirmPassword', { validate: (v) => v === password || 'Passwords do not match' })}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Saving...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
