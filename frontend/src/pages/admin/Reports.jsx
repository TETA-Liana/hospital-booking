import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';

export default function Reports() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/admin/reports', { params: { from, to } }).then(({ data }) => setReport(data.data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-800">Reports</h1>
        <p className="text-ink-500">Appointment trends across the hospital.</p>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={load} className="btn-primary">Apply</button>
      </div>

      {loading ? <LoadingState /> : report && (
        <>
          <div className="card p-6">
            <h2 className="font-display text-lg text-ink-800">Daily appointment volume</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e9ec" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#279d8f" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h2 className="font-display text-lg text-ink-800">By department</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.byDepartment} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="department" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#279d8f" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-display text-lg text-ink-800">By doctor</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.byDoctor} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="doctor" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#45b9aa" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg text-ink-800">By status</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {report.byStatus.map((s) => (
                <div key={s.status} className="rounded-lg border border-ink-100 p-4 text-center">
                  <p className="font-display text-2xl text-ink-800">{s.count}</p>
                  <p className="text-xs text-ink-500">{s.status.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
