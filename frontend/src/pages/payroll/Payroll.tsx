import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Wallet, Download, CheckCircle, FileText } from 'lucide-react';
import { api } from '../../lib/api';

export function Payroll() {
  const [periods, setPeriods] = useState<any[]>([]);

  useEffect(() => {
    api.get('/payroll-periods').then(res => setPeriods(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Penggajian" 
        subtitle="Kelola periode penggajian, komponen, dan slip gaji karyawan."
      >
        <Button>Buat Periode Gaji</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-3 bg-primary-soft text-primary rounded-lg">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Dikeluarkan</p>
            <p className="text-xl font-bold">Rp 120.500.000</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-3 bg-success-soft text-success rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Periode Selesai</p>
            <p className="text-xl font-bold">Oktober 2026</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-5 border-b border-border-default flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-primary">Riwayat Penggajian</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle text-text-secondary text-sm">
                <th className="p-4 font-medium border-b border-border-default">Periode</th>
                <th className="p-4 font-medium border-b border-border-default">Tanggal Gaji</th>
                <th className="p-4 font-medium border-b border-border-default">Total Karyawan</th>
                <th className="p-4 font-medium border-b border-border-default">Total Pembayaran</th>
                <th className="p-4 font-medium border-b border-border-default">Status</th>
                <th className="p-4 font-medium border-b border-border-default text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {periods.map((p, idx) => (
                <tr key={idx} className="border-b border-border-default hover:bg-subtle/50 transition-colors">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4">{p.pay_date}</td>
                  <td className="p-4">42</td>
                  <td className="p-4">Rp 120.500.000</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${p.status === 'paid' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
                      Rekap
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <Card>
        <div className="p-5 border-b border-border-default">
          <h2 className="text-lg font-bold text-text-primary">Slip Gaji Saya (Oktober 2026)</h2>
          <p className="text-sm text-text-secondary mt-1">Anda dapat mengunduh slip gaji Anda pada setiap periode yang telah dibayar.</p>
        </div>
        <div className="p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded bg-subtle flex items-center justify-center">
                    <FileText className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                    <h3 className="font-medium text-text-primary">Slip Gaji - Oktober 2026</h3>
                    <p className="text-sm text-text-secondary">Diterbitkan 25 Okt 2026</p>
                </div>
            </div>
            <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />}>
                Unduh PDF
            </Button>
        </div>
      </Card>
    </div>
  );
}
