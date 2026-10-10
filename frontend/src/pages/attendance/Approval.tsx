import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Check, X, Loader2 } from 'lucide-react';
import api from '../../lib/api';

export function Approval() {
  const [corrections, setCorrections] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeaves, setLoadingLeaves] = useState(true);

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance-corrections');
      setCorrections(response.data);
    } catch (error) {
      console.error('Error fetching corrections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const response = await api.get('/leaves');
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoadingLeaves(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
    fetchLeaves();
  }, []);

  const handleApproval = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/attendance-corrections/${id}`, { status });
      alert(`Koreksi absensi berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
      fetchCorrections();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal memproses persetujuan');
    }
  };

  const handleLeaveApproval = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/leaves/${id}`, { status });
      alert(`Cuti/Izin berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
      fetchLeaves();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal memproses persetujuan');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="h1 text-text-primary">Persetujuan</h1>
        <p className="text-body text-text-secondary">Kelola permintaan koreksi absensi, cuti, dan izin karyawan.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permintaan Koreksi Absensi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border-0 shadow-none rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Tanggal Absensi</TableHead>
                <TableHead>Clock In/Out Seharusnya</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-text-secondary mt-2">Memuat data permintaan...</p>
                  </TableCell>
                </TableRow>
              ) : corrections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                    Tidak ada permintaan koreksi absensi.
                  </TableCell>
                </TableRow>
              ) : (
                corrections.map((corr: any) => (
                  <TableRow key={corr.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-xs">
                          {corr.employee?.first_name?.charAt(0)}{corr.employee?.last_name ? corr.employee.last_name.charAt(0) : ''}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {corr.employee?.first_name} {corr.employee?.last_name || ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{corr.date}</TableCell>
                    <TableCell>
                      <span className="text-body text-text-primary font-medium">{corr.time_in || '--:--'}</span>
                      <span className="text-text-muted mx-2">-</span>
                      <span className="text-body text-text-primary font-medium">{corr.time_out || '--:--'}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-body text-text-secondary max-w-xs truncate" title={corr.reason}>{corr.reason}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={corr.status === 'approved' ? 'success' : corr.status === 'rejected' ? 'danger' : 'warning'}>
                        {corr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {corr.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" className="text-success-fg hover:bg-success-subtle hover:border-success-border" onClick={() => handleApproval(corr.id, 'approved')}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="secondary" size="sm" className="text-danger-fg hover:bg-danger-subtle hover:border-danger-border" onClick={() => handleApproval(corr.id, 'rejected')}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permintaan Cuti & Izin</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border-0 shadow-none rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Jenis Pengajuan</TableHead>
                <TableHead>Rentang Waktu</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loadingLeaves ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-text-secondary mt-2">Memuat data permintaan...</p>
                  </TableCell>
                </TableRow>
              ) : leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                    Tidak ada permintaan cuti & izin.
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((leave: any) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-xs">
                          {leave.employee?.first_name?.charAt(0)}{leave.employee?.last_name ? leave.employee.last_name.charAt(0) : ''}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {leave.employee?.first_name} {leave.employee?.last_name || ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{leave.type === 'annual' ? 'Cuti Tahunan' : leave.type}</TableCell>
                    <TableCell>
                      <span className="text-body text-text-primary font-medium">{leave.start_date}</span>
                      <span className="text-text-muted mx-2">-</span>
                      <span className="text-body text-text-primary font-medium">{leave.end_date}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-body text-text-secondary max-w-xs truncate" title={leave.reason}>{leave.reason}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}>
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {leave.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" className="text-success-fg hover:bg-success-subtle hover:border-success-border" onClick={() => handleLeaveApproval(leave.id, 'approved')}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="secondary" size="sm" className="text-danger-fg hover:bg-danger-subtle hover:border-danger-border" onClick={() => handleLeaveApproval(leave.id, 'rejected')}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
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
  );
}
