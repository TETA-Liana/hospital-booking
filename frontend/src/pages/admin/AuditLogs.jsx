import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../../services/api';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs', { params: { pageSize: 100 } }).then(({ data }) => setLogs(data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink-800">Audit logs</h1>
      <p className="mt-1 text-ink-500">A record of important administrative actions across the system.</p>

      <div className="card mt-6 overflow-x-auto">
        {loading ? <LoadingState /> : logs.length === 0 ? <EmptyState title="No audit entries yet" /> : (
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 text-left text-ink-500">
              <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th></tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-ink-500">{format(new Date(l.createdAt), 'MMM d, yyyy HH:mm')}</td>
                  <td className="px-4 py-3 text-ink-700">{l.user?.email || 'System'}</td>
                  <td className="px-4 py-3 font-medium text-ink-800">{l.action.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-ink-500">{l.entityType} {l.entityId ? `#${l.entityId.slice(0, 8)}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
