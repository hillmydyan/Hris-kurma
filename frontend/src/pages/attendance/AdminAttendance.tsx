import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Download, Search, Filter, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import api from '../../lib/api';

export function AdminAttendance() {
  const [qrToken, setQrToken] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loadingAttendances, setLoadingAttendances] = useState(true);

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

  const fetchAttendances = async () => {
    setLoadingAttendances(true);
    try {
      const response = await api.get('/attendance');
      setAttendances(response.data);
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

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1 text-text-primary">Manajemen Absensi</h1>
          <p className="text-body text-text-secondary">Kelola absensi karyawan dan generate QR Code.</p>
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
              <div className="p-4 bg-white rounded-xl shadow-sm border border-border-default mb-6">
                <QRCodeSVG value={qrToken} size={256} level="H" includeMargin />
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
              <Button variant="primary" leftIcon={<Download className="w-4 h-4" />} disabled={loading || !qrToken}>
                Unduh QR
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instruksi Pemakaian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-body text-text-secondary">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Cetak atau tampilkan layar ini pada perangkat di pintu masuk kantor.</li>
              <li>Karyawan membuka aplikasi HRIS mereka dan menuju menu <strong>Absensi</strong>.</li>
              <li>Karyawan menekan tombol <strong>Scan QR Absensi</strong> dan mengarahkan kamera ke QR Code ini.</li>
              <li>QR Code akan otomatis mencatat waktu kedatangan (Clock-In) maupun kepulangan (Clock-Out).</li>
            </ol>
            <div className="p-4 bg-info-subtle border border-info-border rounded-md mt-6">
              <p className="text-info-fg text-label font-medium mb-1">Catatan Keamanan</p>
              <p className="text-sm text-info-fg/80">
                QR Code diperbarui secara berkala dan hanya berlaku untuk hari ini. Jangan menyebarkan QR Code ini melalui grup chat untuk menghindari manipulasi absensi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Absensi Hari Ini</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border-default flex flex-col sm:flex-row justify-between gap-4 bg-subtle/50">
            <div className="flex-1 max-w-md relative">
              <Input 
                label="" 
                placeholder="Cari nama karyawan..." 
                leftIcon={<Search className="w-5 h-5" />} 
              />
            </div>
            <div className="flex gap-2">
              <Input type="date" label="" defaultValue={new Date().toISOString().split('T')[0]} />
              <Button variant="secondary" leftIcon={<Filter className="w-4 h-4" />}>
                Filter
              </Button>
            </div>
          </div>

          <Table className="border-0 shadow-none rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Waktu Check-In</TableHead>
                <TableHead>Waktu Check-Out</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Status</TableHead>
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
                attendances.map((att: any) => (
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
                    <TableCell>{att.time_in || '-'}</TableCell>
                    <TableCell>{att.time_out || '-'}</TableCell>
                    <TableCell>
                      <span className="text-caption px-2 py-1 bg-subtle rounded-md text-text-secondary border border-border-default uppercase">
                        {att.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={att.status === 'present' ? 'success' : att.status === 'late' ? 'warning' : 'danger'}>
                        {att.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
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
    </div>
  );
}
