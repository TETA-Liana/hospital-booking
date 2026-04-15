import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-3xl text-ink-800">Access denied</h1>
      <p className="mt-2 text-ink-500">You don&rsquo;t have permission to view this page.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
