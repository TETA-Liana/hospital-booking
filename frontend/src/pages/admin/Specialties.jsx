import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import Modal from '../../components/Modal.jsx';

export default function AdminSpecialties() {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  function load() {
    setLoading(true);
    api.get('/specialties').then(({ data }) => setSpecialties(data.data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openCreate() { setEditing(null); reset({ name: '', description: '' }); setModalOpen(true); }
  function openEdit(s) { setEditing(s); reset({ name: s.name, description: s.description || '' }); setModalOpen(true); }

  async function onSubmit(values) {
    try {
      if (editing) await api.put(`/specialties/${editing.id}`, values);
      else await api.post('/specialties', values);
      toast.success('Saved');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  }

  async function remove(s) {
    if (!confirm(`Remove ${s.name}?`)) return;
    await api.delete(`/specialties/${s.id}`);
    toast.success('Removed');
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink-800">Specialties</h1>
        <button onClick={openCreate} className="btn-primary"><MdAdd /> Add specialty</button>
      </div>

      <div className="mt-6">
        {loading ? <LoadingState /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {specialties.map((s) => (
              <div key={s.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-ink-800">{s.name}</p>
                  <p className="text-xs text-ink-400">{s.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(s)} className="text-ink-400 hover:text-brand-600"><MdEdit size={18} /></button>
                  <button onClick={() => remove(s)} className="text-ink-400 hover:text-red-600"><MdDelete size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit specialty' : 'Add specialty'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="label">Name</label><input className="input" {...register('name', { required: true })} /></div>
          <div><label className="label">Description</label><textarea className="input h-20" {...register('description')} /></div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">{isSubmitting ? 'Saving...' : 'Save'}</button>
        </form>
      </Modal>
    </div>
  );
}
