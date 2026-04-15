import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { MdNotifications, MdLogout, MdMenu, MdClose, MdLocalHospital } from 'react-icons/md';
import { useAuth } from '../context/AuthContext.jsx';
import { NAV_CONFIG, ROLE_BASE_PATH } from '../utils/navConfig.js';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const basePath = ROLE_BASE_PATH[user.role];
  const navItems = NAV_CONFIG[user.role] || [];

  async function loadNotifications() {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data);
      setUnreadCount(data.meta?.unreadCount || 0);
    } catch (err) {
      /* silent */
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function markAllRead() {
    await api.put('/notifications/read-all');
    loadNotifications();
  }

  async function handleLogout() {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-ink-900 text-ink-100 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-6 py-5">
          <MdLocalHospital className="h-7 w-7 text-brand-400" />
          <span className="font-display text-lg text-white">City General</span>
        </div>
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={`${basePath}/${item.to}`}
                end={item.to === ''}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-600 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-ink-800 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-300 hover:bg-ink-800 hover:text-white"
          >
            <MdLogout size={18} /> Log out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <MdMenu size={24} className="text-ink-600" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-full p-2 text-ink-500 hover:bg-ink-100"
              >
                <MdNotifications size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-ink-100 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                    <span className="text-sm font-medium text-ink-700">Notifications</span>
                    <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-ink-400">No notifications yet</p>
                    )}
                    {notifications.map((n) => (
                      <div key={n.id} className={`border-b border-ink-50 px-4 py-3 text-sm ${!n.isRead ? 'bg-brand-50/50' : ''}`}>
                        <p className="font-medium text-ink-700">{n.title}</p>
                        <p className="mt-0.5 text-xs text-ink-500">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <div className="hidden text-sm sm:block">
                <p className="font-medium text-ink-700">{user.email}</p>
                <p className="text-xs text-ink-400">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
