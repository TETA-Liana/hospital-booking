import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdLocalHospital } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_BASE_PATH } from '../../utils/navConfig.js';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  async function onSubmit(values) {
    setServerError('');
    try {
      const user = await login(values.email, values.password);
      const dest = location.state?.from?.pathname || ROLE_BASE_PATH[user.role];
      toast.success('Welcome back');
      navigate(dest, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <MdLocalHospital className="h-8 w-8 text-brand-600" />
          <h1 className="mt-2 font-display text-2xl text-ink-800">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-500">Log in to manage your appointments.</p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{serverError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-brand-700 hover:underline">Forgot password?</Link>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          New patient? <Link to="/register" className="font-medium text-brand-700 hover:underline">Create an account</Link>
        </p>

        <div className="mt-6 rounded-lg bg-ink-50 p-3 text-xs text-ink-400">
          <p className="font-medium text-ink-500">Demo accounts (from seed data):</p>
          <p>Admin: admin@hospital.com / Admin@123</p>
          <p>Doctor: dr.jane.smith@hospital.com / Doctor@123</p>
          <p>Receptionist: reception@hospital.com / Reception@123</p>
          <p>Patient: patient@example.com / Patient@123</p>
        </div>
      </div>
    </div>
  );
}
