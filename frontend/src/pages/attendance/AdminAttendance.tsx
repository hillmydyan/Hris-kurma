import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CustomQrCode } from '../../components/ui/CustomQrCode';
import { RefreshCw, Download, Search, Filter, Loader2, Printer, ShieldCheck, CheckCircle2, AlertTriangle, Building, Sparkles, Calendar, Tv, RotateCcw } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { getLocalDateString } from '../../utils/date';

export function AdminAttendance() {
  const navigate = useNavigate();
  const [qrToken, setQrToken] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loadingAttendances, setLoadingAttendances] = useState(true);

  // States untuk Filter & Pencarian
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(() => getLocalDateString());

  // States untuk Unduh QR (Harian Khusus Hari Ini / Dinamis)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [dailyQrToken, setDailyQrToken] = useState('');
  const [dailyQrDate, setDailyQrDate] = useState('');
  const [dailyQrRawDate, setDailyQrRawDate] = useState('');
  const [loadingDailyQr, setLoadingDailyQr] = useState(false);
  const [qrDownloadTab, setQrDownloadTab] = useState<'daily' | 'dynamic'>('daily');

  const fetchDailyQr = async () => {
    setLoadingDailyQr(true);
    try {
      const res = await api.get('/attendance/daily-qr');
      setDailyQrToken(res.data.token);
      setDailyQrDate(res.data.date_formatted || res.data.date);
      setDailyQrRawDate(res.data.date);
    } catch (err) {
      console.error('Error fetching daily QR:', err);
    } finally {
      setLoadingDailyQr(false);
    }
  };

  const handleOpenDownload = () => {
    setDownloadModalOpen(true);
    fetchDailyQr();
  };

  const downloadQrAsPng = (elementId: string, filename: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const svg = el.tagName.toLowerCase() === 'svg' ? (el as unknown as SVGSVGElement) : el.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width || 600;
      canvas.height = img.height || 600;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = filename;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const el = document.getElementById('daily-qr-svg');
    const svg = el ? (el.tagName.toLowerCase() === 'svg' ? el : el.querySelector('svg')) : null;
    const svgHtml = svg ? svg.outerHTML : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Poster Presensi QR Harian - Kurma Group</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; color: #1e293b; padding: 24px; margin: 0; }
          .header { border-bottom: 3px solid #0f4c3a; padding-bottom: 14px; margin-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 800; color: #0f4c3a; letter-spacing: -0.5px; display: flex; align-items: center; justify-content: center; gap: 10px; }
          .sublogo { font-size: 13px; color: #64748b; margin-top: 4px; }
          .date-badge { display: inline-block; background: #f0fdf4; border: 1.5px solid #0f4c3a; color: #064e3b; font-weight: 700; font-size: 13px; padding: 6px 18px; border-radius: 9999px; margin-top: 12px; }
          .title { font-size: 22px; font-weight: 700; margin: 18px 0 8px 0; color: #0f172a; }
          .desc { font-size: 13px; color: #475569; max-width: 480px; margin: 0 auto 20px auto; line-height: 1.5; }
          .qr-box { display: inline-block; padding: 20px; border: 3px solid #e2e8f0; border-radius: 16px; background: white; margin-bottom: 20px; }
          .info-grid { display: flex; justify-content: center; gap: 14px; max-width: 540px; margin: 0 auto; text-align: left; }
          .info-item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 12px; flex: 1; }
          .info-item strong { display: block; color: #0f172a; font-size: 13px; margin-bottom: 2px; }
          .footer { margin-top: 28px; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <img src="${window.location.origin}/logo.ico" alt="" style="width:36px;height:36px;object-fit:contain;" />
            <span>KURMA GROUP</span>
          </div>
          <div class="sublogo">Sistem Informasi SDM & Presensi Resmi</div>
          <div class="date-badge">KHUSUS HARI INI: ${dailyQrDate || 'Hari Ini'}</div>
        </div>
        <div class="title">SCAN PRESENSI HARIAN KANTOR</div>
        <div class="desc">Buka aplikasi HRIS di smartphone Anda, pilih menu <strong>Absensi QR</strong>, lalu scan kode QR di bawah ini:</div>
        <div class="qr-box">${svgHtml}</div>
        <div class="info-grid">
          <div class="info-item">
            <strong>Absen Masuk (Pagi)</strong>
            08:00 WIB (Toleransi s/d 08:15)
          </div>
          <div class="info-item">
            <strong>Absen Pulang (Sore)</strong>
            Mulai Pukul 16:00 WIB
          </div>
          <div class="info-item">
            <strong>Masa Berlaku</strong>
            Khusus Hari Ini s/d 23:59 WIB
          </div>
        </div>
        <div class="footer">
          Kode QR Presensi Harian • Otomatis kedaluwarsa tengah malam • Kurma Group Official
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const fetchQrCode = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance/qr-code');
      setQrToken(response.data.token);
      setDate(response.data.date);
    } catch (error) {
      console.error('Error fetching QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendances = async (dateVal?: string, searchVal?: string) => {
    setLoadingAttendances(true);
    try {
      const activeDate = dateVal !== undefined ? dateVal : filterDate;
      const activeSearch = searchVal !== undefined ? searchVal : searchTerm;
      const params: any = {};
      if (activeDate) params.date = activeDate;
      if (activeSearch) params.search = activeSearch;

      const response = await api.get('/attendance', { params });
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      setAttendances(list);
    } catch (error) {
      console.error('Error fetching attendances:', error);
    } finally {
      setLoadingAttendances(false);
    }
  };

  useEffect(() => {
    fetchQrCode();
    fetchAttendances();
  }, []);

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchAttendances(filterDate, searchTerm);
  };

  const handleResetFilter = () => {
    const todayStr = getLocalDateString();
    setFilterDate(todayStr);
    setSearchTerm('');
    fetchAttendances(todayStr, '');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1 text-text-primary">Monitor Absensi Live</h1>
          <p className="text-body text-text-secondary">Pantau presensi tim & karyawan secara real-time dan kelola QR Code kantor.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            leftIcon={<Tv className="w-4 h-4" />}
            onClick={() => navigate('/admin/absensi/qr-screen')}
          >
            Layar QR Kantor (TV)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center justify-center py-8">
          <CardHeader className="text-center">
            <CardTitle>QR Code Absensi Hari Ini</CardTitle>
            <p className="text-body text-text-secondary">{date}</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {loading ? (
              <div className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-border-default rounded-md">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : qrToken ? (
              <div className="mb-6">
                <CustomQrCode
                  id="dynamic-qr-svg"
                  value={qrToken}
                  size={240}
                  color="#0F4C3A"
                  showBrandLabel={true}
                  brandText="KURMA GROUP"
                />
              </div>
            ) : (
              <div className="w-64 h-64 flex flex-col items-center justify-center border-2 border-dashed border-border-default rounded-md text-text-muted">
                <p>Gagal memuat QR Code</p>
              </div>
            )}
            
            <div className="flex gap-4">
              <Button variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchQrCode} disabled={loading}>
                Perbarui QR
              </Button>
              <Button 
                variant="primary" 
                leftIcon={<Download className="w-4 h-4" />} 
                onClick={handleOpenDownload}
                disabled={loading || !qrToken}
              >
                Unduh QR
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instruksi Pemakaian Terminal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-body text-text-secondary">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Tampilkan layar ini atau buka halaman <strong>Terminal Layar Penuh (TV)</strong> pada layar monitor kantor.</li>
              <li><strong>Absen Pagi (Masuk):</strong> Karyawan melakukan scan saat tiba di kantor (Batas tepat waktu s/d 08:15 WIB).</li>
              <li><strong>Absen Sore (Pulang):</strong> Karyawan melakukan scan saat jam kerja selesai (Mulai pukul 16:00 WIB).</li>
              <li>Sistem secara otomatis mencatat waktu absensi pagi, sore, dan menghitung durasi kerja harian.</li>
            </ol>
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm"
                leftIcon={<Tv className="w-4 h-4" />}
                onClick={() => navigate('/admin/absensi/qr-screen')}
              >
                Buka Terminal Layar Penuh (TV)
              </Button>
            </div>
            <div className="p-4 bg-info-subtle border border-info-border rounded-md mt-4">
              <p className="text-info-fg text-label font-medium mb-1">Catatan Keamanan Dynamic QR</p>
              <p className="text-sm text-info-fg/80">
                QR Code berputar secara berkala untuk mencegah screenshot atau titip absen dari luar kantor.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Absensi Pagi & Sore Hari Ini</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleFilterSubmit} className="p-4 border-b border-border-default flex flex-col sm:flex-row justify-between gap-4 bg-subtle/50">
            <div className="flex-1 max-w-md relative">
              <Input 
                label="" 
                placeholder="Cari nama atau NIK karyawan..." 
                leftIcon={<Search className="w-5 h-5" />} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                label="" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              <Button type="submit" variant="secondary" leftIcon={<Filter className="w-4 h-4" />} disabled={loadingAttendances}>
                Filter
              </Button>
              {(filterDate !== getLocalDateString() || searchTerm) && (
                <Button type="button" variant="text" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={handleResetFilter}>
                  Reset
                </Button>
              )}
            </div>
          </form>

          <Table className="border-0 shadow-none rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Absen Pagi (Masuk)</TableHead>
                <TableHead>Absen Sore (Pulang)</TableHead>
                <TableHead>Durasi Kerja</TableHead>
                <TableHead>Status Harian</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loadingAttendances ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-text-secondary mt-2">Memuat data absensi...</p>
                  </TableCell>
                </TableRow>
              ) : attendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                    Belum ada data absensi hari ini.
                  </TableCell>
                </TableRow>
              ) : (
                attendances.map((att: any) => {
                  const attIn = att.time_in ? att.time_in.slice(0, 5) : null;
                  const attOut = att.time_out ? att.time_out.slice(0, 5) : null;
                  const isLate = att.status === 'late' || (attIn && attIn > '08:15');
                  
                  // Calculate duration
                  let duration = '-';
                  if (attIn && attOut) {
                    const [h1, m1] = attIn.split(':').map(Number);
                    const [h2, m2] = attOut.split(':').map(Number);
                    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                    if (diff > 0) {
                      duration = `${Math.floor(diff / 60)}j ${diff % 60}m`;
                    }
                  }

                  return (
                    <TableRow key={att.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-xs">
                            {att.employee?.first_name?.charAt(0)}{att.employee?.last_name ? att.employee.last_name.charAt(0) : ''}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">
                              {att.employee?.first_name} {att.employee?.last_name || ''}
                            </p>
                            <p className="text-caption text-text-muted">{att.employee?.employee_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {attIn ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">
                              {attIn} WIB
                            </span>
                            {isLate && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-bg text-warning-fg font-medium">
                                Telat
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted font-mono">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {attOut ? (
                          <span className="font-mono font-medium text-blue-700 dark:text-blue-400">
                            {attOut} WIB
                          </span>
                        ) : (
                          <span className="text-text-muted font-mono">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-caption font-mono text-text-secondary">{duration}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={att.status === 'leave' ? 'info' : (att.status === 'absent' || (!attIn && !attOut)) ? 'danger' : isLate ? 'warning' : 'success'}>
                          {att.status === 'leave' ? 'Izin' : (att.status === 'absent' || (!attIn && !attOut)) ? 'Alpa' : isLate ? 'Terlambat' : 'Hadir'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </Table>
          
          <div className="p-4 border-t border-border-default">
            <Pagination 
              currentPage={1} 
              totalPages={1} 
              totalItems={attendances.length} 
              itemsPerPage={10} 
              onPageChange={() => {}} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal Unduh QR: Opsi Permanen (Siap Cetak / Tempel Dinding) vs Dinamis Sesi Hari Ini */}
      <Modal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        title="Unduh & Cetak Kode QR Presensi"
        size="md"
      >
        <div className="space-y-5">
          {/* Tabs Pilihan */}
          <div className="flex border-b border-border-default">
            <button
              type="button"
              onClick={() => setQrDownloadTab('daily')}
              className={`flex-1 py-2.5 text-sm font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                qrDownloadTab === 'daily'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <Calendar className="w-4 h-4" />
              QR Harian Kantor (Khusus Hari Ini)
            </button>
            <button
              type="button"
              onClick={() => setQrDownloadTab('dynamic')}
              className={`flex-1 py-2.5 text-sm font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                qrDownloadTab === 'dynamic'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <Tv className="w-4 h-4" />
              QR Layar TV (Dinamis 60 Detik)
            </button>
          </div>

          {qrDownloadTab === 'daily' ? (
            /* TAB 1: QR HARIAN KANTOR (KHUSUS HARI INI - HANGUS TENGAH MALAM) */
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5 text-emerald-800 dark:text-emerald-300">
                  <p className="font-bold">Khusus Hari Ini Saja (Berlaku s/d Pkl 23:59 WIB)</p>
                  <p className="leading-relaxed text-emerald-700 dark:text-emerald-400">
                    QR ini dibuat khusus untuk presensi kantor hari ini {dailyQrDate ? `(${dailyQrDate})` : ''}. Karyawan dapat scan untuk absen masuk (08:00) & absen pulang (16:00). Kode akan <strong>otomatis hangus saat pergantian hari</strong> sehingga tidak bisa dipakai untuk hari esok.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-border-default shadow-sm">
                {loadingDailyQr ? (
                  <div className="w-52 h-52 flex flex-col items-center justify-center">
                    <Loader2 className="w-7 h-7 animate-spin text-primary mb-2" />
                    <span className="text-xs text-text-muted">Memuat QR Harian...</span>
                  </div>
                ) : dailyQrToken ? (
                  <>
                    <CustomQrCode
                      id="daily-qr-svg"
                      value={dailyQrToken}
                      size={220}
                      color="#0F4C3A"
                      showBrandLabel={true}
                      brandText="KURMA GROUP"
                    />
                    <p className="text-[11px] font-mono text-text-muted mt-2">
                      TOKEN: {dailyQrToken}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted font-medium">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      <span>{dailyQrDate || 'Hari Ini'}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">Berlaku s/d 23:59 WIB</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-danger py-8">Gagal memuat token harian.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => downloadQrAsPng('daily-qr-svg', `QR_Absensi_Harian_${dailyQrRawDate || 'HariIni'}.png`)}
                  disabled={loadingDailyQr || !dailyQrToken}
                  className="w-full"
                >
                  Unduh Gambar PNG
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={handlePrintPoster}
                  disabled={loadingDailyQr || !dailyQrToken}
                  className="w-full"
                >
                  Cetak Poster Harian A4
                </Button>
              </div>
            </div>
          ) : (
            /* TAB 2: QR LAYAR DINAMIS (SESI 60 DETIK) */
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5 text-amber-800 dark:text-amber-300">
                  <p className="font-bold">Berlaku Sebentar (Kedaluwarsa dalam 60 Detik)</p>
                  <p className="leading-relaxed text-amber-700 dark:text-amber-400">
                    QR ini adalah token sesi real-time yang sedang tampil di layar. <strong>Tidak disarankan untuk dicetak</strong> karena akan hangus dalam hitungan detik. Gunakan menu <em>Layar QR Kantor (TV)</em> untuk menampilkan QR dinamis secara langsung.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-2 bg-transparent">
                <CustomQrCode
                  id="session-qr-svg"
                  value={qrToken}
                  size={220}
                  color="#0F4C3A"
                  showBrandLabel={true}
                  brandText="KURMA GROUP"
                />
                <p className="text-[11px] font-mono text-text-muted mt-2">
                  TOKEN SESI: {qrToken.slice(0, 20)}...
                </p>
              </div>

              <Button
                variant="secondary"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => downloadQrAsPng('session-qr-svg', `QR_Absensi_Sesi_${date}.png`)}
                disabled={!qrToken}
                className="w-full"
              >
                Unduh Gambar Sesi Ini (PNG)
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
