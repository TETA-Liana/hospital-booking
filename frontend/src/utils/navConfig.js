import {
  MdDashboard, MdPeople, MdEventNote, MdMedicalServices, MdCalendarToday,
  MdApartment, MdLocalHospital, MdBarChart, MdHistory, MdSettings,
  MdPersonAdd, MdNotifications, MdPerson, MdGroups, MdAssignment,
} from 'react-icons/md';

// Sidebar navigation items per role. `to` is relative to the role's base path.
export const NAV_CONFIG = {
  ADMIN: [
    { to: '', label: 'Dashboard', icon: MdDashboard },
    { to: 'doctors', label: 'Doctors', icon: MdMedicalServices },
    { to: 'patients', label: 'Patients', icon: MdPeople },
    { to: 'staff', label: 'Staff', icon: MdGroups },
    { to: 'departments', label: 'Departments', icon: MdApartment },
    { to: 'specialties', label: 'Specialties', icon: MdLocalHospital },
    { to: 'appointments', label: 'Appointments', icon: MdEventNote },
    { to: 'reports', label: 'Reports', icon: MdBarChart },
    { to: 'audit-logs', label: 'Audit Logs', icon: MdHistory },
    { to: 'settings', label: 'Settings', icon: MdSettings },
  ],
  SUPER_ADMIN: [
    { to: '', label: 'Dashboard', icon: MdDashboard },
    { to: 'doctors', label: 'Doctors', icon: MdMedicalServices },
    { to: 'patients', label: 'Patients', icon: MdPeople },
    { to: 'staff', label: 'Staff', icon: MdGroups },
    { to: 'departments', label: 'Departments', icon: MdApartment },
    { to: 'specialties', label: 'Specialties', icon: MdLocalHospital },
    { to: 'appointments', label: 'Appointments', icon: MdEventNote },
    { to: 'reports', label: 'Reports', icon: MdBarChart },
    { to: 'audit-logs', label: 'Audit Logs', icon: MdHistory },
    { to: 'settings', label: 'Settings', icon: MdSettings },
  ],
  DOCTOR: [
    { to: '', label: 'Dashboard', icon: MdDashboard },
    { to: 'appointments', label: 'Appointments', icon: MdEventNote },
    { to: 'availability', label: 'Availability', icon: MdCalendarToday },
    { to: 'profile', label: 'Profile', icon: MdPerson },
  ],
  PATIENT: [
    { to: '', label: 'Dashboard', icon: MdDashboard },
    { to: 'book', label: 'Book Appointment', icon: MdAssignment },
    { to: 'appointments', label: 'My Appointments', icon: MdEventNote },
    { to: 'doctors', label: 'Doctors', icon: MdMedicalServices },
    { to: 'profile', label: 'Profile', icon: MdPerson },
  ],
  RECEPTIONIST: [
    { to: '', label: 'Dashboard', icon: MdDashboard },
    { to: 'register-patient', label: 'Register Patient', icon: MdPersonAdd },
    { to: 'patients', label: 'Patients', icon: MdPeople },
    { to: 'create-appointment', label: 'Create Appointment', icon: MdAssignment },
    { to: 'appointments', label: 'Appointments', icon: MdEventNote },
  ],
};

export const ROLE_BASE_PATH = {
  ADMIN: '/admin',
  SUPER_ADMIN: '/admin',
  DOCTOR: '/doctor',
  PATIENT: '/patient',
  RECEPTIONIST: '/receptionist',
};
