import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet } from 'react-router-dom';

export function AppShell() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCompact, setSidebarCompact] = useState(false);

  return (
    <div className="flex h-screen bg-page overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCompact={isSidebarCompact}
        toggleCompact={() => setSidebarCompact(!isSidebarCompact)}
      />
      
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
