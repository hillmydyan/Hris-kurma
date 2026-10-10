import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  CheckSquare, 
  Target, 
  Users, 
  FileBarChart, 
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Wallet,
  Briefcase
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCompact: boolean;
  toggleCompact: () => void;
}

export function Sidebar({ isOpen, onClose, isCompact, toggleCompact }: SidebarProps) {
  const menuGroups = [
    {
      title: 'Saya',
      items: [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard /> },
        { name: 'Absensi', path: '/absensi', icon: <Clock /> },
        { name: 'Cuti & Izin', path: '/cuti', icon: <Calendar /> },
        { name: 'Tugas', path: '/tugas', icon: <CheckSquare /> },
        { name: 'KPI', path: '/kpi', icon: <Target /> },
      ]
    },
    {
      title: 'Tim',
      items: [
        { name: 'Persetujuan', path: '/persetujuan', icon: <ShieldCheck />, badge: 4 },
        { name: 'Absensi Tim', path: '/tim/absensi', icon: <Users /> },
      ]
    },
    {
      title: 'Perusahaan',
      items: [
        { name: 'Karyawan', path: '/karyawan', icon: <Users /> },
        { name: 'Absensi Admin', path: '/absensi/admin', icon: <Clock /> },
        { name: 'Penggajian', path: '/penggajian', icon: <Wallet /> },
        { name: 'Rekrutmen', path: '/rekrutmen', icon: <Briefcase /> },
        { name: 'Laporan', path: '/laporan', icon: <FileBarChart /> },
      ]
    },
    {
      title: 'Sistem',
      items: [
        { name: 'Pengaturan', path: '/pengaturan', icon: <Settings /> },
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-text-primary/50 lg:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 bg-surface border-r border-border-default flex flex-col transition-all duration-250 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCompact ? 'w-[72px]' : 'w-[256px]'}
        `}
      >
        <div className="flex h-16 items-center px-4 border-b border-border-default shrink-0">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
            <span className="text-surface font-bold text-sm">KG</span>
          </div>
          {!isCompact && (
            <span className="ml-3 font-semibold text-text-primary truncate">HRIS Kurma</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              {!isCompact && (
                <h3 className="px-3 mb-2 text-caption font-semibold text-text-muted uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <nav className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => { if(window.innerWidth < 1024) onClose(); }}
                    className={({ isActive }) => `
                      flex items-center px-3 h-10 rounded-md transition-colors relative group
                      ${isActive 
                        ? 'bg-primary-soft text-primary font-medium' 
                        : 'text-text-secondary hover:bg-subtle hover:text-text-primary'
                      }
                      ${isCompact ? 'justify-center' : ''}
                    `}
                    title={isCompact ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !isCompact && (
                          <div className="absolute left-0 top-1 bottom-1 w-1 bg-primary rounded-r-md" />
                        )}
                        <span className={`[&>svg]:w-5 [&>svg]:h-5 ${isCompact ? '' : 'mr-3'}`}>
                          {item.icon}
                        </span>
                        {!isCompact && (
                          <span className="text-label truncate">{item.name}</span>
                        )}
                        {!isCompact && item.badge && (
                          <span className="ml-auto bg-primary text-surface text-[10px] px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-border-default hidden lg:block shrink-0">
          <button
            onClick={toggleCompact}
            className="flex items-center justify-center w-full h-10 rounded-md text-text-secondary hover:bg-subtle hover:text-text-primary transition-colors"
          >
            {isCompact ? <ChevronRight className="w-5 h-5" /> : <div className="flex items-center"><ChevronLeft className="w-5 h-5 mr-2" /> <span className="text-label">Ringkas</span></div>}
          </button>
        </div>
      </aside>
    </>
  );
}
