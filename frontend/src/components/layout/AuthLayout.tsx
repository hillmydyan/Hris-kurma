import React from 'react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[480px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <span className="text-surface font-bold text-xl">KG</span>
          </div>
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
