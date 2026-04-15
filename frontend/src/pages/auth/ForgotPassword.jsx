import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { MdLocalHospital } from 'react-icons/md';
import api from '../../services/api';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [sent, setSent] = useState(false);

  async function onSubmit(values) {
    await api.post('/auth/forgot-password', values);
    setSent(true);
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8 text-center">
        <MdLocalHospital className="mx-auto h-8 w-8 text-brand-600" />
        <h1 className="mt-2 font-display text-2xl text-ink-800">Reset your password</h1>
        {sent ? (
          <p className="mt-4 text-sm text-ink-500">
            If an account exists for that email, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink-500">Enter your email and we&rsquo;ll send you a reset link.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 text-left">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" {...register('email', { required: true })} />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
        <p className="mt-6 text-sm text-ink-500">
          <Link to="/login" className="font-medium text-brand-700 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
