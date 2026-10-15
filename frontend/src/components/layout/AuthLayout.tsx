import React from 'react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[480px]">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/logo.ico" 
            alt="Logo Kurma Group" 
            className="w-14 h-14 rounded-xl object-contain mb-4 p-1.5 bg-surface border border-border-default shadow-xs" 
          />
          <h1 className="h1 text-text-primary text-center">HRIS Kurma Group</h1>
          <p className="text-text-secondary text-body mt-2 text-center">Sistem Informasi Sumber Daya Manusia</p>
        </div>
        
        <Outlet />
        
        <div className="mt-8 text-center text-caption text-text-muted">
          &copy; {new Date().getFullYear()} Kurma Group. Hak Cipta Dilindungi.
        </div>
      </div>
    </div>
  );
}
