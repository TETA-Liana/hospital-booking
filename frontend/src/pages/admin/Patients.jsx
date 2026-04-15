import React, { useEffect, useState } from 'react';
import { MdSearch } from 'react-icons/md';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.get('/patients', { params: { search, pageSize: 100 } }).then(({ data }) => setPatients(data.data)).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink-800">Patients</h1>
      <div className="relative mt-4 max-w-md">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input className="input pl-9" placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="card mt-6 overflow-x-auto">
        {loading ? <LoadingState /> : patients.length === 0 ? <EmptyState title="No patients found" /> : (
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 text-left text-ink-500">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Registered</th></tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {patients.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-ink-800">{p.firstName} {p.lastName}</td>
                  <td className="px-4 py-3 text-ink-500">{p.user?.email}</td>
                  <td className="px-4 py-3 text-ink-500">{p.phone || '—'}</td>
                  <td className="px-4 py-3"><span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">{p.user?.status}</span></td>
                  <td className="px-4 py-3 text-ink-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
