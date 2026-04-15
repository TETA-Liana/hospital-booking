import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MdSearch, MdArrowForward } from 'react-icons/md';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [departmentId, setDepartmentId] = useState(searchParams.get('departmentId') || '');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (departmentId) params.departmentId = departmentId;
    api
      .get('/doctors', { params })
      .then(({ data }) => setDoctors(data.data))
      .finally(() => setLoading(false));
  }, [search, departmentId]);

  function goToBooking(doctorId) {
    if (user?.role === 'PATIENT') navigate(`/patient/book?doctorId=${doctorId}`);
    else navigate(`/doctors/${doctorId}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="font-display text-3xl text-ink-800">Find a doctor</h1>
      <p className="mt-1 text-ink-500">Search by name or filter by department to see live availability.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search by doctor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-64" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-8">
        {loading ? (
          <LoadingState />
        ) : doctors.length === 0 ? (
          <EmptyState title="No doctors found" description="Try a different search term or department." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doc) => (
              <div key={doc.id} className="card flex flex-col p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 font-display text-lg text-brand-700">
                    {doc.firstName[0]}{doc.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-ink-800">Dr. {doc.firstName} {doc.lastName}</p>
                    <p className="text-xs text-ink-400">{doc.department?.name}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {doc.specialties?.slice(0, 2).map((s) => (
                    <span key={s.id} className="badge bg-ink-100 text-ink-600">{s.name}</span>
                  ))}
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-ink-500">{doc.biography || 'No biography provided yet.'}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-ink-500">{doc.yearsOfExperience} yrs experience</span>
                  <span className="font-medium text-ink-800">${Number(doc.consultationFee).toFixed(0)} / visit</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to={`/doctors/${doc.id}`} className="btn-secondary flex-1">View profile</Link>
                  <button onClick={() => goToBooking(doc.id)} className="btn-primary flex-1">
                    Book <MdArrowForward />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
