import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdAdd, MdDelete, MdBlock, MdCheckCircle } from 'react-icons/md';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import Modal from '../../components/Modal.jsx';

export default function AdminStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  function load() {
    setLoading(true);
    api.get('/staff', { params: { pageSize: 100 } }).then(({ data }) => setStaff(data.data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openCreate() {
    reset({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', role: 'RECEPTIONIST' });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      await api.post('/staff', values);
      toast.success('Staff account created. Login details were emailed.');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create staff account');
    }
  }

  async function setStatus(member, status) {
    try {
      await api.patch(`/staff/${member.id}/status`, { status });
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    }
  }

  async function remove(member) {
    if (!confirm(`Delete ${member.staff?.firstName} ${member.staff?.lastName}?`)) return;
    try {
      await api.delete(`/staff/${member.id}`);
      toast.success('Staff deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink-800">Staff</h1>
        <button onClick={openCreate} className="btn-primary"><MdAdd /> Add staff</button>
      </div>

      <div className="card mt-6 overflow-x-auto">
        {loading ? <LoadingState /> : (
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 text-left text-ink-500">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-ink-800">{s.staff?.firstName} {s.staff?.lastName}</td>
                  <td className="px-4 py-3 text-ink-500">{s.email}</td>
                  <td className="px-4 py-3 text-ink-500">{s.role.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${s.status === 'ACTIVE' ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {s.status === 'ACTIVE' ? (
                        <button onClick={() => setStatus(s, 'SUSPENDED')} className="text-ink-400 hover:text-red-600" title="Suspend"><MdBlock size={18} /></button>
                      ) : (
                        <button onClick={() => setStatus(s, 'ACTIVE')} className="text-ink-400 hover:text-brand-600" title="Activate"><MdCheckCircle size={18} /></button>
                      )}
                      {s.role !== 'SUPER_ADMIN' && (
                        <button onClick={() => remove(s)} className="text-ink-400 hover:text-red-600" title="Delete"><MdDelete size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add staff account">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">First name</label><input className="input" {...register('firstName', { required: true })} /></div>
            <div><label className="label">Last name</label><input className="input" {...register('lastName', { required: true })} /></div>
          </div>
          <div><label className="label">Email</label><input className="input" type="email" {...register('email', { required: true })} /></div>
          <div><label className="label">Phone</label><input className="input" {...register('phone')} /></div>
          <div><label className="label">Job title</label><input className="input" {...register('jobTitle')} /></div>
          <div>
            <label className="label">Role</label>
            <select className="input" {...register('role')}>
              <option value="RECEPTIONIST">Receptionist</option>
              {user.role === 'SUPER_ADMIN' && <option value="ADMIN">Admin</option>}
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating...' : 'Create staff account'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
