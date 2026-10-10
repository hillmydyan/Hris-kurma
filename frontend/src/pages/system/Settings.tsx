import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { Save } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1 text-text-primary">Pengaturan Sistem</h1>
          <p className="text-body text-text-secondary">Konfigurasi dasar sistem HRIS perusahaan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" leftIcon={<Save className="w-4 h-4" />}>
            Simpan Perubahan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                <a href="#umum" className="flex items-center px-3 py-2 text-label text-primary bg-primary-soft rounded-sm">Umum</a>
                <a href="#absensi" className="flex items-center px-3 py-2 text-label text-text-secondary hover:bg-subtle rounded-sm">Kebijakan Absensi</a>
                <a href="#cuti" className="flex items-center px-3 py-2 text-label text-text-secondary hover:bg-subtle rounded-sm">Pengaturan Cuti</a>
              </nav>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card id="umum">
            <CardHeader>
              <CardTitle>Profil Perusahaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nama Perusahaan" defaultValue="Kurma Group" required />
                <Input label="Nomor Telepon Utama" defaultValue="021-12345678" />
                <div className="md:col-span-2">
                  <Input label="Alamat Kantor Pusat" defaultValue="Jl. Sudirman No. 123, Jakarta Selatan" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="absensi">
            <CardHeader>
              <CardTitle>Kebijakan Kehadiran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Jam Mulai Kerja (Clock In)" type="time" defaultValue="08:00" required />
                <Input label="Jam Selesai Kerja (Clock Out)" type="time" defaultValue="17:00" required />
                <Input label="Toleransi Keterlambatan (Menit)" type="number" defaultValue="15" />
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-subtle rounded-sm">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded-sm border-border-input focus:ring-primary-ring" />
                    <span className="text-body text-text-primary">Wajibkan foto selfie saat absensi</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
