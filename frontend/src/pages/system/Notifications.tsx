import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Bell, Clock, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function Notifications() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div>
          <h1 className="h1 text-text-primary">Notifikasi</h1>
          <p className="text-body text-text-secondary">Pembaruan dan aktivitas terbaru Anda.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
            Tandai Semua Dibaca
          </Button>
        </div>
      </div>

      <div className="space-y-4 max-w-4xl">
        <NotificationItem 
          unread 
          icon={<AlertTriangle className="w-5 h-5" />} 
          iconBg="bg-warning-bg text-warning-fg"
          title="Tugas Terlambat"
          time="10 menit yang lalu"
          content="Tugas 'Laporan Keuangan Q3' telah melewati tenggat waktu. Segera selesaikan tugas Anda."
        />
        <NotificationItem 
          unread 
          icon={<Calendar className="w-5 h-5" />} 
          iconBg="bg-info-bg text-info-fg"
          title="Pengajuan Cuti Disetujui"
          time="2 jam yang lalu"
          content="Pengajuan Cuti Tahunan Anda untuk tanggal 24-26 Okt 2026 telah disetujui oleh Manager."
        />
        <NotificationItem 
          icon={<Clock className="w-5 h-5" />} 
          iconBg="bg-subtle text-text-muted"
          title="Koreksi Absensi Ditolak"
          time="Kemarin, 14:30"
          content="Pengajuan koreksi absensi Anda untuk tanggal 14 Okt 2026 ditolak karena kurang bukti."
        />
        <NotificationItem 
          icon={<Bell className="w-5 h-5" />} 
          iconBg="bg-primary-soft text-primary"
          title="Pembaruan Sistem HRIS"
          time="7 Okt 2026"
          content="HRIS Kurma Group telah diperbarui ke versi terbaru. Lihat halaman pembaruan untuk detail fitur baru."
        />
      </div>
    </div>
  );
}

function NotificationItem({ unread, icon, iconBg, title, time, content }: any) {
  return (
    <Card className={`transition-colors hover:bg-subtle/50 cursor-pointer ${unread ? 'border-primary-soft bg-primary-soft/10 shadow-sm' : 'shadow-none border-border-default'}`}>
      <CardContent className="p-4 sm:p-6 flex gap-4">
        <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start">
            <h4 className={`text-label ${unread ? 'text-text-primary font-semibold' : 'text-text-secondary font-medium'}`}>
              {title}
            </h4>
            <span className="text-caption text-text-muted shrink-0 ml-2">{time}</span>
          </div>
          <p className="text-body text-text-secondary">{content}</p>
          {unread && (
            <div className="mt-2">
              <Badge variant="info" dot>Baru</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
