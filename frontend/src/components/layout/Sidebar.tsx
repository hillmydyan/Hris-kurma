import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  QrCode, 
  Calendar, 
  FileSpreadsheet, 
  Bell, 
  User, 
  Users, 
  Tv, 
  CheckCheck, 
  Wallet, 
  ShieldCheck, 
  Sliders, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeftRight,
  LogOut,
  UserCog
} from 'lucide-react';
import { useAuth, isManagerOnly } from '../../context/AuthContext';
import api from '../../lib/api';

interface SidebarMenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarMenuGroup {
  title: string;
  items: SidebarMenuItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCompact: boolean;
  toggleCompact: () => void;
}

export function Sidebar({ isOpen, onClose, isCompact, toggleCompact }: SidebarProps) {
  const { user, portalMode, switchPortal, canAccessBackend, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number>(0);

  const isManager = isManagerOnly(user);

  useEffect(() => {
    if (canAccessBackend) {
      let isMounted = true;
      api.get('/dashboard/overview')
        .then(res => {
          if (isMounted && typeof res.data?.total_pending === 'number') {
            setPendingApprovalCount(res.data.total_pending);
          }
        })
        .catch(() => {});
      return () => { isMounted = false; };
    }
  }, [canAccessBackend, portalMode]);

  const handlePortalSwitch = (mode: 'user' | 'management') => {
    switchPortal(mode);
    if (mode === 'management') {
      if (isManager) {
        navigate('/admin/daily-reports/review');
      } else {
        navigate('/admin');
      }
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // User Portal Menus
  const userPortalMenuGroups: SidebarMenuGroup[] = [
    {
      title: 'Portal Karyawan',
      items: [
        { name: 'Dashboard Saya', path: '/', icon: <LayoutDashboard /> },
        { name: 'Profil Saya', path: '/profil', icon: <User /> },
        { name: 'Absensi QR', path: '/absensi', icon: <QrCode /> },
        { name: 'Pengajuan Izin', path: '/cuti', icon: <Calendar /> },
        { name: 'Daily Report', path: '/daily-report', icon: <FileSpreadsheet /> },
        ...(isManager ? [
          { name: 'Monitoring Daily Report', path: '/admin/daily-reports/review', icon: <FileSpreadsheet />, badge: 'Tim' }
        ] : []),
        { name: 'Notifikasi & Info', path: '/notifikasi', icon: <Bell /> },
      ]
    }
  ];

  // Management Menus for Manager Only (Restricted to Daily Report Monitoring ONLY)
  const managerMenuGroups: SidebarMenuGroup[] = [
    {
      title: 'Monitoring Kinerja',
      items: [
        { name: 'Catatan Daily Report', path: '/admin/daily-reports/review', icon: <FileSpreadsheet /> },
      ]
    }
  ];

  // Management Backend Menus for HR & Direksi / Owner
  const fullManagementMenuGroups: SidebarMenuGroup[] = [
    {
      title: 'Operasional & Live',
      items: [
        { name: 'Dashboard Eksekutif', path: '/admin', icon: <LayoutDashboard /> },
        { name: 'Monitor Absensi Live', path: '/admin/absensi/live', icon: <Tv /> },
        { name: 'Layar QR Kantor', path: '/admin/absensi/qr-screen', icon: <QrCode /> },
        { name: 'Roster Akhir Pekan', path: '/admin/roster-weekend', icon: <Calendar /> },
        { name: 'Catatan Daily Report', path: '/admin/daily-reports/review', icon: <FileSpreadsheet /> },
        { 
          name: 'Persetujuan', 
          path: '/admin/persetujuan', 
          icon: <CheckCheck />, 
          badge: pendingApprovalCount > 0 ? String(pendingApprovalCount) : undefined 
        },
      ]
    },
    {
      title: 'Manajemen SDM',
      items: [
        { name: 'Data Karyawan', path: '/admin/karyawan', icon: <Users /> },
        { name: 'Manajemen Payroll', path: '/admin/penggajian', icon: <Wallet /> },
      ]
    },
    {
      title: 'Sistem & Konfigurasi',
      items: [
        { name: 'Manajemen User', path: '/admin/users', icon: <UserCog /> },
        { name: 'Role & Hak Akses', path: '/admin/rbac', icon: <ShieldCheck /> },
        { name: 'Broadcast Notifikasi', path: '/admin/notifikasi', icon: <Bell /> },
        { name: 'Pengaturan & Audit', path: '/admin/pengaturan', icon: <Sliders /> },
      ]
    }
  ];

  const managementMenuGroups = isManager ? managerMenuGroups : fullManagementMenuGroups;
  const isManagement = Boolean(canAccessBackend && portalMode === 'management');
  const currentMenuGroups = isManagement ? managementMenuGroups : userPortalMenuGroups;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 bg-surface border-r border-border-default flex flex-col transition-all duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCompact ? 'w-20' : 'w-64'}
        `}
      >
        {/* Brand Header: Logo + Title saja tanpa badge dobel */}
        <div className="flex h-16 items-center px-4 border-b border-border-default shrink-0">
          <div className="flex items-center min-w-0">
            <img 
              src="/logo.ico" 
              alt="Logo Kurma Group" 
              className="w-8 h-8 rounded-md object-contain shrink-0" 
            />
            {!isCompact && (
              <span className="ml-3 font-semibold text-text-primary text-base tracking-tight truncate">
                HRIS Kurma
              </span>
            )}
          </div>
        </div>

        {/* Portal Switcher: Segmented Pill Ringkas */}
        {canAccessBackend && !isCompact && (
          <div className="p-3 border-b border-border-default">
            <div className="bg-subtle p-1 rounded-md flex gap-1">
              <button
                type="button"
                onClick={() => handlePortalSwitch('user')}
                className={`flex-1 py-1 px-2 rounded text-xs transition-colors ${
                  portalMode === 'user'
                    ? 'bg-surface text-primary shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text-primary font-medium'
                }`}
              >
                Karyawan
              </button>
              <button
                type="button"
                onClick={() => handlePortalSwitch('management')}
                className={`flex-1 py-1 px-2 rounded text-xs transition-colors ${
                  portalMode === 'management'
                    ? 'bg-surface text-primary shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text-primary font-medium'
                }`}
              >
                Backend HR
              </button>
            </div>
          </div>
        )}

        {/* Compact Switcher button when collapsed */}
        {canAccessBackend && isCompact && (
          <div className="p-2 border-b border-border-default flex justify-center">
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() => handlePortalSwitch(portalMode === 'user' ? 'management' : 'user')}
                aria-label={portalMode === 'user' ? 'Beralih ke Backend HR' : 'Beralih ke Portal Karyawan'}
                className="w-10 h-10 rounded-md flex items-center justify-center text-text-secondary hover:text-primary hover:bg-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <div 
                role="tooltip"
                className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
              >
                {portalMode === 'user' ? 'Beralih ke Backend HR' : 'Beralih ke Portal Karyawan'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {currentMenuGroups.map((group, idx) => (
            <div key={idx}>
              {!isCompact && (
                <h3 className="px-3 mb-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <nav className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.path === '/' || item.path === '/admin'}
                    onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                    aria-label={item.name}
                    className={({ isActive }) => `
                      group flex items-center px-3 h-9 rounded-md transition-colors relative text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring
                      ${isActive 
                        ? 'bg-primary-soft text-primary font-medium' 
                        : 'text-text-secondary hover:bg-subtle hover:text-text-primary font-normal'
                      }
                      ${isCompact ? 'justify-center' : ''}
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !isCompact && (
                          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" />
                        )}
                        <span className={`relative [&>svg]:w-4 [&>svg]:h-4 ${isCompact ? '' : 'mr-2.5'} ${
                          isActive ? 'text-primary' : 'text-text-muted'
                        }`}>
                          {item.icon}
                          {isCompact && item.badge && (
                            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface" />
                          )}
                        </span>
                        {!isCompact && (
                          <span className="truncate flex-1">{item.name}</span>
                        )}
                        {!isCompact && item.badge && (
                          <span className="ml-2 text-[11px] font-medium px-1.5 py-0.2 rounded-full bg-primary-soft text-primary">
                            {item.badge}
                          </span>
                        )}

                        {/* Floating Tooltip for Compact Sidebar */}
                        {isCompact && (
                          <div 
                            role="tooltip"
                            className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap flex items-center gap-1.5"
                          >
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.2 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* User Profile & Logout di bagian bawah sidebar */}
        <div className="p-3 border-t border-border-default shrink-0 bg-surface">
          {!isCompact ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center min-w-0">
                <div className="w-8 h-8 rounded-full bg-subtle text-text-primary flex items-center justify-center font-semibold text-xs shrink-0 border border-border-default">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="ml-2.5 truncate">
                  <p className="text-xs font-semibold text-text-primary truncate">{user?.name || 'User Kurma'}</p>
                  <p className="text-[11px] text-text-muted truncate">
                    {user?.employee?.current_assignment?.department?.name || user?.roles?.[0] || 'Staff'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={toggleCompact}
                  className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-subtle transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="Perkecil sidebar"
                  title="Perkecil menu"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-danger hover:bg-danger-bg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="Keluar dari sistem"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={toggleCompact}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring"
                  aria-label="Buka menu"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div 
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
                >
                  Buka menu
                </div>
              </div>

              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-danger hover:bg-danger-bg transition-colors focus:outline-none focus:ring-2 focus:ring-danger"
                  aria-label="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div 
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
                >
                  Keluar
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
