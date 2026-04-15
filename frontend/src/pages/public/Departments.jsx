import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="font-display text-3xl text-ink-800">Departments</h1>
      <p className="mt-1 text-ink-500">Explore the areas of care available at City General Hospital.</p>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <Link
              key={d.id}
              to={`/doctors?departmentId=${d.id}`}
              className="card p-6 transition-shadow hover:shadow-md"
            >
              <h3 className="font-display text-lg text-ink-800">{d.name}</h3>
              <p className="mt-1 text-sm text-ink-500">{d.description}</p>
              <p className="mt-4 text-xs font-medium text-brand-600">{d._count?.doctors ?? 0} doctors &rarr;</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
