import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal, ConfirmFooter } from '../../components/ui/Modal';
import { 
  Clock, 
  Download, 
  Plus, 
  Filter, 
  QrCode, 
  Sunrise, 
  Sunset, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  RefreshCw,
  Upload
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../lib/api';

export function MyAttendance() {
  const [isCorrectionModalOpen, setCorrectionModalOpen] = useState(false);
  const [isScanModalOpen, setScanModalOpen] = useState(false);
  const [scanType, setScanType] = useState<'pagi' | 'sore'>('pagi');
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string; time?: string } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Digital Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  const [correctionData, setCorrectionData] = useState({
    date: '',
    time_in: '',
    time_out: '',
    reason: ''
  });
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Pastikan format pemisah titik dua konsisten (HH:mm:ss WIB)
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds} WIB`);

      setCurrentDate(
        now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    try {
      const response = await api.get('/attendance');
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      setAttendances(list);
    } catch (error) {
      console.error('Error fetching attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  // Find today's attendance record
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendances.find((att: any) => att.date === todayStr);

  const hasCheckedIn = Boolean(todayAttendance?.time_in);
  const hasCheckedOut = Boolean(todayAttendance?.time_out);
  const morningTime = todayAttendance?.time_in ? todayAttendance.time_in.slice(0, 5) : null;
  const afternoonTime = todayAttendance?.time_out ? todayAttendance.time_out.slice(0, 5) : null;
  const isMorningLate = todayAttendance?.status === 'late' || (morningTime && morningTime > '08:15');

  const openScanModal = (type: 'pagi' | 'sore') => {
    setScanType(type);
    setScanResult(null);
    setCameraError(null);
    setScanModalOpen(true);
  };

  const handleCorrectionSubmit = async () => {
    if (!correctionData.date || !correctionData.reason) {
      alert('Tanggal dan Alasan koreksi harus diisi');
      return;
    }
    
    setSubmittingCorrection(true);
    try {
      const response = await api.post('/attendance-corrections', correctionData);
      alert(response.data.message || 'Pengajuan koreksi absensi berhasil dikirim.');
      setCorrectionModalOpen(false);
      setCorrectionData({ date: '', time_in: '', time_out: '', reason: '' });
      fetchAttendances();
    } catch (error: any) {
      console.error('Error submitting correction:', error);
      alert(error.response?.data?.error || 'Gagal mengajukan koreksi');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const handleExport = () => {
    if (attendances.length === 0) {
      alert('Tidak ada data absensi untuk diekspor');
      return;
    }
    const headers = ['Tanggal,Jadwal,Masuk,Pulang,Status'];
    const rows = attendances.map((a: any) => 
      `"${a.date}","08:00-16:00","${a.time_in || '-'}","${a.time_out || '-'}","${a.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Riwayat_Absensi_${new Date().toISOString().slice(0, 7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // Abaikan error saat stop
      }
      scannerRef.current = null;
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    await stopScanner();
    try {
      const response = await api.post('/attendance/scan', { 
        token: decodedText,
        type: scanType 
      });
      const now = new Date();
      const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
      setScanResult({
        type: 'success',
        message: response.data.message || 'Presensi berhasil dicatat!',
        time: nowTime
      });
      fetchAttendances();
    } catch (error: any) {
      setScanResult({
        type: 'error',
        message: error.response?.data?.error || 'Gagal memverifikasi QR Code. Pastikan scan QR aktif di layar kantor.'
      });
    }
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await stopScanner();
      const html5QrCode = new Html5Qrcode('reader-file-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err: any) {
      alert('QR Code tidak terdeteksi pada gambar. Pastikan gambar jelas dan tidak buram.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    let isCancelled = false;

    if (isScanModalOpen && !scanResult) {
      setCameraError(null);
      setIsCameraStarting(true);

      const timer = setTimeout(async () => {
        if (isCancelled) return;
        const readerElem = document.getElementById('reader');
        if (!readerElem) return;

        try {
          const html5QrCode = new Html5Qrcode('reader');
          scannerRef.current = html5QrCode;

          const config = { 
            fps: 10, 
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0
          };

          // Prioritaskan kamera belakang (environment), fallback ke kamera depan/webcam (user)
          try {
            await html5QrCode.start(
              { facingMode: 'environment' },
              config,
              (decodedText) => {
                if (!isCancelled) handleScanSuccess(decodedText);
              },
              () => {}
            );
          } catch (firstErr) {
            console.warn('Kamera belakang tidak tersedia, mencoba kamera depan/webcam:', firstErr);
            await html5QrCode.start(
              { facingMode: 'user' },
              config,
              (decodedText) => {
                if (!isCancelled) handleScanSuccess(decodedText);
              },
              () => {}
            );
          }

          if (!isCancelled) {
            setIsCameraStarting(false);
          }
        } catch (err: any) {
          console.error('Camera startup error:', err);
          if (!isCancelled) {
            setIsCameraStarting(false);
            const msg = err?.toString?.() || '';
            if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
              setCameraError('Izin akses kamera diblokir oleh browser. Silakan klik ikon gembok di sebelah kiri alamat web (URL) browser Anda dan ubah status Kamera menjadi "Izinkan" (Allow).');
            } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
              setCameraError('Tidak ada perangkat kamera yang terdeteksi pada perangkat ini.');
            } else if (msg.includes('NotReadableError')) {
              setCameraError('Kamera sedang digunakan oleh aplikasi lain.');
            } else {
              setCameraError('Tidak dapat membuka kamera. Pastikan browser memiliki izin akses kamera.');
            }
          }
        }
      }, 200);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isScanModalOpen, scanResult, scanType]);

  const calculateDuration = (timeIn?: string, timeOut?: string) => {
    if (!timeIn || !timeOut) return '-';
    try {
      const [hIn, mIn] = timeIn.split(':').map(Number);
      const [hOut, mOut] = timeOut.split(':').map(Number);
      const minStart = hIn * 60 + mIn;
      const minEnd = hOut * 60 + mOut;
      const diff = minEnd - minStart;
      if (diff <= 0) return '-';
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hours} Jam ${mins} Mnt`;
    } catch {
      return '-';
    }
  };

  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Summary counts
  const presentCount = attendances.filter(a => a.status === 'present').length;
  const lateCount = attendances.filter(a => a.status === 'late').length;
  const leaveCount = attendances.filter(a => a.status === 'leave').length;
  const absentCount = attendances.filter(a => a.status === 'absent').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Halaman: Judul, Deskripsi, Tombol Outline, & Baris Info Waktu */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Absensi QR
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Scan QR di layar kantor untuk absen pagi dan sore.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<Download className="w-4 h-4 text-text-muted" />} 
              onClick={handleExport}
              className="h-9 whitespace-nowrap"
            >
              Ekspor
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<Plus className="w-4 h-4 text-text-muted" />} 
              onClick={() => setCorrectionModalOpen(true)}
              className="h-9 whitespace-nowrap"
            >
              Koreksi Absensi
            </Button>
          </div>
        </div>

        {/* Baris Info: Tanggal · Jam Berjalan · Jadwal Kantor */}
        <div className="p-3 rounded-lg bg-surface border border-border-default flex items-center justify-between flex-wrap gap-2 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-muted shrink-0" />
            <span>
              {currentDate || 'Hari ini'} · <strong className="text-text-primary font-semibold tabular-nums">{currentTime || '08:00:00 WIB'}</strong>
            </span>
          </div>
          <span className="text-text-muted">
            Jam kantor <span className="font-medium text-text-primary">08:00–16:00 WIB</span>
          </span>
        </div>
      </div>

      {/* 2. Kartu Absen: Absen Pagi & Absen Sore (Responsif HP: Absen Berikutnya di Atas) */}
      <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
        
        {/* KARTU 1: ABSEN PAGI */}
        <Card className={`border-border-default shadow-xs bg-surface ${
          hasCheckedIn && !hasCheckedOut ? 'order-2 md:order-1' : 'order-1'
        }`}>
          <CardHeader className="py-3.5 px-4 sm:px-5 border-b border-border-default">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-text-primary">
                  <Sunrise className="w-4 h-4 text-text-muted shrink-0" />
                  Absen Pagi
                </CardTitle>
                <p className="text-xs text-text-muted mt-0.5">
                  Masuk · target 08:00–08:15
                </p>
              </div>

              {/* Badge Status Satu Baris */}
              {hasCheckedIn ? (
                <Badge variant={isMorningLate ? 'warning' : 'success'} dot className="shrink-0">
                  {isMorningLate ? 'Terlambat' : 'Tepat waktu'}
                </Badge>
              ) : (
                <Badge variant="neutral" className="shrink-0">
                  Belum absen
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div>
              {/* Jam Absen Tampil Besar Font Biasa Tabular */}
              <div className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight tabular-nums">
                {morningTime ? `${morningTime} WIB` : '--:--'}
              </div>

              {/* Petunjuk Satu Baris Kecil */}
              <p className="text-xs text-text-secondary mt-2">
                {hasCheckedIn ? (
                  isMorningLate ? 'Tercatat terlambat setelah 08:15 WIB.' : 'Tercatat tepat waktu pada jam masuk kantor.'
                ) : (
                  'Scan sebelum 08:15 WIB untuk mendapatkan uang makan.'
                )}
              </p>
            </div>

            {/* Tombol Scan Selebar Kartu */}
            <div className="pt-2">
              <Button 
                variant={!hasCheckedIn ? 'primary' : 'outline'} 
                className="w-full h-12 sm:h-11 font-medium text-sm justify-center" 
                leftIcon={hasCheckedIn ? <CheckCircle2 className="w-4 h-4 text-success-fg" /> : <QrCode className="w-4 h-4" />}
                onClick={() => openScanModal('pagi')}
              >
                {hasCheckedIn ? 'Sudah Absen Pagi' : 'Scan Absen Pagi'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* KARTU 2: ABSEN SORE */}
        <Card className={`border-border-default shadow-xs bg-surface ${
          hasCheckedIn && !hasCheckedOut ? 'order-1 md:order-2' : 'order-2'
        }`}>
          <CardHeader className="py-3.5 px-4 sm:px-5 border-b border-border-default">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-text-primary">
                  <Sunset className="w-4 h-4 text-text-muted shrink-0" />
                  Absen Sore
                </CardTitle>
                <p className="text-xs text-text-muted mt-0.5">
                  Pulang · mulai 16:00
                </p>
              </div>

              {/* Badge Status Satu Baris */}
              {hasCheckedOut ? (
                <Badge variant="success" dot className="shrink-0">
                  Tepat waktu
                </Badge>
              ) : (
                <Badge variant="neutral" className="shrink-0">
                  Belum absen
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div>
              {/* Jam Absen Tampil Besar Font Biasa Tabular */}
              <div className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight tabular-nums">
                {afternoonTime ? `${afternoonTime} WIB` : '--:--'}
              </div>

              {/* Petunjuk Satu Baris Kecil */}
              <p className="text-xs text-text-secondary mt-2">
                {hasCheckedOut ? (
                  'Absen sore tercatat, jam kerja selesai.'
                ) : (
                  'Scan saat selesai jam kantor mulai pukul 16:00 WIB.'
                )}
              </p>
            </div>

            {/* Tombol Scan Selebar Kartu */}
            <div className="pt-2">
              <Button 
                variant={hasCheckedIn && !hasCheckedOut ? 'primary' : 'outline'} 
                className="w-full h-12 sm:h-11 font-medium text-sm justify-center" 
                leftIcon={hasCheckedOut ? <CheckCircle2 className="w-4 h-4 text-success-fg" /> : <QrCode className="w-4 h-4" />}
                onClick={() => openScanModal('sore')}
              >
                {hasCheckedOut ? 'Sudah Absen Sore' : 'Scan Absen Sore'}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 3. Ringkasan Bulan Ini (4 Kotak Angka Biasa, 2 per baris di HP) */}
      <Card className="border-border-default shadow-xs bg-surface">
        <CardHeader className="py-3 px-4 sm:px-5 border-b border-border-default">
          <CardTitle className="text-base font-semibold">
            Ringkasan Bulan Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 rounded-lg bg-subtle border border-border-default">
              <p className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
                {presentCount}
              </p>
              <p className="text-xs text-text-secondary mt-1">Tepat waktu</p>
            </div>

            <div className="p-3.5 rounded-lg bg-subtle border border-border-default">
              <p className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
                {lateCount}
              </p>
              <p className="text-xs text-text-secondary mt-1">Terlambat</p>
            </div>

            <div className="p-3.5 rounded-lg bg-subtle border border-border-default">
              <p className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
                {absentCount}
              </p>
              <p className="text-xs text-text-secondary mt-1">Alpa</p>
            </div>

            <div className="p-3.5 rounded-lg bg-subtle border border-border-default">
              <p className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums">
                {leaveCount}
              </p>
              <p className="text-xs text-text-secondary mt-1">Izin & Cuti</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Riwayat Absensi (Tabel di Desktop, Daftar Kartu di HP) */}
      <Card className="border-border-default shadow-xs bg-surface">
        <CardHeader className="py-3 px-4 sm:px-5 border-b border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">
            Riwayat Absensi
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="month" 
              defaultValue={new Date().toISOString().slice(0, 7)}
              className="h-8 px-2.5 rounded-md border border-border-default bg-surface text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button variant="outline" size="sm" leftIcon={<Filter className="w-3.5 h-3.5 text-text-muted" />} className="h-8 text-xs">
              Filter
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Tampilan Desktop: Tabel 6 Kolom */}
          <div className="hidden sm:block overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Tanggal</TableHead>
                  <TableHead className="w-28">Jadwal</TableHead>
                  <TableHead className="w-32">Masuk</TableHead>
                  <TableHead className="w-32">Pulang</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-28 text-right">Durasi</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-text-muted">
                      Memuat data absensi...
                    </TableCell>
                  </TableRow>
                ) : attendances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-text-muted">
                      Belum ada data kehadiran pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  attendances.map((att: any) => {
                    const attIn = att.time_in ? att.time_in.slice(0, 5) : null;
                    const attOut = att.time_out ? att.time_out.slice(0, 5) : null;
                    const isLate = att.status === 'late' || (attIn && attIn > '08:15');

                    return (
                      <TableRow key={att.id} className="hover:bg-subtle/50 transition-colors">
                        <TableCell className="font-medium text-text-primary text-xs">
                          {formatDateIndo(att.date)}
                        </TableCell>
                        <TableCell className="text-xs text-text-secondary tabular-nums">
                          08:00–16:00
                        </TableCell>
                        <TableCell className="text-xs tabular-nums font-medium text-text-primary">
                          {attIn ? `${attIn} WIB` : '-'}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums font-medium text-text-primary">
                          {attOut ? `${attOut} WIB` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={att.status === 'present' ? 'success' : isLate ? 'warning' : att.status === 'leave' ? 'info' : 'danger'}
                            dot
                          >
                            {att.status === 'present' ? 'Hadir' : isLate ? 'Terlambat' : att.status === 'leave' ? 'Izin' : 'Alpa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-text-secondary tabular-nums text-right">
                          {calculateDuration(att.time_in, att.time_out)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>

          {/* Tampilan Mobile: Daftar Kartu Per Hari */}
          <div className="block sm:hidden divide-y divide-border-default">
            {loading ? (
              <div className="p-4 text-center text-xs text-text-muted">
                Memuat data absensi...
              </div>
            ) : attendances.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted">
                Belum ada data kehadiran pada periode ini.
              </div>
            ) : (
              attendances.map((att: any) => {
                const attIn = att.time_in ? att.time_in.slice(0, 5) : null;
                const attOut = att.time_out ? att.time_out.slice(0, 5) : null;
                const isLate = att.status === 'late' || (attIn && attIn > '08:15');

                return (
                  <div key={att.id} className="p-3.5 space-y-2 hover:bg-subtle/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-primary">
                        {formatDateIndo(att.date)}
                      </span>
                      <Badge 
                        variant={att.status === 'present' ? 'success' : isLate ? 'warning' : att.status === 'leave' ? 'info' : 'danger'}
                        dot
                      >
                        {att.status === 'present' ? 'Hadir' : isLate ? 'Terlambat' : att.status === 'leave' ? 'Izin' : 'Alpa'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary pt-1">
                      <div>
                        <span className="text-text-muted block text-[11px]">Absen Masuk</span>
                        <span className="font-medium text-text-primary tabular-nums">
                          {attIn ? `${attIn} WIB` : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[11px]">Absen Pulang</span>
                        <span className="font-medium text-text-primary tabular-nums">
                          {attOut ? `${attOut} WIB` : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border-default/50">
                      <span>Jadwal: 08:00–16:00 WIB</span>
                      <span>Durasi: {calculateDuration(att.time_in, att.time_out)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-border-default flex items-center justify-between">
            <span className="text-xs text-text-muted">
              {attendances.length} catatan absensi
            </span>
            <Pagination currentPage={1} totalPages={1} totalItems={attendances.length} itemsPerPage={15} onPageChange={() => {}} />
          </div>
        </CardContent>
      </Card>

      {/* 5. Modal Koreksi Absensi */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        title="Ajukan Koreksi Absensi"
        footer={
          <ConfirmFooter 
            onCancel={() => setCorrectionModalOpen(false)} 
            onConfirm={handleCorrectionSubmit} 
            confirmText="Kirim Pengajuan Koreksi" 
            isLoading={submittingCorrection} 
          />
        }
      >
        <div className="space-y-4">
          <Input 
            label="Tanggal Absensi" 
            type="date" 
            required 
            value={correctionData.date}
            onChange={(e) => setCorrectionData({...correctionData, date: e.target.value})}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Jam Absen Masuk Seharusnya" 
              type="time" 
              value={correctionData.time_in}
              onChange={(e) => setCorrectionData({...correctionData, time_in: e.target.value})}
              helperText="Misal: 08:00 WIB"
            />
            <Input 
              label="Jam Absen Pulang Seharusnya" 
              type="time" 
              value={correctionData.time_out}
              onChange={(e) => setCorrectionData({...correctionData, time_out: e.target.value})}
              helperText="Misal: 16:00 WIB"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-label text-text-primary">
              Alasan Koreksi <span className="text-danger">*</span>
            </label>
            <textarea 
              className="w-full p-3 rounded-md border bg-surface text-text-primary border-border-default focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm h-24 resize-none transition-colors"
              placeholder="Contoh: Lupa scan absen sore saat lembur, ada kendala koneksi perangkat..."
              required
              value={correctionData.reason}
              onChange={(e) => setCorrectionData({...correctionData, reason: e.target.value})}
            />
          </div>
        </div>
      </Modal>

      {/* 6. Modal Scan QR Code (Kamera & Feedback Jelas) */}
      <Modal
        isOpen={isScanModalOpen}
        onClose={() => {
          stopScanner();
          setScanModalOpen(false);
          setScanResult(null);
          setCameraError(null);
        }}
        title={`Scan QR - ${scanType === 'pagi' ? 'Absen Pagi' : 'Absen Sore'}`}
      >
        <div className="flex flex-col items-center py-2">
          {/* Tampilan Saat Hasil Scan Tersedia */}
          {scanResult ? (
            <div className="w-full max-w-sm text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-subtle border border-border-default">
                {scanResult.type === 'success' ? (
                  <CheckCircle2 className="w-8 h-8 text-success-fg" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-danger-fg" />
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-text-primary">
                  {scanResult.type === 'success' ? 'Presensi Berhasil Dicatat!' : 'Presensi Gagal'}
                </h3>
                <p className="text-xs text-text-secondary mt-1 px-4">
                  {scanResult.message}
                </p>
                {scanResult.time && (
                  <p className="text-sm font-semibold text-text-primary mt-2 tabular-nums">
                    Waktu: {scanResult.time}
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-2 justify-center">
                {scanResult.type === 'error' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setScanResult(null);
                      setCameraError(null);
                    }}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Coba Lagi
                  </Button>
                )}
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => {
                    stopScanner();
                    setScanModalOpen(false);
                    setScanResult(null);
                    setCameraError(null);
                  }}
                >
                  Tutup
                </Button>
              </div>
            </div>
          ) : (
            /* Tampilan Scanner Kamera Aktif */
            <div className="w-full flex flex-col items-center">
              <p className="text-xs text-text-secondary text-center mb-3">
                Arahkan kamera ke QR di layar kantor
              </p>

              {cameraError ? (
                <div className="w-full max-w-xs p-4 rounded-xl bg-danger-subtle border border-danger-subtle text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-danger-fg mx-auto" />
                  <p className="text-xs text-danger-fg font-medium leading-relaxed">
                    {cameraError}
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCameraError(null);
                        setIsCameraStarting(true);
                      }}
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                      className="w-full"
                    >
                      Coba Buka Kamera Lagi
                    </Button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-primary font-medium hover:underline inline-flex items-center justify-center gap-1.5 py-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Atau upload foto/screenshot QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-[280px] sm:max-w-xs flex flex-col items-center">
                  <div 
                    id="reader" 
                    className="w-full overflow-hidden rounded-xl border border-border-default shadow-xs bg-slate-900 min-h-[260px] flex items-center justify-center relative"
                  >
                    {isCameraStarting && (
                      <div className="text-center p-4 text-xs text-slate-300 flex flex-col items-center gap-2">
                        <Camera className="w-6 h-6 text-slate-400 animate-pulse" />
                        <span>Membuka kamera...</span>
                        <span className="text-[11px] text-slate-400">Pastikan klik "Izinkan" jika browser meminta izin kamera</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Bermasalah dengan kamera? Unggah foto QR
                    </button>
                  </div>
                </div>
              )}

              {/* Element tersembunyi untuk fallback scan gambar */}
              <div id="reader-file-temp" className="hidden" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileScan}
              />

              <div className="mt-4 pt-3 border-t border-border-default w-full text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    stopScanner();
                    setScanModalOpen(false);
                  }}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
