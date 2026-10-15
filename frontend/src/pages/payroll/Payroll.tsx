import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

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

  // Accordion for calculation rules
  const [showRules, setShowRules] = useState(false);

  // Action Menu dropdown state (titik tiga)
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // State for Slip Gaji Modal
  const [selectedSlipEmployee, setSelectedSlipEmployee] = useState<any>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [periodsRes, summaryRes] = await Promise.all([
        api.get('/payroll-periods'),
        api.get('/payroll/summary')
      ]);
      const rawPeriods = periodsRes.data;
      setPeriods(Array.isArray(rawPeriods) ? rawPeriods : (Array.isArray(rawPeriods?.data) ? rawPeriods.data : []));
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
    }
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

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(val || 0);
  };

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

  // Generate official HTML slip document for printing or downloading (Preserved)
  const generateSlipHtml = (emp: any) => {
    const periodMonth = summary?.period_label || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const slipNo = `SLIP/${emp.employee_id}/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Slip Gaji - ${emp.name} (${emp.employee_id}) - ${periodMonth}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .slip-card {
      max-width: 720px;
      margin: 0 auto;
      border: 2px solid #0f172a;
      border-radius: 10px;
      padding: 30px;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .company-brand h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: -0.3px;
    }
    .company-brand p {
      margin: 3px 0 0 0;
      font-size: 11px;
      color: #64748b;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-badge h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    .doc-badge .period {
      margin: 3px 0 0 0;
      font-size: 12px;
      color: #047857;
      font-weight: 600;
    }
    .slip-no {
      font-family: monospace;
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .employee-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 24px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 18px;
      font-size: 12px;
    }
    .field-row {
      display: flex;
    }
    .field-label {
      width: 130px;
      color: #64748b;
      font-weight: 500;
    }
    .field-value {
      flex: 1;
      font-weight: 600;
      color: #0f172a;
    }
    .attendance-note-box {
      background: #fefce8;
      border: 1px solid #fef08a;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 18px;
      font-size: 11.5px;
      line-height: 1.5;
    }
    .attendance-note-box strong {
      color: #854d0e;
    }
    .table-slip {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    .table-slip th {
      background: #0f172a;
      color: #ffffff;
      padding: 9px 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .table-slip td {
      padding: 9px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12.5px;
    }
    .total-banner {
      background: #ecfdf5;
      border: 2px solid #059669;
      border-radius: 8px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .total-banner .label {
      font-size: 13px;
      font-weight: 700;
      color: #065f46;
      text-transform: uppercase;
    }
    .total-banner .amount {
      font-size: 20px;
      font-family: monospace;
      font-weight: 900;
      color: #047857;
    }
    .bank-info {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 12px;
      color: #166534;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
    }
    .sig-space {
      height: 60px;
    }
    .sig-line {
      border-top: 1px solid #64748b;
      padding-top: 6px;
      font-weight: 600;
      color: #0f172a;
    }
    .footer-note {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 24px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 12px;
    }
    @media print {
      body { padding: 0; background: none; }
      .slip-card { border: 1.5px solid #000; box-shadow: none; border-radius: 0; padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="slip-card">
    <div class="header">
      <div class="company-brand">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
          <img src="${window.location.origin}/logo.ico" alt="" style="width:36px;height:36px;object-fit:contain;" />
          <div>
            <h1>PT KURMA GROUP INDONESIA</h1>
            <p>Graha Kurma Tower, Lt. 8, Jl. TB Simatupang No. 18, Jakarta Selatan</p>
          </div>
        </div>
        <p>Telp: (021) 789-2233 • Email: finance@kurmagroup.co.id</p>
      </div>
      <div class="doc-badge">
        <h2>SLIP GAJI KARYAWAN</h2>
        <div class="period">Periode: ${periodMonth}</div>
        <div class="slip-no">No: ${slipNo}</div>
      </div>
    </div>

    <div class="employee-grid">
      <div class="field-row"><div class="field-label">NIK / ID Karyawan:</div><div class="field-value">${emp.employee_id} / ${emp.nik || '-'}</div></div>
      <div class="field-row"><div class="field-label">Nama Karyawan:</div><div class="field-value">${emp.name}</div></div>
      <div class="field-row"><div class="field-label">Departemen:</div><div class="field-value">${emp.department}</div></div>
      <div class="field-row"><div class="field-label">Jabatan:</div><div class="field-value">${emp.job_position}</div></div>
      <div class="field-row"><div class="field-label">Tipe Hubungan Kerja:</div><div class="field-value">${emp.employment_type === 'permanent' ? 'Karyawan Tetap (PKWTT)' : 'Karyawan Kontrak (PKWT)'}</div></div>
      <div class="field-row"><div class="field-label">Tanggal Cetak:</div><div class="field-value">${printDate}</div></div>
    </div>

    <div class="attendance-note-box">
      <strong>Catatan Kehadiran & Basis Hari Kerja (26 Hari Kerja / Bulan):</strong><br>
      • Basis Standar Kerja: <strong>26 Hari Kerja</strong> (6 hari kerja/minggu • 1 hari libur akhir pekan)<br>
      • Kehadiran Aktual: <strong>${emp.present_days ?? 0} Hari</strong> | Tidak Hadir: <strong>${emp.unattended_days || 0} Hari</strong><br>
      • Hadir Tepat Waktu (&le; 08:15 WIB): <strong>${emp.eligible_meal_days} Hari</strong> (Berhak Uang Makan = ${formatRupiah(emp.meal_allowance)})<br>
      • Telat Lebih dari 15 Menit (&gt; 08:15 WIB): <strong>${emp.late_over_15_days} Hari</strong> (<em>Uang makan hari tersebut hangus</em>)<br>
      • Jadwal Akhir Pekan: <strong>${emp.weekend_pattern_label || 'Tetap Masuk Sabtu (Minggu OFF)'}</strong>
    </div>

    <table class="table-slip">
      <thead>
        <tr>
          <th style="width: 50%;">Komponen Penerimaan (Earnings)</th>
          <th style="width: 25%;">Keterangan Perhitungan</th>
          <th style="width: 25%; text-align: right;">Jumlah (Rp)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Gaji Pokok</strong></td>
          <td>${emp.is_prorated ? `Bulanan Prorata (${emp.present_days}/26 hari kerja aktif)` : 'Bulanan Tetap (100% Utuh)'}</td>
          <td style="text-align: right; font-weight: bold;">${formatRupiah(emp.earned_basic_salary || emp.basic_salary)}</td>
        </tr>
        <tr>
          <td><strong>Uang Makan Aktual</strong></td>
          <td>${emp.eligible_meal_days} hari hadir tepat waktu &times; Rp 11.000</td>
          <td style="text-align: right; font-weight: bold;">${formatRupiah(emp.meal_allowance)}</td>
        </tr>
      </tbody>
    </table>

    <table class="table-slip">
      <thead>
        <tr>
          <th style="width: 50%;">Komponen Potongan (Deductions)</th>
          <th style="width: 25%;">Keterangan Perhitungan</th>
          <th style="width: 25%; text-align: right;">Jumlah (Rp)</th>
        </tr>
      </thead>
      <tbody>
        ${emp.is_prorated && emp.prorata_deduction > 0 ? `
        <tr>
          <td>Potongan Prorata (Tidak Masuk Penuh 1 Bulan)</td>
          <td>${emp.unattended_days} hari belum bekerja / cut-off</td>
          <td style="text-align: right; color: #4f46e5;">-${formatRupiah(emp.prorata_deduction)}</td>
        </tr>` : `
        <tr>
          <td>Potongan Gaji Pokok (Izin / Sakit / Alpa)</td>
          <td>Gaji pokok utuh 100% (tidak ada potongan)</td>
          <td style="text-align: right; color: #10b981;">Rp 0</td>
        </tr>`}
        <tr>
          <td>Potongan Uang Makan (Izin / Sakit / Alpa / Telat)</td>
          <td>${emp.is_prorated ? 'Hari izin / absen setelah tanggal masuk' : `${(emp.unattended_days || 0) + (emp.late_over_15_days || 0)} hari tidak dapat uang makan`}</td>
          <td style="text-align: right; color: #dc2626;">-${formatRupiah(emp.meal_deduction || ((emp.unattended_days || 0) * 11000))}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-banner">
      <div class="label">Total Diterima (Take Home Pay):</div>
      <div class="amount">${formatRupiah(emp.total_salary)}</div>
    </div>

    <div class="bank-info">
      <strong>Transfer Rekening:</strong> ${emp.bank_name || 'BCA'} • No. ${emp.bank_account_number || '-'} a.n. ${emp.bank_account_holder || emp.name}
    </div>

    <div class="signatures">
      <div>
        <p>Disetujui Oleh,</p>
        <div class="sig-space"></div>
        <div class="sig-line">Finance & HRD Kurma Group</div>
      </div>
      <div>
        <p>Diterima Oleh,</p>
        <div class="sig-space"></div>
        <div class="sig-line">${emp.name}</div>
      </div>
    </div>

    <div class="footer-note">
      Slip gaji ini dicetak secara otomatis melalui Sistem HRIS PT Kurma Group Indonesia. Dokumen ini sah dan bersifat rahasia (confidential).
    </div>
  </div>
</body>
</html>`;
  };

  const handlePrintSlip = (emp: any) => {
    const html = generateSlipHtml(emp);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    }
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
      fetchData();
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
      fetchData();
    } catch (error: any) {
      console.error('Error resetting adjustment:', error);
      alert(error.response?.data?.message || 'Gagal mereset koreksi.');
    } finally {
      setAdjusting(false);
    }
  };

  const employeesList = summary?.employees || [];
  const filteredEmployees = employeesList.filter((emp: any) => {
    const matchSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = selectedDept === 'all' || emp.department === selectedDept;
    return matchSearch && matchDept;
  });

  const uniqueDepartments = Array.from(new Set(employeesList.map((e: any) => e.department))).filter(Boolean);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">Manajemen Payroll</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Periode {formatPeriodRange(summary?.cutoff_start_date, summary?.cutoff_end_date)} · {summary?.standard_working_days || 26} hari kerja
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="primary" 
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
            className="h-9 text-xs font-medium whitespace-nowrap"
          >
            Buat Periode Gaji Baru
          </Button>
        </div>
      </div>

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

      {/* SECTION 1: DAFTAR GAJI KARYAWAN */}
      <Card className="border border-border-default shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-text-primary">
            Daftar Gaji Karyawan
          </CardTitle>
          <Link to="/admin/karyawan" className="text-xs text-primary font-medium hover:underline">
            Kelola di Data Karyawan
          </Link>
        </CardHeader>

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
                className="h-9 w-48 px-3 rounded-lg border border-border-default bg-surface text-text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">Semua Departemen ({employeesList.length})</option>
                {uniqueDepartments.map((dept: any) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
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
                            <p className="font-medium text-text-primary text-xs truncate leading-tight">
                              {emp.name}
                            </p>
                            <p className="text-[11px] text-text-muted truncate leading-tight max-w-[220px]">
                              {emp.employee_id} • {emp.department} • {emp.job_position} • {patternLabel}
                            </p>
                          </div>
                        </td>

                        {/* 2. Presensi */}
                        <td className="py-3 px-4 whitespace-nowrap">
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
                              leftIcon={<Sliders className="w-3.5 h-3.5" />}
                              onClick={() => openAdjustmentModal(emp)}
                              className="h-8 text-xs font-medium px-2.5"
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
                                  className="absolute right-0 mt-1 w-36 bg-surface rounded-lg shadow-md border border-border-default z-20 py-1 text-left animate-in zoom-in-95"
                                >
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
                        leftIcon={<Sliders className="w-3.5 h-3.5" />}
                        onClick={() => openAdjustmentModal(emp)}
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
      </Card>

      {/* SECTION 2: RIWAYAT PERIODE PENGGAJIAN */}
      <Card className="border border-border-default shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border-default flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-text-primary">
            Riwayat Periode Penggajian
          </CardTitle>
          <span className="text-[11px] text-text-muted">
            {periods.length} periode tercatat
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-subtle border-b border-border-default text-text-secondary font-semibold">
              <tr>
                <th className="py-2.5 px-4">Nama Periode</th>
                <th className="py-2.5 px-4">Tanggal Pembayaran</th>
                <th className="py-2.5 px-4">Karyawan</th>
                <th className="py-2.5 px-4 text-right">Total Anggaran</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {periods.map((p, idx) => (
                <tr key={idx} className="hover:bg-subtle/50 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-text-primary">{p.name}</td>
                  <td className="py-2.5 px-4 text-text-secondary">{formatShortDateIndo(p.pay_date || p.end_date)}</td>
                  <td className="py-2.5 px-4">{p.total_employees || summary?.active_employees_count || 10} orang</td>
                  <td className="py-2.5 px-4 text-right font-medium text-text-primary tabular-nums">
                    {formatRupiah(p.total_amount || summary?.total_monthly_payroll || 0)}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      p.status === 'paid' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {p.status === 'paid' ? 'Sudah Dibayar' : 'Berjalan'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => alert(`Rekap penggajian periode ${p.name} siap diunduh.`)}
                      className="h-7 text-xs px-2"
                      leftIcon={<Download className="w-3 h-3" />}
                    >
                      Rekap PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL SLIP GAJI KARYAWAN & DOWNLOAD / CETAK */}
      <Modal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        title="Dokumen Slip Gaji Karyawan"
        size="lg"
      >
        {selectedSlipEmployee && (
          <div className="space-y-4 text-xs">
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
