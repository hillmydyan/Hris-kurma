import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AuthLayout } from './components/layout/AuthLayout';
import { DesignSystem } from './pages/DesignSystem';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { NotFound } from './pages/system/NotFound';
import { Dashboard } from './pages/Dashboard';
import { EmployeeList } from './pages/employee/EmployeeList';
import { EmployeeForm } from './pages/employee/EmployeeForm';
import { EmployeeDetail } from './pages/employee/EmployeeDetail';
import { MyAttendance } from './pages/attendance/MyAttendance';
import { AdminAttendance } from './pages/attendance/AdminAttendance';
import { Approval } from './pages/attendance/Approval';
import { MyLeave } from './pages/leave/MyLeave';
import { Tasks } from './pages/task/Tasks';
import { Kpi } from './pages/kpi/Kpi';
import { Reports } from './pages/report/Reports';
import { Settings } from './pages/system/Settings';
import { Notifications } from './pages/system/Notifications';
import { Payroll } from './pages/payroll/Payroll';
import { Recruitment } from './pages/recruitment/Recruitment';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="design-system" element={<DesignSystem />} />
          <Route path="absensi">
            <Route index element={<MyAttendance />} />
            <Route path="admin" element={<AdminAttendance />} />
          </Route>
          <Route path="cuti" element={<MyLeave />} />
          <Route path="tugas" element={<Tasks />} />
          <Route path="kpi" element={<Kpi />} />
          <Route path="karyawan">
            <Route index element={<EmployeeList />} />
            <Route path="tambah" element={<EmployeeForm />} />
            <Route path=":id/edit" element={<EmployeeForm />} />
            <Route path=":id" element={<EmployeeDetail />} />
          </Route>
          <Route path="persetujuan" element={<Approval />} />
          <Route path="penggajian" element={<Payroll />} />
          <Route path="rekrutmen" element={<Recruitment />} />
          <Route path="laporan" element={<Reports />} />
          <Route path="notifikasi" element={<Notifications />} />
          <Route path="pengaturan" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
