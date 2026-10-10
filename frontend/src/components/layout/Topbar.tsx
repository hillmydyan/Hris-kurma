import React from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="h-16 bg-surface border-b border-border-default flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
      <div className="flex items-center flex-1">
        <button 
          onClick={onMenuClick}
          className="mr-4 p-2 -ml-2 rounded-md text-text-secondary hover:bg-subtle lg:hidden focus:outline-none focus:ring-2 focus:ring-primary-ring"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden lg:block flex-1 max-w-md">
          <Input 
            label="" 
            placeholder="Cari karyawan atau menu..." 
            leftIcon={<Search className="w-5 h-5" />} 
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 ml-4">
        <button className="relative p-2 rounded-md text-text-secondary hover:bg-subtle hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-surface"></span>
        </button>

        <div className="h-8 w-px bg-border-default mx-2"></div>

        <button className="flex items-center space-x-3 p-1 rounded-md hover:bg-subtle transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary-ring">
          <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-label text-text-primary">Ahmad Fajri</p>
            <p className="text-caption text-text-muted">Staff IT</p>
          </div>
        </button>
      </div>
    </header>
  );
}
