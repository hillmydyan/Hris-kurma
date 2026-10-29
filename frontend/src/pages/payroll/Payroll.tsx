import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmFooter } from '../../components/ui/Modal';
import { 
  Plus, 
  Search, 
  Sliders, 
  RotateCcw, 
  Info, 
  ChevronDown, 
  Download, 
  Printer, 
  MoreVertical,
  User,
  Loader2,
  Send,
  CheckCircle2,
  FileSpreadsheet,
  CalendarDays,
  History,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { formatRupiah, generateSlipHtml, printSlipDocument } from '../../utils/slipGenerator';
import { exportPayrollToExcel } from '../../utils/exportPayrollExcel';
import { AttendanceCorrectionCalendar } from '../attendance/AttendanceCorrectionCalendar';

// Helper: Format tanggal Indonesia (WIB)
function formatShortDateIndo(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    }).format(date);
  } catch {
    return dateStr;
  }
}

// Helper: Format periode cut-off (misal: "28 Sep – 27 Okt 2026")
function formatPeriodRange(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return 'Periode Berjalan';
  try {
    const [y1, m1, d1] = startDate.split('-').map(Number);
    const [y2, m2, d2] = endDate.split('-').map(Number);
    const date1 = new Date(Date.UTC(y1, m1 - 1, d1, 12, 0, 0));
    const date2 = new Date(Date.UTC(y2, m2 - 1, d2, 12, 0, 0));

    const sDay = date1.getDate();
    const sMonth = new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'Asia/Jakarta' }).format(date1);
    const eDay = date2.getDate();
    const eMonth = new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'Asia/Jakarta' }).format(date2);
    const eYear = date2.getFullYear();

    return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${eYear}`;
  } catch {
    return `${startDate} s/d ${endDate}`;
  }
}

export function Payroll() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // View state: Daftar Penggajian vs Koreksi Absen (Kalender)
  const [activeTab, setActiveTab] = useState<'payroll' | 'correction'>('payroll');
  const [selectedCorrectionEmployeeId, setSelectedCorrectionEmployeeId] = useState<number | string | undefined>(undefined);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionModalEmployee, setCorrectionModalEmployee] = useState<any>(null);

  // Accordion for calculation rules
  const [showRules, setShowRules] = useState(false);

  // Action Menu dropdown state (titik tiga)
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // State for Slip Gaji Modal
  const [selectedSlipEmployee, setSelectedSlipEmployee] = useState<any>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  // State for Payslip Publishing (Rilis ke Dashboard Karyawan)
  const [publishingAll, setPublishingAll] = useState(false);
  const [publishingSingleId, setPublishingSingleId] = useState<number | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // State for Past Period Slip Dispatch & Selector
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('');
  const [isPastPeriodModalOpen, setIsPastPeriodModalOpen] = useState(false);
  const [selectedPastPeriodForModal, setSelectedPastPeriodForModal] = useState<any>(null);

  // Helper: Dapatkan key periode berjalan saat ini berdasarkan siklus cut-off 28
  const getCurrentCutoffKey = () => {
    const today = new Date();
    const day = today.getDate();
    const d = new Date(today);
    if (day > 27) {
      d.setMonth(d.getMonth() + 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };
  const currentDefaultPeriodKey = getCurrentCutoffKey();

  // State for HR Manual Payroll Adjustment Modal
  const [selectedAdjustmentEmployee, setSelectedAdjustmentEmployee] = useState<any>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    present_days: 26,
    eligible_meal_days: 26,
    late_over_15_days: 0,
    is_prorated: false,
    note: '',
  });

  const [newPeriod, setNewPeriod] = useState({
    name: '',
    start_date: '',
    end_date: '',
    pay_date: '',
  });

  const fetchData = async (periodParams?: { period_key?: string; start_date?: string; end_date?: string }) => {
    try {
      setLoading(true);
      const activeKey = periodParams?.period_key || selectedPeriodKey;
      const summaryParams = periodParams || (activeKey ? { period_key: activeKey } : undefined);

      const [periodsRes, summaryRes] = await Promise.all([
        api.get('/payroll-periods'),
        api.get('/payroll/summary', { params: summaryParams })
      ]);
      const rawPeriods = periodsRes.data;
      const list = Array.isArray(rawPeriods) ? rawPeriods : (Array.isArray(rawPeriods?.data) ? rawPeriods.data : []);
      setPeriods(list);
      setSummary(summaryRes.data);
      if (summaryRes.data?.period_key) {
        setSelectedPeriodKey(summaryRes.data.period_key);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPeriod = (targetPeriod: any) => {
    if (!targetPeriod) return;
    setSelectedPeriodKey(targetPeriod.period_key);
    fetchData({
      period_key: targetPeriod.period_key,
      start_date: targetPeriod.start_date,
      end_date: targetPeriod.end_date,
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close action dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreatePeriod = async () => {
    if (!newPeriod.name || !newPeriod.start_date || !newPeriod.end_date) {
      alert('Nama periode, tanggal mulai, dan tanggal selesai wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/payroll-periods', newPeriod);
      alert('Periode penggajian baru berhasil dibuat dan gaji karyawan telah disesuaikan.');
      setIsModalOpen(false);
      setNewPeriod({ name: '', start_date: '', end_date: '', pay_date: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error creating period:', error);
      alert(error.response?.data?.message || 'Gagal membuat periode penggajian.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishAll = async (targetSummary?: any) => {
    const s = targetSummary || summary;
    if (!s) return;
    setPublishingAll(true);
    try {
      const res = await api.post('/payroll/publish-all', {
        period_key: s.period_key,
        start_date: s.cutoff_start_date || s.start_date,
        end_date: s.cutoff_end_date || s.end_date,
        period_label: s.period_label || s.name,
      });
      alert(res.data?.message || 'Seluruh slip gaji berhasil dirilis ke Dashboard karyawan.');
      setIsPublishModalOpen(false);
      setIsPastPeriodModalOpen(false);
      fetchData({
        period_key: s.period_key,
        start_date: s.cutoff_start_date || s.start_date,
        end_date: s.cutoff_end_date || s.end_date,
      });
    } catch (error: any) {
      console.error('Error publishing all slips:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Gagal merilis slip gaji.');
    } finally {
      setPublishingAll(false);
    }
  };

  const handlePublishSingle = async (emp: any) => {
    if (!summary) return;
    setPublishingSingleId(emp.id);
    try {
      const res = await api.post('/payroll/publish-single', {
        employee_id: emp.id,
        period_key: summary.period_key,
        start_date: summary.cutoff_start_date,
        end_date: summary.cutoff_end_date,
        period_label: summary.period_label,
      });
      alert(res.data?.message || `Slip gaji ${emp.name} berhasil dikirim ke Dashboard karyawan.`);
      fetchData({
        period_key: summary.period_key,
        start_date: summary.cutoff_start_date,
        end_date: summary.cutoff_end_date,
      });
    } catch (error: any) {
      console.error('Error publishing single slip:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Gagal mengirim slip gaji.');
    } finally {
      setPublishingSingleId(null);
    }
  };

  const handleUnpublish = async (empId?: number) => {
    if (!summary) return;
    const confirmMsg = empId 
      ? 'Tarik publikasi slip gaji untuk karyawan ini dari Dashboard?' 
      : `Tarik seluruh publikasi slip gaji periode ${summary.period_label} dari Dashboard karyawan?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await api.post('/payroll/unpublish', {
        period_key: summary.period_key,
        employee_id: empId,
      });
      alert(res.data?.message || 'Publikasi slip gaji berhasil dibatalkan.');
      fetchData({
        period_key: summary.period_key,
        start_date: summary.cutoff_start_date,
        end_date: summary.cutoff_end_date,
      });
    } catch (error: any) {
      console.error('Error unpublishing:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Gagal membatalkan publikasi.');
    }
  };

  const handlePrintSlip = (emp: any) => {
    printSlipDocument(emp, summary?.period_label);
  };

  const openSlipModal = (emp: any) => {
    setSelectedSlipEmployee(emp);
    setIsSlipModalOpen(true);
  };

  const openAdjustmentModal = (emp: any) => {
    setSelectedAdjustmentEmployee(emp);
    setAdjustmentForm({
      present_days: emp.present_days ?? 26,
      eligible_meal_days: emp.eligible_meal_days ?? 26,
      late_over_15_days: emp.late_over_15_days ?? 0,
      is_prorated: Boolean(emp.is_prorated),
      note: emp.adjustment_note || (emp.is_new_joiner ? `Prorata karyawan baru masuk ${emp.join_date || ''}` : 'Koreksi transisi kehadiran'),
    });
    setIsAdjustmentModalOpen(true);
  };

  const handleSaveAdjustment = async () => {
    if (!selectedAdjustmentEmployee) return;
    setAdjusting(true);
    try {
      await api.post('/payroll/adjust', {
        employee_id: selectedAdjustmentEmployee.id,
        period_key: summary?.period_key || '2026-10',
        present_days: Number(adjustmentForm.present_days),
        eligible_meal_days: Number(adjustmentForm.eligible_meal_days),
        late_over_15_days: Number(adjustmentForm.late_over_15_days) || 0,
        is_prorated: Boolean(adjustmentForm.is_prorated),
        note: adjustmentForm.note,
      });
      alert(`Koreksi presensi & payroll untuk ${selectedAdjustmentEmployee.name} berhasil disimpan.`);
      setIsAdjustmentModalOpen(false);
      fetchData({
        period_key: summary?.period_key,
        start_date: summary?.cutoff_start_date,
        end_date: summary?.cutoff_end_date,
      });
    } catch (error: any) {
      console.error('Error saving adjustment:', error);
      alert(error.response?.data?.message || 'Gagal menyimpan koreksi payroll.');
    } finally {
      setAdjusting(false);
    }
  };

  const handleResetAdjustment = async () => {
    if (!selectedAdjustmentEmployee) return;
    if (!confirm(`Reset koreksi untuk ${selectedAdjustmentEmployee.name} kembali ke perhitungan otomatis sistem?`)) return;
    setAdjusting(true);
    try {
      await api.delete(`/payroll/adjust/${selectedAdjustmentEmployee.id}?period_key=${summary?.period_key || '2026-10'}`);
      alert('Koreksi payroll berhasil direset ke otomatis.');
      setIsAdjustmentModalOpen(false);
      fetchData({
        period_key: summary?.period_key,
        start_date: summary?.cutoff_start_date,
        end_date: summary?.cutoff_end_date,
      });
    } catch (error: any) {
      console.error('Error resetting adjustment:', error);
      alert(error.response?.data?.message || 'Gagal mereset koreksi.');
    } finally {
      setAdjusting(false);
    }
  };

  const [exporting, setExporting] = useState(false);

  const employeesList = summary?.employees || [];
  const filteredEmployees = employeesList.filter((emp: any) => {
    const matchSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = selectedDept === 'all' || emp.department === selectedDept;
    return matchSearch && matchDept;
  });

  const uniqueDepartments = Array.from(new Set(employeesList.map((e: any) => e.department))).filter(Boolean);

  const handleExportExcel = async () => {
    if (filteredEmployees.length === 0) {
      alert('Tidak ada data karyawan yang cocok dengan filter untuk diekspor.');
      return;
    }
    setExporting(true);
    try {
      await exportPayrollToExcel({
        employees: filteredEmployees,
        periodLabel: summary?.period_label,
        periodKey: summary?.period_key,
        cutoffEndDate: summary?.cutoff_end_date,
      });
    } catch (error) {
      console.error('Error exporting payroll to Excel:', error);
      alert('Gagal mengekspor data ke Excel.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Manajemen Payroll</h1>
            {summary?.is_period_published ? (
              <Badge variant="success" dot>
                Dirilis ({summary?.published_employees_count || 0}/{summary?.active_employees_count || 0} Karyawan)
              </Badge>
            ) : (summary?.published_employees_count || 0) > 0 ? (
              <Badge variant="warning" dot>
                Sebagian Dirilis ({summary?.published_employees_count}/{summary?.active_employees_count})
              </Badge>
            ) : (
              <Badge variant="neutral">
                Draft (Belum Dirilis ke Karyawan)
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Periode {formatPeriodRange(summary?.cutoff_start_date, summary?.cutoff_end_date)} · {summary?.standard_working_days || 26} hari kerja
            {summary?.period_published_at && (
              <span className="ml-2 text-emerald-700 font-medium">• Diterbitkan {summary.period_published_at}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button 
            variant="primary" 
            size="sm"
            leftIcon={<Send className="w-4 h-4" />}
            onClick={() => setIsPublishModalOpen(true)}
            disabled={publishingAll || loading}
            className="h-9 text-xs font-medium whitespace-nowrap"
            title="Kirim seluruh slip gaji resmi periode ini ke Dashboard masing-masing karyawan"
          >
            {summary?.is_period_published ? 'Kirim Ulang Semua Slip' : 'Rilis Semua Slip'}
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<History className="w-4 h-4 text-primary" />}
            onClick={() => {
              setIsPastPeriodModalOpen(true);
              const pastList = periods.filter(p => p.period_key !== currentDefaultPeriodKey);
              if (pastList.length > 0) {
                const currentViewing = periods.find(p => p.period_key === summary?.period_key && p.period_key !== currentDefaultPeriodKey);
                setSelectedPastPeriodForModal(currentViewing || pastList[0]);
              } else if (periods.length > 0) {
                setSelectedPastPeriodForModal(periods[0]);
              }
            }}
            className="h-9 text-xs font-medium whitespace-nowrap"
            title="Pilih dan kirim slip gaji untuk periode-periode terdahulu"
          >
            Kirim Slip Periode Lalu
          </Button>

          {(summary?.published_employees_count || 0) > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={() => handleUnpublish()}
              className="h-9 text-xs font-medium whitespace-nowrap text-rose-600 hover:text-rose-700"
              title="Tarik seluruh publikasi slip gaji periode ini dari Dashboard"
            >
              Tarik Rilis
            </Button>
          )}

          <Button 
            variant="outline" 
            size="sm"
            leftIcon={exporting ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="h-9 text-xs font-medium whitespace-nowrap"
            title="Ekspor data gaji pokok dan uang makan ke Excel (.xlsx)"
          >
            {exporting ? 'Mengekspor...' : 'Ekspor ke Excel'}
          </Button>

          <Button 
            variant="secondary" 
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
            className="h-9 text-xs font-medium whitespace-nowrap"
          >
            Buat Periode Baru
          </Button>
        </div>
      </div>

      {/* Selector & Switcher Periode Penggajian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-border-default rounded-lg shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 shrink-0">
            <CalendarDays className="w-4 h-4 text-primary" />
            Pilih Periode:
          </span>

          <select
            value={summary?.period_key || ''}
            onChange={(e) => {
              const found = periods.find(p => p.period_key === e.target.value);
              if (found) {
                handleSelectPeriod(found);
              }
            }}
            className="text-xs font-medium text-text-primary bg-subtle border border-border-default rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-w-[280px]"
          >
            {periods.map((p) => {
              const isCurrent = p.period_key === currentDefaultPeriodKey;
              const isPub = p.is_published;
              return (
                <option key={p.period_key || p.id} value={p.period_key}>
                  {p.name} {isCurrent ? '(Bulan Ini)' : '(Periode Lalu)'} — {isPub ? 'Sudah Dirilis' : 'Draft'}
                </option>
              );
            })}
          </select>

          {summary?.is_current_period === false ? (
            <Badge variant="warning" dot className="h-5 text-[10px]">
              Mode Riwayat Periode Lalu
            </Badge>
          ) : (
            <Badge variant="neutral" className="h-5 text-[10px]">
              Periode Berjalan Aktif
            </Badge>
          )}
        </div>

        {summary?.is_current_period === false && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const cur = periods.find(p => p.period_key === currentDefaultPeriodKey);
              if (cur) handleSelectPeriod(cur);
              else fetchData();
            }}
            className="h-8 text-xs font-medium self-start sm:self-auto text-primary border-primary/30 hover:bg-primary/5"
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-primary" />}
          >
            Kembali ke Periode Berjalan
          </Button>
        )}
      </div>

      {/* Alert Banner ketika melihat Periode Lalu */}
      {summary?.is_current_period === false && (
        <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-semibold text-amber-950">
                Menampilkan Data Periode Lalu: {summary?.period_label}
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Cut-off {formatShortDateIndo(summary?.cutoff_start_date)} s/d {formatShortDateIndo(summary?.cutoff_end_date)}.
                {summary?.is_period_published 
                  ? ` Seluruh slip gaji periode ini telah dirilis resmi pada ${summary?.period_published_at || 'sebelumnya'}.` 
                  : ' Slip gaji periode ini belum dirilis ke Dashboard karyawan.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={() => setIsPublishModalOpen(true)}
              disabled={publishingAll}
              className="h-7 text-xs font-medium"
            >
              {summary?.is_period_published ? 'Kirim Ulang Semua Slip' : 'Rilis Semua Slip Periode Ini'}
            </Button>
          </div>
        </div>
      )}

      {/* Aturan Perhitungan (Ringkas, default tertutup) */}
      <div className="p-3 bg-subtle border border-border-default rounded-lg text-xs text-text-secondary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-text-muted shrink-0" />
            <span>Gaji pokok 100% utuh · Segala jenis izin/sakit/alpa hanya memotong uang makan (Rp 11.000/hari).</span>
          </div>
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className="text-primary hover:underline font-medium text-xs inline-flex items-center gap-1"
          >
            {showRules ? 'Tutup aturan' : 'Lihat aturan'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRules ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showRules && (
          <div className="mt-2.5 pt-2.5 border-t border-border-default space-y-1 text-text-secondary text-[11px] leading-relaxed">
            <p>• <strong>Prorata Karyawan Baru (Tidak Masuk Full 1 Bulan)</strong>: Gaji pokok dihitung prorata proporsional sesuai hari kerja efektif sejak tanggal bergabung sampai akhir cut-off.</p>
            <p>• <strong>Gaji Pokok Karyawan Reguler (100% Utuh)</strong>: Komponen tetap bulanan, tidak dipotong oleh segala bentuk izin, sakit, alpa, maupun tanpa keterangan.</p>
            <p>• <strong>Uang Makan Rp 11.000/Hari</strong>: Komponen variabel harian. Diberikan jika hadir tepat waktu (&le; 08:15 WIB). Segala bentuk izin, sakit, alpa, atau terlambat &gt; 15 menit otomatis memotong perolehan uang makan.</p>
            <p>• <strong>Siklus Cut-Off Penggajian</strong>: Dihitung dari tanggal 28 bulan sebelumnya sampai tanggal 27 bulan berjalan.</p>
            <p>• <strong>Koreksi Manual HR</strong>: Klik tombol "Koreksi" pada baris karyawan untuk menyesuaikan jumlah hari hadir dan opsi prorata jika diperlukan.</p>
          </div>
        )}
      </div>

      {/* 4 Kartu Ringkasan Penggajian */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Gaji Pokok (Tetap Utuh / Prorata) */}
        <Card className="border border-border-default shadow-xs p-3.5">
          <p className="text-[11px] font-medium text-text-muted">Total Gaji Pokok</p>
          <p className="text-lg font-semibold text-text-primary tabular-nums mt-1">
            {formatRupiah(summary?.total_earned_basic || summary?.total_basic_salary || 0)}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {summary?.total_prorata_deduction > 0 
              ? `Termasuk penyesuaian prorata (-${formatRupiah(summary?.total_prorata_deduction)})` 
              : 'Komponen Tetap Bulanan'}
          </p>
        </Card>

        {/* 2. Total Uang Makan Aktual */}
        <Card className="border border-border-default shadow-xs p-3.5">
          <p className="text-[11px] font-medium text-text-muted">Total Uang Makan</p>
          <p className="text-lg font-semibold text-text-primary tabular-nums mt-1">
            {formatRupiah(summary?.total_meal_allowance || 0)}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">Rp 11.000/hari hadir tepat waktu</p>
        </Card>

        {/* 3. Potongan Uang Makan (Absen/Izin) */}
        <Card className="border border-border-default shadow-xs p-3.5">
          <p className="text-[11px] font-medium text-text-muted">Potongan Uang Makan</p>
          <p className="text-lg font-semibold text-rose-600 tabular-nums mt-1">
            -{formatRupiah(summary?.total_meal_deduction || 0)}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">Akibat sakit, izin, atau alpa</p>
        </Card>

        {/* 4. Total Bersih (Latar aksen tipis penekanan) */}
        <Card className="border border-indigo-200 bg-indigo-50/40 shadow-xs p-3.5">
          <p className="text-[11px] font-medium text-primary">Total Penggajian Bersih</p>
          <p className="text-lg font-bold text-primary tabular-nums mt-1">
            {formatRupiah(summary?.total_monthly_payroll || 0)}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">Gaji pokok + uang makan aktual</p>
        </Card>
      </div>

      {/* SECTION 1: TAB DAFTAR GAJI VS KOREKSI ABSEN */}
      <Card className="border border-border-default shadow-xs overflow-hidden">
        {/* Navigation Tabs on Left */}
        <div className="flex flex-wrap items-center justify-between border-b border-border-default px-4 pt-2 bg-surface">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('payroll')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'payroll'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Daftar Gaji Karyawan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('correction');
                if (filteredEmployees.length > 0 && !selectedCorrectionEmployeeId) {
                  setSelectedCorrectionEmployeeId(filteredEmployees[0].id);
                }
              }}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'correction'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Koreksi Absen (Kalender)</span>
            </button>
          </div>
          <Link to="/admin/karyawan" className="text-xs text-primary font-medium hover:underline pb-2 hidden sm:inline-block">
            Kelola di Data Karyawan
          </Link>
        </div>

        {activeTab === 'correction' ? (
          <div className="p-4 bg-surface">
            <AttendanceCorrectionCalendar
              initialEmployeeId={selectedCorrectionEmployeeId}
              onCorrectionSaved={fetchData}
              hideHeader={true}
            />
          </div>
        ) : (
          <CardContent className="p-0">
          {/* Filters Bar: Pencarian & Departemen sejajar sama tinggi */}
          <div className="p-3.5 border-b border-border-default flex flex-col sm:flex-row gap-3 justify-between items-center bg-subtle/20">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text"
                placeholder="Cari nama karyawan atau NIK..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border-default bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                aria-label="Cari karyawan"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
              <label htmlFor="dept-filter-select" className="text-xs text-text-secondary font-medium whitespace-nowrap">
                Departemen:
              </label>
              <select
                id="dept-filter-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-9 w-44 px-3 rounded-lg border border-border-default bg-surface text-text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">Semua Departemen ({employeesList.length})</option>
                {uniqueDepartments.map((dept: any) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                leftIcon={exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                onClick={handleExportExcel}
                disabled={exporting || loading}
                className="h-9 text-xs font-medium whitespace-nowrap shrink-0"
                title="Ekspor data saat ini ke Excel (.xlsx)"
              >
                Ekspor Excel
              </Button>
            </div>
          </div>

          {/* Desktop Table View (7 Kolom, Tanpa Horizontal Scroll) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-subtle sticky top-0 z-10 border-b border-border-default">
                <tr>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Karyawan</th>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Presensi</th>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs text-right whitespace-nowrap">Gaji Pokok (Tetap)</th>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs text-right whitespace-nowrap">Uang Makan</th>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs text-right whitespace-nowrap">Total Diterima</th>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Rekening</th>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary mb-1.5" />
                      <p className="text-xs">Memuat data gaji karyawan...</p>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted text-xs">
                      Tidak ada data karyawan yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp: any) => {
                    const presentCount = emp.present_days ?? 0;
                    const standardDays = emp.standard_working_days || 26;
                    const unattended = emp.unattended_days ?? 0;

                    const patternLabel = emp.weekend_pattern === 'sunday_fixed'
                      ? 'Minggu In'
                      : emp.weekend_pattern === 'rotating'
                      ? 'Rotasi Weekend'
                      : 'Sabtu In';

                    return (
                      <tr key={emp.id} className="h-16 hover:bg-subtle/50 transition-colors border-b border-border-default last:border-0">
                        {/* 1. Karyawan */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-medium text-text-primary text-xs truncate leading-tight">
                                {emp.name}
                              </p>
                              {emp.is_published ? (
                                <span 
                                  className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full shrink-0" 
                                  title={`Slip gaji terbit ke dashboard pada ${emp.published_at || ''}`}
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Terkirim
                                </span>
                              ) : (
                                <span className="text-[9px] font-normal text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full shrink-0">
                                  Draft
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-text-muted truncate leading-tight max-w-[220px]">
                              {emp.employee_id} • {emp.department} • {emp.job_position} • {patternLabel}
                            </p>
                          </div>
                        </td>

                        {/* 2. Presensi */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-text-primary text-xs">
                                Hadir {presentCount} dari {standardDays} hari
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {emp.is_prorated ? (
                                  <span className="text-[10px] text-primary bg-indigo-50 border border-indigo-200 px-1 rounded font-medium" title={emp.adjustment_note || 'Prorata: Masuk di pertengahan bulan'}>
                                    Prorata
                                  </span>
                                ) : unattended > 0 ? (
                                  <span className="text-[11px] text-text-muted">
                                    {unattended} hari izin/absen
                                  </span>
                                ) : null}
                                {emp.is_manually_adjusted && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded font-medium" title={emp.adjustment_note || 'Dikoreksi HR'}>
                                    Koreksi
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              leftIcon={<CalendarDays className="w-3.5 h-3.5 text-primary" />}
                              onClick={() => {
                                setCorrectionModalEmployee(emp);
                                setIsCorrectionModalOpen(true);
                              }}
                              className="h-7 text-[11px] px-2 font-medium shrink-0"
                              title="Koreksi kalender absensi & sesuaikan gaji"
                            >
                              Koreksi
                            </Button>
                          </div>
                        </td>

                        {/* 3. Gaji Pokok (Rata Kanan) */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <p className="font-medium text-text-primary text-xs tabular-nums">
                            {formatRupiah(emp.earned_basic_salary ?? emp.basic_salary)}
                          </p>
                          {emp.is_prorated ? (
                            <p className="text-[11px] text-text-muted tabular-nums mt-0.5">
                              dari {formatRupiah(emp.basic_salary)}
                              {emp.prorata_deduction > 0 && (
                                <span className="text-primary ml-1 font-medium">(-{formatRupiah(emp.prorata_deduction)})</span>
                              )}
                            </p>
                          ) : (
                            <p className="text-[11px] text-emerald-600 font-medium tabular-nums mt-0.5">
                              Tetap 100% Utuh
                            </p>
                          )}
                        </td>

                        {/* 4. Uang Makan (Rata Kanan) */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <p className="font-medium text-text-primary text-xs tabular-nums">
                            {formatRupiah(emp.meal_allowance)}
                          </p>
                          <p className="text-[11px] text-text-muted tabular-nums mt-0.5">
                            {emp.eligible_meal_days} hari dapat
                            {!emp.is_prorated && unattended > 0 && (
                              <span className="text-rose-600 ml-1">(-{formatRupiah(emp.meal_deduction || unattended * 11000)})</span>
                            )}
                          </p>
                        </td>

                        {/* 5. Total Diterima (Paling Tebal, Biasa) */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <p className="font-bold text-text-primary text-xs tabular-nums">
                            {formatRupiah(emp.total_salary)}
                          </p>
                        </td>

                        {/* 6. Rekening */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-medium text-text-primary text-xs">{emp.bank_name || 'BCA'}</p>
                          <p className="text-[11px] text-text-muted tabular-nums mt-0.5">
                            {emp.bank_account_number || '-'}
                          </p>
                        </td>

                        {/* 7. Aksi */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 relative">
                            {emp.is_published ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
                                onClick={() => handleUnpublish(emp.id)}
                                className="h-8 text-xs font-medium px-2 text-rose-600 hover:text-rose-700 border-rose-200"
                                title="Tarik slip dari dashboard karyawan"
                              >
                                Tarik
                              </Button>
                            ) : (
                              <Button 
                                variant="primary" 
                                size="sm" 
                                leftIcon={publishingSingleId === emp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                onClick={() => handlePublishSingle(emp)}
                                disabled={publishingSingleId === emp.id}
                                className="h-8 text-xs font-medium px-2.5"
                                title="Kirim slip gaji resmi ke dashboard karyawan ini"
                              >
                                Kirim
                              </Button>
                            )}

                            <Button 
                              variant="outline" 
                              size="sm" 
                              leftIcon={<Download className="w-3.5 h-3.5" />}
                              onClick={() => openSlipModal(emp)}
                              className="h-8 text-xs font-medium px-2.5"
                            >
                              Slip
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              leftIcon={<CalendarDays className="w-3.5 h-3.5 text-primary" />}
                              onClick={() => {
                                setCorrectionModalEmployee(emp);
                                setIsCorrectionModalOpen(true);
                              }}
                              className="h-8 text-xs font-medium px-2.5"
                              title="Koreksi kalender absensi & sesuaikan gaji"
                            >
                              Koreksi
                            </Button>

                            {/* Dropdown Menu Titik Tiga */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === emp.id ? null : emp.id);
                                }}
                                className="p-1.5 rounded-md hover:bg-subtle text-text-muted hover:text-text-primary transition-colors"
                                aria-label="Menu aksi lainnya"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeMenuId === emp.id && (
                                <div 
                                  ref={actionMenuRef}
                                  className="absolute right-0 mt-1 w-44 bg-surface rounded-lg shadow-md border border-border-default z-20 py-1 text-left animate-in zoom-in-95"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handlePrintSlip(emp);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-text-primary hover:bg-subtle flex items-center gap-2 text-left"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-text-muted" />
                                    Cetak Slip (PDF)
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      if (emp.is_published) {
                                        handleUnpublish(emp.id);
                                      } else {
                                        handlePublishSingle(emp);
                                      }
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-text-primary hover:bg-subtle flex items-center gap-2 text-left"
                                  >
                                    {emp.is_published ? (
                                      <>
                                        <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                        <span className="text-rose-600">Tarik dari Dashboard</span>
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-3.5 h-3.5 text-primary" />
                                        <span>Kirim ke Dashboard</span>
                                      </>
                                    )}
                                  </button>

                                  <Link
                                    to={`/admin/karyawan/${emp.id}`}
                                    className="w-full px-3 py-1.5 text-xs text-text-primary hover:bg-subtle flex items-center gap-2"
                                    onClick={() => setActiveMenuId(null)}
                                  >
                                    <User className="w-3.5 h-3.5 text-text-muted" />
                                    Profil Karyawan
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< 1024px) */}
          <div className="lg:hidden p-4 space-y-3 bg-subtle/10">
            {loading ? (
              <div className="p-6 text-center text-text-muted">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary mb-1.5" />
                <p className="text-xs">Memuat data gaji karyawan...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <p className="p-4 text-center text-text-muted text-xs">
                Tidak ada data karyawan yang cocok.
              </p>
            ) : (
              filteredEmployees.map((emp: any) => {
                const presentCount = emp.present_days ?? 0;
                const standardDays = emp.standard_working_days || 26;
                const unattended = emp.unattended_days ?? 0;

                return (
                  <div key={`m-${emp.id}`} className="p-3.5 bg-surface rounded-lg border border-border-default shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-text-primary text-xs">{emp.name}</p>
                        <p className="text-[11px] text-text-muted">{emp.employee_id} • {emp.department}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-text-muted block">Total Diterima:</span>
                        <span className="font-bold text-text-primary text-xs tabular-nums">
                          {formatRupiah(emp.total_salary)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border-default text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Presensi:</span>
                        <span className="font-medium text-text-primary">
                          Hadir {presentCount} dari {standardDays} hari {emp.is_prorated ? '(Prorata)' : (unattended > 0 ? `(${unattended} hari izin/absen)` : '')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Gaji Pokok:</span>
                        <span className="font-medium text-text-primary tabular-nums">
                          {emp.is_prorated ? (
                            <span>
                              {formatRupiah(emp.earned_basic_salary)}{' '}
                              <span className="text-[10px] text-primary font-medium">(Prorata {presentCount}/{standardDays} hr)</span>
                            </span>
                          ) : (
                            <span>
                              {formatRupiah(emp.basic_salary)}{' '}
                              <span className="text-[10px] text-emerald-600 font-medium">(Utuh 100%)</span>
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Uang Makan:</span>
                        <span className="font-medium text-text-primary tabular-nums">
                          {formatRupiah(emp.meal_allowance)} ({emp.eligible_meal_days} hr)
                          {!emp.is_prorated && unattended > 0 && (
                            <span className="text-[10px] text-rose-600 ml-1">
                              (-{formatRupiah(emp.meal_deduction || unattended * 11000)})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Rekening:</span>
                        <span className="text-text-secondary tabular-nums">
                          {emp.bank_name || 'BCA'} {emp.bank_account_number || '-'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border-default flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        onClick={() => openSlipModal(emp)}
                        className="flex-1 h-9 text-xs justify-center font-medium"
                      >
                        Slip Gaji
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<CalendarDays className="w-3.5 h-3.5 text-primary" />}
                        onClick={() => {
                          setCorrectionModalEmployee(emp);
                          setIsCorrectionModalOpen(true);
                        }}
                        className="flex-1 h-9 text-xs justify-center font-medium"
                      >
                        Koreksi
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
        )}
      </Card>

      {/* SECTION 2: RIWAYAT PERIODE PENGGAJIAN */}
      <Card className="border border-border-default shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border-default flex items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold text-text-primary">
              Riwayat Periode Penggajian
            </CardTitle>
            <p className="text-[11px] text-text-muted mt-0.5">
              Klik "Buka" untuk meninjau rincian gaji pada periode lalu, atau "Kirim Slip" untuk merilis ke Dashboard karyawan.
            </p>
          </div>
          <span className="text-[11px] text-text-muted shrink-0">
            {periods.length} periode tercatat
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-subtle border-b border-border-default text-text-secondary font-semibold">
              <tr>
                <th className="py-2.5 px-4">Nama Periode</th>
                <th className="py-2.5 px-4">Rentang Cut-Off</th>
                <th className="py-2.5 px-4">Karyawan</th>
                <th className="py-2.5 px-4 text-right">Total Anggaran</th>
                <th className="py-2.5 px-4">Status Rilis Slip</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {periods.map((p, idx) => {
                const isSelected = p.period_key === summary?.period_key;
                return (
                  <tr key={idx} className={`hover:bg-subtle/50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                    <td className="py-2.5 px-4 font-medium text-text-primary">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{p.name}</span>
                        {isSelected && (
                          <Badge variant="primary" className="h-5 text-[10px]">
                            Sedang Dibuka
                          </Badge>
                        )}
                        {p.period_key === currentDefaultPeriodKey && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-normal">
                            Bulan Ini
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-text-secondary">
                      {p.start_date && p.end_date 
                        ? `${formatShortDateIndo(p.start_date)} – ${formatShortDateIndo(p.end_date)}`
                        : formatShortDateIndo(p.pay_date || p.end_date)}
                    </td>
                    <td className="py-2.5 px-4">{p.total_employees || summary?.active_employees_count || 10} orang</td>
                    <td className="py-2.5 px-4 text-right font-medium text-text-primary tabular-nums">
                      {formatRupiah(p.total_amount || summary?.total_monthly_payroll || 0)}
                    </td>
                    <td className="py-2.5 px-4">
                      {p.is_published ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Dirilis ({p.published_count || p.total_employees} org)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant={isSelected ? "secondary" : "outline"}
                          size="sm" 
                          onClick={() => {
                            handleSelectPeriod(p);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="h-7 text-xs px-2 font-medium"
                          leftIcon={<ArrowRight className="w-3 h-3" />}
                        >
                          {isSelected ? 'Aktif' : 'Buka'}
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => {
                            setSelectedPastPeriodForModal(p);
                            setIsPastPeriodModalOpen(true);
                          }}
                          className="h-7 text-xs px-2 font-medium"
                          leftIcon={<Send className="w-3 h-3" />}
                          title="Kirim atau rilis slip gaji untuk periode ini"
                        >
                          Kirim Slip
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL KONFIRMASI RILIS SELURUH SLIP GAJI */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => !publishingAll && setIsPublishModalOpen(false)}
        title="Konfirmasi Penerbitan Seluruh Slip Gaji"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-primary-soft/40 border border-primary/20 rounded-lg space-y-1.5">
            <p className="font-semibold text-text-primary text-sm flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Rilis Slip Gaji ke Dashboard Seluruh Karyawan
            </p>
            <p className="text-text-secondary leading-relaxed">
              Anda akan menerbitkan slip gaji resmi untuk <strong>{summary?.period_label}</strong> kepada seluruh <strong>{summary?.active_employees_count} karyawan aktif</strong>.
            </p>
          </div>

          <div className="bg-subtle p-3 rounded-md border border-border-default space-y-1.5 text-text-secondary">
            <div className="flex justify-between">
              <span>Periode Cut-Off:</span>
              <span className="font-medium text-text-primary">{summary?.cutoff_start_date} s/d {summary?.cutoff_end_date}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Karyawan Penerima:</span>
              <span className="font-medium text-text-primary">{summary?.active_employees_count} Orang</span>
            </div>
            <div className="flex justify-between">
              <span>Total Gaji Bersih:</span>
              <span className="font-semibold text-emerald-600">{formatRupiah(summary?.total_monthly_payroll || 0)}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 leading-snug">
            <strong>Catatan Operasional:</strong> Dokumen slip gaji akan langsung dapat diakses dan diunduh oleh karyawan di Dashboard masing-masing. Sistem juga akan mengirimkan notifikasi in-app otomatis ke setiap akun karyawan.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPublishModalOpen(false)}
              disabled={publishingAll}
              className="h-9 px-4 text-xs font-medium"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={publishingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              onClick={() => handlePublishAll()}
              disabled={publishingAll}
              className="h-9 px-4 text-xs font-medium"
            >
              {publishingAll ? 'Sedang Menerbitkan...' : 'Ya, Rilis & Kirim Sekarang'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL PENGIRIMAN SLIP GAJI PERIODE LALU */}
      <Modal
        isOpen={isPastPeriodModalOpen}
        onClose={() => !publishingAll && setIsPastPeriodModalOpen(false)}
        title="Pengiriman Slip Gaji Periode Lalu"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-primary-soft/40 border border-primary/20 rounded-lg space-y-1">
            <p className="font-semibold text-text-primary text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Pilih & Kirim Slip Gaji Periode Lalu
            </p>
            <p className="text-text-secondary leading-relaxed">
              Kirimkan slip gaji resmi untuk cut-off periode sebelumnya ke Dashboard masing-masing karyawan beserta notifikasi in-app otomatis.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-text-primary">
              Pilih Periode Penggajian yang Ingin Diproses:
            </label>
            <select
              value={selectedPastPeriodForModal?.period_key || ''}
              onChange={(e) => {
                const found = periods.find(p => p.period_key === e.target.value);
                if (found) setSelectedPastPeriodForModal(found);
              }}
              className="w-full text-xs font-medium text-text-primary bg-white border border-border-default rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="" disabled>-- Pilih Periode Cut-Off --</option>
              {periods.map((p) => {
                const isCurrent = p.period_key === currentDefaultPeriodKey;
                const statusText = p.is_published ? 'Sudah Dirilis' : 'Belum Dirilis';
                return (
                  <option key={p.period_key || p.id} value={p.period_key}>
                    {p.name} {isCurrent ? '(Bulan Ini)' : '(Periode Lalu)'} — [{statusText}]
                  </option>
                );
              })}
            </select>
          </div>

          {selectedPastPeriodForModal && (
            <div className="bg-subtle p-3 rounded-md border border-border-default space-y-2 text-text-secondary">
              <div className="flex justify-between items-center">
                <span>Nama Periode:</span>
                <span className="font-semibold text-text-primary">{selectedPastPeriodForModal.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Rentang Cut-Off:</span>
                <span className="font-medium text-text-primary">
                  {formatShortDateIndo(selectedPastPeriodForModal.start_date)} s/d {formatShortDateIndo(selectedPastPeriodForModal.end_date)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status Penerbitan:</span>
                {selectedPastPeriodForModal.is_published ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Sudah Dirilis ({selectedPastPeriodForModal.published_count || selectedPastPeriodForModal.total_employees} karyawan)
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Belum Dirilis (Draft)
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span>Total Karyawan Aktif:</span>
                <span className="font-medium text-text-primary">{selectedPastPeriodForModal.total_employees} Orang</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Estimasi Anggaran Gaji:</span>
                <span className="font-semibold text-emerald-600">{formatRupiah(selectedPastPeriodForModal.total_amount || 0)}</span>
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 leading-snug">
            <strong>Catatan Operasional:</strong> Anda dapat memeriksa seluruh rincian komponen gaji karyawan untuk periode ini terlebih dahulu dengan menekan tombol <em>"Tinjau di Tabel"</em>, atau langsung mengirimkan seluruh slip gaji periode ini dengan menekan <em>"Rilis & Kirim Sekarang"</em>.
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border-default">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPastPeriodModalOpen(false)}
              disabled={publishingAll}
              className="h-9 px-3 text-xs font-medium"
            >
              Batal
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (selectedPastPeriodForModal) {
                  handleSelectPeriod(selectedPastPeriodForModal);
                  setIsPastPeriodModalOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={!selectedPastPeriodForModal || publishingAll}
              className="h-9 px-3 text-xs font-medium"
              leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Tinjau di Tabel Utama
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={publishingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              onClick={() => {
                if (selectedPastPeriodForModal) {
                  handlePublishAll(selectedPastPeriodForModal);
                }
              }}
              disabled={!selectedPastPeriodForModal || publishingAll}
              className="h-9 px-4 text-xs font-medium"
            >
              {publishingAll ? 'Sedang Mengirim...' : (selectedPastPeriodForModal?.is_published ? 'Kirim Ulang Semua Slip' : 'Rilis & Kirim Sekarang')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL SLIP GAJI KARYAWAN & DOWNLOAD / CETAK */}
      <Modal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        title="Dokumen Slip Gaji Karyawan"
        size="lg"
      >
        {selectedSlipEmployee && (
          <div className="space-y-4 text-xs">
            {/* Status Publikasi ke Dashboard */}
            {selectedSlipEmployee.is_published ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Slip gaji ini sudah terkirim resmi ke Dashboard karyawan {selectedSlipEmployee.published_at ? `(${selectedSlipEmployee.published_at})` : ''}.
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
                  onClick={() => {
                    handleUnpublish(selectedSlipEmployee.id);
                    setIsSlipModalOpen(false);
                  }}
                  className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 font-medium"
                >
                  Tarik Slip
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  Slip gaji ini masih berstatus Draft dan belum dapat dilihat oleh karyawan di Dashboard.
                </span>
                <Button 
                  variant="primary" 
                  size="sm" 
                  leftIcon={publishingSingleId === selectedSlipEmployee.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  onClick={() => {
                    handlePublishSingle(selectedSlipEmployee);
                    setIsSlipModalOpen(false);
                  }}
                  disabled={publishingSingleId === selectedSlipEmployee.id}
                  className="h-7 text-xs font-medium"
                >
                  Kirim ke Dashboard
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-subtle border border-border-default">
              <div>
                <p className="font-semibold text-text-primary">
                  Slip Gaji: {selectedSlipEmployee.name}
                </p>
                <p className="text-[11px] text-text-muted">
                  {selectedSlipEmployee.employee_id} • {selectedSlipEmployee.department}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsSlipModalOpen(false)}
                  className="h-8 text-xs"
                >
                  Tutup
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => handlePrintSlip(selectedSlipEmployee)}
                  className="h-8 text-xs font-medium"
                >
                  Cetak / Simpan PDF
                </Button>
              </div>
            </div>

            {/* Rincian Slip */}
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-text-primary mb-1.5 uppercase text-[11px] tracking-wider">
                  1. Rincian Penerimaan
                </p>
                <div className="border border-border-default rounded-lg overflow-hidden text-xs divide-y divide-border-default">
                  <div className="flex justify-between p-2.5 bg-subtle font-medium text-text-secondary">
                    <span>Komponen</span>
                    <span>Keterangan</span>
                    <span>Jumlah</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-subtle/40">
                    <span className="font-medium text-text-primary">Gaji Pokok</span>
                    <span className={selectedSlipEmployee.is_prorated ? "text-primary font-medium" : "text-emerald-600 font-medium"}>
                      {selectedSlipEmployee.is_prorated 
                        ? `Bulanan Prorata (${selectedSlipEmployee.present_days ?? 0}/26 hr)` 
                        : 'Bulanan Tetap (100% Utuh)'}
                    </span>
                    <span className="font-semibold text-text-primary tabular-nums">
                      {formatRupiah(selectedSlipEmployee.earned_basic_salary || selectedSlipEmployee.basic_salary)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-text-primary">Uang Makan Aktual</span>
                    <span className="text-text-muted">{selectedSlipEmployee.eligible_meal_days} hari hadir × Rp 11.000</span>
                    <span className="font-medium text-text-primary tabular-nums">{formatRupiah(selectedSlipEmployee.meal_allowance)}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-text-primary mb-1.5 uppercase text-[11px] tracking-wider">
                  2. Rincian Potongan
                </p>
                <div className="border border-border-default rounded-lg overflow-hidden text-xs divide-y divide-border-default">
                  {selectedSlipEmployee.is_prorated && selectedSlipEmployee.prorata_deduction > 0 ? (
                    <div className="flex justify-between p-2.5">
                      <span className="text-text-muted">Potongan Prorata (Tidak Masuk Penuh 1 Bulan)</span>
                      <span className="text-text-muted">Masuk pertengahan bulan ({selectedSlipEmployee.unattended_days} hari)</span>
                      <span className="font-medium text-primary tabular-nums">-{formatRupiah(selectedSlipEmployee.prorata_deduction)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between p-2.5">
                      <span className="text-text-muted">Potongan Gaji Pokok</span>
                      <span className="text-text-muted">Gaji pokok utuh 100% (tidak ada potongan)</span>
                      <span className="font-medium text-emerald-600 tabular-nums">Rp 0</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2.5">
                    <span className="text-text-muted">Potongan Uang Makan (Izin/Sakit/Alpa)</span>
                    <span className="text-text-muted">{selectedSlipEmployee.is_prorated ? 'Hari absen / izin setelah bergabung' : `${selectedSlipEmployee.unattended_days || 0} hari tidak dapat uang makan`}</span>
                    <span className="font-medium text-rose-600 tabular-nums">-{formatRupiah(selectedSlipEmployee.meal_deduction || ((selectedSlipEmployee.unattended_days || 0) * 11000))}</span>
                  </div>
                </div>
              </div>

              {/* Take Home Pay Box */}
              <div className="p-3.5 rounded-lg bg-subtle border border-border-default flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-text-muted uppercase">
                    Total Diterima (Take Home Pay):
                  </p>
                  <p className="text-lg font-bold text-text-primary tabular-nums mt-0.5">
                    {formatRupiah(selectedSlipEmployee.total_salary)}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-text-muted">Rekening Transfer:</p>
                  <p className="font-medium text-text-primary">{selectedSlipEmployee.bank_name || 'BCA'} • {selectedSlipEmployee.bank_account_number || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL KALENDER KOREKSI ABSEN & DAMPAK GAJI PER KARYAWAN */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title={`Koreksi Absensi & Dampak Gaji: ${correctionModalEmployee?.name || 'Karyawan'}`}
        size="lg"
      >
        {correctionModalEmployee && (
          <div className="space-y-4">
            <div className="p-3 bg-subtle rounded-lg border border-border-default flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-semibold text-text-primary text-sm">
                  {correctionModalEmployee.name}
                </p>
                <p className="text-[11px] text-text-muted">
                  {correctionModalEmployee.employee_id} • {correctionModalEmployee.department} • {correctionModalEmployee.job_position}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-text-muted block">Gaji Pokok Terdaftar:</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatRupiah(correctionModalEmployee.basic_salary)}
                </span>
              </div>
            </div>

            <AttendanceCorrectionCalendar
              initialEmployeeId={correctionModalEmployee.id}
              onCorrectionSaved={fetchData}
              hideHeader={true}
            />

            <div className="flex items-center justify-between pt-2 border-t border-border-default">
              <p className="text-[11px] text-text-muted">
                Perubahan status absensi langsung menyesuaikan kalkulasi gaji (gaji pokok, uang makan, dan total).
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCorrectionModalOpen(false)}
                className="h-8 text-xs font-medium px-4"
              >
                Selesai
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL KOREKSI MANUAL PAYROLL OLEH HR */}
      <Modal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        title="Koreksi Presensi & Payroll Karyawan"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            {selectedAdjustmentEmployee?.is_manually_adjusted ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
                onClick={handleResetAdjustment}
                disabled={adjusting}
                className="h-9 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Reset Otomatis
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAdjustmentModalOpen(false)}
                disabled={adjusting}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAdjustment}
                disabled={adjusting}
                className="h-9 text-xs font-medium"
              >
                {adjusting ? 'Menyimpan...' : 'Simpan Koreksi'}
              </Button>
            </div>
          </div>
        }
      >
        {selectedAdjustmentEmployee && (
          <div className="space-y-3.5 text-xs">
            {/* Header info karyawan */}
            <div className="p-3 rounded-lg bg-subtle border border-border-default flex items-start justify-between">
              <div>
                <p className="font-semibold text-text-primary">{selectedAdjustmentEmployee.name}</p>
                <p className="text-[11px] text-text-muted">{selectedAdjustmentEmployee.employee_id} • {selectedAdjustmentEmployee.department}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-text-muted">Gaji Pokok</p>
                <p className="font-semibold text-text-primary tabular-nums">
                  {formatRupiah(selectedAdjustmentEmployee.basic_salary)}
                </p>
              </div>
            </div>

            {/* Inputs Koreksi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Hari Hadir Kerja *"
                  type="number"
                  min="0"
                  max="31"
                  value={adjustmentForm.present_days}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, present_days: Number(e.target.value) })}
                  helperText="Basis 26 hari kerja"
                />
              </div>
              <div>
                <Input
                  label="Hari Uang Makan *"
                  type="number"
                  min="0"
                  max="31"
                  value={adjustmentForm.eligible_meal_days}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, eligible_meal_days: Number(e.target.value) })}
                  helperText="Rp 11.000 / hari tepat waktu"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Hari Telat > 15 Menit"
                  type="number"
                  min="0"
                  max="31"
                  value={adjustmentForm.late_over_15_days}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, late_over_15_days: Number(e.target.value) })}
                  helperText="Uang makan hari ini hangus"
                />
              </div>
              <div>
                <Input
                  label="Catatan Koreksi"
                  type="text"
                  placeholder="Misal: Penyesuaian transisi / Prorata"
                  value={adjustmentForm.note}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, note: e.target.value })}
                  helperText="Tercantum pada slip gaji"
                />
              </div>
            </div>

            {/* Toggle Prorata */}
            <div className="p-2.5 rounded-lg border border-border-default bg-subtle/50 flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary text-xs">Prorata Gaji Pokok</p>
                <p className="text-[11px] text-text-muted">Aktifkan jika karyawan tidak masuk full 1 bulan (gaji pokok dihitung prorata)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(adjustmentForm.is_prorated)}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, is_prorated: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-border-default peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Live calculation box */}
            {(() => {
              const basic = Number(selectedAdjustmentEmployee.basic_salary || 0);
              const present = Number(adjustmentForm.present_days || 0);
              const isProrated = Boolean(adjustmentForm.is_prorated);
              const earnedBasic = isProrated ? Math.round((present / 26) * basic) : basic;
              const meal = Number(adjustmentForm.eligible_meal_days || 0) * 11000;
              const total = earnedBasic + meal;

              return (
                <div className="p-3 rounded-lg bg-subtle border border-border-default space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">Simulasi Setelah Koreksi:</span>
                    <span className="font-bold text-text-primary tabular-nums text-sm">
                      {formatRupiah(total)}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-muted flex justify-between pt-1 border-t border-border-default">
                    <span>
                      Gaji Pokok: {formatRupiah(earnedBasic)} {isProrated ? `(Prorata ${present}/26 hr)` : '(Utuh 100%)'}
                    </span>
                    <span>Uang Makan: {formatRupiah(meal)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* MODAL BUAT PERIODE GAJI BARU */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Periode Penggajian Baru"
        footer={
          <ConfirmFooter
            onCancel={() => setIsModalOpen(false)}
            onConfirm={handleCreatePeriod}
            confirmText="Buat Periode & Sesuaikan Gaji"
            isLoading={submitting}
          />
        }
      >
        <div className="space-y-3.5 text-xs">
          <Input
            label="Nama Periode *"
            placeholder="Contoh: November 2026"
            value={newPeriod.name}
            onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tanggal Mulai *"
              type="date"
              value={newPeriod.start_date}
              onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })}
              required
            />
            <Input
              label="Tanggal Selesai *"
              type="date"
              value={newPeriod.end_date}
              onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })}
              required
            />
          </div>
          <Input
            label="Tanggal Pembayaran Gaji"
            type="date"
            value={newPeriod.pay_date}
            onChange={(e) => setNewPeriod({ ...newPeriod, pay_date: e.target.value })}
            helperText="Tanggal transfer gaji ke rekening karyawan"
          />

          <div className="p-3 rounded-lg bg-subtle border border-border-default text-xs text-text-secondary">
            <p className="font-medium text-text-primary">Otomatis Terhubung ke Data Karyawan & Presensi:</p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              Sistem akan otomatis menghitung slip gaji untuk {summary?.active_employees_count || 10} karyawan aktif dengan total estimasi anggaran {formatRupiah(summary?.total_monthly_payroll || 0)}.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
