import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { 
  Check, 
  X, 
  Loader2, 
  Calendar, 
  Clock, 
  ArrowLeftRight, 
  CheckCheck, 
  Plus, 
  Search, 
  AlertCircle
} from 'lucide-react';
import api from '../../lib/api';

// Helper: Format tanggal Indonesia (WIB) tanpa pergeseran hari
export function formatDateIndo(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      }).format(d);
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function Approval() {
  const [corrections, setCorrections] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [loadingSwaps, setLoadingSwaps] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filter & Navigation States
  const [activeTab, setActiveTab] = useState<'all' | 'swaps' | 'leaves' | 'corrections'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reject Confirmation Modal State
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    type: 'swap' | 'leave' | 'correction' | null;
    id: number | null;
    name: string;
    reason: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    name: '',
    reason: '',
  });

  // Manual Leave Creation Modal State (HR on-behalf)
  const [manualLeaveModal, setManualLeaveModal] = useState({
    isOpen: false,
    submitting: false,
    employee_id: '',
    type: 'sick',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
    direct_approve: true,
  });

  // Manual Correction Creation Modal State (HR on-behalf)
  const [manualCorrectionModal, setManualCorrectionModal] = useState({
    isOpen: false,
    submitting: false,
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    time_in: '08:00',
    time_out: '16:00',
    reason: '',
    direct_approve: true,
  });

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance-corrections');
      const raw = response.data;
      setCorrections(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
    } catch (error) {
      console.error('Error fetching corrections:', error);
      setCorrections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const response = await api.get('/leaves');
      const raw = response.data;
      setLeaves(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setLeaves([]);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchSwaps = async () => {
    setLoadingSwaps(true);
    try {
      const response = await api.get('/workday-swaps');
      const raw = response.data;
      setSwaps(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
    } catch (error) {
      console.error('Error fetching workday swaps:', error);
      setSwaps([]);
    } finally {
      setLoadingSwaps(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setEmployees(list.filter((e: any) => e.status === 'active'));
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const refreshAll = () => {
    fetchCorrections();
    fetchLeaves();
    fetchSwaps();
  };

  useEffect(() => {
    refreshAll();
    fetchEmployees();
  }, []);

  // Handlers for Single Approval
  const handleApproval = async (id: number, status: 'approved' | 'rejected', reason?: string) => {
    try {
      await api.put(`/attendance-corrections/${id}`, { status, rejection_reason: reason });
      alert(`Koreksi absensi berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`);
      fetchCorrections();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal memproses persetujuan koreksi absensi.');
    }
  };

  const handleLeaveApproval = async (id: number, status: 'approved' | 'rejected', reason?: string) => {
    try {
      await api.put(`/leaves/${id}`, { status, rejection_reason: reason });
      alert(`Pengajuan izin berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}. Presensi telah disinkronkan.`);
      fetchLeaves();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal memproses persetujuan izin.');
    }
  };

  const handleSwapApproval = async (id: number, status: 'approved' | 'rejected', reason?: string) => {
    try {
      await api.put(`/workday-swaps/${id}`, { 
        status, 
        rejection_reason: reason 
      });
      alert(`Pengajuan tukar hari berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`);
      fetchSwaps();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal memproses persetujuan tukar hari.');
    }
  };

  // Open Reject Dialog
  const openRejectModal = (type: 'swap' | 'leave' | 'correction', id: number, name: string) => {
    setRejectModal({
      isOpen: true,
      type,
      id,
      name,
      reason: '',
    });
  };

  // Submit Reject Dialog
  const handleConfirmReject = async () => {
    if (!rejectModal.id || !rejectModal.type) return;
    const { type, id, reason } = rejectModal;
    setRejectModal({ ...rejectModal, isOpen: false });

    if (type === 'swap') {
      await handleSwapApproval(id, 'rejected', reason);
    } else if (type === 'leave') {
      await handleLeaveApproval(id, 'rejected', reason);
    } else if (type === 'correction') {
      await handleApproval(id, 'rejected', reason);
    }
  };

  // Bulk Approval Handler
  const handleBulkApprove = async (type: 'swaps' | 'leaves' | 'corrections') => {
    let pendingList: any[] = [];
    let endpoint = '';
    let label = '';

    if (type === 'swaps') {
      pendingList = swaps.filter(s => s.status === 'pending');
      endpoint = '/workday-swaps/bulk';
      label = 'Tukar Hari';
    } else if (type === 'leaves') {
      pendingList = leaves.filter(l => l.status === 'pending');
      endpoint = '/leaves/bulk';
      label = 'Izin & Cuti';
    } else if (type === 'corrections') {
      pendingList = corrections.filter(c => c.status === 'pending');
      endpoint = '/attendance-corrections/bulk';
      label = 'Koreksi Absensi';
    }

    if (pendingList.length === 0) {
      alert(`Tidak ada pengajuan ${label} yang menunggu.`);
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menyetujui sekaligus ${pendingList.length} pengajuan ${label}?`)) {
      return;
    }

    setBulkLoading(true);
    try {
      const ids = pendingList.map(item => item.id);
      const res = await api.post(endpoint, { ids, status: 'approved' });
      alert(res.data?.message || `Semua pengajuan ${label} berhasil disetujui!`);
      refreshAll();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal memproses persetujuan massal.');
    } finally {
      setBulkLoading(false);
    }
  };

  // Submit Manual Leave (HR)
  const handleSaveManualLeave = async () => {
    if (!manualLeaveModal.employee_id) {
      alert('Pilih karyawan terlebih dahulu.');
      return;
    }
    if (!manualLeaveModal.reason) {
      alert('Alasan perizinan wajib diisi.');
      return;
    }

    setManualLeaveModal(prev => ({ ...prev, submitting: true }));
    try {
      const res = await api.post('/leaves', {
        employee_id: Number(manualLeaveModal.employee_id),
        type: manualLeaveModal.type,
        start_date: manualLeaveModal.start_date,
        end_date: manualLeaveModal.end_date,
        reason: manualLeaveModal.reason,
      });

      const leaveId = res.data?.data?.id;
      if (manualLeaveModal.direct_approve && leaveId) {
        await api.put(`/leaves/${leaveId}`, { status: 'approved' });
      }

      alert('Izin karyawan berhasil dicatat dan disinkronkan ke presensi!');
      setManualLeaveModal({
        isOpen: false,
        submitting: false,
        employee_id: '',
        type: 'sick',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: '',
        direct_approve: true,
      });
      fetchLeaves();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan perizinan karyawan.');
    } finally {
      setManualLeaveModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Submit Manual Correction (HR)
  const handleSaveManualCorrection = async () => {
    if (!manualCorrectionModal.employee_id) {
      alert('Pilih karyawan terlebih dahulu.');
      return;
    }
    if (!manualCorrectionModal.reason) {
      alert('Alasan koreksi wajib diisi.');
      return;
    }

    setManualCorrectionModal(prev => ({ ...prev, submitting: true }));
    try {
      const res = await api.post('/attendance-corrections', {
        employee_id: Number(manualCorrectionModal.employee_id),
        date: manualCorrectionModal.date,
        time_in: manualCorrectionModal.time_in,
        time_out: manualCorrectionModal.time_out,
        reason: manualCorrectionModal.reason,
      });

      const corrId = res.data?.data?.id;
      if (manualCorrectionModal.direct_approve && corrId) {
        await api.put(`/attendance-corrections/${corrId}`, { status: 'approved' });
      }

      alert('Koreksi absensi berhasil dicatat dan jadwal presensi telah diperbarui!');
      setManualCorrectionModal({
        isOpen: false,
        submitting: false,
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        time_in: '08:00',
        time_out: '16:00',
        reason: '',
        direct_approve: true,
      });
      fetchCorrections();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan koreksi absensi.');
    } finally {
      setManualCorrectionModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Filtered Lists & Counters
  const pendingSwaps = swaps.filter(s => s.status === 'pending');
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const pendingCorrections = corrections.filter(c => c.status === 'pending');
  const totalPending = pendingSwaps.length + pendingLeaves.length + pendingCorrections.length;
  const totalSubmissions = swaps.length + leaves.length + corrections.length;

  const filterItem = (item: any) => {
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    if (!matchStatus) return false;

    if (!searchQuery.trim()) return true;

    const empName = String(
      item.employee_name || 
      (item.employee ? `${item.employee.first_name || ''} ${item.employee.last_name || ''}`.trim() : '') ||
      ''
    ).toLowerCase();

    const empCode = String(
      item.employee_code ||
      item.employee?.employee_id ||
      ''
    ).toLowerCase();

    const reason = String(item.reason || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return empName.includes(q) || empCode.includes(q) || reason.includes(q);
  };

  const filteredSwaps = swaps.filter(s => filterItem(s));
  const filteredLeaves = leaves.filter(l => filterItem(l));
  const filteredCorrections = corrections.filter(c => filterItem(c));

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case 'sick':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">Izin Sakit</span>;
      case 'annual':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-primary border border-indigo-200 whitespace-nowrap">Cuti Tahunan</span>;
      case 'event':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">Izin Acara</span>;
      case 'family':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">Izin Keluarga</span>;
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">Izin Mendesak</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap">Izin Lainnya</span>;
    }
  };

  // Helper Employee Information
  const getEmployeeInfo = (item: any, type: 'swaps' | 'leaves' | 'corrections') => {
    if (type === 'swaps') {
      return {
        name: item.employee_name || 'Karyawan',
        code: item.employee_code || '-',
        dept: item.department || '-',
        initial: item.employee_name?.charAt(0) || 'K'
      };
    }
    const name = `${item.employee?.first_name || ''} ${item.employee?.last_name || ''}`.trim() || 'Karyawan';
    const code = item.employee?.employee_id || item.employee_code || '-';
    const dept = item.employee?.current_assignment?.department?.name || item.department || '-';
    const initial = item.employee?.first_name?.charAt(0) || 'K';
    return { name, code, dept, initial };
  };

  // Configuration for 3 submission types
  const sectionsConfig = [
    {
      type: 'swaps' as const,
      title: 'Tukar Hari',
      items: filteredSwaps,
      pendingCount: pendingSwaps.length,
      loading: loadingSwaps,
      bulkLabel: 'Tukar Hari',
    },
    {
      type: 'leaves' as const,
      title: 'Izin & Cuti',
      items: filteredLeaves,
      pendingCount: pendingLeaves.length,
      loading: loadingLeaves,
      bulkLabel: 'Izin & Cuti',
    },
    {
      type: 'corrections' as const,
      title: 'Koreksi Absensi',
      items: filteredCorrections,
      pendingCount: pendingCorrections.length,
      loading: loading,
      bulkLabel: 'Koreksi Absensi',
    },
  ];

  // In "Semua" tab, sort sections so non-empty sections appear first
  const displaySections = activeTab === 'all'
    ? [...sectionsConfig].sort((a, b) => {
        if (a.items.length > 0 && b.items.length === 0) return -1;
        if (a.items.length === 0 && b.items.length > 0) return 1;
        return 0;
      })
    : sectionsConfig.filter(s => s.type === activeTab);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">Persetujuan</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Setujui atau tolak pengajuan tukar hari, izin & cuti, dan koreksi absensi.
          </p>
          <p className="text-xs text-text-secondary font-medium mt-1">
            {totalPending} menunggu persetujuan dari {totalSubmissions} pengajuan
          </p>
        </div>

        {/* Action Buttons: Dua tombol berdampingan, sama tinggi, outline */}
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<Plus className="w-4 h-4 text-primary" />}
            onClick={() => setManualLeaveModal(prev => ({ ...prev, isOpen: true }))}
            className="h-9 text-xs font-medium whitespace-nowrap"
          >
            Buat Izin Karyawan
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<Plus className="w-4 h-4 text-primary" />}
            onClick={() => setManualCorrectionModal(prev => ({ ...prev, isOpen: true }))}
            className="h-9 text-xs font-medium whitespace-nowrap"
          >
            Input Koreksi Absensi
          </Button>
        </div>
      </div>

      {/* Main Container Card */}
      <Card className="shadow-xs border border-border-default overflow-hidden">
        {/* Tab Jenis Pengajuan */}
        <div className="px-4 pt-3 border-b border-border-default overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-6 min-w-max">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-3 pt-1 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <span>Semua</span>
              {totalPending > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                  {totalPending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('swaps')}
              className={`pb-3 pt-1 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'swaps'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <span>Tukar Hari</span>
              {pendingSwaps.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                  {pendingSwaps.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leaves')}
              className={`pb-3 pt-1 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'leaves'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <span>Izin & Cuti</span>
              {pendingLeaves.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                  {pendingLeaves.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('corrections')}
              className={`pb-3 pt-1 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'corrections'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <span>Koreksi Absensi</span>
              {pendingCorrections.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                  {pendingCorrections.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pencarian dan Filter Toolbar */}
        <div className="p-3.5 border-b border-border-default flex flex-col sm:flex-row gap-3 justify-between items-center bg-subtle/20">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama karyawan, NIK, atau alasan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border-default bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              aria-label="Cari pengajuan"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
            {activeTab !== 'all' && (
              <>
                {activeTab === 'swaps' && pendingSwaps.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleBulkApprove('swaps')}
                    disabled={bulkLoading}
                    className="h-9 text-xs font-medium whitespace-nowrap"
                    leftIcon={<CheckCheck className="w-4 h-4" />}
                  >
                    Setujui Semua ({pendingSwaps.length})
                  </Button>
                )}
                {activeTab === 'leaves' && pendingLeaves.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleBulkApprove('leaves')}
                    disabled={bulkLoading}
                    className="h-9 text-xs font-medium whitespace-nowrap"
                    leftIcon={<CheckCheck className="w-4 h-4" />}
                  >
                    Setujui Semua ({pendingLeaves.length})
                  </Button>
                )}
                {activeTab === 'corrections' && pendingCorrections.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleBulkApprove('corrections')}
                    disabled={bulkLoading}
                    className="h-9 text-xs font-medium whitespace-nowrap"
                    leftIcon={<CheckCheck className="w-4 h-4" />}
                  >
                    Setujui Semua ({pendingCorrections.length})
                  </Button>
                )}
              </>
            )}

            <div className="flex items-center gap-2">
              <label htmlFor="status-filter-select" className="text-xs text-text-secondary font-medium whitespace-nowrap">
                Status:
              </label>
              <select
                id="status-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-9 w-48 px-3 rounded-lg border border-border-default bg-surface text-text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Area: Sections for each submission type */}
        <div className="divide-y divide-border-default">
          {displaySections.map((section) => {
            const hasData = section.items.length > 0;

            // In "Semua" tab, if section is empty, render ONLY a slim gray row without table header!
            if (activeTab === 'all' && !hasData) {
              return (
                <div key={section.type} className="px-4 py-2.5 bg-subtle/30 flex items-center justify-between text-xs text-text-muted">
                  <span>Tidak ada pengajuan {section.title.toLowerCase()}</span>
                </div>
              );
            }

            return (
              <div key={section.type} className="space-y-0">
                {/* Section Header (in Semua tab or if there's data) */}
                <div className="px-4 py-2.5 bg-subtle/50 flex items-center justify-between border-b border-border-default">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary">{section.title}</span>
                    <span className="text-[11px] text-text-muted">({section.items.length} pengajuan)</span>
                  </div>
                  {activeTab === 'all' && section.pendingCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkApprove(section.type)}
                      disabled={bulkLoading}
                      className="h-7 text-[11px] px-2.5 font-medium"
                      leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
                    >
                      Setujui Semua ({section.pendingCount})
                    </Button>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-subtle/80 sticky top-0 z-10 border-b border-border-default">
                      {section.type === 'swaps' && (
                        <tr>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Karyawan</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Hari Izin</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Hari Pengganti</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Alasan</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Status</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs text-right whitespace-nowrap">Aksi</th>
                        </tr>
                      )}
                      {section.type === 'leaves' && (
                        <tr>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Karyawan</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Jenis Izin</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Tanggal</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Alasan</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Status</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs text-right whitespace-nowrap">Aksi</th>
                        </tr>
                      )}
                      {section.type === 'corrections' && (
                        <tr>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Karyawan</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Tanggal</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Jam Koreksi</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Alasan</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Status</th>
                          <th className="py-3 px-4 font-semibold text-text-secondary text-xs text-right whitespace-nowrap">Aksi</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {section.loading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-text-muted">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary mb-1.5" />
                            <p className="text-xs">Memuat data pengajuan {section.title.toLowerCase()}...</p>
                          </td>
                        </tr>
                      ) : section.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-text-muted text-xs">
                            Tidak ada pengajuan {section.title.toLowerCase()} yang sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        section.items.map((item: any) => {
                          const emp = getEmployeeInfo(item, section.type);
                          return (
                            <tr key={`${section.type}-${item.id}`} className="h-16 hover:bg-subtle/50 transition-colors">
                              {/* Karyawan (Uniform for all) */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-subtle text-text-secondary flex items-center justify-center font-semibold text-xs shrink-0 border border-border-default">
                                    {emp.initial}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-text-primary text-xs truncate leading-tight">
                                      {emp.name}
                                    </p>
                                    <p className="text-[11px] text-text-muted truncate mt-0.5 leading-tight">
                                      {emp.code} • {emp.dept}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Columns for Swaps */}
                              {section.type === 'swaps' && (
                                <>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <p className="font-medium text-text-primary text-xs">
                                      {formatDateIndo(item.original_date)}
                                    </p>
                                    <span className="text-[11px] text-text-muted block">tidak masuk</span>
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <p className="font-medium text-text-primary text-xs">
                                      {formatDateIndo(item.replacement_date)}
                                    </p>
                                    <span className="text-[11px] text-text-muted block">wajib masuk</span>
                                  </td>
                                </>
                              )}

                              {/* Columns for Leaves */}
                              {section.type === 'leaves' && (
                                <>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    {getLeaveTypeBadge(item.type)}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap text-xs">
                                    {item.start_date === item.end_date ? (
                                      <span className="font-medium text-text-primary">{formatDateIndo(item.start_date)}</span>
                                    ) : (
                                      <div className="leading-tight">
                                        <span className="font-medium text-text-primary">{formatDateIndo(item.start_date)}</span>
                                        <span className="text-text-muted mx-1">s/d</span>
                                        <span className="font-medium text-text-primary">{formatDateIndo(item.end_date)}</span>
                                      </div>
                                    )}
                                  </td>
                                </>
                              )}

                              {/* Columns for Corrections */}
                              {section.type === 'corrections' && (
                                <>
                                  <td className="py-3 px-4 whitespace-nowrap font-medium text-text-primary text-xs">
                                    {formatDateIndo(item.date)}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap text-xs font-mono">
                                    {item.time_in && <span className="text-text-primary font-medium">Masuk: {item.time_in}</span>}
                                    {item.time_in && item.time_out && <span className="text-text-muted mx-1.5">•</span>}
                                    {item.time_out && <span className="text-text-primary font-medium">Pulang: {item.time_out}</span>}
                                    {!item.time_in && !item.time_out && <span className="text-text-muted">-</span>}
                                  </td>
                                </>
                              )}

                              {/* Alasan (Uniform for all) */}
                              <td className="py-3 px-4">
                                <p className="text-xs text-text-secondary line-clamp-2 max-w-[200px]" title={item.reason}>
                                  {item.reason || '-'}
                                </p>
                              </td>

                              {/* Status (Uniform for all) */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                  item.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : item.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                </span>
                                {item.approved_by_name && (
                                  <p className="text-[10px] text-text-muted mt-0.5 truncate max-w-[120px]">
                                    Oleh: {item.approved_by_name}
                                  </p>
                                )}
                                {item.approver?.name && (
                                  <p className="text-[10px] text-text-muted mt-0.5 truncate max-w-[120px]">
                                    Oleh: {item.approver.name}
                                  </p>
                                )}
                                {item.rejection_reason && (
                                  <p className="text-[10px] text-rose-600 mt-0.5 truncate max-w-[120px]" title={item.rejection_reason}>
                                    {item.rejection_reason}
                                  </p>
                                )}
                              </td>

                              {/* Aksi (Uniform for all) */}
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                {item.status === 'pending' ? (
                                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => {
                                        if (section.type === 'swaps') handleSwapApproval(item.id, 'approved');
                                        else if (section.type === 'leaves') handleLeaveApproval(item.id, 'approved');
                                        else handleApproval(item.id, 'approved');
                                      }}
                                      className="h-8 text-xs font-medium px-2.5"
                                      leftIcon={<Check className="w-3.5 h-3.5" />}
                                    >
                                      Setujui
                                    </Button>
                                    <button
                                      type="button"
                                      onClick={() => openRejectModal(
                                        section.type === 'swaps' ? 'swap' : section.type === 'leaves' ? 'leave' : 'correction',
                                        item.id,
                                        emp.name
                                      )}
                                      className="h-8 px-2.5 text-xs font-medium rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      Tolak
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-text-muted">
                                    {item.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Tablet Card View (< 1024px) */}
                <div className="lg:hidden p-4 space-y-3 bg-subtle/10">
                  {section.loading ? (
                    <div className="p-6 text-center text-text-muted">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary mb-1.5" />
                      <p className="text-xs">Memuat data pengajuan...</p>
                    </div>
                  ) : section.items.length === 0 ? (
                    <p className="p-4 text-center text-text-muted text-xs">
                      Tidak ada pengajuan {section.title.toLowerCase()} yang sesuai filter.
                    </p>
                  ) : (
                    section.items.map((item: any) => {
                      const emp = getEmployeeInfo(item, section.type);
                      return (
                        <div key={`m-${section.type}-${item.id}`} className="p-3.5 bg-surface rounded-lg border border-border-default shadow-xs space-y-2.5">
                          {/* Card Header: Karyawan & Status */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-subtle text-text-secondary flex items-center justify-center font-semibold text-xs shrink-0 border border-border-default">
                                {emp.initial}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-text-primary text-xs truncate">
                                  {emp.name}
                                </p>
                                <p className="text-[11px] text-text-muted truncate">
                                  {emp.code} • {emp.dept}
                                </p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 ${
                              item.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                            </span>
                          </div>

                          {/* Detail Info per Type */}
                          <div className="text-xs space-y-1 pt-1 border-t border-border-default">
                            {section.type === 'swaps' && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-text-muted block">Hari Izin:</span>
                                  <span className="font-medium text-text-primary">{formatDateIndo(item.original_date)}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-text-muted block">Hari Pengganti:</span>
                                  <span className="font-medium text-text-primary">{formatDateIndo(item.replacement_date)}</span>
                                </div>
                              </div>
                            )}

                            {section.type === 'leaves' && (
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-text-muted block">Jenis:</span>
                                  {getLeaveTypeBadge(item.type)}
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-text-muted block">Tanggal:</span>
                                  <span className="font-medium text-text-primary">
                                    {formatDateIndo(item.start_date)}
                                    {item.start_date !== item.end_date && ` - ${formatDateIndo(item.end_date)}`}
                                  </span>
                                </div>
                              </div>
                            )}

                            {section.type === 'corrections' && (
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-text-muted block">Tanggal:</span>
                                  <span className="font-medium text-text-primary">{formatDateIndo(item.date)}</span>
                                </div>
                                <div className="text-right font-mono">
                                  <span className="text-[10px] text-text-muted block">Jam:</span>
                                  <span className="text-text-primary">{item.time_in || '-'} - {item.time_out || '-'}</span>
                                </div>
                              </div>
                            )}

                            {item.reason && (
                              <div className="pt-1">
                                <span className="text-[10px] text-text-muted block">Alasan:</span>
                                <p className="text-text-secondary text-xs line-clamp-2" title={item.reason}>
                                  {item.reason}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Footer Action for Pending */}
                          {item.status === 'pending' && (
                            <div className="pt-2 border-t border-border-default flex items-center gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  if (section.type === 'swaps') handleSwapApproval(item.id, 'approved');
                                  else if (section.type === 'leaves') handleLeaveApproval(item.id, 'approved');
                                  else handleApproval(item.id, 'approved');
                                }}
                                className="flex-1 h-9 text-xs justify-center"
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                              >
                                Setujui
                              </Button>
                              <button
                                type="button"
                                onClick={() => openRejectModal(
                                  section.type === 'swaps' ? 'swap' : section.type === 'leaves' ? 'leave' : 'correction',
                                  item.id,
                                  emp.name
                                )}
                                className="flex-1 h-9 text-xs font-medium rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* MODAL 1: KONFIRMASI PENOLAKAN (DENGAN ALASAN) */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ ...rejectModal, isOpen: false })}
        title="Konfirmasi Penolakan Pengajuan"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRejectModal({ ...rejectModal, isOpen: false })}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
              className="h-9 text-xs"
            >
              Konfirmasi Tolak
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            <p className="font-semibold">Apakah Anda yakin ingin menolak pengajuan ini?</p>
            <p className="mt-0.5">Pemohon: <strong>{rejectModal.name}</strong></p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">
              Alasan Penolakan (Opsional)
            </label>
            <textarea
              className="w-full h-24 p-2.5 rounded-lg border bg-surface text-text-primary border-border-default focus:border-primary focus:ring-1 focus:ring-primary text-xs"
              placeholder="Contoh: Jadwal operasional sedang padat / Jam kehadiran tidak sesuai bukti CCTV..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 2: BUAT IZIN KARYAWAN (MANUAL HR) */}
      <Modal
        isOpen={manualLeaveModal.isOpen}
        onClose={() => setManualLeaveModal(prev => ({ ...prev, isOpen: false }))}
        title="Buat Izin Karyawan"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setManualLeaveModal(prev => ({ ...prev, isOpen: false }))}
              disabled={manualLeaveModal.submitting}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveManualLeave}
              disabled={manualLeaveModal.submitting}
              className="h-9 text-xs"
            >
              {manualLeaveModal.submitting ? 'Menyimpan...' : 'Simpan Izin'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-primary">Pilih Karyawan *</label>
            <select
              value={manualLeaveModal.employee_id}
              onChange={(e) => setManualLeaveModal({ ...manualLeaveModal, employee_id: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border bg-surface text-text-primary border-border-default focus:border-primary focus:ring-1 focus:ring-primary text-xs"
            >
              <option value="">-- Pilih Karyawan --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name || ''} ({emp.employee_id}) - {emp.current_assignment?.department?.name || 'Umum'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-primary">Jenis Izin / Cuti *</label>
            <select
              value={manualLeaveModal.type}
              onChange={(e) => setManualLeaveModal({ ...manualLeaveModal, type: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border bg-surface text-text-primary border-border-default focus:border-primary focus:ring-1 focus:ring-primary text-xs"
            >
              <option value="sick">Izin Sakit</option>
              <option value="annual">Cuti Tahunan</option>
              <option value="event">Izin Ada Acara</option>
              <option value="family">Izin Keperluan Keluarga</option>
              <option value="urgent">Izin Mendesak</option>
              <option value="other">Izin Lainnya</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-primary">Tanggal Mulai *</label>
              <input
                type="date"
                value={manualLeaveModal.start_date}
                onChange={(e) => setManualLeaveModal({ ...manualLeaveModal, start_date: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-surface text-text-primary border-border-default focus:border-primary focus:ring-1 focus:ring-primary text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-primary">Tanggal Selesai *</label>
              <input
                type="date"
                value={manualLeaveModal.end_date}
                onChange={(e) => setManualLeaveModal({ ...manualLeaveModal, end_date: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-surface text-text-primary border-border-default focus:border-primary focus:ring-1 focus:ring-primary text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-primary">Alasan Izin *</label>
            <textarea
              className="w-full h-20 p-2.5 rounded-lg border bg-surface text-text-primary border-border-default focus:border-primary focus:ring-1 focus:ring-primary text-xs"
              placeholder="Contoh: Sakit demam dengan surat dokter / Keperluan keluarga..."
              value={manualLeaveModal.reason}
              onChange={(e) => setManualLeaveModal({ ...manualLeaveModal, reason: e.target.value })}
            />
          </div>

          <div className="p-3 bg-subtle border border-border-default rounded-lg flex items-center gap-2">
            <input
              type="checkbox"
              id="direct_approve_leave"
              checked={manualLeaveModal.direct_approve}
              onChange={(e) => setManualLeaveModal({ ...manualLeaveModal, direct_approve: e.target.checked })}
              className="w-4 h-4 rounded border-border-default text-primary focus:ring-primary"
            />
            <label htmlFor="direct_approve_leave" className="text-xs font-medium text-text-primary cursor-pointer">
              Langsung setujui dan sinkronkan ke presensi kantor
            </label>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: INPUT KOREKSI ABSENSI (MANUAL HR) */}
      <Modal
        isOpen={manualCorrectionModal.isOpen}
        onClose={() => setManualCorrectionModal(prev => ({ ...prev, isOpen: false }))}
        title="Input Koreksi Absensi"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setManualCorrectionModal(prev => ({ ...prev, isOpen: false }))}
              disabled={manualCorrectionModal.submitting}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveManualCorrection}
              disabled={manualCorrectionModal.submitting}
              className="h-9 text-xs"
            >
              {manualCorrectionModal.submitting ? 'Menyimpan...' : 'Simpan Koreksi'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-primary">Pilih Karyawan *</label>
            <select
              value={manualCorrectionModal.employee_id}
              onChange={(e) => setManualCorrectionModal({ ...manualCorrectionModal, employee_id: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border bg-surface text-text-primary border-border-default focus:border-primary focus:ring-1 focus:ring-primary text-xs"
            >
              <option value="">-- Pilih Karyawan --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name || ''} ({emp.employee_id}) - {emp.current_assignment?.department?.name || 'Umum'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-primary">Tanggal Absensi *</label>
            <input
              type="date"
              value={manualCorrectionModal.date}
              onChange={(e) => setManualCorrectionModal({ ...manualCorrectionModal, date: e.target.value })}
              className="w-full h-9 px-3 rounded-lg border bg-surface text-text-primary border-border-default focus:border-primary focus:ring-1 focus:ring-primary text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-primary">Jam Masuk (Pagi) *</label>
              <input
                type="time"
                value={manualCorrectionModal.time_in}
                onChange={(e) => setManualCorrectionModal({ ...manualCorrectionModal, time_in: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-surface text-text-primary border-border-default focus:border-primary focus:ring-1 focus:ring-primary text-xs"
              />
              <span className="text-[10px] text-text-muted">Maks. 08:15 WIB untuk uang makan</span>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-primary">Jam Pulang (Sore)</label>
              <input
                type="time"
                value={manualCorrectionModal.time_out}
                onChange={(e) => setManualCorrectionModal({ ...manualCorrectionModal, time_out: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border bg-surface text-text-primary border-border-default focus:border-primary focus:ring-1 focus:ring-primary text-xs"
              />
              <span className="text-[10px] text-text-muted">Jam pulang kerja normal</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-primary">Alasan Koreksi *</label>
            <textarea
              className="w-full h-20 p-2.5 rounded-lg border bg-surface text-text-primary border-border-default focus:border-primary focus:ring-1 focus:ring-primary text-xs"
              placeholder="Contoh: Lupa scan saat tiba di kantor / kendala teknis perangkat..."
              value={manualCorrectionModal.reason}
              onChange={(e) => setManualCorrectionModal({ ...manualCorrectionModal, reason: e.target.value })}
            />
          </div>

          <div className="p-3 bg-subtle border border-border-default rounded-lg flex items-center gap-2">
            <input
              type="checkbox"
              id="direct_approve_corr"
              checked={manualCorrectionModal.direct_approve}
              onChange={(e) => setManualCorrectionModal({ ...manualCorrectionModal, direct_approve: e.target.checked })}
              className="w-4 h-4 rounded border-border-default text-primary focus:ring-primary"
            />
            <label htmlFor="direct_approve_corr" className="text-xs font-medium text-text-primary cursor-pointer">
              Langsung setujui dan perbarui presensi tanggal tersebut
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
