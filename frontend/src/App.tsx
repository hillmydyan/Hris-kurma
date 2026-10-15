import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { AuthLayout } from './components/layout/AuthLayout';
import { DesignSystem } from './pages/DesignSystem';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { NotFound } from './pages/system/NotFound';
import { Dashboard } from './pages/Dashboard';

// User Portal Pages
import { MyProfile } from './pages/employee/MyProfile';
import { MyAttendance } from './pages/attendance/MyAttendance';
import { MyLeave } from './pages/leave/MyLeave';
import { DailyReport } from './pages/daily-report/DailyReport';
import { Notifications } from './pages/system/Notifications';

// Management Backend Pages
import { AdminAttendance } from './pages/attendance/AdminAttendance';
import { QrScreen } from './pages/attendance/QrScreen';
import { DailyReportReview } from './pages/daily-report/DailyReportReview';
import { Approval } from './pages/attendance/Approval';
import { WeekendRoster } from './pages/attendance/WeekendRoster';
import { EmployeeList } from './pages/employee/EmployeeList';
import { EmployeeForm } from './pages/employee/EmployeeForm';
import { EmployeeDetail } from './pages/employee/EmployeeDetail';
import { Payroll } from './pages/payroll/Payroll';
import { RbacManagement } from './pages/system/RbacManagement';
import { UserManagement } from './pages/system/UserManagement';
import { Settings } from './pages/system/Settings';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Outlet } from 'react-router-dom';
import { useAuth, isManagerOnly } from './context/AuthContext';

function ManagementRoute({ children }: { children: React.ReactNode }) {
  const { canAccessBackend, isLoading } = useAuth();
  if (isLoading) return null;
  if (!canAccessBackend) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AdminIndexRoute() {
  const { user } = useAuth();
  if (isManagerOnly(user)) {
    return <Navigate to="/admin/absensi/live" replace />;
  }
  return <Dashboard />;
}

function HrOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (isManagerOnly(user)) {
    return <Navigate to="/admin/absensi/live" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          
          {/* Main App with Dual-Portal Shell */}
          <Route path="/" element={<AppShell />}>
            {/* === USER PORTAL === */}
            <Route index element={<Dashboard />} />
            <Route path="profil" element={<MyProfile />} />
            <Route path="absensi" element={<MyAttendance />} />
            <Route path="cuti" element={<MyLeave />} />
            <Route path="daily-report" element={<DailyReport />} />
            <Route path="notifikasi" element={<Notifications />} />

            {/* === MANAGEMENT BACKEND - Restricted to Authorized Managers/HR/Admin === */}
            <Route path="admin" element={<ManagementRoute><Outlet /></ManagementRoute>}>
              <Route index element={<AdminIndexRoute />} />
              <Route path="absensi/live" element={<AdminAttendance />} />
              <Route path="absensi/qr-screen" element={<QrScreen />} />
              <Route path="daily-reports/review" element={<DailyReportReview />} />
              <Route path="roster-weekend" element={<HrOnlyRoute><WeekendRoster /></HrOnlyRoute>} />
              <Route path="persetujuan" element={<HrOnlyRoute><Approval /></HrOnlyRoute>} />
              <Route path="karyawan">
                <Route index element={<HrOnlyRoute><EmployeeList /></HrOnlyRoute>} />
                <Route path="tambah" element={<HrOnlyRoute><EmployeeForm /></HrOnlyRoute>} />
                <Route path=":id/edit" element={<HrOnlyRoute><EmployeeForm /></HrOnlyRoute>} />
                <Route path=":id" element={<HrOnlyRoute><EmployeeDetail /></HrOnlyRoute>} />
              </Route>
              <Route path="penggajian" element={<HrOnlyRoute><Payroll /></HrOnlyRoute>} />
              <Route path="users" element={<HrOnlyRoute><UserManagement /></HrOnlyRoute>} />
              <Route path="rbac" element={<HrOnlyRoute><RbacManagement /></HrOnlyRoute>} />
              <Route path="notifikasi" element={<HrOnlyRoute><Notifications /></HrOnlyRoute>} />
              <Route path="pengaturan" element={<HrOnlyRoute><Settings /></HrOnlyRoute>} />
            </Route>

            {/* Backwards compatibility aliases */}
            <Route path="tugas" element={<Navigate to="/daily-report" replace />} />
            <Route path="riwayat" element={<Navigate to="/absensi" replace />} />
            <Route path="users" element={<Navigate to="/admin/users" replace />} />
            <Route path="karyawan/tambah" element={<Navigate to="/admin/karyawan/tambah" replace />} />
            <Route path="karyawan/:id/edit" element={<Navigate to="/admin/karyawan/:id/edit" replace />} />
            <Route path="karyawan/:id" element={<Navigate to="/admin/karyawan/:id" replace />} />
            <Route path="karyawan" element={<Navigate to="/admin/karyawan" replace />} />
            <Route path="karyawan/*" element={<Navigate to="/admin/karyawan" replace />} />
            <Route path="penggajian" element={<Navigate to="/admin/penggajian" replace />} />
            <Route path="persetujuan" element={<Navigate to="/admin/persetujuan" replace />} />
            <Route path="pengaturan" element={<Navigate to="/admin/pengaturan" replace />} />
            {import.meta.env.DEV && <Route path="design-system" element={<DesignSystem />} />}

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
