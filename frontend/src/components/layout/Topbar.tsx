import React, { useState, useEffect } from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    api.get('/notifications')
      .then(res => {
        if (isMounted && typeof res.data?.unread_count === 'number') {
          setUnreadCount(res.data.unread_count);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <header className="h-16 bg-surface border-b border-border-default flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
      {/* Sisi Kiri: Menu Drawer Mobile & Brand Mobile */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-md text-text-secondary hover:bg-subtle lg:hidden focus:outline-none focus:ring-2 focus:ring-primary min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <img src="/logo.ico" alt="Logo Kurma Group" className="w-6 h-6 object-contain rounded" />
          <span className="font-semibold text-text-primary text-sm tracking-tight">HRIS Kurma</span>
        </div>
      </div>

      {/* Sisi Kanan: Notifikasi & Avatar Profil */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Notifikasi */}
        <Link 
          to="/notifikasi"
          className="relative p-2 rounded-md text-text-secondary hover:bg-subtle hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label={`${unreadCount} notifikasi`}
          title={`${unreadCount} notifikasi belum dibaca`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 px-1 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold text-white bg-danger rounded-full ring-2 ring-surface">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Link>

        {/* Avatar Kecil Menuju Profil */}
        <Link 
          to="/profil"
          className="p-1 rounded-full hover:ring-2 hover:ring-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label={`Profil ${user?.name || 'Pengguna'}`}
          title={`Profil: ${user?.name || 'Pengguna'}`}
        >
          <div className="w-8 h-8 rounded-full bg-primary-soft text-primary font-semibold flex items-center justify-center shrink-0 text-xs border border-primary/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Topbar;
