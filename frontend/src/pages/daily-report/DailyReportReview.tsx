import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  Eye, 
  MessageSquare,
  Save,
  X,
  Users,
  UserMinus,
  UserPlus,
  Loader2,
  Check
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

interface ReportItem {
  id: number;
  report_date: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'revision_requested';
  submitted_at?: string;
  overall_feedback?: string;
  summary_notes?: string;
  employee?: {
    id: number;
    employee_id: string;
    first_name: string;
    last_name?: string;
    current_assignment?: {
      department?: { id: number; name: string };
      job_position?: { id: number; name: string };
    };
  };
  entries?: any[];
  reviewer?: { name: string };
}

// Helper: Format tanggal Indonesia (WIB) tanpa pergeseran hari
export function formatReportDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    // Jika format hanya YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      // Gunakan 12:00 UTC agar aman di zona waktu WIB (UTC+7)
      const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }).format(d);
    }

    // Jika format ISO datetime (misal: "2026-10-11T17:00:00.000000Z")
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(d);
  } catch {
    return dateStr;
  }
}

// Helper: Format waktu penyerahan WIB
export function formatSubmittedTime(timeStr: string | null | undefined): string {
  if (!timeStr) return 'Belum diserahkan';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    const formatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
      hour12: false,
    }).format(d);
    return `${formatted} WIB`;
  } catch {
    return timeStr;
  }
}

