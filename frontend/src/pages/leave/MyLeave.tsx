import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmFooter } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { 
  Plus, 
  Calendar, 
  Clock, 
  FileText, 
  Loader2, 
  HeartPulse, 
  ArrowLeftRight, 
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import api from '../../lib/api';

export function MyLeave() {
  const [activeTab, setActiveTab] = useState<'leaves' | 'swaps'>('leaves');
  
  // States for Leave Requests
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    type: 'sick',
    start_date: '',
    end_date: '',
    reason: ''
  });

  // States for Workday Swaps (Ganti Hari Kerja)
  const [isSwapModalOpen, setSwapModalOpen] = useState(false);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [loadingSwaps, setLoadingSwaps] = useState(true);
  const [submittingSwap, setSubmittingSwap] = useState(false);
  const [swapFormData, setSwapFormData] = useState({
    original_date: '',
    replacement_date: '',
    reason: ''
  });

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

  useEffect(() => {
    fetchLeaves();
    fetchSwaps();
  }, []);

  const handleLeaveSubmit = async () => {
    if (!leaveFormData.start_date || !leaveFormData.end_date || !leaveFormData.reason) {
      alert('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }
    
    setSubmittingLeave(true);
    try {
      await api.post('/leaves', leaveFormData);
      alert('Pengajuan perizinan kerja berhasil dikirim.');
      setLeaveModalOpen(false);
      setLeaveFormData({ type: 'sick', start_date: '', end_date: '', reason: '' });
      fetchLeaves();
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Gagal mengajukan izin');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleSwapSubmit = async () => {
    if (!swapFormData.original_date || !swapFormData.replacement_date || !swapFormData.reason) {
      alert('Mohon lengkapi tanggal tidak masuk, tanggal pengganti, dan alasan.');
      return;
    }

    if (swapFormData.original_date === swapFormData.replacement_date) {
      alert('Tanggal pengganti tidak boleh sama dengan tanggal izin tidak masuk.');
      return;
    }

    setSubmittingSwap(true);
    try {
      await api.post('/workday-swaps', swapFormData);
      alert('Pengajuan ganti hari kerja berhasil dikirim dan menunggu persetujuan HR.');
      setSwapModalOpen(false);
      setSwapFormData({ original_date: '', replacement_date: '', reason: '' });
      fetchSwaps();
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Gagal mengajukan ganti hari kerja.');
    } finally {
      setSubmittingSwap(false);
    }
  };

  const handleCancelSwap = async (id: number) => {
    if (!confirm('Batalkan pengajuan ganti hari kerja ini?')) return;
    try {
      await api.delete(`/workday-swaps/${id}`);
      alert('Pengajuan ganti hari kerja berhasil dibatalkan.');
      fetchSwaps();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal membatalkan permohonan.');
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'sick':
        return 'Izin Sakit';
      case 'event':
        return 'Izin Ada Acara';
      case 'family':
        return 'Izin Keperluan Keluarga';
      case 'urgent':
        return 'Izin Mendesak';
      case 'other':
        return 'Izin Lainnya';
      default:
        return type === 'annual' ? 'Izin Keperluan' : type;
    }
  };

  const sickCount = leaves.filter(l => l.type === 'sick').length;
  const otherCount = leaves.filter(l => l.type !== 'sick').length;
  const approvedLeavesCount = leaves.filter(l => l.status === 'approved').length;
  const pendingSwapsCount = swaps.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1 text-text-primary">Perizinan & Ganti Hari Kerja</h1>
          <p className="text-body text-text-secondary">
            Kelola izin tidak masuk kerja (izin sakit, ada acara, dll) atau ajukan tukar/ganti hari kerja ke akhir pekan.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'leaves' ? (
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setLeaveModalOpen(true)}>
              Ajukan Izin
            </Button>
          ) : (
            <Button variant="primary" leftIcon={<ArrowLeftRight className="w-4 h-4" />} onClick={() => setSwapModalOpen(true)}>
              Ajukan Ganti Hari
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border-default space-x-1">
        <button
          onClick={() => setActiveTab('leaves')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'leaves'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Pengajuan Izin Kerja ({leaves.length})
        </button>
        <button
          onClick={() => setActiveTab('swaps')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'swaps'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Pengajuan Ganti Hari Kerja ({swaps.length})
          {pendingSwapsCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
              {pendingSwapsCount} Menunggu
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PENGAJUAN IZIN REGULER */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary-soft border-primary/20">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                <h3 className="text-text-secondary text-label mb-2">Total Izin Diajukan</h3>
                <div className="flex items-end justify-center gap-2">
                  <span className="text-display text-primary">{leaves.length}</span>
                  <span className="text-body text-text-secondary mb-1">Tiket</span>
                </div>
                <p className="text-caption text-text-muted mt-2">{approvedLeavesCount} disetujui atasan</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  Izin Sakit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-display text-text-primary">{sickCount}</p>
                <p className="text-caption text-text-secondary mt-1">Ketidakhadiran karena kondisi kesehatan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  Izin Acara & Keperluan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-display text-text-primary">{otherCount}</p>
                <p className="text-caption text-text-secondary mt-1">Acara pribadi, keperluan keluarga & lainnya</p>
              </CardContent>
            </Card>
          </div>

          {/* Table of Leaves */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pengajuan Izin Kerja</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="border-0 shadow-none rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal Pengajuan</TableHead>
                    <TableHead>Jenis Izin</TableHead>
                    <TableHead>Rentang Waktu</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {loadingLeaves ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                        <p className="text-text-secondary mt-2">Memuat riwayat perizinan...</p>
                      </TableCell>
                    </TableRow>
                  ) : leaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                        Belum ada riwayat pengajuan izin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaves.map((leave: any) => (
                      <TableRow key={leave.id}>
                        <TableCell>{new Date(leave.created_at).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          {getLeaveTypeLabel(leave.type)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-slate-700">{leave.start_date}</span>
                          <span className="text-slate-400 mx-1.5">s/d</span>
                          <span className="font-medium text-slate-700">{leave.end_date}</span>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-xs truncate text-slate-600" title={leave.reason}>{leave.reason}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}>
                            {leave.status === 'approved' ? 'Disetujui' : leave.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: PENGAJUAN GANTI HARI KERJA (WORKDAY SWAP) */}
      {activeTab === 'swaps' && (
        <div className="space-y-6">
          {/* Explanation Info Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
            <p className="font-bold text-sm text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-blue-600" />
              Ketentuan Pengajuan Ganti Hari Kerja (Tukar Hari):
            </p>
            <p className="leading-relaxed text-blue-800/90 dark:text-blue-300/90">
              • Jika Anda berhalangan hadir di hari kerja reguler (contoh: <strong>Senin</strong> tidak bisa masuk), Anda dapat mengajukan ganti hari bekerja di hari libur akhir pekan Anda (<strong>Sabtu</strong> atau <strong>Minggu</strong>).<br />
              • <strong>Setelah disetujui HR</strong>: Hari asal tidak dipotong gaji, dan hari pengganti menjadi hari wajib masuk kerja (wajib scan presensi dan berhak mendapatkan uang makan).
            </p>
          </div>

          {/* Table of Swaps */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Riwayat Pengajuan Ganti Hari Kerja</CardTitle>
                <p className="text-xs text-text-muted mt-1">Daftar permohonan pertukaran hari kerja dan status persetujuan HR.</p>
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setSwapModalOpen(true)}
              >
                Ajukan Baru
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="border-0 shadow-none rounded-none">
                <TableHeader>
                  <TableRow>
                    <TableHead>Hari Izin (Tidak Masuk)</TableHead>
                    <TableHead>Hari Pengganti (Wajib Masuk)</TableHead>
                    <TableHead>Alasan Penggantian</TableHead>
                    <TableHead>Status Persetujuan</TableHead>
                    <TableHead>Keterangan HR</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {loadingSwaps ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                        <p className="text-text-secondary mt-2">Memuat riwayat ganti hari...</p>
                      </TableCell>
                    </TableRow>
                  ) : swaps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                        Belum ada riwayat pengajuan ganti hari kerja.
                      </TableCell>
                    </TableRow>
                  ) : (
                    swaps.map((swap: any) => (
                      <TableRow key={swap.id}>
                        <TableCell>
                          <div>
                            <span className="font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs">
                              {swap.original_day}, {swap.original_date}
                            </span>
                            <p className="text-[10px] text-text-muted mt-0.5">Hari tidak masuk kerja</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                              {swap.replacement_day}, {swap.replacement_date}
                            </span>
                            <p className="text-[10px] text-text-muted mt-0.5">Hari pengganti masuk kerja</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-xs text-xs text-text-primary" title={swap.reason}>
                            {swap.reason}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={swap.status === 'approved' ? 'success' : swap.status === 'rejected' ? 'danger' : 'warning'}>
                            {swap.status === 'approved' ? 'Disetujui HR' : swap.status === 'rejected' ? 'Ditolak' : 'Menunggu Persetujuan'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-text-muted">
                            {swap.status === 'rejected' && swap.rejection_reason 
                              ? <span className="text-rose-600 font-medium">{swap.rejection_reason}</span>
                              : swap.approved_by_name ? `Disetujui oleh: ${swap.approved_by_name}` : '-'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          {swap.status === 'pending' && (
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="text-xs text-rose-600 hover:bg-rose-50"
                              onClick={() => handleCancelSwap(swap.id)}
                            >
                              Batalkan
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Ajukan Izin Reguler */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Form Pengajuan Izin Kerja"
        footer={<ConfirmFooter onCancel={() => setLeaveModalOpen(false)} onConfirm={handleLeaveSubmit} confirmText="Kirim Pengajuan Izin" isLoading={submittingLeave} />}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-label text-text-primary">Jenis Izin <span className="text-danger">*</span></label>
            <select 
              className="w-full h-10 px-3 rounded-sm border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring text-xs font-medium"
              value={leaveFormData.type}
              onChange={(e) => setLeaveFormData({...leaveFormData, type: e.target.value})}
            >
              <option value="sick">Izin Sakit</option>
              <option value="event">Izin Ada Acara Pribadi / Undangan</option>
              <option value="family">Izin Keperluan Keluarga</option>
              <option value="urgent">Izin Keperluan Mendesak / Darurat</option>
              <option value="other">Izin Lainnya</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Tanggal Mulai" 
              type="date" 
              required 
              value={leaveFormData.start_date}
              onChange={(e) => setLeaveFormData({...leaveFormData, start_date: e.target.value})}
            />
            <Input 
              label="Tanggal Selesai" 
              type="date" 
              required 
              value={leaveFormData.end_date}
              onChange={(e) => setLeaveFormData({...leaveFormData, end_date: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-label text-text-primary">Alasan Izin <span className="text-danger">*</span></label>
            <textarea 
              className="w-full p-3 rounded-sm border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring h-24 resize-none text-xs"
              placeholder="Tuliskan alasan perizinan secara rinci..."
              required
              value={leaveFormData.reason}
              onChange={(e) => setLeaveFormData({...leaveFormData, reason: e.target.value})}
            ></textarea>
          </div>
        </div>
      </Modal>

      {/* Modal Ajukan Ganti Hari Kerja (Workday Swap) */}
      <Modal
        isOpen={isSwapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        title="Form Pengajuan Ganti Hari Kerja (Tukar Hari)"
        footer={<ConfirmFooter onCancel={() => setSwapModalOpen(false)} onConfirm={handleSwapSubmit} confirmText="Kirim Pengajuan Ganti Hari" isLoading={submittingSwap} />}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-900 dark:text-amber-200">
            <strong>Petunjuk:</strong> Pilih tanggal hari kerja Anda yang berhalangan masuk (misal Senin), lalu tentukan tanggal hari pengganti Anda masuk kerja (Sabtu atau Minggu).
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-text-primary">Hari Tidak Masuk (Izin) <span className="text-danger">*</span></label>
              <input 
                type="date" 
                className="w-full h-10 px-3 rounded-lg border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring text-xs"
                value={swapFormData.original_date}
                onChange={(e) => setSwapFormData({...swapFormData, original_date: e.target.value})}
                required
              />
              <span className="text-[10px] text-text-muted">Hari reguler yang tidak bisa Anda masuki</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-primary">Hari Pengganti (Masuk) <span className="text-danger">*</span></label>
              <input 
                type="date" 
                className="w-full h-10 px-3 rounded-lg border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring text-xs"
                value={swapFormData.replacement_date}
                onChange={(e) => setSwapFormData({...swapFormData, replacement_date: e.target.value})}
                required
              />
              <span className="text-[10px] text-text-muted">Hari libur akhir pekan pengganti</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Alasan Penggantian Hari <span className="text-danger">*</span></label>
            <textarea 
              className="w-full p-3 rounded-lg border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring h-24 resize-none text-xs"
              placeholder="Contoh: Hari Senin ada keperluan pengurusan berkas penting, sehingga hari kerja diganti masuk pada hari Minggu..."
              value={swapFormData.reason}
              onChange={(e) => setSwapFormData({...swapFormData, reason: e.target.value})}
              required
            ></textarea>
          </div>
        </div>
      </Modal>
    </div>
  );
}
