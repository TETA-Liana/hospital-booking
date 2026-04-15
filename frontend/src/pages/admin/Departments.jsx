import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import Modal from '../../components/Modal.jsx';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  function load() {
    setLoading(true);
    api.get('/departments', { params: { activeOnly: 'false' } }).then(({ data }) => setDepartments(data.data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    reset({ name: '', description: '' });
    setModalOpen(true);
  }
  function openEdit(dept) {
    setEditing(dept);
    reset({ name: dept.name, description: dept.description || '' });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) {
        await api.put(`/departments/${editing.id}`, values);
        toast.success('Department updated');
      } else {
        await api.post('/departments', values);
        toast.success('Department created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  }

  async function remove(dept) {
    if (!confirm(`Remove ${dept.name}?`)) return;
    try {
      await api.delete(`/departments/${dept.id}`);
      toast.success('Department removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove department');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink-800">Departments</h1>
        <button onClick={openCreate} className="btn-primary"><MdAdd /> Add department</button>
      </div>

      <div className="card mt-6 overflow-x-auto">
        {loading ? <LoadingState /> : (
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 text-left text-ink-500">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Doctors</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {departments.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium text-ink-800">{d.name}</td>
                  <td className="px-4 py-3 text-ink-500">{d.description}</td>
                  <td className="px-4 py-3 text-ink-500">{d._count?.doctors ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${d.isActive ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'bg-ink-100 text-ink-500'}`}>
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(d)} className="text-ink-400 hover:text-brand-600"><MdEdit size={18} /></button>
                      <button onClick={() => remove(d)} className="text-ink-400 hover:text-red-600"><MdDelete size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit department' : 'Add department'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input h-20" {...register('description')} />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
