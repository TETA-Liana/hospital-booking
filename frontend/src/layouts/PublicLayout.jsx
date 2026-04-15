import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { MdLocalHospital } from 'react-icons/md';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_BASE_PATH } from '../utils/navConfig.js';

export default function PublicLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <MdLocalHospital className="h-7 w-7 text-brand-600" />
            <span className="font-display text-xl text-ink-800">City General</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-ink-600 md:flex">
            <Link to="/" className="hover:text-brand-700">Home</Link>
            <Link to="/doctors" className="hover:text-brand-700">Doctors</Link>
            <Link to="/departments" className="hover:text-brand-700">Departments</Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <button className="btn-primary" onClick={() => navigate(`${ROLE_BASE_PATH[user.role]}`)}>
                Go to dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Log in</Link>
                <Link to="/register" className="btn-primary">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-ink-100 bg-white py-8 text-center text-sm text-ink-400">
        &copy; {new Date().getFullYear()} City General Hospital. All rights reserved.
      </footer>
    </div>
  );
}
