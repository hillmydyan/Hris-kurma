import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Clock, Calendar, CheckSquare, Target, Users, TrendingUp } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1 text-text-primary">Selamat pagi, Ahmad!</h1>
          <p className="text-body text-text-secondary">Berikut adalah ringkasan aktivitas dan tugas Anda hari ini.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Clock className="w-4 h-4" />}>
            Clock In
          </Button>
          <Button variant="primary">Ajukan Cuti</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Kehadiran Bulan Ini" 
          value="18 / 22" 
          subtitle="Hari Kerja" 
          icon={<Clock className="text-info-fg" />} 
          trend="+2 hari dari bulan lalu"
          trendUp
        />
        <StatCard 
          title="Sisa Cuti Tahunan" 
          value="8" 
          subtitle="Hari" 
          icon={<Calendar className="text-success-fg" />} 
        />
        <StatCard 
          title="Tugas Aktif" 
          value="5" 
          subtitle="2 Terlambat" 
          icon={<CheckSquare className="text-warning-fg" />} 
          alert
        />
        <StatCard 
          title="Pencapaian KPI" 
          value="85%" 
          subtitle="Target: 90%" 
          icon={<Target className="text-primary" />} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - 2 spans */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Kehadiran Tim Hari Ini</CardTitle>
              <Button variant="text" size="sm">Lihat Semua</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Karyawan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-subtle flex items-center justify-center text-caption font-bold text-text-secondary">BS</div>
                        <div>
                          <p className="font-medium">Budi Santoso</p>
                          <p className="text-caption text-text-muted">Marketing</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="success" dot>Hadir</Badge></TableCell>
                    <TableCell>07:55</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-subtle flex items-center justify-center text-caption font-bold text-text-secondary">CL</div>
                        <div>
                          <p className="font-medium">Citra Lestari</p>
                          <p className="text-caption text-text-muted">Finance</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="warning">Terlambat</Badge></TableCell>
                    <TableCell>08:15</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-subtle flex items-center justify-center text-caption font-bold text-text-secondary">DA</div>
                        <div>
                          <p className="font-medium">Dian Anggraeni</p>
                          <p className="text-caption text-text-muted">HR</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="info">Cuti</Badge></TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </tbody>
              </Table>
            </CardContent>
          </Card>

        </div>

        {/* Right Column - 1 span */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Persetujuan Menunggu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-md bg-subtle hover:bg-page transition-colors cursor-pointer border border-transparent hover:border-border-default">
                <div className="w-10 h-10 rounded-full bg-warning-bg text-warning-fg flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-label">Cuti Tahunan - Budi Santoso</p>
                  <p className="text-caption text-text-muted mt-0.5">24 - 26 Okt 2026 (3 Hari)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-subtle hover:bg-page transition-colors cursor-pointer border border-transparent hover:border-border-default">
                <div className="w-10 h-10 rounded-full bg-info-bg text-info-fg flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-label">Koreksi Absensi - Dian</p>
                  <p className="text-caption text-text-muted mt-0.5">Lupa Clock Out (15 Okt)</p>
                </div>
              </div>
              <Button variant="secondary" className="w-full">Lihat Semua (4)</Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, trend, trendUp, alert }: any) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-label mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-display text-text-primary">{value}</h3>
          </div>
          <p className={`text-caption mt-1 ${alert ? 'text-danger font-medium' : 'text-text-muted'}`}>
            {subtitle}
          </p>
          {trend && (
            <p className={`text-caption mt-2 flex items-center ${trendUp ? 'text-success-fg' : 'text-danger-fg'}`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${!trendUp && 'rotate-180'}`} />
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 bg-subtle rounded-md">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
