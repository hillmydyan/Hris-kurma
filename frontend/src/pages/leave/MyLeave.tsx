import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmFooter } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Plus, Calendar, Clock, FileText, Loader2 } from 'lucide-react';
import api from '../../lib/api';

export function MyLeave() {
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leaves');
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async () => {
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      alert('Mohon lengkapi semua field yang wajib');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/leaves', formData);
      alert('Pengajuan berhasil');
      setLeaveModalOpen(false);
      setFormData({ type: 'annual', start_date: '', end_date: '', reason: '' });
      fetchLeaves();
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Gagal mengajukan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1 text-text-primary">Cuti & Izin Saya</h1>
          <p className="text-body text-text-secondary">Kelola sisa cuti dan riwayat pengajuan Anda.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setLeaveModalOpen(true)}>
            Ajukan Cuti/Izin
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary-soft border-primary/20">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <h3 className="text-text-secondary text-label mb-2">Sisa Cuti Tahunan</h3>
            <div className="flex items-end justify-center gap-2">
              <span className="text-display text-primary">8</span>
              <span className="text-body text-text-secondary mb-1">Hari</span>
            </div>
            <p className="text-caption text-text-muted mt-2">Berlaku sampai 31 Des 2026</p>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Rekap Penggunaan Tahun Ini</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-display text-text-primary">4</p>
              <p className="text-caption text-text-secondary">Cuti Terpakai</p>
            </div>
            <div>
              <p className="text-display text-info-fg">2</p>
              <p className="text-caption text-text-secondary">Izin Sakit</p>
            </div>
            <div>
              <p className="text-display text-warning-fg">0</p>
              <p className="text-caption text-text-secondary">Izin Lainnya</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengajuan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border-0 shadow-none rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal Pengajuan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Rentang Waktu</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-text-secondary mt-2">Memuat riwayat pengajuan...</p>
                  </TableCell>
                </TableRow>
              ) : leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                    Tidak ada riwayat pengajuan.
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((leave: any) => (
                  <TableRow key={leave.id}>
                    <TableCell>{new Date(leave.created_at).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="capitalize">{leave.type === 'annual' ? 'Cuti Tahunan' : leave.type}</TableCell>
                    <TableCell>{leave.start_date} s/d {leave.end_date}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <Badge variant={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}>
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="text" size="sm" className="text-primary hover:text-primary-hover font-medium">Detail</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Ajukan Cuti / Izin"
        footer={<ConfirmFooter onCancel={() => setLeaveModalOpen(false)} onConfirm={handleSubmit} confirmText="Ajukan" isLoading={submitting} />}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-label text-text-primary">Jenis Pengajuan <span className="text-danger">*</span></label>
            <select 
              className="w-full h-10 px-3 rounded-sm border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="annual">Cuti Tahunan</option>
              <option value="sick">Izin Sakit</option>
              <option value="maternity">Cuti Melahirkan</option>
              <option value="unpaid">Cuti Di Luar Tanggungan</option>
              <option value="other">Izin Lainnya</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Tanggal Mulai" 
              type="date" 
              required 
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            />
            <Input 
              label="Tanggal Selesai" 
              type="date" 
              required 
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-label text-text-primary">Alasan <span className="text-danger">*</span></label>
            <textarea 
              className="w-full p-3 rounded-sm border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring h-24 resize-none"
              placeholder="Berikan alasan pengajuan secara singkat..."
              required
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            ></textarea>
          </div>
          <div className="space-y-1.5">
            <label className="text-label text-text-primary">Lampiran (Opsional)</label>
            <div className="w-full p-4 border-2 border-dashed border-border-default rounded-sm text-center bg-subtle hover:bg-page transition-colors cursor-pointer">
              <FileText className="w-6 h-6 text-text-muted mx-auto mb-2" />
              <p className="text-caption text-text-secondary">Klik atau seret file ke sini</p>
              <p className="text-[10px] text-text-muted mt-1">Maks. 5MB (JPG, PNG, PDF)</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
