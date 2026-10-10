import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Download, FileText, Filter, Calendar } from 'lucide-react';
import { Tabs } from '../../components/ui/Tabs';

export function Reports() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1 text-text-primary">Laporan</h1>
          <p className="text-body text-text-secondary">Ekspor dan pantau laporan kehadiran serta performa.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" leftIcon={<Download className="w-4 h-4" />}>
            Ekspor Semua Data
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs 
            activeTab="absensi"
            onChange={() => {}}
            tabs={[
              { id: 'absensi', label: 'Kehadiran' },
              { id: 'cuti', label: 'Cuti & Izin' },
              { id: 'karyawan', label: 'Data Karyawan' }
            ]}
          />
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-subtle rounded-md">
              <div className="flex-1">
                <Input label="Periode" type="month" defaultValue="2026-10" leftIcon={<Calendar className="w-4 h-4" />} />
              </div>
              <div className="flex-1">
                <div className="space-y-1.5">
                  <label className="text-label text-text-primary">Departemen</label>
                  <select className="w-full h-10 px-3 rounded-sm border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring">
                    <option value="semua">Semua Departemen</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="secondary" className="h-10">Terapkan Filter</Button>
                <Button variant="primary" className="h-10" leftIcon={<FileText className="w-4 h-4" />}>Buat Laporan</Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Total Hadir</TableHead>
                  <TableHead>Total Terlambat</TableHead>
                  <TableHead>Total Alpa</TableHead>
                  <TableHead>Total Cuti</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                <TableRow>
                  <TableCell>Ahmad Fajri (IT)</TableCell>
                  <TableCell>20</TableCell>
                  <TableCell className="text-warning-fg">2</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>0</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Budi Santoso (Marketing)</TableCell>
                  <TableCell>18</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell className="text-info-fg">4</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Citra Lestari (Finance)</TableCell>
                  <TableCell>21</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell className="text-danger-fg">1</TableCell>
                  <TableCell>0</TableCell>
                </TableRow>
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
