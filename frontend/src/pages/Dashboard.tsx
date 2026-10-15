import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { 
  Clock, 
  Calendar, 
  CheckSquare, 
  Utensils, 
  FileText, 
  ArrowLeftRight, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight,
  QrCode,
  FileSpreadsheet,
  User as UserIcon,
  Loader2,
  RefreshCw
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import api from '../lib/api';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}

function SummaryCard({ title, value, subtitle, icon }: SummaryCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
        <div className="flex items-center justify-between text-xs text-text-muted font-medium">
          <span className="truncate">{title}</span>
          <span className="shrink-0 ml-2 text-text-muted">{icon}</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-text-primary tracking-tight tabular-nums">
            {value}
          </div>
        </div>
        <div className="text-xs text-text-muted truncate">
          {subtitle}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { user, portalMode } = useAuth();
  const location = useLocation();

  // Deteksi apakah sedang di halaman admin / portal manajemen
  const isManagementView = portalMode === 'management' || location.pathname.startsWith('/admin');

  // State untuk data Pengajuan Pengguna & Jadwal Akhir Pekan (User Mode)
  const [userLeaves, setUserLeaves] = useState<any[]>([]);
  const [userSwaps, setUserSwaps] = useState<any[]>([]);
  const [dynamicWeekendSchedule, setDynamicWeekendSchedule] = useState<any>(null);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // State untuk data Presensi & Daily Report Hari Ini (User Mode)
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [todayDailyReport, setTodayDailyReport] = useState<any>(null);
  const [openPolicyIndex, setOpenPolicyIndex] = useState<number | null>(null);

  // State untuk data Manajemen Real-time (Executive / Admin Mode)
  const [managementOverview, setManagementOverview] = useState<any>(null);
  const [loadingManagement, setLoadingManagement] = useState(false);

  const todayDateFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const fetchManagementOverview = async () => {
    setLoadingManagement(true);
    try {
      const res = await api.get('/dashboard/overview');
      setManagementOverview(res.data);
    } catch (err) {
      console.error('Error fetching management overview:', err);
    } finally {
      setLoadingManagement(false);
    }
  };

  useEffect(() => {
    if (isManagementView) {
      fetchManagementOverview();
    } else {
      setLoadingRequests(true);
      const todayStr = new Date().toISOString().split('T')[0];

      Promise.allSettled([
        api.get('/leaves'),
        api.get('/workday-swaps'),
        api.get('/weekend-schedules'),
        api.get('/attendance'),
        api.get('/attendance/my-summary'),
        api.get(`/daily-reports/today?date=${todayStr}`)
      ]).then(([leavesRes, swapsRes, rosterRes, attRes, mySummaryRes, dailyRes]) => {
        if (leavesRes.status === 'fulfilled') {
          const raw = leavesRes.value.data;
          const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
          setUserLeaves(list);
        }
        if (swapsRes.status === 'fulfilled') {
          const raw = swapsRes.value.data;
          const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
          setUserSwaps(list);
        }
        if (rosterRes.status === 'fulfilled') {
          const rosterData = rosterRes.value.data;
          const rosterList = Array.isArray(rosterData?.roster) ? rosterData.roster : [];
          const mySchedule = rosterList.find((r: any) => r.employee_id === user?.employee?.id);
          if (mySchedule) {
            setDynamicWeekendSchedule(mySchedule);
          }
        }
        if (mySummaryRes.status === 'fulfilled' && mySummaryRes.value.data) {
          const summary = mySummaryRes.value.data;
          setAttendanceSummary(summary);
          if (summary.today_attendance) {
            setTodayAttendance(summary.today_attendance);
          }
        }
        if (attRes.status === 'fulfilled') {
          const raw = attRes.value.data;
          const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
          const myAtt = list.find((att: any) => 
            (att.employee_id === user?.employee?.id || !att.employee_id) && att.date === todayStr
          ) || list.find((att: any) => att.date === todayStr);
          if (myAtt) {
            setTodayAttendance(myAtt);
          }
          // Fallback ringkasan jika endpoint my-summary belum merespon
          setAttendanceSummary((prev: any) => {
            if (prev) return prev;
            const currentMonthPrefix = todayStr.slice(0, 7);
            const myAttendancesMonth = list.filter((a: any) => 
              (!a.employee_id || a.employee_id === user?.employee?.id) &&
              a.date && a.date.startsWith(currentMonthPrefix) &&
              (a.status === 'present' || a.status === 'late')
            );
            const presentCount = myAttendancesMonth.length;
            return {
              present_days: presentCount,
              standard_working_days: 26,
              attendance_rate: Math.round((presentCount / 26) * 100),
            };
          });
        }
        if (dailyRes.status === 'fulfilled') {
          setTodayDailyReport(dailyRes.value.data);
        }
      }).finally(() => {
        setLoadingRequests(false);
      });
    }
  }, [isManagementView, user?.employee?.id]);

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sick: 'Izin Sakit',
      annual: 'Cuti Tahunan',
      family: 'Izin Keluarga',
      event: 'Acara Keluarga',
      urgent: 'Keperluan Mendesak',
      unpaid: 'Cuti Tanpa Gaji',
      maternity: 'Cuti Melahirkan',
      other: 'Izin Lainnya'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" dot>Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="danger" dot>Ditolak</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning" dot>Menunggu</Badge>;
    }
  };

  // Gabungkan pengajuan izin & swap untuk tampilan user portal
  const combinedUserRequests = [
    ...userLeaves.map((l: any) => ({
      id: `leave-${l.id}`,
      typeLabel: getLeaveTypeLabel(l.type),
      date: `${l.start_date}${l.end_date !== l.start_date ? ` s/d ${l.end_date}` : ''}`,
      reason: l.reason,
      status: l.status,
      createdAt: l.created_at || l.start_date,
      isSwap: false,
    })),
    ...userSwaps.map((s: any) => ({
      id: `swap-${s.id}`,
      typeLabel: 'Tukar Hari Kerja',
      date: `${s.original_date} ➔ ${s.replacement_date}`,
      reason: s.reason,
      status: s.status,
      createdAt: s.created_at || s.original_date,
      isSwap: true,
    }))
  ].slice(0, 5);

  // Menentukan jadwal akhir pekan karyawan
  const weekendSchedule = user?.weekend_schedule;
  const weekendPattern = dynamicWeekendSchedule?.weekend_pattern || user?.employee?.weekend_pattern || weekendSchedule?.pattern || 'saturday_fixed';
  const assignedWorkday = dynamicWeekendSchedule?.assigned_workday || weekendSchedule?.assigned_workday || (weekendPattern === 'sunday_fixed' ? 'sunday' : 'saturday');

  let weekendValue = 'Masuk Sabtu';
  let weekendSubtitle = 'Minggu Libur (Bebas Absen)';
  if (assignedWorkday === 'sunday') {
    weekendValue = 'Masuk Minggu';
    weekendSubtitle = weekendPattern === 'rotating' 
      ? 'Sabtu Libur • Pekan depan: Masuk Sabtu' 
      : 'Sabtu Libur (Bebas Absen)';
  } else {
    weekendValue = 'Masuk Sabtu';
    weekendSubtitle = weekendPattern === 'rotating' 
      ? 'Minggu Libur • Pekan depan: Masuk Minggu' 
      : 'Minggu Libur (Bebas Absen)';
  }

  const hasCheckedIn = Boolean(todayAttendance?.time_in);
  const hasCheckedOut = Boolean(todayAttendance?.time_out);
  const morningTime = todayAttendance?.time_in ? todayAttendance.time_in.slice(0, 5) : null;
  const afternoonTime = todayAttendance?.time_out ? todayAttendance.time_out.slice(0, 5) : null;
  const isAttendanceComplete = hasCheckedIn && hasCheckedOut;

  const isDailyReportSubmitted = Boolean(
    todayDailyReport && 
    (todayDailyReport.status === 'submitted' || todayDailyReport.status === 'reviewed')
  );
  const hasDraftReport = Boolean(
    todayDailyReport && 
    todayDailyReport.entries && 
    todayDailyReport.entries.some((e: any) => e.activity && e.activity.trim() !== '')
  );

  const approvedLeavesCount = userLeaves.filter((l: any) => l.status === 'approved').length;

  const policies = [
    {
      title: 'Basis 26 Hari Kerja',
      description: 'Gaji pokok dihitung secara proporsional berdasarkan basis 26 hari kerja per bulan.'
    },
    {
      title: 'Uang Makan Rp 11.000 / Hari',
      description: 'Berhak didapatkan jika absen masuk sebelum atau tepat pukul 08:15 WIB (toleransi 15 menit dari jam kerja standar 08:00 WIB).'
    },
    {
      title: 'Jadwal Roster Akhir Pekan',
      description: 'Pola shift kerja Sabtu atau Minggu diatur oleh HR. Anda dapat mengajukan permohonan tukar hari kerja melalui menu Pengajuan Izin.'
    },
    {
      title: 'Daily Report Harian',
      description: 'Wajib diisi dan disubmit setiap hari kerja sebelum absen pulang pada jam 16:00 WIB.'
    }
  ];

  return (
    <div className="space-y-6">
      {isManagementView ? (
        /* ================== MANAGEMENT BACKEND DASHBOARD ================== */
        <>
          {/* Header Eksekutif */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                Dashboard Eksekutif
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-sm text-text-secondary">
                  Ringkasan operasional dan kehadiran tim hari ini.
                </p>
                <span className="text-text-muted hidden sm:inline">•</span>
                <span className="text-xs font-medium text-text-muted bg-subtle px-2 py-0.5 rounded border border-border-default">
                  {todayDateFormatted}
                </span>
              </div>
            </div>

            {/* Action Buttons Management */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link to="/admin/absensi/live" className="shrink-0">
                <Button variant="outline" size="sm" leftIcon={<Clock className="w-4 h-4 text-text-muted" />} className="whitespace-nowrap h-9">
                  Monitor Presensi Live
                </Button>
              </Link>
              <Link to="/admin/persetujuan" className="shrink-0">
                <Button variant="primary" size="sm" className="whitespace-nowrap h-9">
                  Persetujuan & Izin
                </Button>
              </Link>
            </div>
          </div>

          {/* Kartu Ringkasan Eksekutif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard 
              title="Kehadiran Tim"
              value={`${managementOverview?.stats?.present_today ?? 0} / ${managementOverview?.stats?.total_active_employees ?? 0}`}
              subtitle={`${managementOverview?.stats?.attendance_rate ?? 0}% hadir${(managementOverview?.stats?.late_today ?? 0) > 0 ? ` • ${managementOverview.stats.late_today} terlambat` : ''}`}
              icon={<Clock className="w-4 h-4" />}
            />
            <SummaryCard 
              title="Izin & Sakit"
              value={`${managementOverview?.stats?.on_leave_today ?? 0}`}
              subtitle={(managementOverview?.stats?.on_leave_today ?? 0) > 0 ? `${managementOverview.stats.on_leave_today} orang izin aktif hari ini` : "Tidak ada izin aktif hari ini"}
              icon={<Calendar className="w-4 h-4" />}
            />
            <SummaryCard 
              title="Daily Report Masuk"
              value={`${managementOverview?.stats?.daily_reports_submitted ?? 0} / ${managementOverview?.stats?.daily_reports_total ?? 0}`}
              subtitle={`${managementOverview?.stats?.daily_reports_total ? Math.round(((managementOverview?.stats?.daily_reports_submitted ?? 0) / managementOverview.stats.daily_reports_total) * 100) : 0}% submit • ${Math.max(0, (managementOverview?.stats?.daily_reports_total ?? 0) - (managementOverview?.stats?.daily_reports_submitted ?? 0))} belum`}
              icon={<FileSpreadsheet className="w-4 h-4" />}
            />
            <SummaryCard 
              title="Uang Makan Harian"
              value={`Rp ${(managementOverview?.stats?.meal_allowance ?? 11000).toLocaleString('id-ID')}`}
              subtitle={`Toleransi maks. ${managementOverview?.stats?.tolerance_minutes ?? 15} mnt (08:15 WIB)`}
              icon={<Utensils className="w-4 h-4" />}
            />
          </div>

          {/* Grid Konten Manajemen */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom Kiri: Kehadiran Tim Hari Ini */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold text-text-primary">
                        Kehadiran Tim Hari Ini
                      </CardTitle>
                      {managementOverview && !managementOverview.is_today_data && (
                        <Badge variant="neutral" className="text-[10px] font-normal py-0 px-1.5 h-5">
                          Presensi Terkini
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate">
                      Monitoring absensi real-time staf operasional
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      type="button"
                      onClick={fetchManagementOverview} 
                      disabled={loadingManagement}
                      className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-subtle transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center disabled:opacity-50"
                      aria-label="Perbarui data kehadiran"
                      title="Perbarui Data"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingManagement ? 'animate-spin text-primary' : ''}`} />
                    </button>
                    <Link to="/admin/absensi/live">
                      <Button variant="text" size="sm" className="text-xs h-8 px-2 font-medium">
                        Lihat Semua
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingManagement ? (
                    <div className="py-12 flex flex-col items-center justify-center text-text-muted">
                      <Loader2 className="w-5 h-5 animate-spin text-primary mb-2" />
                      <p className="text-xs">Memuat data absensi tim...</p>
                    </div>
                  ) : managementOverview?.today_attendances?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-subtle border-b border-border-default text-text-muted text-xs font-medium">
                          <tr>
                            <th className="px-4 py-2 font-medium">Karyawan</th>
                            <th className="px-4 py-2 font-medium">Status</th>
                            <th className="px-4 py-2 font-medium text-right">Waktu Masuk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                          {managementOverview.today_attendances.map((att: any) => (
                            <tr key={att.id} className="hover:bg-subtle/70 transition-colors">
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-subtle text-text-secondary border border-border-default flex items-center justify-center text-xs font-semibold shrink-0">
                                    {att.initials}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-text-primary text-sm leading-tight truncate">
                                      {att.employee_name}
                                    </p>
                                    <p className="text-xs text-text-muted leading-tight truncate">
                                      {att.department_name}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                {att.status === 'present' ? (
                                  <Badge variant="success" dot>Hadir</Badge>
                                ) : att.status === 'late' ? (
                                  <Badge variant="warning" dot>Terlambat</Badge>
                                ) : att.status === 'leave' ? (
                                  <Badge variant="info" dot>Izin / Cuti</Badge>
                                ) : att.status === 'half_day' ? (
                                  <Badge variant="neutral" dot>Setengah Hari</Badge>
                                ) : (
                                  <Badge variant="danger" dot>Alpa</Badge>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-xs text-text-secondary tabular-nums">
                                {att.time_in !== '-' ? `${att.time_in} WIB` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-text-muted px-4">
                      <Clock className="w-6 h-6 mx-auto mb-1.5 text-text-muted/60" />
                      <p className="font-medium text-text-secondary text-xs">Belum ada absensi tercatat hari ini</p>
                      <p className="text-[11px] text-text-muted mt-0.5">Data muncul saat karyawan melakukan scan presensi QR.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Kolom Kanan: Persetujuan Menunggu */}
            <div>
              <Card className="h-full flex flex-col justify-between">
                <div>
                  <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                    <CardTitle className="text-base font-semibold text-text-primary whitespace-nowrap">
                      Persetujuan Menunggu
                    </CardTitle>
                    {managementOverview?.total_pending > 0 ? (
                      <Badge variant="warning" className="whitespace-nowrap shrink-0 text-xs py-0.5 px-2">
                        {managementOverview.total_pending} Antrean
                      </Badge>
                    ) : (
                      <Badge variant="success" className="whitespace-nowrap shrink-0 text-xs py-0.5 px-2">
                        Selesai
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {loadingManagement ? (
                      <div className="py-6 flex flex-col items-center justify-center text-text-muted">
                        <Loader2 className="w-5 h-5 animate-spin text-primary mb-1.5" />
                        <p className="text-xs">Memeriksa permohonan pending...</p>
                      </div>
                    ) : managementOverview?.pending_approvals?.length > 0 ? (
                      <div className="space-y-2">
                        {managementOverview.pending_approvals.map((item: any) => (
                          <Link 
                            key={`${item.category}-${item.id}`} 
                            to={item.link || '/admin/persetujuan'}
                            className="flex items-center justify-between p-2.5 rounded-md border border-border-default hover:bg-subtle hover:border-border-default transition-colors group gap-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                                item.category === 'leave'
                                  ? 'bg-warning-bg text-warning-fg'
                                  : item.category === 'correction'
                                  ? 'bg-info-bg text-info-fg'
                                  : 'bg-primary-soft text-primary'
                              }`}>
                                {item.category === 'leave' ? (
                                  <Calendar className="w-3.5 h-3.5" />
                                ) : item.category === 'correction' ? (
                                  <Clock className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowLeftRight className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-text-primary truncate leading-tight">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-text-muted truncate leading-tight mt-0.5">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary shrink-0 transition-colors" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-md bg-subtle border border-border-default flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-success-fg shrink-0" />
                        <p className="text-xs text-text-secondary leading-snug">
                          Semua pengajuan cuti, izin, dan koreksi telah diproses.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 pt-0">
                  <Link to="/admin/persetujuan" className="block w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs h-9 font-medium">
                      Lihat Semua Persetujuan {managementOverview?.total_pending ? `(${managementOverview.total_pending})` : ''}
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        /* ================== USER PORTAL DASHBOARD (PORTAL KARYAWAN) ================== */
        <>
          {/* Header Portal Karyawan: Sapaan & Subteks Tanpa Chip */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Halo, {user?.name || 'Karyawan'}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {todayDateFormatted} • {user?.employee?.current_assignment?.department?.name || 'Kurma Group'} • {user?.employee?.current_assignment?.job_position?.name || 'Staff'}
            </p>
          </div>

          {/* 1. KARTU UTAMA: HARI INI (Paling Atas) */}
          <Card className="border-border-default shadow-xs bg-surface">
            <CardHeader className="py-3 px-4 sm:px-5 border-b border-border-default flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Hari Ini</CardTitle>
                  <p className="text-xs text-text-muted">Ketentuan operasional, presensi, dan laporan kerja Anda</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Grid Status Hari Ini: 3 Blok Informasi */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Blok 1: Jadwal Kerja */}
                <div className="p-3.5 rounded-lg bg-subtle border border-border-default flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                      Jadwal Kerja
                    </span>
                    <p className="text-base sm:text-lg font-bold text-text-primary mt-1">
                      08:00 – 16:00 WIB
                    </p>
                  </div>
                  <p className="text-xs text-text-secondary mt-2">
                    Batas uang makan: <span className="font-semibold text-text-primary">08:15 WIB</span>
                  </p>
                </div>

                {/* Blok 2: Status Presensi Masuk & Pulang */}
                <div className="p-3.5 rounded-lg bg-subtle border border-border-default flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                      Presensi Harian
                    </span>
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">Absen Masuk:</span>
                        <span className={`font-semibold tabular-nums ${morningTime ? 'text-text-primary' : 'text-text-muted'}`}>
                          {morningTime ? `${morningTime} WIB` : 'Belum absen'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">Absen Pulang:</span>
                        <span className={`font-semibold tabular-nums ${afternoonTime ? 'text-text-primary' : 'text-text-muted'}`}>
                          {afternoonTime ? `${afternoonTime} WIB` : 'Belum absen'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    {isAttendanceComplete ? 'Presensi hari ini lengkap' : 'Scan QR di layar terminal kantor'}
                  </p>
                </div>

                {/* Blok 3: Status Daily Report */}
                <div className="p-3.5 rounded-lg bg-subtle border border-border-default flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                      Daily Report
                    </span>
                    <p className="text-base sm:text-lg font-bold text-text-primary mt-1">
                      {isDailyReportSubmitted ? 'Sudah dikirim' : (hasDraftReport ? 'Draft tersimpan' : 'Belum diisi')}
                    </p>
                  </div>
                  <p className="text-xs text-text-secondary mt-2">
                    Wajib sebelum absen pulang (16:00 WIB)
                  </p>
                </div>
              </div>

              {/* Dua Tombol Aksi: Warna Aksen Jika Belum Selesai, Outline Jika Sudah Selesai */}
              <div className="pt-2 border-t border-border-default flex flex-col sm:flex-row items-center gap-3">
                <Link to="/absensi" className="w-full sm:flex-1">
                  <Button 
                    variant={isAttendanceComplete ? 'outline' : 'primary'} 
                    className="w-full h-11 sm:h-10 text-sm font-medium justify-center"
                    leftIcon={<QrCode className="w-4 h-4" />}
                  >
                    Scan Presensi QR
                  </Button>
                </Link>

                <Link to="/daily-report" className="w-full sm:flex-1">
                  <Button 
                    variant={isDailyReportSubmitted ? 'outline' : 'primary'} 
                    className="w-full h-11 sm:h-10 text-sm font-medium justify-center"
                    leftIcon={<FileSpreadsheet className="w-4 h-4" />}
                  >
                    Isi Daily Report
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 2. KARTU RINGKASAN: 3 KARTU (Dua per baris di HP) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Kehadiran Bulan Ini */}
            <Card className="h-full">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between text-xs text-text-muted font-medium">
                  <span className="truncate">Kehadiran Bulan Ini</span>
                  <Clock className="w-4 h-4 text-text-muted shrink-0" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight tabular-nums">
                    {attendanceSummary?.present_days ?? 0}{' '}
                    <span className="text-xs sm:text-sm font-normal text-text-secondary">
                      dari {attendanceSummary?.standard_working_days ?? 26} hari kerja
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, attendanceSummary?.attendance_rate ?? 0))}%` }} 
                    />
                  </div>
                </div>
                <div className="text-[11px] sm:text-xs text-text-muted truncate">
                  {attendanceSummary?.attendance_rate ?? 0}% tingkat kehadiran bulan ini
                </div>
              </CardContent>
            </Card>

            {/* Izin Bulan Ini */}
            <Card className="h-full">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between text-xs text-text-muted font-medium">
                  <span className="truncate">Izin Bulan Ini</span>
                  <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight tabular-nums">
                    {approvedLeavesCount} <span className="text-xs sm:text-sm font-normal text-text-secondary">hari</span>
                  </div>
                </div>
                <div className="text-[11px] sm:text-xs text-text-muted truncate">
                  Hari izin terpakai
                </div>
              </CardContent>
            </Card>

            {/* Akhir Pekan Ini */}
            <Card className="h-full col-span-2 lg:col-span-1">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between text-xs text-text-muted font-medium">
                  <span className="truncate">Akhir Pekan Ini</span>
                  <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight truncate">
                    {weekendValue}
                  </div>
                </div>
                <div className="text-[11px] sm:text-xs text-text-muted truncate">
                  {weekendSubtitle}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. GRID 2 KOLOM (Di samping di Desktop, Stacked di HP) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kolom Kiri: Status Pengajuan Saya */}
            <Card>
              <CardHeader className="py-3 px-4 border-b border-border-default flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Status Pengajuan Saya</CardTitle>
                </div>
                <Link to="/cuti" className="text-xs font-medium text-primary hover:underline">
                  Lihat semua
                </Link>
              </CardHeader>

              {/* Baris Tombol Ajukan Izin Satu Baris */}
              <div className="p-3 bg-subtle/50 border-b border-border-default flex items-center justify-between gap-3">
                <p className="text-xs text-text-secondary truncate">
                  Butuh izin sakit, cuti, atau tukar hari?
                </p>
                <Link to="/cuti" className="shrink-0">
                  <Button variant="outline" size="sm" className="text-xs h-8 whitespace-nowrap">
                    Ajukan Izin
                  </Button>
                </Link>
              </div>

              <CardContent className="p-0">
                {loadingRequests ? (
                  /* Skeleton Baris Saat Memuat */
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-md border border-border-default bg-subtle/40 animate-pulse">
                        <div className="space-y-1.5 flex-1 mr-4">
                          <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                          <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                        </div>
                        <div className="h-5 bg-slate-200 rounded w-16" />
                      </div>
                    ))}
                  </div>
                ) : combinedUserRequests.length > 0 ? (
                  /* Daftar 5 Pengajuan Terbaru */
                  <div className="divide-y divide-border-default">
                    {combinedUserRequests.map((req) => (
                      <div key={req.id} className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-subtle transition-colors">
                        <div className="min-w-0 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-md bg-subtle border border-border-default flex items-center justify-center shrink-0 text-text-secondary">
                            {req.isSwap ? (
                              <ArrowLeftRight className="w-4 h-4 text-primary" />
                            ) : (
                              <Calendar className="w-4 h-4 text-text-muted" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-text-primary truncate">
                              {req.typeLabel}
                            </p>
                            <p className="text-[11px] text-text-muted truncate mt-0.5">
                              {req.date} {req.reason ? `• ${req.reason}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(req.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Saat Kosong: Cukup Satu Kalimat */
                  <div className="py-6 px-4 text-center">
                    <p className="text-xs text-text-muted">
                      Belum ada riwayat pengajuan izin, cuti, atau tukar hari kerja.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kolom Kanan: Kebijakan & Aturan Kerja (Akordion Collapsible) */}
            <Card>
              <CardHeader className="py-3 px-4 border-b border-border-default">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Kebijakan & Aturan Kerja
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 divide-y divide-border-default">
                {policies.map((p, idx) => {
                  const isOpen = openPolicyIndex === idx;
                  return (
                    <div key={idx} className="py-2.5 first:pt-1 last:pb-1">
                      <button
                        type="button"
                        onClick={() => setOpenPolicyIndex(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between text-left group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded py-1 px-1 transition-colors hover:bg-subtle"
                      >
                        <span className="text-xs sm:text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                          {p.title}
                        </span>
                        <ChevronRight 
                          className={`w-4 h-4 text-text-muted transition-transform duration-200 shrink-0 ml-2 ${
                            isOpen ? 'rotate-90 text-primary' : ''
                          }`} 
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-1.5 px-1 text-xs text-text-secondary leading-relaxed animate-in fade-in duration-150">
                          {p.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
