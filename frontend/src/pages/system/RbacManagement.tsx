import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Users, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Eye,
  Sliders
} from 'lucide-react';

export function RbacManagement() {
  const roles = [
    {
      name: 'super-admin',
      label: 'Super Admin / Direksi / Owner',
      description: 'Akses penuh ke Management Backend & seluruh sistem, konfigurasi, audit log, dan data perusahaan.',
      usersCount: 1,
      badge: 'Backend (Owner/Direksi)',
      color: 'slate',
    },
    {
      name: 'hr-manager',
      label: 'HR Manager / HR Admin',
      description: 'Akses resmi ke Management Backend: pusat data karyawan, persetujuan perizinan, pengelolaan payroll, dan monitoring absensi.',
      usersCount: 1,
      badge: 'Backend (HR)',
      color: 'indigo',
    },
    {
      name: 'dept-head',
      label: 'Manager Departemen (Dept Head)',
      description: 'Akses Portal Operasional: Monitoring absensi live tim/kantor, Layar QR kantor, dan review daily report tim.',
      usersCount: 3,
      badge: 'Operasional & Tim',
      color: 'indigo',
    },
    {
      name: 'finance-staff',
      label: 'Staff Finance',
      description: 'Akses User Portal. Pengelolaan kompensasi terpusat pada HR & Direksi.',
      usersCount: 1,
      badge: 'User Portal Only',
      color: 'emerald',
    },
    {
      name: 'employee',
      label: 'Karyawan / Staff Operasional',
      description: 'Akses User Portal saja: scan absensi QR, pengisian spreadsheet Daily Report, pengajuan izin, melihat slip gaji pribadi.',
      usersCount: 5,
      badge: 'User Portal Only',
      color: 'teal',
    },
  ];

  const permissionModules = [
    {
      module: 'Daily Report Spreadsheet',
      permissions: ['daily_report.view_self', 'daily_report.create', 'daily_report.edit', 'daily_report.submit', 'daily_report.view_team', 'daily_report.view_all', 'daily_report.review', 'daily_report.export']
    },
    {
      module: 'Presensi & Dynamic QR',
      permissions: ['attendance.scan_qr', 'attendance.view_self', 'attendance.view_team', 'attendance.view_all', 'attendance.generate_qr', 'attendance.manage', 'attendance.approve']
    },
    {
      module: 'Cuti & Perizinan',
      permissions: ['leave.request', 'leave.view_self', 'leave.view_team', 'leave.view_all', 'leave.approve_manager', 'leave.approve_hr']
    },
    {
      module: 'Penggajian (Payroll Isolation)',
      permissions: ['payroll.view_self', 'payroll.view_all', 'payroll.create', 'payroll.process', 'payroll.approve']
    },
    {
      module: 'Akses Portal & Sistem',
      permissions: ['portal.backend_access', 'system.settings', 'system.audit_logs', 'system.rbac']
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Role & Hak Akses (Granular RBAC)</h1>
        <p className="text-xs text-slate-500">
          Struktur keamanan dan pembagian kewenangan akses pengguna Kurma Group.
        </p>
      </div>

      {/* Security Rule Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Prinsip Privasi Finansial & Isolasi Data Kurma Group:</p>
          <p className="text-amber-800 mt-0.5">
            Manager Departemen (Dept Head) hanya memiliki hak akses review operasional tim (Daily Report & Izin/Cuti).
            Data Payroll tim <strong>terisolasi total</strong> dan tidak dapat diakses oleh Manager divisi mana pun demi menjaga kerahasiaan kompensasi.
          </p>
        </div>
      </div>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.name} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 text-sm">{role.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {role.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{role.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center">
                <Users className="w-3.5 h-3.5 mr-1" /> {role.usersCount} Pengguna
              </span>
              <span className="font-mono text-[11px] text-slate-500">{role.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Granular Permission Matrix Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center">
          <Key className="w-4 h-4 mr-2 text-indigo-600" />
          Katalog Izin Granular Terdaftar
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {permissionModules.map((mod) => (
            <div key={mod.module} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{mod.module}</h4>
              <div className="flex flex-wrap gap-1.5">
                {mod.permissions.map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 text-[10px] font-mono">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
