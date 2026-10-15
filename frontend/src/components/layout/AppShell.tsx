import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet, Navigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { 
  LayoutDashboard, 
  QrCode, 
  Calendar, 
  FileSpreadsheet, 
  User 
} from 'lucide-react';

export function AppShell() {
  const { token, isLoading, portalMode } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCompact, setSidebarCompact] = useState(false);

  const isUserPortalMobile = portalMode === 'user' && !location.pathname.startsWith('/admin');

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-page">
        <div className="flex flex-col items-center space-y-4">
          <img src="/logo.ico" alt="Logo Kurma Group" className="w-12 h-12 object-contain" />
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-text-muted">Memuat HRIS Kurma Group...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCompact={isSidebarCompact}
        toggleCompact={() => setSidebarCompact(!isSidebarCompact)}
      />
      
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className={`flex-1 overflow-y-auto ${isUserPortalMobile ? 'pb-20 lg:pb-0' : ''}`}>
          <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Navigasi Bawah Khusus Tampilan Mobile Portal Karyawan (5 Menu) */}
      {isUserPortalMobile && (
        <nav 
          aria-label="Navigasi Bawah Portal Karyawan"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border-default flex items-center justify-around h-16 px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] transition-colors
              ${isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-text-primary font-medium'}
            `}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="truncate">Dashboard</span>
          </NavLink>

          <NavLink
            to="/absensi"
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] transition-colors
              ${isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-text-primary font-medium'}
            `}
          >
            <QrCode className="w-5 h-5 mb-0.5" />
            <span className="truncate">Absensi</span>
          </NavLink>

          <NavLink
            to="/cuti"
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] transition-colors
              ${isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-text-primary font-medium'}
            `}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="truncate">Izin</span>
          </NavLink>

          <NavLink
            to="/daily-report"
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] transition-colors
              ${isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-text-primary font-medium'}
            `}
          >
            <FileSpreadsheet className="w-5 h-5 mb-0.5" />
            <span className="truncate">Daily Report</span>
          </NavLink>

          <NavLink
            to="/profil"
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] transition-colors
              ${isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-text-primary font-medium'}
            `}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="truncate">Profil</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}