export function DailyReportReview() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [notesFilter, setNotesFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Team Management state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState<boolean>(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [teamModalTab, setTeamModalTab] = useState<'current' | 'invite'>('current');
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState<string>('');
  const [selectedEmployeesToInvite, setSelectedEmployeesToInvite] = useState<number[]>([]);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState<boolean>(false);

  // Supervisor feedback state
  const [reviewComments, setReviewComments] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Debounce search query ~300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchTeamData();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, notesFilter, dateFilter]);

  const fetchTeamData = async () => {
    setLoadingTeam(true);
    try {
      const res = await api.get('/manager-team');
      setTeamMembers(res.data.team_members || []);
      setAvailableEmployees(res.data.available_employees || []);
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleInviteEmployees = async () => {
    if (selectedEmployeesToInvite.length === 0) return;
    setIsSubmittingInvite(true);
    try {
      const res = await api.post('/manager-team/invite', {
        employee_ids: selectedEmployeesToInvite
      });
      setActionMessage(res.data.message || 'Anggota berhasil ditambahkan ke tim.');
      setSelectedEmployeesToInvite([]);
      await fetchTeamData();
      await fetchReports();
      setTeamModalTab('current');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambahkan anggota ke tim.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleRemoveMember = async (employeeId: number, employeeName: string) => {
    if (!confirm(`Keluarkan ${employeeName} dari tim pemantauan Anda?`)) return;
    try {
      const res = await api.delete(`/manager-team/${employeeId}`);
      setActionMessage(res.data.message || 'Anggota berhasil dikeluarkan dari tim.');
      await fetchTeamData();
      await fetchReports();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengeluarkan anggota dari tim.');
    }
  };

  const filteredAvailableEmployees = availableEmployees.filter((emp) => {
    if (!searchEmployeeQuery) return true;
    const query = searchEmployeeQuery.toLowerCase();
    const name = `${emp.first_name} ${emp.last_name || ''}`.toLowerCase();
    const dept = (emp.current_assignment?.department?.name || '').toLowerCase();
    const position = (emp.current_assignment?.job_position?.name || '').toLowerCase();
    const code = (emp.employee_id || '').toLowerCase();
    return name.includes(query) || dept.includes(query) || position.includes(query) || code.includes(query);
  });

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let url = '/daily-reports?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (dateFilter) url += `date=${dateFilter}&`;
      if (notesFilter === 'has_notes') url += `has_notes=true&`;
      if (notesFilter === 'no_notes') url += `has_notes=false&`;

      const res = await api.get(url);
      const raw = res.data;
      setReports(Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []));
    } catch (err) {
      console.error('Failed to load reports:', err);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewDrawer = async (report: ReportItem) => {
    try {
      const res = await api.get(`/daily-reports/${report.id}`);
      setSelectedReport(res.data);
      setReviewComments(res.data.overall_feedback || '');
      setIsDrawerOpen(true);
    } catch (err) {
      console.error('Failed to load report detail:', err);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedReport) return;

    setIsSubmittingReview(true);
    try {
      const res = await api.post(`/daily-reports/${selectedReport.id}/review`, {
        action: 'commented',
        comments: reviewComments || '',
      });

      setActionMessage(res.data.message || 'Catatan atasan berhasil disimpan.');
      setIsDrawerOpen(false);
      fetchReports();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan catatan atasan.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Daftar departemen yang bersumber sama dengan Manajemen Payroll
  const departmentOptions = Array.from(
    new Set([
      'Departemen Herbal',
      'Departemen Fashion MY PH',
      'Departemen Shopee Video',
      'Departemen HR & Operasional',
      ...availableEmployees.map((e: any) => e.current_assignment?.department?.name),
      ...reports.map((r: any) => r.employee?.current_assignment?.department?.name),
    ])
  ).filter(Boolean) as string[];

  // Penyaringan bersamaan: nama/NIK, departemen, status, catatan, tanggal
  const filteredReports = reports.filter((item) => {
    // 1. Filter Nama atau NIK (case-insensitive)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      const fullName = `${item.employee?.first_name || ''} ${item.employee?.last_name || ''}`.toLowerCase();
      const nik = (item.employee?.employee_id || '').toLowerCase();
      if (!fullName.includes(q) && !nik.includes(q)) {
        return false;
      }
    }

    // 2. Filter Departemen
    if (deptFilter && deptFilter !== 'all') {
      const itemDeptName = item.employee?.current_assignment?.department?.name || '';
      if (itemDeptName !== deptFilter) {
        return false;
      }
    }

    return true;
  });

  const isFilterActive = 
    Boolean(searchQuery.trim()) || 
    (deptFilter !== 'all' && deptFilter !== '') || 
    statusFilter !== '' || 
    notesFilter !== '' || 
    Boolean(dateFilter);

  const handleResetFilter = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setDeptFilter('all');
    setStatusFilter('');
    setNotesFilter('');
    setDateFilter('');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Catatan Daily Report</h1>
            <span className="text-xs text-text-muted font-normal">{teamMembers.length} anggota dipantau</span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Lihat laporan harian tim dan beri catatan langsung.
          </p>
        </div>

        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsTeamModalOpen(true);
              setTeamModalTab(teamMembers.length === 0 ? 'invite' : 'current');
            }}
            leftIcon={<Users className="w-4 h-4" />}
            className="whitespace-nowrap h-9 text-xs"
          >
            Kelola Tim
          </Button>
        </div>
      </div>

      {/* Info Tim Kosong (satu baris info tipis) */}
      {teamMembers.length === 0 && !loadingTeam && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-subtle border border-border-default rounded-lg text-xs text-text-secondary">
          <Users className="w-4 h-4 text-text-muted shrink-0" />
          <span>Belum ada anggota tim. Undang anggota lewat Kelola Tim.</span>
        </div>
      )}

      {/* Action Notification Message */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setActionMessage(null)} 
            aria-label="Tutup pesan" 
            className="p-1 rounded hover:bg-emerald-100 text-emerald-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Toolbar (2 Baris) */}
      <div className="bg-surface p-3.5 rounded-lg border border-border-default shadow-xs space-y-3 text-xs">
        {/* Baris 1: Kotak Cari (Paling Lebar), Dropdown Departemen, Input Tanggal */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Kotak Cari */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama atau NIK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-xs rounded-lg border border-border-default bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              aria-label="Cari nama atau NIK"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
                aria-label="Kosongkan pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Departemen */}
          <div className="w-full lg:w-64 shrink-0">
            <select
              id="dept-filter-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-border-default bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer transition-colors"
              aria-label="Filter departemen"
            >
              <option value="all">Semua departemen</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Input Tanggal */}
          <div className="w-full lg:w-48 shrink-0">
            <div className="relative flex items-center w-full">
              <Calendar className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border-default bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
                aria-label="Filter tanggal laporan"
              />
            </div>
          </div>
        </div>

        {/* Baris 2: Status, Catatan, lalu Reset di Ujung Kanan */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 lg:pt-0 border-t lg:border-t-0 border-border-default">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-text-secondary font-medium text-xs whitespace-nowrap">Status:</span>
              <div className="inline-flex items-center p-0.5 rounded-lg bg-page border border-border-default h-9">
                <button
                  type="button"
                  onClick={() => setStatusFilter('')}
                  className={`px-3 h-7.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === ''
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-subtle'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('submitted')}
                  className={`px-3 h-7.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === 'submitted'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-subtle'
                  }`}
                >
                  Sudah diisi
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('draft')}
                  className={`px-3 h-7.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === 'draft'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-subtle'
                  }`}
                >
                  Draft
                </button>
              </div>
            </div>

            {/* Catatan Filter */}
            <div className="flex items-center gap-2">
              <span className="text-text-secondary font-medium text-xs whitespace-nowrap">Catatan:</span>
              <div className="inline-flex items-center p-0.5 rounded-lg bg-page border border-border-default h-9">
                <button
                  type="button"
                  onClick={() => setNotesFilter('')}
                  className={`px-3 h-7.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    notesFilter === ''
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-subtle'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setNotesFilter('has_notes')}
                  className={`px-3 h-7.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    notesFilter === 'has_notes'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-subtle'
                  }`}
                >
                  Ada
                </button>
                <button
                  type="button"
                  onClick={() => setNotesFilter('no_notes')}
                  className={`px-3 h-7.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    notesFilter === 'no_notes'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-subtle'
                  }`}
                >
                  Belum ada
                </button>
              </div>
            </div>
          </div>

          {/* Reset Filter Button (Ujung Kanan, Hanya Muncul Kalau Ada Filter Aktif) */}
          {isFilterActive && (
            <div className="flex justify-end lg:ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilter}
                className="h-9 text-xs text-text-secondary hover:text-text-primary whitespace-nowrap"
                leftIcon={<X className="w-3.5 h-3.5" />}
              >
                Reset
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Jumlah Hasil */}
      <div className="flex items-center justify-between text-xs text-text-muted px-0.5">
        <p>
          {isLoading ? 'Memuat laporan...' : `Menampilkan ${filteredReports.length} dari ${reports.length} laporan`}
        </p>
      </div>

      {/* Reports Table Card (Desktop) */}
      <div className="hidden lg:block bg-surface rounded-lg border border-border-default shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-subtle sticky top-0 z-10 border-b border-border-default">
              <tr>
                <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Karyawan</th>
                <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Tanggal</th>
                <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Aktivitas</th>
                <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Status</th>
                <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Catatan</th>
                <th className="py-3 px-4 font-semibold text-text-secondary text-xs text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="h-16 border-b border-border-default/60 animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-subtle shrink-0" />
                        <div className="space-y-1.5 flex-1 min-w-0 max-w-[220px]">
                          <div className="h-3.5 bg-subtle rounded w-32" />
                          <div className="h-2.5 bg-subtle rounded w-44" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3.5 bg-subtle rounded w-24" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3.5 bg-subtle rounded w-16" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-5 bg-subtle rounded-full w-20" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-5 bg-subtle rounded-full w-16" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-8 bg-subtle rounded w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <FileSpreadsheet className="w-8 h-8 text-text-muted" />
                      <p className="text-sm font-medium text-text-primary">Tidak ada laporan yang cocok</p>
                      <p className="text-xs text-text-muted">
                        {isFilterActive 
                          ? 'Tidak ada data laporan yang sesuai dengan kombinasi filter yang dipilih.' 
                          : 'Belum ada daily report yang masuk.'}
                      </p>
                      {isFilterActive && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleResetFilter} 
                          className="mt-2 text-xs"
                        >
                          Reset Filter
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((item) => (
                  <tr key={item.id} className="h-16 hover:bg-subtle/50 transition-colors">
                    {/* Karyawan */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-subtle text-text-secondary flex items-center justify-center font-semibold text-xs shrink-0 border border-border-default">
                          {item.employee?.first_name?.charAt(0) || 'K'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary text-sm truncate leading-tight">
                            {item.employee?.first_name} {item.employee?.last_name || ''}
                          </p>
                          <p className="text-[11px] text-text-muted truncate mt-0.5 max-w-[260px] leading-tight">
                            {item.employee?.employee_id || '-'} • {item.employee?.current_assignment?.department?.name || '-'} • {item.employee?.current_assignment?.job_position?.name || '-'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Tanggal */}
                    <td className="py-3 px-4 whitespace-nowrap text-text-secondary font-medium">
                      {formatReportDate(item.report_date)}
                    </td>

                    {/* Aktivitas */}
                    <td className="py-3 px-4 whitespace-nowrap text-text-secondary">
                      {item.entries?.length || 0} aktivitas
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        item.status === 'draft'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.status === 'draft' ? 'Draft' : 'Sudah diisi'}
                      </span>
                    </td>

                    {/* Catatan */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span 
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          item.overall_feedback
                            ? 'bg-indigo-50 text-primary border border-indigo-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                        title={item.overall_feedback || undefined}
                      >
                        {item.overall_feedback ? (
                          <>
                            <MessageSquare className="w-3 h-3 shrink-0" />
                            Ada
                          </>
                        ) : (
                          'Belum ada'
                        )}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex justify-end">
                        <Button
                          variant={item.overall_feedback ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => openReviewDrawer(item)}
                          className="whitespace-nowrap h-9 text-xs"
                          leftIcon={item.overall_feedback ? <Eye className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                        >
                          {item.overall_feedback ? 'Lihat Catatan' : 'Beri Catatan'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports Card List (Mobile & Tablet < 1024px) */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="p-4 bg-surface rounded-lg border border-border-default shadow-xs space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-subtle shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 bg-subtle rounded w-28" />
                      <div className="h-2.5 bg-subtle rounded w-36" />
                    </div>
                  </div>
                  <div className="h-3 bg-subtle rounded w-20" />
                </div>
                <div className="h-8 bg-subtle rounded w-full mt-2" />
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center bg-surface rounded-lg border border-border-default">
            <FileSpreadsheet className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-text-primary">Tidak ada laporan yang cocok</p>
            <p className="text-xs text-text-muted mt-1">
              {isFilterActive 
                ? 'Tidak ada data laporan yang sesuai dengan kombinasi filter yang dipilih.' 
                : 'Belum ada daily report yang masuk.'}
            </p>
            {isFilterActive && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetFilter} 
                className="mt-3 text-xs mx-auto"
              >
                Reset Filter
              </Button>
            )}
          </div>
        ) : (
          filteredReports.map((item) => (
            <div key={item.id} className="p-4 bg-surface rounded-lg border border-border-default shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-subtle text-text-secondary flex items-center justify-center font-semibold text-xs shrink-0 border border-border-default">
                    {item.employee?.first_name?.charAt(0) || 'K'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">
                      {item.employee?.first_name} {item.employee?.last_name || ''}
                    </p>
                    <p className="text-caption text-text-muted truncate">
                      {item.employee?.employee_id || '-'} • {item.employee?.current_assignment?.department?.name || '-'} • {item.employee?.current_assignment?.job_position?.name || '-'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-text-secondary whitespace-nowrap shrink-0">
                  {formatReportDate(item.report_date)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-default text-xs">
                <span className="text-text-muted">
                  {item.entries?.length || 0} aktivitas
                </span>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
                    item.status === 'draft'
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {item.status === 'draft' ? 'Draft' : 'Sudah diisi'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
                    item.overall_feedback
                      ? 'bg-indigo-50 text-primary border border-indigo-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {item.overall_feedback ? (
                      <>
                        <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                        Ada
                      </>
                    ) : (
                      'Belum ada'
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  variant={item.overall_feedback ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => openReviewDrawer(item)}
                  className="w-full text-xs h-9 justify-center"
                  leftIcon={item.overall_feedback ? <Eye className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                >
                  {item.overall_feedback ? 'Lihat Catatan' : 'Beri Catatan'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Drawer */}
      {isDrawerOpen && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-text-primary/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-surface h-full shadow-lg flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border-default flex items-center justify-between bg-page">
              <div>
                <h3 className="font-semibold text-text-primary text-base">Detail & Catatan Daily Report</h3>
                <p className="text-caption text-text-muted mt-0.5">
                  {selectedReport.employee?.first_name} {selectedReport.employee?.last_name || ''} • {formatReportDate(selectedReport.report_date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Tutup panel"
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-subtle transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Report Summary Card */}
              <div className="bg-subtle p-3.5 rounded-lg border border-border-default text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-semibold">Departemen</span>
                  <span className="font-medium text-text-primary">{selectedReport.employee?.current_assignment?.department?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-semibold">Jabatan</span>
                  <span className="font-medium text-text-primary">{selectedReport.employee?.current_assignment?.job_position?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-semibold">Waktu Diserahkan</span>
                  <span className="font-medium text-text-primary">{formatSubmittedTime(selectedReport.submitted_at)}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-semibold">Status Pengisian</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mt-0.5 ${
                    selectedReport.status === 'draft'
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {selectedReport.status === 'draft' ? 'Draft' : 'Sudah diisi'}
                  </span>
                </div>
              </div>

              {/* Entries Spreadsheet Log */}
              <div>
                <h4 className="font-semibold text-xs text-text-secondary mb-2 uppercase tracking-wider">
                  Rincian Aktivitas Kerja:
                </h4>
                <div className="space-y-2">
                  {!selectedReport.entries || selectedReport.entries.length === 0 ? (
                    <div className="p-4 rounded-lg border border-border-default bg-subtle text-center text-xs text-text-muted">
                      Belum ada rincian aktivitas yang ditambahkan.
                    </div>
                  ) : (
                    selectedReport.entries.map((entry: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg border border-border-default bg-surface text-xs space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text-secondary bg-subtle px-2 py-0.5 rounded text-[11px] border border-border-default">
                            #{idx + 1} • {entry.time_start || '00:00'} - {entry.time_end || '00:00'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            entry.status === 'done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            entry.status === 'in_progress' ? 'bg-indigo-50 text-primary border border-indigo-200' :
                            entry.status === 'blocked' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {entry.status === 'done' ? 'Selesai' :
                             entry.status === 'in_progress' ? 'Dalam Proses' :
                             entry.status === 'blocked' ? 'Terkendala' : entry.status}
                          </span>
                        </div>
                        <p className="font-medium text-text-primary">{entry.activity}</p>
                        {entry.output_result && (
                          <div className="text-[11px] text-text-secondary bg-subtle p-2 rounded border border-border-default">
                            <strong className="text-text-primary">Hasil:</strong> {entry.output_result}
                          </div>
                        )}
                        {entry.notes && (
                          <p className="text-[11px] text-text-muted italic">
                            Catatan: {entry.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Staff Notes */}
              {selectedReport.summary_notes && (
                <div className="p-3 bg-subtle rounded-lg border border-border-default text-xs">
                  <span className="font-semibold text-text-primary block mb-1">Catatan Karyawan:</span>
                  <p className="text-text-secondary">{selectedReport.summary_notes}</p>
                </div>
              )}

              {/* Supervisor Feedback Form */}
              <div className="pt-3 border-t border-border-default space-y-2">
                <label className="block text-xs font-semibold text-text-primary">
                  Catatan / Masukan dari Atasan:
                </label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Tuliskan apresiasi, masukan hasil kerja, atau arahan tindak lanjut untuk karyawan..."
                  className="w-full p-2.5 text-xs rounded-lg border border-border-default focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-text-primary"
                />
                <p className="text-[11px] text-text-muted">
                  Catatan ini akan langsung terlihat oleh karyawan pada tampilan daily report mereka.
                </p>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="p-4 border-t border-border-default bg-page flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDrawerOpen(false)}
                className="text-xs h-9"
              >
                Tutup
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={isSubmittingReview}
                onClick={handleSubmitFeedback}
                leftIcon={isSubmittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                className="text-xs h-9"
              >
                {isSubmittingReview ? 'Menyimpan...' : 'Simpan Catatan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Team Management Modal */}
      <Modal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        title="Kelola Tim"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-text-secondary">
            Halaman ini memantau daily report staf yang Anda undang ke dalam tim pemantauan. Anda dapat mengundang atau mengeluarkan anggota tim kapan saja.
          </p>

          {/* Modal Tabs */}
          <div className="flex border-b border-border-default">
            <button
              type="button"
              onClick={() => setTeamModalTab('current')}
              className={`pb-2.5 px-4 text-xs font-semibold transition-colors border-b-2 ${
                teamModalTab === 'current'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              Anggota Tim Aktif ({teamMembers.length})
            </button>
            <button
              type="button"
              onClick={() => setTeamModalTab('invite')}
              className={`pb-2.5 px-4 text-xs font-semibold transition-colors border-b-2 ${
                teamModalTab === 'invite'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              + Undang Anggota Baru ({availableEmployees.length})
            </button>
          </div>

          {/* Tab 1: Current Team Members */}
          {teamModalTab === 'current' && (
            <div className="space-y-3">
              {loadingTeam ? (
                <div className="py-8 text-center text-text-muted text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" /> Memuat daftar tim...
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="py-8 text-center bg-subtle rounded-lg p-6">
                  <Users className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="font-medium text-text-primary text-xs">Belum ada anggota tim yang diundang</p>
                  <p className="text-caption text-text-muted mt-1 mb-4">
                    Anda belum mengundang staf untuk dipantau.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setTeamModalTab('invite')}
                    leftIcon={<UserPlus className="w-4 h-4" />}
                    className="h-9 text-xs"
                  >
                    Undang Staf Sekarang
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border-default max-h-[360px] overflow-y-auto">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-subtle text-text-secondary font-medium flex items-center justify-center shrink-0 text-xs border border-border-default">
                          {member.employee?.first_name?.charAt(0) || 'K'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary text-xs truncate">
                            {member.employee?.first_name} {member.employee?.last_name || ''}
                          </p>
                          <p className="text-caption text-text-muted truncate">
                            {member.employee?.current_assignment?.department?.name || 'Umum'} • {member.employee?.current_assignment?.job_position?.name || 'Staff'} ({member.employee?.employee_id})
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveMember(member.employee_id, `${member.employee?.first_name} ${member.employee?.last_name || ''}`)}
                        className="shrink-0 text-xs h-8"
                        leftIcon={<UserMinus className="w-3.5 h-3.5" />}
                      >
                        Keluarkan
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Invite Available Employees */}
          {teamModalTab === 'invite' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama karyawan, jabatan, departemen..."
                  value={searchEmployeeQuery}
                  onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border-default focus:border-primary focus:ring-1 focus:ring-primary bg-page text-text-primary"
                />
              </div>

              {/* Selection Bar */}
              <div className="flex items-center justify-between text-caption px-1">
                <span className="text-text-muted">
                  {selectedEmployeesToInvite.length} karyawan dipilih
                </span>
                {filteredAvailableEmployees.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedEmployeesToInvite.length === filteredAvailableEmployees.length) {
                        setSelectedEmployeesToInvite([]);
                      } else {
                        setSelectedEmployeesToInvite(filteredAvailableEmployees.map((e) => e.id));
                      }
                    }}
                    className="text-primary font-medium hover:underline text-xs"
                  >
                    {selectedEmployeesToInvite.length === filteredAvailableEmployees.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </button>
                )}
              </div>

              {/* Available List */}
              <div className="divide-y divide-border-default max-h-[300px] overflow-y-auto border border-border-default rounded-lg">
                {filteredAvailableEmployees.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-xs">
                    {searchEmployeeQuery ? 'Tidak ada karyawan yang cocok dengan pencarian.' : 'Seluruh karyawan aktif sudah tergabung dalam tim Anda.'}
                  </div>
                ) : (
                  filteredAvailableEmployees.map((emp) => {
                    const isSelected = selectedEmployeesToInvite.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => {
                          setSelectedEmployeesToInvite((prev) =>
                            isSelected ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                          );
                        }}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary-soft/40' : 'hover:bg-subtle'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div click
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-border-default"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-text-primary text-xs truncate">
                              {emp.first_name} {emp.last_name || ''}
                            </p>
                            <p className="text-caption text-text-muted truncate">
                              {emp.current_assignment?.department?.name || 'Umum'} • {emp.current_assignment?.job_position?.name || 'Staff'} ({emp.employee_id})
                            </p>
                          </div>
                        </div>
                        <Button
                          variant={isSelected ? 'primary' : 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployeesToInvite((prev) =>
                              isSelected ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                            );
                          }}
                          className="h-8 text-xs"
                        >
                          {isSelected ? 'Terpilih' : '+ Pilih'}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Submit Invite Button */}
              <div className="pt-2 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="h-9 text-xs"
                >
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={selectedEmployeesToInvite.length === 0 || isSubmittingInvite}
                  onClick={handleInviteEmployees}
                  leftIcon={isSubmittingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  className="h-9 text-xs"
                >
                  {isSubmittingInvite ? 'Menyimpan...' : `Undang ${selectedEmployeesToInvite.length} Anggota ke Tim`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
