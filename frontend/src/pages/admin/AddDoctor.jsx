import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AddDoctor() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [departments, setDepartments] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data.data));
    api.get('/specialties').then(({ data }) => setSpecialties(data.data));
  }, []);

  async function onSubmit(values) {
    try {
      const requiredFields = ['email', 'firstName', 'lastName', 'medicalLicenseNo', 'departmentId'];
      const missing = requiredFields.filter((field) => !String(values[field] || '').trim());
      if (missing.length) {
        toast.error('Please fill in all required doctor fields.');
        return;
      }

      const payload = {
        ...values,
        email: String(values.email).trim(),
        firstName: String(values.firstName).trim(),
        lastName: String(values.lastName).trim(),
        medicalLicenseNo: String(values.medicalLicenseNo).trim(),
        departmentId: String(values.departmentId).trim(),
        yearsOfExperience: values.yearsOfExperience ? Number(values.yearsOfExperience) : 0,
        consultationFee: values.consultationFee ? Number(values.consultationFee) : 0,
        appointmentDurationMinutes: values.appointmentDurationMinutes ? Number(values.appointmentDurationMinutes) : 30,
        specialtyIds: Array.isArray(values.specialtyIds)
          ? values.specialtyIds.filter(Boolean)
          : values.specialtyIds
            ? [].concat(values.specialtyIds).filter(Boolean)
            : [],
      };

      if (!payload.password) delete payload.password;
      await api.post('/doctors', payload);
      toast.success('Doctor created. Login details were emailed.');
      navigate('/admin/doctors');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create doctor');
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-ink-800">Add doctor</h1>

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
        <div>
          <label className="label">Temporary password (leave blank to auto-generate &amp; email)</label>
          <input className="input" type="password" {...register('password')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="label">Medical license no.</label>
            <input className="input" {...register('medicalLicenseNo', { required: true })} />
          </div>
        </div>
        <div>
          <label className="label">Department</label>
          <select className="input" {...register('departmentId', { required: true })}>
            <option value="">Select department</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Specialties</label>
          <select multiple className="input h-28" {...register('specialtyIds')}>
            {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Years of experience</label>
            <input type="number" className="input" {...register('yearsOfExperience')} />
          </div>
          <div>
            <label className="label">Consultation fee ($)</label>
            <input type="number" step="0.01" className="input" {...register('consultationFee')} />
          </div>
          <div>
            <label className="label">Room number</label>
            <input className="input" {...register('roomNumber')} />
          </div>
        </div>
        <div>
          <label className="label">Qualification</label>
          <input className="input" {...register('qualification')} />
        </div>
        <div>
          <label className="label">Biography</label>
          <textarea className="input h-24" {...register('biography')} />
        </div>
        <div className="max-w-xs">
          <label className="label">Appointment duration (minutes)</label>
          <input type="number" className="input" defaultValue={30} {...register('appointmentDurationMinutes')} />
        </div>
        <button type="submit" disabled={isSubmitting || departments.length === 0} className="btn-primary">
          {isSubmitting ? 'Creating...' : departments.length === 0 ? 'Loading departments...' : 'Create doctor'}
        </button>
      </form>
    </div>
  );
}
