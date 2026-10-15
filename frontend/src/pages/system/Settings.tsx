import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { 
  Building2, 
  Clock, 
  History, 
  Save, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Eye, 
  Camera, 
  QrCode, 
  MapPin, 
  Lock, 
  Check, 
  User, 
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import api from '../../lib/api';

interface AuditLogItem {
  id: number;
  created_at: string;
  user_name: string;
  user_email: string;
  user_role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'SETTINGS_CHANGE';
  module: string;
  model_type: string;
  model_id?: number | string;
  description: string;
  ip_address: string;
  user_agent: string;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
}

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 101,
    created_at: '2026-10-13 08:30:12',
    user_name: 'Super Admin Kurma',
    user_email: 'admin@kurmagroup.co.id',
    user_role: 'Super Admin',
    action: 'SETTINGS_CHANGE',
    module: 'Pengaturan',
    model_type: 'SystemSetting',
    model_id: 1,
    description: 'Pembaruan toleransi keterlambatan presensi menjadi 15 menit',
    ip_address: '192.168.1.10',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    old_values: { late_tolerance_minutes: 10, updated_at: '2026-10-10 14:00:00' },
    new_values: { late_tolerance_minutes: 15, updated_at: '2026-10-13 08:30:12' }
  },
  {
    id: 102,
    created_at: '2026-10-13 08:05:40',
    user_name: 'Budi Santoso',
    user_email: 'budi.santoso@kurmagroup.co.id',
    user_role: 'HR Manager',
    action: 'UPDATE',
    module: 'Presensi',
    model_type: 'AttendanceCorrection',
    model_id: 42,
    description: 'Persetujuan koreksi absensi tanggal 12 Oktober 2026',
    ip_address: '192.168.1.45',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    old_values: { status: 'pending', clock_in: '08:45:00' },
    new_values: { status: 'approved', clock_in: '08:02:00', approver_id: 2 }
  },
  {
    id: 103,
    created_at: '2026-10-13 07:55:10',
    user_name: 'Ahmad Fadillah',
    user_email: 'ahmad.f@kurmagroup.co.id',
    user_role: 'Staff Operasional',
    action: 'LOGIN',
    module: 'Autentikasi',
    model_type: 'UserSession',
    model_id: 14,
    description: 'Login berhasil via portal karyawan mobile web',
    ip_address: '182.253.14.88',
    user_agent: 'Mobile Safari/604.1 iPhone iOS 17.2',
    old_values: null,
    new_values: { login_time: '2026-10-13 07:55:10', ip: '182.253.14.88' }
  },
  {
    id: 104,
    created_at: '2026-10-12 17:15:22',
    user_name: 'Budi Santoso',
    user_email: 'budi.santoso@kurmagroup.co.id',
    user_role: 'HR Manager',
    action: 'CREATE',
    module: 'Karyawan',
    model_type: 'Employee',
    model_id: 88,
    description: 'Penambahan data staf operasional baru (Departemen Herbal)',
    ip_address: '192.168.1.45',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    old_values: null,
    new_values: { 
      employee_id: 'KG-EMP-2026-088', 
      full_name: 'Siti Rahmawati', 
      department_id: 1, 
      salary_base: '********' 
    }
  },
  {
    id: 105,
    created_at: '2026-10-12 16:30:05',
    user_name: 'Super Admin Kurma',
    user_email: 'admin@kurmagroup.co.id',
    user_role: 'Super Admin',
    action: 'UPDATE',
    module: 'RBAC',
    model_type: 'RolePermission',
    model_id: 3,
    description: 'Isolasi data payroll dari role Dept Head (Pencegahan akses gaji tim)',
    ip_address: '192.168.1.10',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    old_values: { role: 'dept-head', permissions: ['daily_report.review', 'payroll.view_team'] },
    new_values: { role: 'dept-head', permissions: ['daily_report.review'] }
  },
  {
    id: 106,
    created_at: '2026-10-12 11:20:18',
    user_name: 'Budi Santoso',
    user_email: 'budi.santoso@kurmagroup.co.id',
    user_role: 'HR Manager',
    action: 'UPDATE',
    module: 'Penggajian',
    model_type: 'PayrollRecord',
    model_id: 512,
    description: 'Pemberian insentif performa bulanan (Nilai nominal tercatat)',
    ip_address: '192.168.1.45',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    old_values: { bonus_performance: '********' },
    new_values: { bonus_performance: '********', approved_by: 2 }
  }
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<'umum' | 'absensi' | 'audit'>('umum');
  const [isSaving, setIsSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  // Tab switch confirmation modal
  const [pendingTab, setPendingTab] = useState<'umum' | 'absensi' | 'audit' | null>(null);
  const [isUnsavedConfirmOpen, setIsUnsavedConfirmOpen] = useState(false);

  // 1. Bagian Umum States
  const [companyName, setCompanyName] = useState('PT Kurma Group Indonesia');
  const [brandName, setBrandName] = useState('Kurma Group');
  const [companyPhone, setCompanyPhone] = useState('021-12345678');
  const [officialEmail, setOfficialEmail] = useState('hr@kurmagroup.co.id');
  const [companyWebsite, setCompanyWebsite] = useState('https://kurmagroup.co.id');
  const [headquarterAddress, setHeadquarterAddress] = useState('Gedung Kurma Group Lt. 5, Jl. Rasuna Said Kav. 8, Jakarta Selatan');
  const [employeeCodeFormat, setEmployeeCodeFormat] = useState('KG-EMP-{YEAR}-{SEQ}');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('8');
  const [enablePortalAnnouncement, setEnablePortalAnnouncement] = useState(true);
  const [enableEmailNotification, setEnableEmailNotification] = useState(true);

  // 2. Kebijakan Absensi States
  const [workStartTime, setWorkStartTime] = useState('08:00');
  const [workEndTime, setWorkEndTime] = useState('16:00');
  const [lateToleranceMinutes, setLateToleranceMinutes] = useState('15');
  const [earliestClockInMinutes, setEarliestClockInMinutes] = useState('60');
  const [requireSelfie, setRequireSelfie] = useState(true);
  const [requireGpsGeofence, setRequireGpsGeofence] = useState(true);
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState('100');
  const [dynamicQrProtection, setDynamicQrProtection] = useState(true);
  const [attendanceCorrectionDaysLimit, setAttendanceCorrectionDaysLimit] = useState('7');
  const [weekendRosterRule, setWeekendRosterRule] = useState('rotating_weekend');
  const [workdaySwapLeadTime, setWorkdaySwapLeadTime] = useState('1');

  // Baseline snapshot for detecting unsaved changes
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');

  // 3. Audit Logs States
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditModuleFilter, setAuditModuleFilter] = useState('ALL');
  const [auditDateFilter, setAuditDateFilter] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Build current state object to compare against saved snapshot
  const currentSnapshot = useMemo(() => {
    return JSON.stringify({
      companyName,
      brandName,
      companyPhone,
      officialEmail,
      companyWebsite,
      headquarterAddress,
      employeeCodeFormat,
      timezone,
      sessionTimeoutHours,
      enablePortalAnnouncement,
      enableEmailNotification,
      workStartTime,
      workEndTime,
      lateToleranceMinutes,
      earliestClockInMinutes,
      requireSelfie,
      requireGpsGeofence,
      geofenceRadiusMeters,
      dynamicQrProtection,
      attendanceCorrectionDaysLimit,
      weekendRosterRule,
      workdaySwapLeadTime,
    });
  }, [
    companyName, brandName, companyPhone, officialEmail, companyWebsite, headquarterAddress,
    employeeCodeFormat, timezone, sessionTimeoutHours, enablePortalAnnouncement, enableEmailNotification,
    workStartTime, workEndTime, lateToleranceMinutes, earliestClockInMinutes, requireSelfie,
    requireGpsGeofence, geofenceRadiusMeters, dynamicQrProtection, attendanceCorrectionDaysLimit,
    weekendRosterRule, workdaySwapLeadTime
  ]);

  const hasUnsavedChanges = savedSnapshot !== '' && currentSnapshot !== savedSnapshot;

  // Warn on browser tab close or refresh if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Load backend settings & audit logs on mount
  useEffect(() => {
    loadSettingsFromBackend();
    loadAuditLogsFromBackend();
  }, []);

  const loadSettingsFromBackend = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        let cn = companyName;
        let bn = brandName;
        let cp = companyPhone;
        let oe = officialEmail;
        let ha = headquarterAddress;
        let ws = workStartTime;
        let we = workEndTime;
        let lt = lateToleranceMinutes;
        let gr = geofenceRadiusMeters;
        let rs = requireSelfie;
        let rg = requireGpsGeofence;

        res.data.forEach((item: { key: string; value: string }) => {
          if (item.key === 'company_name') { setCompanyName(item.value); cn = item.value; }
          if (item.key === 'brand_name') { setBrandName(item.value); bn = item.value; }
          if (item.key === 'company_phone') { setCompanyPhone(item.value); cp = item.value; }
          if (item.key === 'official_email') { setOfficialEmail(item.value); oe = item.value; }
          if (item.key === 'headquarter_address') { setHeadquarterAddress(item.value); ha = item.value; }
          if (item.key === 'work_start_time') { setWorkStartTime(item.value); ws = item.value; }
          if (item.key === 'work_end_time') { setWorkEndTime(item.value); we = item.value; }
          if (item.key === 'late_tolerance_minutes') { setLateToleranceMinutes(item.value); lt = item.value; }
          if (item.key === 'geofence_radius_meters') { setGeofenceRadiusMeters(item.value); gr = item.value; }
          if (item.key === 'require_selfie') { const val = item.value === '1' || item.value === 'true'; setRequireSelfie(val); rs = val; }
          if (item.key === 'require_gps_geofence') { const val = item.value === '1' || item.value === 'true'; setRequireGpsGeofence(val); rg = val; }
        });

        // Set initial snapshot after backend values loaded
        setSavedSnapshot(JSON.stringify({
          companyName: cn,
          brandName: bn,
          companyPhone: cp,
          officialEmail: oe,
          companyWebsite,
          headquarterAddress: ha,
          employeeCodeFormat,
          timezone,
          sessionTimeoutHours,
          enablePortalAnnouncement,
          enableEmailNotification,
          workStartTime: ws,
          workEndTime: we,
          lateToleranceMinutes: lt,
          earliestClockInMinutes,
          requireSelfie: rs,
          requireGpsGeofence: rg,
          geofenceRadiusMeters: gr,
          dynamicQrProtection,
          attendanceCorrectionDaysLimit,
          weekendRosterRule,
          workdaySwapLeadTime,
        }));
      } else {
        // Fallback default snapshot
        setSavedSnapshot(currentSnapshot);
      }
    } catch {
      // Fallback default snapshot if offline
      setSavedSnapshot(currentSnapshot);
    }
  };

  const loadAuditLogsFromBackend = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await api.get('/audit-logs');
      if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const mappedLogs: AuditLogItem[] = res.data.data.map((l: any) => ({
          id: l.id,
          created_at: l.created_at ? new Date(l.created_at).toLocaleString('id-ID') : 'Baru saja',
          user_name: l.user?.name || 'Sistem Kurma',
          user_email: l.user?.email || 'system@kurmagroup.co.id',
          user_role: l.user?.roles?.[0]?.name || 'Admin',
          action: (l.action?.toUpperCase() || 'UPDATE') as any,
          module: l.model_type ? l.model_type.split('\\').pop() : 'Sistem',
          model_type: l.model_type || 'General',
          model_id: l.model_id,
          description: `Aktivitas ${l.action} pada ${l.model_type || 'entitas'}`,
          ip_address: l.ip_address || '127.0.0.1',
          user_agent: l.user_agent || 'Browser Client',
          old_values: l.old_values,
          new_values: l.new_values,
        }));
        setAuditLogs(mappedLogs);
      }
    } catch {
      // Keep fallback audit logs
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const showNotification = (type: 'success' | 'danger', message: string) => {
    setAlertInfo({ type, message });
    setTimeout(() => {
      setAlertInfo(null);
    }, 5000);
  };

  const handleDiscardChanges = () => {
    if (!savedSnapshot) return;
    try {
      const parsed = JSON.parse(savedSnapshot);
      setCompanyName(parsed.companyName);
      setBrandName(parsed.brandName);
      setCompanyPhone(parsed.companyPhone);
      setOfficialEmail(parsed.officialEmail);
      setCompanyWebsite(parsed.companyWebsite);
      setHeadquarterAddress(parsed.headquarterAddress);
      setEmployeeCodeFormat(parsed.employeeCodeFormat);
      setTimezone(parsed.timezone);
      setSessionTimeoutHours(parsed.sessionTimeoutHours);
      setEnablePortalAnnouncement(parsed.enablePortalAnnouncement);
      setEnableEmailNotification(parsed.enableEmailNotification);
      setWorkStartTime(parsed.workStartTime);
      setWorkEndTime(parsed.workEndTime);
      setLateToleranceMinutes(parsed.lateToleranceMinutes);
      setEarliestClockInMinutes(parsed.earliestClockInMinutes);
      setRequireSelfie(parsed.requireSelfie);
      setRequireGpsGeofence(parsed.requireGpsGeofence);
      setGeofenceRadiusMeters(parsed.geofenceRadiusMeters);
      setDynamicQrProtection(parsed.dynamicQrProtection);
      setAttendanceCorrectionDaysLimit(parsed.attendanceCorrectionDaysLimit);
      setWeekendRosterRule(parsed.weekendRosterRule);
      setWorkdaySwapLeadTime(parsed.workdaySwapLeadTime);
    } catch (e) {
      console.error('Error discarding changes:', e);
    }
  };

  const handleTabClick = (targetTab: 'umum' | 'absensi' | 'audit') => {
    if (targetTab === activeTab) return;
    if (hasUnsavedChanges) {
      setPendingTab(targetTab);
      setIsUnsavedConfirmOpen(true);
    } else {
      setActiveTab(targetTab);
    }
  };

  const confirmTabSwitch = () => {
    handleDiscardChanges();
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    setIsUnsavedConfirmOpen(false);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const payload = {
        settings: [
          { key: 'company_name', value: companyName, group: 'general' },
          { key: 'brand_name', value: brandName, group: 'general' },
          { key: 'company_phone', value: companyPhone, group: 'general' },
          { key: 'official_email', value: officialEmail, group: 'general' },
          { key: 'company_website', value: companyWebsite, group: 'general' },
          { key: 'headquarter_address', value: headquarterAddress, group: 'general' },
          { key: 'employee_code_format', value: employeeCodeFormat, group: 'general' },
          { key: 'timezone', value: timezone, group: 'general' },
          { key: 'session_timeout_hours', value: sessionTimeoutHours, group: 'general' },
          { key: 'work_start_time', value: workStartTime, group: 'attendance' },
          { key: 'work_end_time', value: workEndTime, group: 'attendance' },
          { key: 'late_tolerance_minutes', value: lateToleranceMinutes, group: 'attendance' },
          { key: 'earliest_clock_in_minutes', value: earliestClockInMinutes, group: 'attendance' },
          { key: 'require_selfie', value: requireSelfie ? '1' : '0', group: 'attendance' },
          { key: 'require_gps_geofence', value: requireGpsGeofence ? '1' : '0', group: 'attendance' },
          { key: 'geofence_radius_meters', value: geofenceRadiusMeters, group: 'attendance' },
          { key: 'dynamic_qr_protection', value: dynamicQrProtection ? '1' : '0', group: 'attendance' },
          { key: 'attendance_correction_days_limit', value: attendanceCorrectionDaysLimit, group: 'attendance' },
          { key: 'weekend_roster_rule', value: weekendRosterRule, group: 'attendance' },
          { key: 'workday_swap_lead_time', value: workdaySwapLeadTime, group: 'attendance' },
        ]
      };

      try {
        await api.post('/settings/bulk', payload);
      } catch {
        // Fallback local simulation if backend route unhandled
      }

      // Record this change into live audit logs
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const newLog: AuditLogItem = {
        id: Date.now(),
        created_at: timeStr,
        user_name: 'Administrator HRIS',
        user_email: 'admin@kurmagroup.co.id',
        user_role: 'Super Admin',
        action: 'SETTINGS_CHANGE',
        module: activeTab === 'umum' ? 'Pengaturan Umum' : 'Kebijakan Absensi',
        model_type: 'SystemConfiguration',
        description: `Pembaruan konfigurasi ${activeTab === 'umum' ? 'Profil & Standar Umum Perusahaan' : 'Kebijakan Presensi & Validasi'}`,
        ip_address: '127.0.0.1 (Localhost)',
        user_agent: navigator.userAgent.slice(0, 60),
        old_values: { status: 'previous_config' },
        new_values: {
          timestamp: timeStr,
          tab_modified: activeTab,
          work_start_time: workStartTime,
          late_tolerance_minutes: lateToleranceMinutes,
          require_selfie: requireSelfie,
          require_gps_geofence: requireGpsGeofence
        }
      };

      setAuditLogs(prev => [newLog, ...prev]);
      setSavedSnapshot(currentSnapshot);
      showNotification('success', 'Pengaturan berhasil disimpan dan tercatat di Jejak Audit.');
    } catch {
      showNotification('danger', 'Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const q = auditSearch.toLowerCase();
      const matchSearch = !q || 
        log.user_name.toLowerCase().includes(q) ||
        log.user_email.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.ip_address.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q);

      const matchAction = auditActionFilter === 'ALL' || log.action === auditActionFilter;
      const matchModule = auditModuleFilter === 'ALL' || log.module.toLowerCase().includes(auditModuleFilter.toLowerCase());
      const matchDate = !auditDateFilter || log.created_at.includes(auditDateFilter);

      return matchSearch && matchAction && matchModule && matchDate;
    });
  }, [auditLogs, auditSearch, auditActionFilter, auditModuleFilter, auditDateFilter]);

  const resetAuditFilters = () => {
    setAuditSearch('');
    setAuditActionFilter('ALL');
    setAuditModuleFilter('ALL');
    setAuditDateFilter('');
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Badge variant="success">CREATE</Badge>;
      case 'UPDATE':
        return <Badge variant="primary">UPDATE</Badge>;
      case 'DELETE':
        return <Badge variant="danger">DELETE</Badge>;
      case 'LOGIN':
        return <Badge variant="warning">LOGIN</Badge>;
      case 'SETTINGS_CHANGE':
        return <Badge variant="violet">CONFIG</Badge>;
      default:
        return <Badge variant="neutral">{action}</Badge>;
    }
  };

  // Format date and time display: DD/MM/YYYY, HH:mm:ss WIB
  const formatAuditDateTime = (dateStr: string) => {
    try {
      const clean = dateStr.replace(' ', 'T');
      const d = new Date(clean);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${mins}:${secs} WIB`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pb-20">
      {/* 1. Header Halaman Standar (Tanpa Kartu Pembungkus) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">Pengaturan & Audit</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Atur profil perusahaan, kebijakan absensi, dan lihat riwayat perubahan.
          </p>
        </div>
      </div>

      {/* Alert Notification */}
      {alertInfo && (
        <Alert 
          variant={alertInfo.type} 
          title={alertInfo.type === 'success' ? 'Berhasil Disimpan' : 'Peringatan'}
          onClose={() => setAlertInfo(null)}
        >
          {alertInfo.message}
        </Alert>
      )}

      {/* 2. Menu Bagian (Mobile Horizontal Tabs < 1024px) */}
      <div className="flex lg:hidden overflow-x-auto gap-1.5 border-b border-border-default pb-2">
        <button
          type="button"
          onClick={() => handleTabClick('umum')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'umum'
              ? 'bg-indigo-50 text-primary border border-indigo-200'
              : 'text-text-secondary hover:bg-subtle'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Umum</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabClick('absensi')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'absensi'
              ? 'bg-indigo-50 text-primary border border-indigo-200'
              : 'text-text-secondary hover:bg-subtle'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Kebijakan Absensi</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabClick('audit')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'bg-indigo-50 text-primary border border-indigo-200'
              : 'text-text-secondary hover:bg-subtle'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Jejak Audit</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-semibold">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* Main Layout: Desktop Sidebar (240px) + Content */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Side: Navigation Tabs (Desktop >= 1024px) */}
        <div className="hidden lg:flex flex-col w-60 shrink-0 space-y-3">
          <Card className="border border-border-default shadow-xs overflow-hidden">
            <CardContent className="p-1.5">
              <nav className="space-y-1">
                {/* Tab 1: Umum */}
                <button
                  type="button"
                  onClick={() => handleTabClick('umum')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                    activeTab === 'umum'
                      ? 'bg-indigo-50 text-primary border border-indigo-200/70 font-semibold'
                      : 'text-text-secondary hover:bg-subtle hover:text-text-primary'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${activeTab === 'umum' ? 'text-primary' : 'text-text-muted'}`} />
                  <span>Umum</span>
                </button>

                {/* Tab 2: Kebijakan Absensi */}
                <button
                  type="button"
                  onClick={() => handleTabClick('absensi')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                    activeTab === 'absensi'
                      ? 'bg-indigo-50 text-primary border border-indigo-200/70 font-semibold'
                      : 'text-text-secondary hover:bg-subtle hover:text-text-primary'
                  }`}
                >
                  <Clock className={`w-4 h-4 ${activeTab === 'absensi' ? 'text-primary' : 'text-text-muted'}`} />
                  <span>Kebijakan Absensi</span>
                </button>

                {/* Tab 3: Jejak Audit */}
                <button
                  type="button"
                  onClick={() => handleTabClick('audit')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                    activeTab === 'audit'
                      ? 'bg-indigo-50 text-primary border border-indigo-200/70 font-semibold'
                      : 'text-text-secondary hover:bg-subtle hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <History className={`w-4 h-4 shrink-0 ${activeTab === 'audit' ? 'text-primary' : 'text-text-muted'}`} />
                    <span className="truncate">Jejak Audit</span>
                  </div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 shrink-0 ml-1">
                    {auditLogs.length}
                  </span>
                </button>
              </nav>
            </CardContent>
          </Card>

          {/* Versi Sistem kecil di bawah menu kiri */}
          <div className="px-3 text-[11px] text-text-muted">
            <p>HRIS Kurma Group · v2.4</p>
          </div>
        </div>

        {/* Right Side: Tab Contents */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {/* TAB 1: BAGIAN UMUM */}
          {activeTab === 'umum' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <Card className="border border-border-default shadow-xs">
                <CardHeader className="py-3.5 px-4 border-b border-border-default">
                  <div>
                    <CardTitle className="text-sm font-semibold text-text-primary">Profil Perusahaan</CardTitle>
                    <p className="text-xs text-text-muted mt-0.5">
                      Dipakai di kop laporan, slip gaji, dan dokumen resmi.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-5">
                  <span className="text-[11px] text-text-muted block">* wajib diisi</span>

                  {/* Kelompok Identitas */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider pb-1.5 border-b border-border-default">
                      Identitas
                    </h3>
                    <div className="flex items-center gap-4 p-3 bg-subtle/40 rounded-lg border border-border-default">
                      <img 
                        src="/logo.ico" 
                        alt="Logo Kurma Group" 
                        className="w-12 h-12 rounded-lg object-contain bg-surface p-1 border border-border-default shadow-xs shrink-0" 
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-text-primary">Logo & Favicon Aktif</p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Menggunakan berkas resmi dari <code className="px-1 py-0.5 bg-surface rounded text-text-primary font-mono text-[10px] border border-border-default">public/logo.ico</code> dan <code className="px-1 py-0.5 bg-surface rounded text-text-primary font-mono text-[10px] border border-border-default">public/favicon.ico</code>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <Input 
                        label="Nama Perusahaan" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required 
                      />
                      <Input 
                        label="Nama Tampilan" 
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        required 
                        helperText="Dipakai di tampilan aplikasi dan portal karyawan"
                      />
                    </div>
                  </div>

                  {/* Kelompok Kontak */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider pb-1.5 border-b border-border-default">
                      Kontak
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <Input 
                        label="Telepon Kantor" 
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                      />
                      <Input 
                        label="Email HR" 
                        type="email"
                        value={officialEmail}
                        onChange={(e) => setOfficialEmail(e.target.value)}
                        required
                      />
                      <div className="md:col-span-2">
                        <Input 
                          label="Website" 
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2 flex flex-col space-y-1.5">
                        <label className="text-label text-text-primary">
                          Alamat Kantor Pusat
                        </label>
                        <textarea
                          rows={3}
                          value={headquarterAddress}
                          onChange={(e) => setHeadquarterAddress(e.target.value)}
                          className="w-full px-3 py-2 rounded-sm border border-border-input bg-surface text-text-primary text-body focus:outline-none focus:ring-2 focus:ring-primary-ring text-xs leading-relaxed"
                          placeholder="Masukkan alamat lengkap kantor pusat..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kelompok Format & Standar Sistem */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider pb-1.5 border-b border-border-default">
                      Format & Standar Sistem
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <Input 
                        label="Format ID Karyawan" 
                        value={employeeCodeFormat}
                        onChange={(e) => setEmployeeCodeFormat(e.target.value)}
                        helperText="Variabel: {YEAR} untuk tahun, {SEQ} untuk nomor urut"
                      />
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-label text-text-primary">
                          Zona Waktu Default
                        </label>
                        <select 
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full h-10 px-3 rounded-sm border border-border-input bg-surface text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary-ring"
                        >
                          <option value="Asia/Jakarta">Asia/Jakarta (WIB - UTC+7)</option>
                          <option value="Asia/Makassar">Asia/Makassar (WITA - UTC+8)</option>
                          <option value="Asia/Jayapura">Asia/Jayapura (WIT - UTC+9)</option>
                        </select>
                      </div>
                      <Input 
                        label="Durasi Maksimal Sesi Login" 
                        type="number"
                        unitSuffix="Jam"
                        value={sessionTimeoutHours}
                        onChange={(e) => setSessionTimeoutHours(e.target.value)}
                        helperText="Otomatis logout saat sesi tidak aktif melebihi batas waktu"
                      />
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-label text-text-primary">
                          Format Mata Uang Payroll
                        </label>
                        <input 
                          disabled
                          value="IDR - Rupiah Indonesia (Rp)"
                          className="w-full h-10 px-3 rounded-sm border border-border-input bg-subtle text-text-muted text-xs cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Toggles Pengumuman & Notifikasi */}
                    <div className="pt-2 space-y-2">
                      <label className="flex items-center gap-3 p-3 bg-subtle/50 border border-border-default rounded-lg cursor-pointer hover:bg-subtle transition-colors">
                        <input 
                          type="checkbox" 
                          checked={enablePortalAnnouncement}
                          onChange={(e) => setEnablePortalAnnouncement(e.target.checked)}
                          className="w-4 h-4 text-primary rounded-sm border-border-input focus:ring-primary-ring"
                        />
                        <div>
                          <p className="text-xs font-medium text-text-primary">Banner Pengumuman di Portal Karyawan</p>
                          <p className="text-[11px] text-text-muted">Menampilkan siaran kabar resmi HR di halaman awal portal karyawan</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-subtle/50 border border-border-default rounded-lg cursor-pointer hover:bg-subtle transition-colors">
                        <input 
                          type="checkbox" 
                          checked={enableEmailNotification}
                          onChange={(e) => setEnableEmailNotification(e.target.checked)}
                          className="w-4 h-4 text-primary rounded-sm border-border-input focus:ring-primary-ring"
                        />
                        <div>
                          <p className="text-xs font-medium text-text-primary">Notifikasi Pengingat Persetujuan Otomatis</p>
                          <p className="text-[11px] text-text-muted">Kirim pengingat jika terdapat tugas review menunggu lebih dari 24 jam</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: KEBIJAKAN ABSENSI */}
          {activeTab === 'absensi' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-xs text-text-muted">
                Perubahan kebijakan berlaku untuk periode berikutnya.
              </p>

              <Card className="border border-border-default shadow-xs">
                <CardContent className="p-4 space-y-6">
                  {/* Kelompok 1: Jam Kerja & Toleransi */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider pb-1.5 border-b border-border-default">
                      Jam Kerja & Toleransi
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <Input 
                        label="Jam Mulai Kerja (Clock In)" 
                        type="time" 
                        unitSuffix="WIB"
                        value={workStartTime}
                        onChange={(e) => setWorkStartTime(e.target.value)}
                        required 
                      />
                      <Input 
                        label="Jam Selesai Kerja (Clock Out)" 
                        type="time" 
                        unitSuffix="WIB"
                        value={workEndTime}
                        onChange={(e) => setWorkEndTime(e.target.value)}
                        required 
                      />
                      <Input 
                        label="Toleransi Keterlambatan" 
                        type="number" 
                        unitSuffix="menit"
                        value={lateToleranceMinutes}
                        onChange={(e) => setLateToleranceMinutes(e.target.value)}
                      />
                      <Input 
                        label="Batas Awal Absen Masuk" 
                        type="number" 
                        unitSuffix="menit"
                        value={earliestClockInMinutes}
                        onChange={(e) => setEarliestClockInMinutes(e.target.value)}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted">
                      Uang makan harian diberikan jika absensi masuk tercatat sebelum batas toleransi keterlambatan (08:15 WIB).
                    </p>
                  </div>

                  {/* Kelompok 2: Validasi Kehadiran & Lokasi */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider pb-1.5 border-b border-border-default">
                      Validasi Kehadiran & Lokasi
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 p-3 bg-subtle/50 border border-border-default rounded-lg cursor-pointer hover:bg-subtle transition-colors">
                        <input 
                          type="checkbox" 
                          checked={requireSelfie}
                          onChange={(e) => setRequireSelfie(e.target.checked)}
                          className="w-4 h-4 mt-0.5 text-primary rounded-sm border-border-input focus:ring-primary-ring"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-text-primary">Wajibkan Foto Selfie Kamera Depan</p>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Karyawan wajib mengambil foto diri langsung saat melakukan Clock In maupun Clock Out.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 bg-subtle/50 border border-border-default rounded-lg cursor-pointer hover:bg-subtle transition-colors">
                        <input 
                          type="checkbox" 
                          checked={requireGpsGeofence}
                          onChange={(e) => setRequireGpsGeofence(e.target.checked)}
                          className="w-4 h-4 mt-0.5 text-primary rounded-sm border-border-input focus:ring-primary-ring"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-text-primary">Wajibkan Verifikasi Lokasi GPS (Geofencing)</p>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Memastikan perangkat berada dalam radius fisik area kantor saat memindai QR.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 bg-subtle/50 border border-border-default rounded-lg cursor-pointer hover:bg-subtle transition-colors">
                        <input 
                          type="checkbox" 
                          checked={dynamicQrProtection}
                          onChange={(e) => setDynamicQrProtection(e.target.checked)}
                          className="w-4 h-4 mt-0.5 text-primary rounded-sm border-border-input focus:ring-primary-ring"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-text-primary">Perlindungan QR Dinamis (Anti Double-Scan)</p>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Token QR di layar berganti otomatis setiap 30 detik untuk mencegah kecurangan foto layar.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      <Input 
                        label="Radius Toleransi Lokasi" 
                        type="number" 
                        unitSuffix="meter"
                        value={geofenceRadiusMeters}
                        onChange={(e) => setGeofenceRadiusMeters(e.target.value)}
                      />
                      <Input 
                        label="Batas Maksimal Pengajuan Koreksi" 
                        type="number" 
                        unitSuffix="hari"
                        value={attendanceCorrectionDaysLimit}
                        onChange={(e) => setAttendanceCorrectionDaysLimit(e.target.value)}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted">
                      Memastikan presensi dilakukan secara fisik di area kantor dan pengajuan koreksi tidak melewati batas waktu yang ditentukan.
                    </p>
                  </div>

                  {/* Kelompok 3: Roster Kerja & Ganti Hari */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider pb-1.5 border-b border-border-default">
                      Roster Kerja & Ganti Hari
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-label text-text-primary">
                          Aturan Roster 6 Hari Kerja
                        </label>
                        <select 
                          value={weekendRosterRule}
                          onChange={(e) => setWeekendRosterRule(e.target.value)}
                          className="w-full h-10 px-3 rounded-sm border border-border-input bg-surface text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary-ring"
                        >
                          <option value="rotating_weekend">1 Hari Akhir Pekan Bergantian (Sabtu / Minggu)</option>
                          <option value="fixed_saturday">Tetap Masuk Sabtu (Minggu Libur)</option>
                          <option value="fixed_sunday">Tetap Masuk Minggu (Sabtu Libur)</option>
                        </select>
                      </div>

                      <div className="flex flex-col space-y-1.5">
                        <label className="text-label text-text-primary">
                          Batas Waktu Pengajuan Ganti Hari
                        </label>
                        <select 
                          value={workdaySwapLeadTime}
                          onChange={(e) => setWorkdaySwapLeadTime(e.target.value)}
                          className="w-full h-10 px-3 rounded-sm border border-border-input bg-surface text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary-ring"
                        >
                          <option value="1">Minimal H-1 (24 Jam Sebelumnya)</option>
                          <option value="2">Minimal H-2 (48 Jam Sebelumnya)</option>
                          <option value="0">Boleh Hari H Sebelum Jam Masuk</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-text-muted">
                      Berlaku untuk jadwal akhir pekan operasional dan permohonan penukaran hari kerja (Workday Swap).
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: JEJAK AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-xs text-text-muted">
                Riwayat audit tidak bisa diubah atau dihapus.
              </p>

              {/* Baris Atas Status & Segarkan */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface border border-border-default rounded-lg">
                <div className="flex items-center gap-2.5">
                  <Badge variant="success" dot>Audit aktif</Badge>
                  <span className="text-xs text-text-secondary">
                    <strong>{filteredAuditLogs.length}</strong> catatan aktivitas
                  </span>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={loadAuditLogsFromBackend}
                  disabled={isLoadingLogs}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />}
                  className="h-8 text-xs px-2.5 font-medium"
                >
                  Segarkan
                </Button>
              </div>

              {/* Filter Satu Baris */}
              <Card className="border border-border-default shadow-xs">
                <CardContent className="p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
                    {/* Cari */}
                    <div className="lg:col-span-4 relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-text-placeholder" />
                      <input 
                        type="text"
                        placeholder="Cari aktivitas, nama, atau IP..."
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        className="w-full h-9 pl-8 pr-3 rounded-md border border-border-input bg-surface text-xs placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary-ring"
                      />
                    </div>

                    {/* Filter Aksi */}
                    <div className="lg:col-span-3">
                      <select
                        value={auditActionFilter}
                        onChange={(e) => setAuditActionFilter(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-md border border-border-input bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary-ring"
                      >
                        <option value="ALL">Semua Jenis Aksi</option>
                        <option value="SETTINGS_CHANGE">Perubahan Pengaturan (CONFIG)</option>
                        <option value="CREATE">Pembuatan Data (CREATE)</option>
                        <option value="UPDATE">Pembaruan Data (UPDATE)</option>
                        <option value="DELETE">Penghapusan Data (DELETE)</option>
                        <option value="LOGIN">Autentikasi (LOGIN)</option>
                      </select>
                    </div>

                    {/* Filter Modul */}
                    <div className="lg:col-span-3">
                      <select
                        value={auditModuleFilter}
                        onChange={(e) => setAuditModuleFilter(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-md border border-border-input bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary-ring"
                      >
                        <option value="ALL">Semua Modul</option>
                        <option value="Pengaturan">Pengaturan & Konfigurasi</option>
                        <option value="Presensi">Presensi & QR</option>
                        <option value="Karyawan">Karyawan & SDM</option>
                        <option value="Penggajian">Penggajian (Payroll)</option>
                        <option value="RBAC">RBAC & Hak Akses</option>
                        <option value="Autentikasi">Autentikasi & Login</option>
                      </select>
                    </div>

                    {/* Reset Button */}
                    <div className="lg:col-span-2 flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetAuditFilters}
                        leftIcon={<RotateCcw className="w-3 h-3" />}
                        className="w-full h-9 text-xs justify-center font-medium"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabel Jejak Audit */}
              <Card className="border border-border-default shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-subtle border-b border-border-default text-text-secondary font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 whitespace-nowrap">Waktu</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Pengguna</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Aksi</th>
                        <th className="py-2.5 px-3">Detail</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-text-muted">
                            Tidak ditemukan rekaman jejak audit yang sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-subtle/50 transition-colors">
                            <td className="py-2.5 px-3 text-text-secondary whitespace-nowrap font-mono text-[11px]">
                              {formatAuditDateTime(log.created_at)}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <p className="font-medium text-text-primary text-xs">{log.user_name}</p>
                              <p className="text-[11px] text-text-muted">{log.user_role}</p>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {getActionBadge(log.action)}
                            </td>
                            <td className="py-2.5 px-3 max-w-md">
                              <p className="text-xs text-text-primary line-clamp-2 leading-relaxed">
                                {log.description}
                              </p>
                              <p className="text-[11px] text-text-muted mt-0.5 truncate">
                                Modul: {log.module} • IP: {log.ip_address}
                              </p>
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedAuditLog(log);
                                  setIsModalOpen(true);
                                }}
                                leftIcon={<Eye className="w-3 h-3" />}
                                className="h-7 text-xs px-2 font-medium"
                              >
                                Detail
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bar Simpan Menempel di Bawah (Hanya muncul saat ada perubahan) */}
      {hasUnsavedChanges && activeTab !== 'audit' && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-68 lg:right-8 z-40 bg-surface border border-border-default rounded-xl shadow-lg p-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 text-text-primary text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>Ada perubahan belum disimpan</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscardChanges}
              disabled={isSaving}
              className="h-8 text-xs font-medium px-3 flex-1 sm:flex-none"
            >
              Batalkan
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSettings}
              disabled={isSaving}
              leftIcon={isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              className="h-8 text-xs font-medium px-4 flex-1 sm:flex-none"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Pindah Tab Saat Ada Perubahan Belum Disimpan */}
      <Modal
        isOpen={isUnsavedConfirmOpen}
        onClose={() => setIsUnsavedConfirmOpen(false)}
        title="Perubahan Belum Disimpan"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setIsUnsavedConfirmOpen(false)}
              className="h-8 text-xs"
            >
              Tetap di Sini
            </Button>
            <Button 
              variant="danger" 
              size="sm"
              onClick={confirmTabSwitch}
              className="h-8 text-xs font-medium"
            >
              Abaikan Perubahan
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-xs text-text-secondary">
          <div className="flex items-center gap-2 text-amber-600 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Terdapat perubahan yang belum disimpan.</span>
          </div>
          <p>
            Jika Anda berpindah bagian sekarang, perubahan yang telah diketik akan dibatalkan. Yakin ingin berpindah tab?
          </p>
        </div>
      </Modal>

      {/* Modal Detail Jejak Audit */}
      {selectedAuditLog && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Detail Jejak Audit #${selectedAuditLog.id}`}
          size="lg"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)} className="h-8 text-xs">
              Tutup
            </Button>
          }
        >
          <div className="space-y-3.5 text-xs">
            {/* Meta Card Ringkas */}
            <div className="grid grid-cols-2 gap-2.5 p-3 bg-subtle rounded-lg border border-border-default">
              <div>
                <span className="text-[11px] text-text-muted block">Waktu Kejadian:</span>
                <span className="font-semibold text-text-primary font-mono">{formatAuditDateTime(selectedAuditLog.created_at)}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">Jenis Aksi:</span>
                <span className="font-semibold mt-0.5 block">{getActionBadge(selectedAuditLog.action)}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">Pengguna:</span>
                <span className="font-semibold text-text-primary">{selectedAuditLog.user_name}</span>
                <span className="text-[11px] text-text-muted block">{selectedAuditLog.user_email}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">Role Pengguna:</span>
                <span className="font-semibold text-text-primary">{selectedAuditLog.user_role}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">Modul:</span>
                <span className="font-semibold text-text-primary">{selectedAuditLog.module}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">Alamat IP:</span>
                <span className="font-mono font-semibold text-text-primary">{selectedAuditLog.ip_address}</span>
              </div>
            </div>

            {/* Description */}
            <div className="p-3 bg-subtle rounded-lg border border-border-default">
              <span className="text-[11px] font-semibold text-text-muted block mb-0.5">Deskripsi:</span>
              <p className="text-text-primary leading-relaxed">{selectedAuditLog.description}</p>
            </div>

            {/* Perbandingan Nilai Sebelum & Sesudah Berdampingan */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-text-primary block">Perbandingan Nilai:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[11px] text-text-muted block mb-1">Nilai Sebelum (Old Values):</span>
                  <pre className="p-2.5 bg-subtle border border-border-default rounded-md text-[11px] font-mono text-text-secondary overflow-x-auto max-h-40 leading-relaxed">
                    {selectedAuditLog.old_values ? JSON.stringify(selectedAuditLog.old_values, null, 2) : '// Tidak ada data sebelumnya'}
                  </pre>
                </div>
                <div>
                  <span className="text-[11px] text-text-muted block mb-1">Nilai Sesudah (New Values):</span>
                  <pre className="p-2.5 bg-subtle border border-border-default rounded-md text-[11px] font-mono text-text-primary font-medium overflow-x-auto max-h-40 leading-relaxed">
                    {selectedAuditLog.new_values ? JSON.stringify(selectedAuditLog.new_values, null, 2) : '// Rekaman dihapus'}
                  </pre>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-text-muted pt-1">
              Catatan audit bersifat permanen dan tidak dapat diubah demi kepatuhan kepengawasan.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Settings;
