import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal, ConfirmFooter } from '../../components/ui/Modal';
import { Clock, Download, Plus, Filter, Search, QrCode } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../lib/api';

export function MyAttendance() {
  const [isCorrectionModalOpen, setCorrectionModalOpen] = useState(false);
  const [isScanModalOpen, setScanModalOpen] = useState(false);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [correctionData, setCorrectionData] = useState({
    date: '',
    time_in: '',
    time_out: '',
    reason: ''
  });
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  React.useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    try {
      const response = await api.get('/attendance');
      setAttendances(response.data);
    } catch (error) {
      console.error('Error fetching attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectionSubmit = async () => {
    if (!correctionData.date || !correctionData.reason) {
      alert('Tanggal dan Alasan harus diisi');
      return;
    }
    
    setSubmittingCorrection(true);
    try {
      const response = await api.post('/attendance-corrections', correctionData);
      alert(response.data.message);
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

  React.useEffect(() => {
    if (isScanModalOpen) {
      const scanner = new Html5QrcodeScanner('reader', { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
      scanner.render(
        async (result) => {
          scanner.clear();
          setScanModalOpen(false);
          try {
            const response = await api.post('/attendance/scan', { token: result });
            alert(response.data.message);
            fetchAttendances();
          } catch (error: any) {
            alert(error.response?.data?.error || 'Gagal scan QR Code');
          }
        },
        (err) => {
          // console.warn(err);
        }
      );

      return () => {
        scanner.clear().catch(e => console.error(e));
      };
    }
  }, [isScanModalOpen]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1 text-text-primary">Kehadiran Saya</h1>
          <p className="text-body text-text-secondary">Pantau riwayat absensi dan jam kerja Anda.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            Ekspor
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCorrectionModalOpen(true)}>
            Koreksi Absensi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary-soft border-primary/20">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <h3 className="text-text-secondary text-label mb-2">Jam Saat Ini</h3>
            <p className="text-display text-primary tabular-nums tracking-tight">08:14:32</p>
            <p className="text-caption text-text-muted mt-1">9 Oktober 2026</p>
            <Button variant="primary" className="w-full mt-6" leftIcon={<QrCode className="w-4 h-4" />} onClick={() => setScanModalOpen(true)}>
              Scan QR Absensi
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Ringkasan Bulan Ini (Okt 2026)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-display text-text-primary">7</p>
              <p className="text-caption text-text-secondary">Hadir</p>
            </div>
            <div>
              <p className="text-display text-warning-fg">1</p>
              <p className="text-caption text-text-secondary">Terlambat</p>
            </div>
            <div>
              <p className="text-display text-danger-fg">0</p>
              <p className="text-caption text-text-secondary">Alpa</p>
            </div>
            <div>
              <p className="text-display text-info-fg">1</p>
              <p className="text-caption text-text-secondary">Cuti/Izin</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border-default flex gap-2">
            <Input label="" type="month" defaultValue="2026-10" />
            <Button variant="secondary" leftIcon={<Filter className="w-4 h-4" />}>Filter Status</Button>
          </div>

          <Table className="border-0 shadow-none rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Jam</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">Memuat data...</TableCell>
                </TableRow>
              ) : attendances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-text-secondary">Tidak ada data kehadiran.</TableCell>
                </TableRow>
              ) : (
                attendances.map((att: any) => (
                  <TableRow key={att.id}>
                    <TableCell>{att.date}</TableCell>
                    <TableCell>08:00 - 17:00</TableCell>
                    <TableCell>{att.time_in || '-'}</TableCell>
                    <TableCell>{att.time_out || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={att.status === 'present' ? 'success' : att.status === 'late' ? 'warning' : 'danger'}>
                        {att.status}
                      </Badge>
                    </TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
          
          <div className="p-4 border-t border-border-default">
            <Pagination currentPage={1} totalPages={1} totalItems={attendances.length} itemsPerPage={10} onPageChange={() => {}} />
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        title="Ajukan Koreksi Absensi"
        footer={<ConfirmFooter onCancel={() => setCorrectionModalOpen(false)} onConfirm={handleCorrectionSubmit} confirmText="Ajukan Koreksi" isLoading={submittingCorrection} />}
      >
        <div className="space-y-4">
          <Input 
            label="Tanggal Absensi" 
            type="date" 
            required 
            value={correctionData.date}
            onChange={(e) => setCorrectionData({...correctionData, date: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Jam Clock In Seharusnya" 
              type="time" 
              value={correctionData.time_in}
              onChange={(e) => setCorrectionData({...correctionData, time_in: e.target.value})}
            />
            <Input 
              label="Jam Clock Out Seharusnya" 
              type="time" 
              value={correctionData.time_out}
              onChange={(e) => setCorrectionData({...correctionData, time_out: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-label text-text-primary">Alasan Koreksi <span className="text-danger">*</span></label>
            <textarea 
              className="w-full p-3 rounded-sm border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring h-24 resize-none"
              placeholder="Contoh: Lupa clock out, mesin absen error..."
              required
              value={correctionData.reason}
              onChange={(e) => setCorrectionData({...correctionData, reason: e.target.value})}
            ></textarea>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isScanModalOpen}
        onClose={() => setScanModalOpen(false)}
        title="Scan QR Code Absensi"
      >
        <div className="flex flex-col items-center">
          <p className="text-text-secondary text-center mb-4">Arahkan kamera perangkat Anda ke QR Code yang disediakan oleh Admin/HR.</p>
          <div id="reader" className="w-full max-w-sm overflow-hidden rounded-md border border-border-default"></div>
        </div>
      </Modal>
    </div>
  );
}
