import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { Tabs } from '../components/ui/Tabs';
import { Modal, ConfirmFooter } from '../components/ui/Modal';
import { Mail, Search, Bell, Inbox } from 'lucide-react';

export function DesignSystem() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'components' | 'data'>('components');
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in">
      <header className="flex items-center justify-between border-b border-border-default pb-6">
        <div>
          <h1 className="h1 text-primary">HRIS Kurma Group UI</h1>
          <p className="text-text-secondary text-body">Design System & Komponen Dasar (D-01, D-02, D-03)</p>
        </div>
      </header>

      <Tabs 
        activeTab={activeTab} 
        onChange={(id) => setActiveTab(id as any)}
        tabs={[
          { id: 'tokens', label: 'Tokens (D-01)' },
          { id: 'components', label: 'Komponen (D-02)' },
          { id: 'data', label: 'Data & Tabel (D-03)' }
        ]}
      />

      <div className="pt-6">
        {activeTab === 'tokens' && <TokenGallery />}
        {activeTab === 'components' && (
          <ComponentGallery onOpenModal={() => setModalOpen(true)} />
        )}
        {activeTab === 'data' && <DataGallery />}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)}
        title="Konfirmasi Tindakan"
        footer={<ConfirmFooter onCancel={() => setModalOpen(false)} onConfirm={() => setModalOpen(false)} />}
      >
        <p>Apakah Anda yakin ingin menyimpan perubahan ini ke sistem? Perubahan yang disimpan tidak bisa dibatalkan.</p>
      </Modal>
    </div>
  );
}

function ComponentGallery({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      
      {/* ALERTS */}
      <section className="space-y-4">
        <h2 className="h2 text-text-primary">Alerts (C-10)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert variant="info" title="Informasi Baru">Sistem akan mengalami pemeliharaan rutin pada hari Sabtu pukul 02:00 WIB.</Alert>
          <Alert variant="success" title="Berhasil" onClose={() => {}}>Data karyawan berhasil diperbarui.</Alert>
          <Alert variant="warning" title="Perhatian" onClose={() => {}}>Ada 3 pengajuan cuti yang menunggu persetujuan Anda.</Alert>
          <Alert variant="danger" title="Gagal Menyimpan">Koneksi terputus. Silakan periksa jaringan Anda dan coba lagi.</Alert>
        </div>
      </section>

      {/* BUTTONS */}
      <section className="space-y-4">
        <h2 className="h2 text-text-primary">Buttons (C-01)</h2>
        <Card>
          <CardContent className="flex flex-wrap items-end gap-4">
            <Button variant="primary">Ajukan Cuti</Button>
            <Button variant="secondary">Ekspor</Button>
            <Button variant="danger">Tolak</Button>
            <Button variant="text">Lihat Detail</Button>
            
            <div className="w-full border-t border-border-default my-2"></div>
            
            <Button variant="primary" leftIcon={<Mail className="w-4 h-4" />}>Kirim Pesan</Button>
            <Button variant="secondary" isLoading>Menyimpan</Button>
            <Button variant="primary" disabled>Nonaktif</Button>
            <Button variant="primary" onClick={onOpenModal}>Buka Modal Konfirmasi</Button>
          </CardContent>
        </Card>
      </section>

      {/* INPUTS */}
      <section className="space-y-4">
        <h2 className="h2 text-text-primary">Inputs (C-02)</h2>
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nama Lengkap" placeholder="Masukkan nama" required />
            <Input label="Email Kerja" type="email" placeholder="nama@kurmagroup.id" leftIcon={<Mail className="w-5 h-5" />} />
            <Input label="Pencarian" placeholder="Cari karyawan..." leftIcon={<Search className="w-5 h-5" />} />
            <Input label="Nomor KTP" error="Nomor KTP harus 16 digit" placeholder="16 digit angka" defaultValue="12345" />
          </CardContent>
        </Card>
      </section>

      {/* BADGES */}
      <section className="space-y-4">
        <h2 className="h2 text-text-primary">Badges (C-05)</h2>
        <Card>
          <CardContent className="flex flex-wrap gap-4">
            <Badge variant="success" dot>Hadir</Badge>
            <Badge variant="warning">Terlambat 11 mnt</Badge>
            <Badge variant="danger" dot>Alpa</Badge>
            <Badge variant="info">Cuti</Badge>
            <Badge variant="violet">Sakit</Badge>
            <Badge variant="sky">Izin</Badge>
            <Badge variant="orange">Lupa clock-out</Badge>
            <Badge variant="neutral">Belum absen</Badge>
          </CardContent>
        </Card>
      </section>
      
      {/* CARDS */}
      <section className="space-y-4">
        <h2 className="h2 text-text-primary">Cards (C-03)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Kehadiran Tim</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-display">12</p>
              <p className="text-text-muted text-caption">Karyawan hadir hari ini</p>
            </CardContent>
          </Card>
          
          <Card onClick={() => alert('Card ditekan!')}>
            <CardContent className="flex items-center justify-between">
              <div>
                <h3 className="h3">Tugas Baru</h3>
                <p className="text-text-muted text-caption">Klik untuk membuka detail (Hover effect)</p>
              </div>
              <Bell className="text-primary w-6 h-6" />
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}

function DataGallery() {
  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      
      <section className="space-y-4">
        <h2 className="h2 text-text-primary">Tabel (C-04)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Karyawan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            <TableRow>
              <TableCell>Ahmad Fajri</TableCell>
              <TableCell><Badge variant="success" dot>Hadir</Badge></TableCell>
              <TableCell>07:58</TableCell>
              <TableCell>17:05</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Budi Santoso</TableCell>
              <TableCell><Badge variant="warning">Terlambat</Badge></TableCell>
              <TableCell>08:15</TableCell>
              <TableCell>17:02</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Citra Lestari</TableCell>
              <TableCell><Badge variant="info">Cuti</Badge></TableCell>
              <TableCell>-</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          </tbody>
        </Table>
        
        <Pagination 
          currentPage={1} 
          totalPages={5} 
          totalItems={45} 
          itemsPerPage={10} 
          onPageChange={() => {}} 
        />
      </section>

      <section className="space-y-4">
        <h2 className="h2 text-text-primary">Keadaan Kosong (C-15)</h2>
        <EmptyState 
          icon={<Inbox className="w-12 h-12" />}
          title="Tidak ada data kehadiran"
          description="Belum ada catatan kehadiran untuk rentang waktu yang dipilih."
          actionLabel="Hapus Filter"
          onAction={() => {}}
        />
      </section>

    </div>
  )
}

