import React from 'react';

const STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  CONFIRMED: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  REJECTED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  CANCELLED: 'bg-ink-100 text-ink-600 ring-1 ring-ink-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  NO_SHOW: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  ACTIVE: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  INACTIVE: 'bg-ink-100 text-ink-600 ring-1 ring-ink-200',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  SUSPENDED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-ink-100 text-ink-600 ring-1 ring-ink-200';
  return <span className={`badge ${cls}`}>{status?.replace(/_/g, ' ')}</span>;
}
