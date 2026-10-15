import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  Wallet, 
  Eye, 
  EyeOff, 
  FileText, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  CreditCard,
  Building2,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah, printSlipDocument } from '../../utils/slipGenerator';

interface SlipRecord {
  id: number;
  period_key: string;
  period_name: string;
  start_date: string;
  end_date: string;
  published_at: string | null;
  published_at_raw?: string | null;
  net_pay: number;
  gross_pay: number;
  total_deductions: number;
  details: any;
}

export function MySlipGaji() {
  const { user } = useAuth();
  const [slips, setSlips] = useState<SlipRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSalaryHidden, setIsSalaryHidden] = useState<boolean>(() => {
    return localStorage.getItem('kg_hris_mask_salary') !== 'false';
  });

  // Modal State
  const [selectedSlip, setSelectedSlip] = useState<SlipRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchSlips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/my-slips');
      const list = Array.isArray(res.data) ? res.data : [];
      setSlips(list);
    } catch (err) {
      console.error('Gagal mengambil riwayat slip gaji:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlips();
  }, []);

  const toggleSalaryVisibility = () => {
    setIsSalaryHidden((prev) => {
      const next = !prev;
      localStorage.setItem('kg_hris_mask_salary', String(next));
      return next;
    });
  };

  const handleOpenSlipModal = (slip: SlipRecord) => {
    setSelectedSlip(slip);
    setIsModalOpen(true);
  };

  const handlePrintSlip = (slip: SlipRecord) => {
    // Gabungkan details dengan field utama untuk print document
    const payload = {
      ...(slip.details || {}),
      name: slip.details?.name || user?.name || 'Karyawan',
      employee_id: slip.details?.employee_id || user?.employee?.employee_id || 'KG-EMP',
      department: slip.details?.department || user?.employee?.current_assignment?.department?.name || 'Kurma Group',
      job_position: slip.details?.job_position || user?.employee?.current_assignment?.job_position?.name || 'Staff',
      period_name: slip.period_name,
      total_salary: slip.net_pay,
      net_pay: slip.net_pay,
    };
    printSlipDocument(payload, slip.period_name);
  };

  const latestSlip = slips.length > 0 ? slips[0] : null;

  // Filter riwayat slip
  const filteredSlips = slips.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.period_name.toLowerCase().includes(q) ||
      s.period_key.toLowerCase().includes(q) ||
      (s.published_at && s.published_at.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Slip Gaji Saya
            </h1>
            <Badge variant="primary" dot>
              Resmi & Rahasia
            </Badge>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Akses, tinjau, dan unduh slip gaji resmi PT Kurma Group Indonesia Anda secara berkala.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Privacy Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSalaryVisibility}
            className="text-xs h-9 font-medium"
            leftIcon={isSalaryHidden ? <EyeOff className="w-4 h-4 text-text-muted" /> : <Eye className="w-4 h-4 text-primary" />}
          >
            {isSalaryHidden ? 'Tampilkan Nominal Gaji' : 'Sembunyikan Nominal'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSlips}
            disabled={loading}
            className="text-xs h-9 font-medium"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Perbarui
          </Button>
        </div>
      </div>

      {/* Security & Confidentiality Notice Banner */}
      <div className="p-3.5 rounded-lg bg-primary-soft/40 border border-primary/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary leading-relaxed">
          <span className="font-semibold text-text-primary">Kerahasiaan Dokumen:</span> Informasi slip gaji dan nominal kompensasi merupakan dokumen rahasia antara Anda dan manajemen PT Kurma Group Indonesia. Gunakan tombol mata di atas untuk menyamarkan nominal saat berada di tempat umum.
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && slips.length === 0 ? (
        <div className="space-y-4">
          <div className="h-48 rounded-xl border border-border-default bg-surface animate-pulse" />
          <div className="h-64 rounded-xl border border-border-default bg-surface animate-pulse" />
        </div>
      ) : latestSlip ? (
        <>
          {/* 1. KARTU UTAMA: SLIP GAJI TERBARU (HIGHLIGHT BANNER) */}
          <Card className="border-border-default shadow-xs bg-surface overflow-hidden">
            <CardHeader className="py-3.5 px-4 sm:px-6 border-b border-border-default bg-subtle/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">Slip Gaji Periode Terbaru</CardTitle>
                    <Badge variant="success" dot>Telah Diterbitkan</Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {latestSlip.period_name} • Rilis: {latestSlip.published_at || 'Baru saja'}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintSlip(latestSlip)}
                  leftIcon={<Printer className="w-4 h-4" />}
                  className="text-xs h-8"
                >
                  Cetak / Unduh PDF
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenSlipModal(latestSlip)}
                  leftIcon={<FileText className="w-4 h-4" />}
                  className="text-xs h-8"
                >
                  Lihat Rincian Lengkap
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* Highlight Nominal Take Home Pay */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-primary-soft/30 border border-primary/20 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                      Total Diterima (Take Home Pay)
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mt-1.5 tabular-nums">
                      {isSalaryHidden ? 'Rp ••••••••' : formatRupiah(latestSlip.net_pay)}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-3">
                    Ditransfer ke rekening {latestSlip.details?.bank_name || 'BCA'} •••{String(latestSlip.details?.bank_account_number || '').slice(-4) || '••••'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-subtle border border-border-default flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                      Komponen Pendapatan Kotor
                    </span>
                    <div className="text-lg sm:text-xl font-bold text-text-primary mt-1.5 tabular-nums">
                      {isSalaryHidden ? 'Rp ••••••••' : formatRupiah(latestSlip.gross_pay)}
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary mt-3 space-y-1">
                    <div className="flex justify-between">
                      <span>Gaji Pokok:</span>
                      <span className="font-semibold text-text-primary">
                        {isSalaryHidden ? '••••••••' : formatRupiah(latestSlip.details?.earned_basic_salary || latestSlip.details?.basic_salary || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uang Makan ({latestSlip.details?.eligible_meal_days ?? latestSlip.details?.present_days ?? 0} hari):</span>
                      <span className="font-semibold text-text-primary">
                        {isSalaryHidden ? '••••••••' : formatRupiah(latestSlip.details?.meal_allowance || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-subtle border border-border-default flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                      Total Potongan & Presensi
                    </span>
                    <div className="text-lg sm:text-xl font-bold text-text-primary mt-1.5 tabular-nums">
                      {isSalaryHidden ? 'Rp ••••••••' : (latestSlip.total_deductions > 0 ? `-${formatRupiah(latestSlip.total_deductions)}` : 'Rp 0')}
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary mt-3 space-y-1">
                    <div className="flex justify-between">
                      <span>Kehadiran Efektif:</span>
                      <span className="font-semibold text-text-primary">
                        {latestSlip.details?.present_days || 0} / 26 Hari
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status Hitungan:</span>
                      <span className="font-semibold text-text-primary">
                        {latestSlip.details?.is_prorated ? 'Prorata' : 'Tetap (Utuh)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="sm:hidden flex flex-col gap-2 pt-2 border-t border-border-default">
                <Button
                  variant="primary"
                  className="w-full text-xs h-9 justify-center"
                  onClick={() => handleOpenSlipModal(latestSlip)}
                  leftIcon={<FileText className="w-4 h-4" />}
                >
                  Lihat Rincian Lengkap
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs h-9 justify-center"
                  onClick={() => handlePrintSlip(latestSlip)}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Cetak / Unduh PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. TABEL RIWAYAT ARSIP SLIP GAJI */}
          <Card className="border-border-default shadow-xs bg-surface">
            <CardHeader className="py-3.5 px-4 sm:px-6 border-b border-border-default flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Riwayat Arsip Slip Gaji</CardTitle>
                <p className="text-xs text-text-muted mt-0.5">
                  Daftar seluruh slip gaji yang pernah diterbitkan untuk akun Anda ({slips.length} periode tersimpan)
                </p>
              </div>

              <div className="w-full sm:w-64">
                <div className="relative">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari bulan atau periode..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-border-default bg-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredSlips.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <FileText className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm font-medium text-text-primary">Tidak Ada Data Ditemukan</p>
                  <p className="text-xs text-text-muted mt-1">
                    {searchQuery ? 'Coba gunakan kata kunci pencarian yang berbeda.' : 'Belum ada riwayat slip gaji yang diterbitkan.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-subtle text-text-muted font-semibold uppercase text-[10px] tracking-wider border-b border-border-default">
                      <tr>
                        <th className="py-3 px-4 sm:px-6">Periode Penggajian</th>
                        <th className="py-3 px-4">Tanggal Rilis</th>
                        <th className="py-3 px-4 text-right">Gaji Pokok</th>
                        <th className="py-3 px-4 text-right">Uang Makan</th>
                        <th className="py-3 px-4 text-right">Potongan</th>
                        <th className="py-3 px-4 text-right">Take Home Pay</th>
                        <th className="py-3 px-4 sm:px-6 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {filteredSlips.map((slip) => {
                        const snap = slip.details || {};
                        return (
                          <tr key={slip.id} className="hover:bg-subtle/50 transition-colors">
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="font-semibold text-text-primary text-xs sm:text-sm">
                                {slip.period_name}
                              </div>
                              <div className="text-[11px] text-text-muted mt-0.5">
                                Cut-off: {slip.start_date || '-'} s/d {slip.end_date || '-'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                <span>{slip.published_at || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-medium text-text-primary tabular-nums">
                              {isSalaryHidden ? '••••••••' : formatRupiah(snap.earned_basic_salary || snap.basic_salary || 0)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-medium text-text-primary tabular-nums">
                              {isSalaryHidden ? '••••••••' : formatRupiah(snap.meal_allowance || 0)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-medium text-text-primary tabular-nums">
                              {isSalaryHidden ? '••••••••' : (slip.total_deductions > 0 ? `-${formatRupiah(slip.total_deductions)}` : 'Rp 0')}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-primary tabular-nums">
                              {isSalaryHidden ? 'Rp ••••••••' : formatRupiah(slip.net_pay)}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenSlipModal(slip)}
                                  className="text-xs h-7 px-2.5 font-medium"
                                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                                >
                                  Rincian
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePrintSlip(slip)}
                                  className="text-xs h-7 px-2 font-medium"
                                  title="Cetak / Simpan PDF"
                                >
                                  <Printer className="w-3.5 h-3.5 text-text-secondary" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Empty State: Belum Ada Slip Diterbitkan */
        <Card className="border-border-default shadow-xs bg-surface">
          <CardContent className="py-16 px-6 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-subtle border border-border-default flex items-center justify-center mx-auto text-text-muted">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-primary">
                Belum Ada Slip Gaji Diterbitkan
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
                Slip gaji resmi bulanan Anda akan muncul otomatis di sini segera setelah dirilis oleh manajemen HR & Finance PT Kurma Group Indonesia.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSlips}
                className="text-xs h-9 font-medium"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Cek Ulang
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL PREVIEW SLIP GAJI */}
      <Modal
        isOpen={isModalOpen && Boolean(selectedSlip)}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlip(null);
        }}
        title={`Slip Gaji Resmi - ${selectedSlip?.period_name || 'Kurma Group'}`}
        size="lg"
      >
        {selectedSlip && (
          <div className="space-y-4 text-xs">
            {/* Header Kurma Group */}
            <div className="p-4 rounded-lg bg-subtle border border-border-default flex items-start justify-between gap-3">
              <div>
                <span className="font-extrabold text-sm text-primary tracking-tight block">
                  PT KURMA GROUP INDONESIA
                </span>
                <p className="text-[11px] text-text-muted mt-0.5">
                  HR Management & Payroll System • Dokumen Sah & Rahasia
                </p>
                <p className="text-[11px] text-text-secondary mt-1">
                  Periode: <strong className="text-text-primary">{selectedSlip.period_name}</strong> ({selectedSlip.start_date || '-'} s/d {selectedSlip.end_date || '-'})
                </p>
              </div>

              <div className="text-right">
                <Badge variant="success" dot>Resmi Diterbitkan</Badge>
                <p className="text-[10px] text-text-muted mt-1">
                  Rilis: {selectedSlip.published_at || '-'}
                </p>
              </div>
            </div>

            {/* Identitas Karyawan */}
            <div className="p-3.5 rounded-lg border border-border-default bg-surface grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-muted block text-[11px]">Nama Karyawan:</span>
                <span className="font-semibold text-text-primary">{selectedSlip.details?.name || user?.name}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">ID Karyawan / NIK:</span>
                <span className="font-semibold text-text-primary">{selectedSlip.details?.employee_id || user?.employee?.employee_id || '-'}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Departemen & Posisi:</span>
                <span className="font-medium text-text-secondary">
                  {selectedSlip.details?.department || '-'} • {selectedSlip.details?.job_position || '-'}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Rekening Pembayaran:</span>
                <span className="font-medium text-text-secondary">
                  {selectedSlip.details?.bank_name || 'BCA'} • No. {selectedSlip.details?.bank_account_number || '-'}
                </span>
              </div>
            </div>

            {/* Rincian Komponen */}
            <div className="border border-border-default rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-subtle text-text-muted font-semibold uppercase text-[10px] tracking-wider border-b border-border-default">
                  <tr>
                    <th className="py-2 px-3 text-left">Komponen Gaji</th>
                    <th className="py-2 px-3 text-left">Keterangan</th>
                    <th className="py-2 px-3 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-text-primary">Gaji Pokok</td>
                    <td className="py-2.5 px-3 text-text-secondary">
                      {selectedSlip.details?.is_prorated ? `Bulanan Prorata (${selectedSlip.details?.present_days}/26 hari)` : 'Bulanan Tetap (100% Utuh)'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-text-primary tabular-nums">
                      {formatRupiah(selectedSlip.details?.earned_basic_salary || selectedSlip.details?.basic_salary || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-text-primary">Uang Makan Aktual</td>
                    <td className="py-2.5 px-3 text-text-secondary">
                      {selectedSlip.details?.eligible_meal_days ?? selectedSlip.details?.present_days ?? 0} hari hadir &times; Rp 11.000
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-text-primary tabular-nums">
                      {formatRupiah(selectedSlip.details?.meal_allowance || 0)}
                    </td>
                  </tr>

                  {/* Potongan */}
                  {selectedSlip.details?.is_prorated && (selectedSlip.details?.prorata_deduction || 0) > 0 && (
                    <tr className="bg-subtle/30">
                      <td className="py-2.5 px-3 text-text-secondary">Potongan Prorata</td>
                      <td className="py-2.5 px-3 text-text-muted">{selectedSlip.details?.unattended_days || 0} hari belum aktif</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-primary tabular-nums">
                        -{formatRupiah(selectedSlip.details?.prorata_deduction)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-subtle/30">
                    <td className="py-2.5 px-3 text-text-secondary">Potongan Uang Makan</td>
                    <td className="py-2.5 px-3 text-text-muted">
                      {(selectedSlip.details?.unattended_days || 0) + (selectedSlip.details?.late_over_15_days || 0)} hari tidak memenuhi syarat
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-danger tabular-nums">
                      -{formatRupiah(selectedSlip.details?.meal_deduction || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Take Home Pay Banner */}
            <div className="p-3.5 rounded-lg bg-primary-soft/40 border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                  Total Diterima (Take Home Pay)
                </span>
                <span className="text-[11px] text-text-muted">
                  Sudah ditransfer langsung ke rekening terdaftar
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-primary tabular-nums">
                {formatRupiah(selectedSlip.net_pay)}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-default">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedSlip(null);
                }}
                className="text-xs h-9"
              >
                Tutup
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handlePrintSlip(selectedSlip)}
                className="text-xs h-9"
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Cetak / Simpan PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