function TokenGallery() {
  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      <section className="space-y-6">
        <h2 className="h2 text-primary">1. Warna Netral & Aksen</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <ColorSwatch label="bg-page" color="bg-page" border />
          <ColorSwatch label="bg-surface" color="bg-surface" border />
          <ColorSwatch label="bg-subtle" color="bg-subtle" border />
          <ColorSwatch label="text-primary" color="bg-text-primary" textColor="text-surface" />
          <ColorSwatch label="text-secondary" color="bg-text-secondary" textColor="text-surface" />
          <ColorSwatch label="text-muted" color="bg-text-muted" textColor="text-surface" />
          <ColorSwatch label="text-placeholder" color="bg-text-placeholder" textColor="text-surface" />
          <ColorSwatch label="primary" color="bg-primary" textColor="text-surface" />
          <ColorSwatch label="primary-hover" color="bg-primary-hover" textColor="text-surface" />
          <ColorSwatch label="primary-soft" color="bg-primary-soft" textColor="text-primary" />
          <ColorSwatch label="primary-ring" color="bg-primary-ring" textColor="text-surface" />
          <ColorSwatch label="danger" color="bg-danger" textColor="text-surface" />
          <ColorSwatch label="danger-hover" color="bg-danger-hover" textColor="text-surface" />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="h2 text-primary">2. Warna Semantik (Badge / Alert)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <SemanticSwatch label="Success" bg="bg-success-bg" fg="text-success-fg" />
          <SemanticSwatch label="Warning" bg="bg-warning-bg" fg="text-warning-fg" />
          <SemanticSwatch label="Danger" bg="bg-danger-bg" fg="text-danger-fg" />
          <SemanticSwatch label="Info" bg="bg-info-bg" fg="text-info-fg" />
          <SemanticSwatch label="Violet" bg="bg-violet-bg" fg="text-violet-fg" />
          <SemanticSwatch label="Sky" bg="bg-sky-bg" fg="text-sky-fg" />
          <SemanticSwatch label="Orange" bg="bg-orange-bg" fg="text-orange-fg" />
          <SemanticSwatch label="Neutral" bg="bg-neutral-bg" fg="text-neutral-fg" />
        </div>
      </section>
    </div>
  );
}

function ColorSwatch({ label, color, textColor = 'text-text-primary', border = false }: { label: string, color: string, textColor?: string, border?: boolean }) {
  return (
    <div className={`h-24 rounded-lg flex items-center justify-center p-3 text-center transition-transform hover:scale-105 ${color} ${textColor} ${border ? 'border border-border-default shadow-xs' : ''}`}>
      <span className="text-caption font-medium">{label}</span>
    </div>
  );
}

function SemanticSwatch({ label, bg, fg }: { label: string, bg: string, fg: string }) {
  return (
    <div className={`h-24 rounded-lg flex flex-col items-center justify-center p-3 text-center transition-transform hover:scale-105 ${bg}`}>
      <span className={`text-label ${fg}`}>{label}</span>
      <span className={`text-caption ${fg} opacity-80 mt-1 font-mono text-[10px]`}>{bg} / {fg}</span>
    </div>
  );
}
