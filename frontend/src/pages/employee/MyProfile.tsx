import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  User, 
  Briefcase, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export function MyProfile() {
  const { user } = useAuth();
  const emp = user?.employee;
  const assignment = emp?.current_assignment;

  // Form State untuk Ubah Kata Sandi
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '15 Januari 2024';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/user/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      setSuccessMsg(res.data?.message || 'Kata sandi berhasil diubah.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Change password error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Gagal mengubah kata sandi. Periksa kata sandi saat ini.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[960px] mx-auto animate-in fade-in duration-200">
      {/* Judul Halaman */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          Profil Saya
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Data identitas kepegawaian dan pengaturan keamanan akun Anda
        </p>
      </div>

      {/* Header Profil: Kartu Putih Sederhana & Avatar Inisial */}
      <Card className="border-border-default shadow-xs bg-surface">
        <CardContent className="p-4 sm:p-5 flex items-center gap-4">
          {/* Avatar Bulat Berisi Inisial */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary-soft text-primary font-bold text-xl sm:text-2xl flex items-center justify-center border border-primary/20 shrink-0 select-none">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          {/* Nama, Status, & Jabatan / Departemen */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-text-primary truncate">
                {user?.name || 'Karyawan'}
              </h2>
              <Badge variant="success" dot className="shrink-0">
                Aktif
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-1 truncate">
              {assignment?.job_position?.name || 'Staff'} · {assignment?.department?.name || 'Kurma Group'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Kartu Informasi: Dua Kolom Berdampingan di Desktop, Satu Kolom di HP */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Kartu Penugasan */}
          <Card className="h-full border-border-default shadow-xs bg-surface">
            <CardHeader className="py-3 px-4 sm:px-5 border-b border-border-default">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-text-primary">
                <Briefcase className="w-4 h-4 text-text-muted shrink-0" />
                Penugasan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="divide-y divide-border-default">
                <div className="pb-3 first:pt-0">
                  <p className="text-xs text-text-muted">ID Karyawan</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {emp?.employee_id || 'EMP-001'}
                  </p>
                </div>
                <div className="py-3">
                  <p className="text-xs text-text-muted">Departemen</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {assignment?.department?.name || 'Kurma Group'}
                  </p>
                </div>
                <div className="py-3">
                  <p className="text-xs text-text-muted">Jabatan</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {assignment?.job_position?.name || 'Staff'}
                  </p>
                </div>
                <div className="py-3">
                  <p className="text-xs text-text-muted">Lokasi Kerja</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {assignment?.work_location?.name || 'Kantor Pusat Jakarta'}
                  </p>
                </div>
                <div className="pt-3 last:pb-0">
                  <p className="text-xs text-text-muted">Tanggal Bergabung</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {formatDateIndo(emp?.join_date)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Kartu Kontak & Akun */}
          <Card className="h-full border-border-default shadow-xs bg-surface">
            <CardHeader className="py-3 px-4 sm:px-5 border-b border-border-default">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-text-primary">
                <User className="w-4 h-4 text-text-muted shrink-0" />
                Kontak & Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="divide-y divide-border-default">
                <div className="pb-3 first:pt-0">
                  <p className="text-xs text-text-muted">Email Kerja</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5 break-all">
                    {user?.email || '-'}
                  </p>
                </div>
                <div className="py-3">
                  <p className="text-xs text-text-muted">Nomor Telepon</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">
                    {emp?.phone || '0812-3456-7890'}
                  </p>
                </div>
                <div className="py-3">
                  <p className="text-xs text-text-muted">Hak Akses</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5 capitalize">
                    {user?.roles?.[0] || 'Karyawan'}
                  </p>
                </div>
                <div className="pt-3 last:pb-0">
                  <p className="text-xs text-text-muted">Status Akun</p>
                  <div className="mt-1">
                    <Badge variant="success" dot>
                      Terverifikasi
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keterangan Bantuan HR */}
        <p className="text-xs text-text-muted mt-2.5">
          Data dikelola HR. Hubungi HR kalau ada yang perlu diperbaiki.
        </p>
      </div>

      {/* 3. Kartu Kata Sandi */}
      <Card className="border-border-default shadow-xs bg-surface">
        <CardHeader className="py-3 px-4 sm:px-5 border-b border-border-default">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-text-primary">
            <Key className="w-4 h-4 text-text-muted shrink-0" />
            Kata Sandi
          </CardTitle>
          <p className="text-xs text-text-muted mt-0.5">
            Ubah kata sandi secara berkala untuk menjaga keamanan akun Anda.
          </p>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {successMsg && (
            <div className="mb-4 p-3 rounded-md bg-success-soft border border-success-border text-success-fg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success-fg" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-md bg-danger-soft border border-danger-border text-danger-fg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-danger-fg" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {/* Kata Sandi Saat Ini */}
            <div className="space-y-1.5">
              <label htmlFor="current_password" className="text-xs font-medium text-text-primary block">
                Kata Sandi Saat Ini <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="current_password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama Anda"
                  className="w-full h-11 sm:h-10 px-3 pr-10 rounded-md border border-border-default bg-surface text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label={showCurrent ? 'Sembunyikan kata sandi saat ini' : 'Tampilkan kata sandi saat ini'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center rounded"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Kata Sandi Baru */}
            <div className="space-y-1.5">
              <label htmlFor="new_password" className="text-xs font-medium text-text-primary block">
                Kata Sandi Baru <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="new_password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
                  className="w-full h-11 sm:h-10 px-3 pr-10 rounded-md border border-border-default bg-surface text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center rounded"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-text-muted">
                Minimal 6 karakter
              </p>
            </div>

            {/* Konfirmasi Kata Sandi Baru */}
            <div className="space-y-1.5">
              <label htmlFor="confirm_password" className="text-xs font-medium text-text-primary block">
                Konfirmasi Sandi Baru <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi sandi baru"
                  className="w-full h-11 sm:h-10 px-3 pr-10 rounded-md border border-border-default bg-surface text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center rounded"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tombol Simpan */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full sm:w-auto h-11 sm:h-10 text-sm font-medium px-6"
              >
                {loading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
