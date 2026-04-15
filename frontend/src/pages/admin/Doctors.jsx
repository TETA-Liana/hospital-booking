import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdToggleOn, MdToggleOff } from 'react-icons/md';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/doctors', { params: { search, pageSize: 100, activeOnly: 'false' } })
      .then(({ data }) => setDoctors(data.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function toggleStatus(doc) {
    try {
      await api.patch(`/doctors/${doc.id}/status`, { isActive: !doc.isActive });
      toast.success(doc.isActive ? 'Doctor deactivated' : 'Doctor activated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    }
  }

  async function remove(doc) {
    if (!confirm(`Delete Dr. ${doc.firstName} ${doc.lastName}? This cannot be undone.`)) return;
    try {
      await api.delete(`/doctors/${doc.id}`);
      toast.success('Doctor deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete doctor');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink-800">Doctors</h1>
        <Link to="/admin/doctors/add" className="btn-primary"><MdAdd /> Add doctor</Link>
      </div>

      <div className="relative mt-4 max-w-md">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input className="input pl-9" placeholder="Search doctors..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card mt-6 overflow-x-auto">
        {loading ? <LoadingState /> : doctors.length === 0 ? <EmptyState title="No doctors found" /> : (
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 text-left text-ink-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">License</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {doctors.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium text-ink-800">Dr. {d.firstName} {d.lastName}</td>
                  <td className="px-4 py-3 text-ink-500">{d.department?.name}</td>
                  <td className="px-4 py-3 text-ink-500">{d.medicalLicenseNo}</td>
                  <td className="px-4 py-3 text-ink-500">${Number(d.consultationFee).toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${d.isActive ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'bg-ink-100 text-ink-500'}`}>
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toggleStatus(d)} title={d.isActive ? 'Deactivate' : 'Activate'} className="text-ink-400 hover:text-brand-600">
                        {d.isActive ? <MdToggleOn size={22} /> : <MdToggleOff size={22} />}
                      </button>
                      <button onClick={() => remove(d)} title="Delete" className="text-ink-400 hover:text-red-600">
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
