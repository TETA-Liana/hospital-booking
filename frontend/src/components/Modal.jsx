import React from 'react';
import { MdClose } from 'react-icons/md';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4" onClick={onClose}>
      <div
        className={`card w-full ${sizes[size]} max-h-[90vh] overflow-y-auto p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-ink-800">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
            <MdClose size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
