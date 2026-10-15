import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Save, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Calendar,
  MessageSquare,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface ReportEntry {
  id?: number;
  row_order: number;
  time_start: string;
  time_end: string;
  activity: string;
  output_result: string;
  status: 'done' | 'in_progress' | 'pending' | 'blocked';
  notes: string;
}

interface DailyReportData {
  id: number | null;
  report_date: string;
  department_name?: string;
  job_position_name?: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'revision_requested';
  submitted_at?: string;
  overall_feedback?: string;
  summary_notes?: string;
  entries: ReportEntry[];
  reviews?: Array<{
    action: string;
    comments: string;
    created_at: string;
    reviewer?: { name: string };
  }>;
}

export function DailyReport() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [report, setReport] = useState<DailyReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [validationErrors, setValidationErrors] = useState<Record<number, Record<string, string>>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cek apakah portal karyawan mobile menampilkan bottom nav (h-16 di bottom-0)
  const isUserPortalMobile = !user?.roles?.some((r: any) => 
    ['super-admin', 'owner', 'direksi', 'hr-manager', 'hr'].includes(typeof r === 'string' ? r : r?.name)
  );

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  const fetchReport = async (date: string) => {
    setIsLoading(true);
    setValidationErrors({});
    try {
      const res = await api.get(`/daily-reports/today?date=${date}`);
      setReport(res.data);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to load daily report:', err);
      setFeedbackMsg({ type: 'error', text: 'Gagal memuat daily report untuk tanggal ini.' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const handleEntryChange = (index: number, field: keyof ReportEntry, value: any) => {
    if (!report) return;

    const newEntries = [...report.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };

    setReport({ ...report, entries: newEntries });
    setSaveStatus('dirty');

    // Hapus pesan error jika pengguna mulai mengisi kolom yang bersangkutan
    if (validationErrors[index]?.[field]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        if (copy[index]) {
          const rowErrors = { ...copy[index] };
          delete rowErrors[field];
          if (Object.keys(rowErrors).length === 0) {
            delete copy[index];
          } else {
            copy[index] = rowErrors;
          }
        }
        return copy;
      });
    }
  };

  const handleAddRow = () => {
    if (!report) return;

    const lastEntry = report.entries[report.entries.length - 1];
    const newEntry: ReportEntry = {
      row_order: report.entries.length + 1,
      time_start: lastEntry?.time_end || '08:00',
      time_end: '',
      activity: '',
      output_result: '',
      status: 'done',
      notes: '',
    };

    setReport({
      ...report,
      entries: [...report.entries, newEntry],
    });
    setSaveStatus('dirty');
  };

  const handleDeleteRow = (index: number) => {
    if (!report) return;
    if (report.entries.length <= 1) {
      handleEntryChange(0, 'activity', '');
      handleEntryChange(0, 'output_result', '');
      handleEntryChange(0, 'notes', '');
      return;
    }

    const newEntries = report.entries
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, row_order: i + 1 }));

    setReport({ ...report, entries: newEntries });
    setSaveStatus('dirty');

    // Sesuaikan posisi validation errors
    setValidationErrors((prev) => {
      const copy: Record<number, Record<string, string>> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const numKey = Number(key);
        if (numKey < index) {
          copy[numKey] = val;
        } else if (numKey > index) {
          copy[numKey - 1] = val;
        }
      });
      return copy;
    });
  };

  const handleDuplicateRow = (index: number) => {
    if (!report) return;

    const target = report.entries[index];
    const duplicated: ReportEntry = {
      ...target,
      id: undefined,
      row_order: index + 2,
    };

    const newEntries = [...report.entries];
    newEntries.splice(index + 1, 0, duplicated);
    const reindexed = newEntries.map((item, i) => ({ ...item, row_order: i + 1 }));

    setReport({ ...report, entries: reindexed });
    setSaveStatus('dirty');
  };

  const handleApplyTemplate = () => {
    if (!report) return;

    const deptCode = user?.employee?.current_assignment?.department?.code || '';
    let templateRows: Partial<ReportEntry>[] = [];

    if (deptCode === 'HRB') {
      templateRows = [
        { time_start: '08:00', time_end: '10:00', activity: 'Riset tren formula dan testimoni produk herbal kompetitor', output_result: 'Dokumen riset 3 kompetitor', status: 'done' },
        { time_start: '10:00', time_end: '12:00', activity: 'Drafting copywriting materi edukasi madu dan suplemen herbal', output_result: '2 naskah landing page', status: 'done' },
        { time_start: '13:00', time_end: '14:30', activity: 'Review performa iklan kampanye harian dan optimalisasi CPA', output_result: 'Laporan ROAS kampanye', status: 'done' },
        { time_start: '14:30', time_end: '16:00', activity: 'Koordinasi pengiriman sampel riset dan rekap feedback pelanggan', output_result: 'Terkirim 5 sampel', status: 'done' },
      ];
    } else if (deptCode === 'FSH') {
      templateRows = [
        { time_start: '08:00', time_end: '10:00', activity: 'Analisis katalog fashion trending pasar Malaysia (MY) dan Filipina (PH)', output_result: '10 SKU trending terpilih', status: 'done' },
        { time_start: '10:00', time_end: '12:00', activity: 'Produksi variasi teks copywriting promosi hijab atau fashion muslim', output_result: '5 angle iklan disiapkan', status: 'done' },
        { time_start: '13:00', time_end: '14:30', activity: 'Monitoring pesanan marketplace internasional dan koordinasi supply', output_result: 'Zero pending dispatch', status: 'done' },
        { time_start: '14:30', time_end: '16:00', activity: 'Evaluasi konversi checkout harian per negara', output_result: 'Dashboard metrik diperbarui', status: 'done' },
      ];
    } else if (deptCode === 'SPV') {
      templateRows = [
        { time_start: '08:00', time_end: '10:00', activity: 'Review video tren dan audio viral Shopee Video hari ini', output_result: 'List 5 sound dan hook viral', status: 'done' },
        { time_start: '10:00', time_end: '12:00', activity: 'Produksi rekaman dan live demo produk studio Shopee Video', output_result: '4 draft video master', status: 'done' },
        { time_start: '13:00', time_end: '14:30', activity: 'Editing video, subtitle, thumbnail, dan penautan produk', output_result: '4 video siap tayang', status: 'done' },
        { time_start: '14:30', time_end: '16:00', activity: 'Analisis impresi video, CTR keranjang kuning, dan GMV harian', output_result: 'Laporan harian video creator', status: 'done' },
      ];
    } else {
      templateRows = [
        { time_start: '08:00', time_end: '10:00', activity: 'Monitoring rekap absensi harian dan verifikasi kehadiran tim', output_result: 'Rekap kehadiran selesai', status: 'done' },
        { time_start: '10:00', time_end: '12:00', activity: 'Pemeriksaan berkas pengajuan izin dan cuti serta administrasi staf', output_result: 'Semua tiket izin diproses', status: 'done' },
        { time_start: '13:00', time_end: '14:30', activity: 'Review Daily Report staf divisi dan persiapan umpan balik catatan', output_result: 'Catatan feedback disiapkan', status: 'done' },
        { time_start: '14:30', time_end: '16:00', activity: 'Penyusunan laporan operasional harian kantor Kurma Group', output_result: 'Laporan harian final', status: 'done' },
      ];
    }

    const filledEntries: ReportEntry[] = templateRows.map((t, idx) => ({
      row_order: idx + 1,
      time_start: t.time_start || '09:00',
      time_end: t.time_end || '10:00',
      activity: t.activity || '',
      output_result: t.output_result || '',
      status: (t.status as any) || 'done',
      notes: '',
    }));

    setReport({ ...report, entries: filledEntries });
    setValidationErrors({});
    setSaveStatus('dirty');
  };

  const handleSaveReport = async () => {
    if (!report) return;

    // Validasi lokal: cek apakah ada baris yang belum memiliki deskripsi aktivitas
    const newErrors: Record<number, Record<string, string>> = {};

    report.entries.forEach((entry, idx) => {
      const hasPartialContent = Boolean(
        (entry.output_result && entry.output_result.trim()) ||
        (entry.notes && entry.notes.trim()) ||
        (entry.time_end && entry.time_end.trim())
      );
      if (hasPartialContent && (!entry.activity || !entry.activity.trim())) {
        newErrors[idx] = {
          ...newErrors[idx],
          activity: 'Aktivitas pekerjaan wajib diisi'
        };
      }
    });

    // Jika seluruh baris sama sekali belum diisi
    const filledCount = report.entries.filter(e => e.activity && e.activity.trim()).length;
    if (filledCount === 0 && report.entries.length > 0) {
      newErrors[0] = {
        ...newErrors[0],
        activity: 'Minimal isi satu aktivitas pekerjaan hari ini'
      };
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      setFeedbackMsg({
        type: 'error',
        text: 'Mohon lengkapi kolom aktivitas pekerjaan yang ditandai.'
      });
      return;
    }

    setValidationErrors({});
    setIsSaving(true);
    setSaveStatus('saving');
    setFeedbackMsg(null);

    try {
      const res = await api.post('/daily-reports/draft', {
        report_date: selectedDate,
        entries: report.entries,
        summary_notes: report.summary_notes,
      });

      setReport(res.data.report);
      setSaveStatus('saved');
      setFeedbackMsg({ type: 'success', text: 'Daily Report berhasil disimpan.' });
    } catch (err: any) {
      setSaveStatus('dirty');
      setFeedbackMsg({ 
        type: 'error', 
        text: err.response?.data?.error || 'Gagal menyimpan daily report.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const autoExpand = (e: React.FormEvent<HTMLTextAreaElement>, minHeight: number) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.max(target.scrollHeight, minHeight)}px`;
  };

  const renderSaveStatusIndicator = () => {
    if (isSaving || saveStatus === 'saving') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-text-muted font-medium">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
          <span>Menyimpan...</span>
        </span>
      );
    }

    if (saveStatus === 'dirty') {
      return (
        <Badge variant="warning" dot>
          Belum disimpan
        </Badge>
      );
    }

    return (
      <Badge variant="success" dot>
        Tersimpan
      </Badge>
    );
  };

  const isReadOnly = false;

  return (
    <div className={`space-y-5 animate-in fade-in duration-200 ${isUserPortalMobile ? 'pb-36' : 'pb-24'} md:pb-6`}>
      {/* 1. Header Halaman */}
      <Card className="border-border-default shadow-xs bg-surface">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Judul & Deskripsi Satu Kalimat */}
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                  Daily Report
                </h1>
              </div>
              <p className="text-sm text-text-secondary mt-1">
                Catat pekerjaan hari ini, lalu simpan.
              </p>
            </div>

            {/* Kontrol Tanggal & Satu Indikator Status Simpan */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Input Tanggal dengan Label "Tanggal" & Tepat Satu Ikon Kalender (Format dd/mm/yyyy) */}
              <div className="relative inline-flex items-center gap-2 bg-subtle border border-border-default hover:border-primary/50 rounded-md px-3 py-1.5 transition-colors group cursor-pointer">
                <Calendar className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors shrink-0" />
                <label htmlFor="report-date" className="text-xs font-medium text-text-secondary cursor-pointer">
                  Tanggal:
                </label>
                <span className="text-xs font-semibold text-text-primary tabular-nums">
                  {formatDateIndo(selectedDate)}
                </span>
                <input
                  id="report-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Pilih tanggal laporan"
                />
              </div>

              {/* Satu Indikator Status Simpan Bergantian Sesuai Keadaan */}
              <div className="flex items-center">
                {renderSaveStatusIndicator()}
              </div>

              {/* Action Buttons Desktop */}
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyTemplate}
                  leftIcon={<Sparkles className="w-4 h-4 text-text-muted" />}
                  title="Isi otomatis contoh pekerjaan divisi"
                  className="h-9 text-xs"
                >
                  Pasang Template Divisi
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveReport}
                  disabled={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                  className="h-9 text-xs font-medium"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Laporan'}
                </Button>
              </div>
            </div>
          </div>

          {/* Tombol Aksi Tambahan di Mobile Header */}
          <div className="mt-3 pt-3 border-t border-border-default flex sm:hidden items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyTemplate}
              leftIcon={<Sparkles className="w-4 h-4 text-text-muted" />}
              className="w-full text-xs h-9 justify-center"
            >
              Pasang Template Divisi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className={`p-3 rounded-md text-xs font-medium flex items-center justify-between ${
          feedbackMsg.type === 'success' 
            ? 'bg-success-soft text-success-fg border border-success-border' 
            : 'bg-danger-soft text-danger-fg border border-danger-border'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success-fg" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-danger-fg" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedbackMsg(null)} 
            aria-label="Tutup notifikasi" 
            className="p-1 rounded text-text-muted hover:text-text-primary transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Catatan & Masukan dari Atasan (Kotak Tersendiri di Atas Tabel) */}
      {report?.overall_feedback && (
        <Card className="border-border-default shadow-xs bg-surface">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-subtle text-primary flex items-center justify-center shrink-0 mt-0.5 border border-border-default">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary">Catatan & Masukan dari Atasan</span>
                <Badge variant="neutral">Feedback</Badge>
              </div>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {report.overall_feedback}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Tabel Isian (Desktop Layar Lebar: Muat Penuh Tanpa Scroll Horizontal di >= 1280px) */}
      <div className="hidden md:block bg-surface rounded-lg border border-border-default shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse table-fixed">
          <thead>
            <tr className="bg-subtle border-b border-border-default text-text-muted font-medium text-xs">
              <th className="py-2.5 px-3 w-12 text-center">No</th>
              <th className="py-2.5 px-3 w-[190px]">Waktu</th>
              <th className="py-2.5 px-3 w-[27%]">Aktivitas</th>
              <th className="py-2.5 px-3 w-[25%]">Hasil</th>
              <th className="py-2.5 px-3 w-36">Status</th>
              <th className="py-2.5 px-3">Catatan</th>
              {!isReadOnly && <th className="py-2.5 px-2 w-16 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-text-muted">
                  Memuat data daily report...
                </td>
              </tr>
            ) : report?.entries?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-text-muted">
                  Belum ada baris aktivitas. Klik <strong>Tambah Aktivitas</strong> atau <strong>Pasang Template Divisi</strong>.
                </td>
              </tr>
            ) : (
              report?.entries?.map((entry, index) => (
                <tr key={index} className="hover:bg-subtle/40 transition-colors">
                  {/* No */}
                  <td className="py-2.5 px-3 text-center font-medium text-text-muted align-top pt-3">
                    {index + 1}
                  </td>

                  {/* Waktu: 2 Input Jam Berdampingan Format 24 Jam */}
                  <td className="py-2.5 px-3 align-top">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        aria-label={`Jam mulai aktivitas ${index + 1}`}
                        value={entry.time_start || ''}
                        disabled={isReadOnly}
                        onChange={(e) => handleEntryChange(index, 'time_start', e.target.value)}
                        className="w-[78px] h-8 px-1.5 text-xs rounded border border-border-default bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-subtle tabular-nums transition-colors"
                      />
                      <span className="text-text-muted font-medium">–</span>
                      <input
                        type="time"
                        aria-label={`Jam selesai aktivitas ${index + 1}`}
                        value={entry.time_end || ''}
                        disabled={isReadOnly}
                        onChange={(e) => handleEntryChange(index, 'time_end', e.target.value)}
                        className="w-[78px] h-8 px-1.5 text-xs rounded border border-border-default bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-subtle tabular-nums transition-colors"
                      />
                    </div>
                  </td>

                  {/* Aktivitas (Kotak Isian Bertambah Tinggi Mengikuti Teks) */}
                  <td className="py-2.5 px-3 align-top">
                    <textarea
                      rows={2}
                      aria-label={`Aktivitas ${index + 1}`}
                      value={entry.activity || ''}
                      disabled={isReadOnly}
                      placeholder="Deskripsikan pekerjaan yang dilakukan..."
                      onChange={(e) => handleEntryChange(index, 'activity', e.target.value)}
                      onInput={(e) => autoExpand(e, 38)}
                      className={`w-full p-2 text-xs rounded border bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 resize-y disabled:bg-subtle transition-colors ${
                        validationErrors[index]?.activity 
                          ? 'border-danger focus:ring-danger focus:border-danger' 
                          : 'border-border-default focus:ring-primary focus:border-primary'
                      }`}
                    />
                    {validationErrors[index]?.activity && (
                      <p className="text-[11px] text-danger mt-1 font-medium leading-tight">
                        {validationErrors[index].activity}
                      </p>
                    )}
                  </td>

                  {/* Hasil / Output */}
                  <td className="py-2.5 px-3 align-top">
                    <textarea
                      rows={2}
                      aria-label={`Hasil output aktivitas ${index + 1}`}
                      value={entry.output_result || ''}
                      disabled={isReadOnly}
                      placeholder="Hasil atau output yang dicapai..."
                      onChange={(e) => handleEntryChange(index, 'output_result', e.target.value)}
                      onInput={(e) => autoExpand(e, 38)}
                      className="w-full p-2 text-xs rounded border border-border-default bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-y disabled:bg-subtle transition-colors"
                    />
                  </td>

                  {/* Status: Cukup Lebar Menampilkan Opsi Utuh */}
                  <td className="py-2.5 px-3 align-top">
                    <select
                      aria-label={`Status aktivitas ${index + 1}`}
                      value={entry.status}
                      disabled={isReadOnly}
                      onChange={(e) => handleEntryChange(index, 'status', e.target.value as any)}
                      className="w-full h-8 px-2 text-xs rounded border border-border-default bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-subtle transition-colors cursor-pointer"
                    >
                      <option value="done">Selesai</option>
                      <option value="in_progress">Sedang Proses</option>
                      <option value="pending">Tertunda</option>
                      <option value="blocked">Ada Kendala</option>
                    </select>
                  </td>

                  {/* Catatan */}
                  <td className="py-2.5 px-3 align-top">
                    <textarea
                      rows={2}
                      aria-label={`Catatan kendala aktivitas ${index + 1}`}
                      value={entry.notes || ''}
                      disabled={isReadOnly}
                      placeholder="Kendala atau catatan..."
                      onChange={(e) => handleEntryChange(index, 'notes', e.target.value)}
                      onInput={(e) => autoExpand(e, 38)}
                      className="w-full p-2 text-xs rounded border border-border-default bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-y disabled:bg-subtle transition-colors"
                    />
                  </td>

                  {/* Tombol Aksi Hapus & Duplikat */}
                  {!isReadOnly && (
                    <td className="py-2.5 px-2 text-center align-top pt-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(index)}
                          className="p-1 text-text-muted hover:text-text-primary hover:bg-subtle rounded transition-colors"
                          title="Duplikat baris"
                          aria-label={`Duplikat baris ${index + 1}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(index)}
                          className="p-1 text-text-muted hover:text-danger hover:bg-danger-soft rounded transition-colors"
                          title="Hapus baris"
                          aria-label={`Hapus baris ${index + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Tombol Tambah Aktivitas Tepat di Bawah Baris Terakhir */}
        <div className="p-3 bg-subtle/30 border-t border-border-default flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            leftIcon={<Plus className="w-4 h-4 text-text-muted" />}
            className="text-xs h-8"
          >
            Tambah Aktivitas
          </Button>
          <span className="text-xs text-text-muted">
            {report?.entries?.length || 0} aktivitas terdaftar
          </span>
        </div>

        {/* Catatan Tambahan / Ringkasan Harian Desktop */}
        <div className="p-4 bg-surface border-t border-border-default space-y-1.5">
          <label htmlFor="summary_notes" className="block text-xs font-semibold text-text-primary">
            Catatan Tambahan / Ringkasan Harian
          </label>
          <textarea
            id="summary_notes"
            rows={2}
            value={report?.summary_notes || ''}
            disabled={isReadOnly}
            placeholder="Tuliskan kendala umum, ide pengembangan, atau rangkuman hasil kerja hari ini..."
            onChange={(e) => {
              if (report && !isReadOnly) {
                setReport({ ...report, summary_notes: e.target.value });
                setSaveStatus('dirty');
              }
            }}
            onInput={(e) => autoExpand(e, 44)}
            className="w-full p-2.5 text-xs rounded-md border border-border-default bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-subtle transition-colors"
          />
        </div>
      </div>

      {/* 4. Tampilan Mobile (Kartu Per Aktivitas di Layar HP 360–430px) */}
      <div className="block md:hidden space-y-4">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-text-muted bg-surface rounded-lg border border-border-default">
            Memuat data daily report...
          </div>
        ) : report?.entries?.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-muted bg-surface rounded-lg border border-border-default">
            Belum ada aktivitas tercatat. Klik Tambah Aktivitas di bawah.
          </div>
        ) : (
          report?.entries?.map((entry, index) => (
            <Card key={index} className="border-border-default shadow-xs bg-surface overflow-hidden">
              <CardHeader className="py-2.5 px-4 bg-subtle border-b border-border-default flex flex-row items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  Aktivitas {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicateRow(index)}
                    className="p-1.5 text-text-muted hover:text-text-primary rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label={`Duplikat aktivitas ${index + 1}`}
                    title="Duplikat aktivitas"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(index)}
                    className="p-1.5 text-text-muted hover:text-danger rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label={`Hapus aktivitas ${index + 1}`}
                    title="Hapus aktivitas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3.5">
                {/* Waktu Mulai & Selesai Berdampingan */}
                <div>
                  <span className="block text-xs font-medium text-text-secondary mb-1">
                    Waktu Pengerjaan
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor={`mobile-start-${index}`} className="block text-[11px] text-text-muted mb-0.5">
                        Mulai
                      </label>
                      <input
                        id={`mobile-start-${index}`}
                        type="time"
                        value={entry.time_start || ''}
                        disabled={isReadOnly}
                        onChange={(e) => handleEntryChange(index, 'time_start', e.target.value)}
                        className="w-full h-11 px-3 text-sm rounded-md border border-border-default bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary tabular-nums"
                      />
                    </div>
                    <div>
                      <label htmlFor={`mobile-end-${index}`} className="block text-[11px] text-text-muted mb-0.5">
                        Selesai
                      </label>
                      <input
                        id={`mobile-end-${index}`}
                        type="time"
                        value={entry.time_end || ''}
                        disabled={isReadOnly}
                        onChange={(e) => handleEntryChange(index, 'time_end', e.target.value)}
                        className="w-full h-11 px-3 text-sm rounded-md border border-border-default bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                {/* Aktivitas */}
                <div>
                  <label htmlFor={`mobile-activity-${index}`} className="block text-xs font-medium text-text-secondary mb-1">
                    Aktivitas <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id={`mobile-activity-${index}`}
                    rows={2}
                    value={entry.activity || ''}
                    disabled={isReadOnly}
                    placeholder="Deskripsi pekerjaan yang dilakukan..."
                    onChange={(e) => handleEntryChange(index, 'activity', e.target.value)}
                    onInput={(e) => autoExpand(e, 44)}
                    className={`w-full p-2.5 text-sm rounded-md border bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 transition-colors ${
                      validationErrors[index]?.activity 
                        ? 'border-danger focus:ring-danger focus:border-danger' 
                        : 'border-border-default focus:ring-primary focus:border-primary'
                    }`}
                  />
                  {validationErrors[index]?.activity && (
                    <p className="text-[11px] text-danger mt-1 font-medium leading-tight">
                      {validationErrors[index].activity}
                    </p>
                  )}
                </div>

                {/* Hasil */}
                <div>
                  <label htmlFor={`mobile-output-${index}`} className="block text-xs font-medium text-text-secondary mb-1">
                    Hasil
                  </label>
                  <textarea
                    id={`mobile-output-${index}`}
                    rows={2}
                    value={entry.output_result || ''}
                    disabled={isReadOnly}
                    placeholder="Hasil atau output yang dicapai..."
                    onChange={(e) => handleEntryChange(index, 'output_result', e.target.value)}
                    onInput={(e) => autoExpand(e, 44)}
                    className="w-full p-2.5 text-sm rounded-md border border-border-default bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor={`mobile-status-${index}`} className="block text-xs font-medium text-text-secondary mb-1">
                    Status
                  </label>
                  <select
                    id={`mobile-status-${index}`}
                    value={entry.status}
                    disabled={isReadOnly}
                    onChange={(e) => handleEntryChange(index, 'status', e.target.value as any)}
                    className="w-full h-11 px-3 text-sm rounded-md border border-border-default bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                  >
                    <option value="done">Selesai</option>
                    <option value="in_progress">Sedang Proses</option>
                    <option value="pending">Tertunda</option>
                    <option value="blocked">Ada Kendala</option>
                  </select>
                </div>

                {/* Catatan */}
                <div>
                  <label htmlFor={`mobile-notes-${index}`} className="block text-xs font-medium text-text-secondary mb-1">
                    Catatan
                  </label>
                  <input
                    id={`mobile-notes-${index}`}
                    type="text"
                    value={entry.notes || ''}
                    disabled={isReadOnly}
                    placeholder="Catatan tambahan jika ada..."
                    onChange={(e) => handleEntryChange(index, 'notes', e.target.value)}
                    className="w-full h-11 px-3 text-sm rounded-md border border-border-default bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Tombol Tambah Aktivitas Selebar Layar di Bawah Kartu Terakhir */}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddRow}
          className="w-full h-11 text-sm font-medium justify-center"
          leftIcon={<Plus className="w-4 h-4 text-text-muted" />}
        >
          Tambah Aktivitas
        </Button>

        {/* Ringkasan Harian Mobile */}
        <Card className="border-border-default shadow-xs bg-surface p-4 space-y-1.5">
          <label htmlFor="mobile-summary" className="block text-xs font-semibold text-text-primary">
            Catatan Tambahan / Ringkasan Harian
          </label>
          <textarea
            id="mobile-summary"
            rows={2}
            value={report?.summary_notes || ''}
            disabled={isReadOnly}
            placeholder="Tuliskan kendala umum atau rangkuman kerja hari ini..."
            onChange={(e) => {
              if (report && !isReadOnly) {
                setReport({ ...report, summary_notes: e.target.value });
                setSaveStatus('dirty');
              }
            }}
            onInput={(e) => autoExpand(e, 44)}
            className="w-full p-2.5 text-sm rounded-md border border-border-default bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </Card>
      </div>

      {/* 5. Sticky Bottom Bar di Mobile: Status Simpan & Tombol Simpan Laporan */}
      <div 
        className={`fixed left-0 right-0 z-30 bg-surface/95 backdrop-blur-xs border-t border-border-default p-3 shadow-md md:hidden flex items-center justify-between gap-3 safe-area-pb ${
          isUserPortalMobile ? 'bottom-16' : 'bottom-0'
        }`}
      >
        <div className="flex items-center min-w-0">
          {renderSaveStatusIndicator()}
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSaveReport}
          disabled={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
          className="h-10 px-4 text-xs font-medium shrink-0"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Laporan'}
        </Button>
      </div>
    </div>
  );
}
