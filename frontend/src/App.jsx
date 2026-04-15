import React from 'react';
import { Routes, Route } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

import Landing from './pages/public/Landing.jsx';
import DoctorsList from './pages/public/DoctorsList.jsx';
import DoctorProfile from './pages/public/DoctorProfile.jsx';
import Departments from './pages/public/Departments.jsx';
import Unauthorized from './pages/public/Unauthorized.jsx';
import NotFound from './pages/public/NotFound.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';

import PatientDashboard from './pages/patient/Dashboard.jsx';
import BookAppointment from './pages/patient/BookAppointment.jsx';
import MyAppointments from './pages/patient/MyAppointments.jsx';
import PatientProfile from './pages/patient/Profile.jsx';

import DoctorDashboard from './pages/doctor/Dashboard.jsx';
import DoctorAppointments from './pages/doctor/Appointments.jsx';
import DoctorAvailability from './pages/doctor/Availability.jsx';
import DoctorProfileEdit from './pages/doctor/Profile.jsx';

import ReceptionistDashboard from './pages/receptionist/Dashboard.jsx';
import RegisterPatient from './pages/receptionist/RegisterPatient.jsx';
import CreateAppointment from './pages/receptionist/CreateAppointment.jsx';
import ReceptionistPatients from './pages/receptionist/Patients.jsx';
import ReceptionistAppointments from './pages/receptionist/Appointments.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminDoctors from './pages/admin/Doctors.jsx';
import AddDoctor from './pages/admin/AddDoctor.jsx';
import AdminDepartments from './pages/admin/Departments.jsx';
import AdminSpecialties from './pages/admin/Specialties.jsx';
import AdminPatients from './pages/admin/Patients.jsx';
import AdminStaff from './pages/admin/Staff.jsx';
import AdminAppointments from './pages/admin/Appointments.jsx';
import Reports from './pages/admin/Reports.jsx';
import AuditLogs from './pages/admin/AuditLogs.jsx';
import AdminSettings from './pages/admin/Settings.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/doctors" element={<DoctorsList />} />
        <Route path="/doctors/:id" element={<DoctorProfile />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      {/* Patient */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute roles={['PATIENT']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientDashboard />} />
        <Route path="book" element={<BookAppointment />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="doctors" element={<DoctorsList />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      {/* Doctor */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute roles={['DOCTOR']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="availability" element={<DoctorAvailability />} />
        <Route path="profile" element={<DoctorProfileEdit />} />
      </Route>

      {/* Receptionist */}
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute roles={['RECEPTIONIST']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ReceptionistDashboard />} />
        <Route path="register-patient" element={<RegisterPatient />} />
        <Route path="create-appointment" element={<CreateAppointment />} />
        <Route path="patients" element={<ReceptionistPatients />} />
        <Route path="appointments" element={<ReceptionistAppointments />} />
      </Route>

      {/* Admin / Super Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="doctors/add" element={<AddDoctor />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="staff" element={<AdminStaff />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="specialties" element={<AdminSpecialties />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
