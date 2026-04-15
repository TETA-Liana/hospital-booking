import React from 'react';

export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ink-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
      {label}
    </div>
  );
}
