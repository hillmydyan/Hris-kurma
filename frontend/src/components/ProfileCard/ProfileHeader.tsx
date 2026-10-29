import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, AlertCircle, CheckCircle2, Briefcase, Mail, Calendar, IdCard, Building2 } from 'lucide-react';
import { ProfileCard } from './ProfileCard';
import { Badge } from '../ui/Badge';
import { validateProfileImage } from '../../utils/imageUtils';
import { uploadProfilePhoto, deleteProfilePhoto } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';

export interface ProfileHeaderProps {
  className?: string;
}

export function ProfileHeader({ className = '' }: ProfileHeaderProps) {
  const { user, updateUserPhoto, refreshUser } = useAuth();
  const emp = user?.employee;
  const assignment = emp?.current_assignment;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Bersihkan Object URL saat komponen unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Hapus pesan sukses otomatis setelah 4 detik
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const activePhoto = previewUrl || emp?.photo_url || emp?.photo || null;
  const hasPhoto = Boolean(activePhoto);

  const handleTriggerFileSelect = () => {
    if (isUploading || isDeleting) return;
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validasi file (JPG/PNG/WebP, maks 2 MB)
    const validation = validateProfileImage(file);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'File foto tidak valid.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    // 2. Optimistic Preview langsung di kartu
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // 3. Upload ke backend
    if (!emp?.id) {
      setErrorMessage('ID Karyawan tidak ditemukan. Foto belum dapat diunggah.');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadProfilePhoto(emp.id, file);

      // 4. Sukses: update global state & navbar avatar
      updateUserPhoto(result.photo_url);
      await refreshUser();
      setSuccessMessage('Foto profil berhasil diperbarui.');

      // Bersihkan object URL lokal karena backend URL sudah aktif
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    } catch (err: any) {
      console.error('Upload profile photo error:', err);
      // 5. Gagal: rollback preview ke foto sebelumnya
      if (objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
      setPreviewUrl(null);

      const serverMsg =
        err.response?.data?.errors?.photo?.[0] ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Gagal mengunggah foto profil. Silakan coba kembali.';
      setErrorMessage(serverMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!emp?.id || isUploading || isDeleting) return;

    if (!window.confirm('Hapus foto profil ini dan kembalikan ke inisial nama?')) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteProfilePhoto(emp.id);

      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);

      // Update state global ke inisial (null)
      updateUserPhoto(null);
      await refreshUser();
      setSuccessMessage('Foto profil berhasil dihapus.');
    } catch (err: any) {
      console.error('Delete photo error:', err);
      const serverMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Gagal menghapus foto profil. Silakan coba kembali.';
      setErrorMessage(serverMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const fullName = user?.name || emp?.first_name || 'Karyawan';
  const jobPosition = assignment?.job_position?.name || 'Staff';
  const department = assignment?.department?.name || 'Kurma Group';
  const employeeId = emp?.employee_id || (emp?.id ? `KG-${String(emp.id).padStart(3, '0')}` : 'KG-EMP');
  const roleLabel = user?.roles?.[0]
    ? user.roles[0].replace('-', ' ').toUpperCase()
    : 'STAFF';

  return (
    <div
      className={`bg-surface border border-border-default rounded-xl shadow-xs p-4 sm:p-6 overflow-hidden ${className}`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload Foto Profil"
      />

      <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-6 lg:gap-8">
        {/* Kolom Kiri: ReactBits ProfileCard */}
        <div className="flex flex-col items-center shrink-0 w-full max-w-[340px]">
          <ProfileCard
            name={fullName}
            title={jobPosition}
            handle="Employee"
            status="Aktif"
            statusColor="#22c55e"
            avatarUrl={activePhoto}
            miniAvatarUrl={activePhoto}
            iconUrl="/kurma-logo-qr.svg"
            contactText={isUploading ? 'Menyimpan...' : 'Ubah Foto'}
            contactAriaLabel="Ubah foto profil"
            onContactClick={handleTriggerFileSelect}
            isUploading={isUploading}
            theme="light"
            enableTilt={true}
            enableMobileTilt={false}
            intro={true}
            className="mx-auto"
          />

          {/* Opsi Hapus Foto (hanya jika user memiliki foto) */}
          {hasPhoto && !isUploading && (
            <div className="mt-2.5 flex items-center justify-center">
              <button
                type="button"
                onClick={handleDeletePhoto}
                disabled={isDeleting}
                className="text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                title="Hapus foto dan gunakan inisial nama"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isDeleting ? 'Menghapus...' : 'Hapus Foto'}</span>
              </button>
            </div>
          )}

          {/* Pesan Error Validasi / Upload */}
          {errorMessage && (
            <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-md text-[11px] text-rose-700 flex items-start gap-1.5 w-full leading-snug animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pesan Sukses Upload / Delete */}
          {successMessage && (
            <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-800 flex items-start gap-1.5 w-full leading-snug animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Ringkasan Identitas Karyawan */}
        <div className="flex-1 flex flex-col justify-between w-full min-w-0 text-center lg:text-left pt-2 lg:pt-1">
          <div>
            {/* Header Nama & Badges */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-border-default pb-4">
              <div>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight truncate">
                    {fullName}
                  </h2>
                  <Badge variant="success" dot className="h-5 text-[10px]">
                    Aktif
                  </Badge>
                  <span className="text-[10px] font-semibold text-primary bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {roleLabel}
                  </span>
                </div>
                <p className="text-sm font-medium text-text-secondary mt-1">
                  {jobPosition} · {department}
                </p>
              </div>

              {/* Tombol Cepat Ubah Foto di Desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerFileSelect}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-primary bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="Ubah foto profil"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Menyimpan...' : 'Ubah Foto Profil'}</span>
                </button>
              </div>
            </div>

            {/* Grid Detail Identitas Ringkas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4 text-xs">
              <div className="flex items-center justify-center lg:justify-start gap-2.5 p-2.5 rounded-lg bg-subtle border border-border-default/60">
                <IdCard className="w-4 h-4 text-text-muted shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-[11px] text-text-muted leading-tight">ID Karyawan</p>
                  <p className="font-semibold text-text-primary truncate">{employeeId}</p>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2.5 p-2.5 rounded-lg bg-subtle border border-border-default/60">
                <Mail className="w-4 h-4 text-text-muted shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-[11px] text-text-muted leading-tight">Email Kerja</p>
                  <p className="font-semibold text-text-primary truncate">{user?.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2.5 p-2.5 rounded-lg bg-subtle border border-border-default/60">
                <Building2 className="w-4 h-4 text-text-muted shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-[11px] text-text-muted leading-tight">Penempatan Kerja</p>
                  <p className="font-semibold text-text-primary truncate">
                    {assignment?.work_location?.name || 'Kantor Pusat'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2.5 p-2.5 rounded-lg bg-subtle border border-border-default/60">
                <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-[11px] text-text-muted leading-tight">Tanggal Bergabung</p>
                  <p className="font-semibold text-text-primary truncate">
                    {formatDateIndo(emp?.join_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Catatan / Keterangan Privasi */}
          <div className="mt-5 pt-3 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-text-muted" />
              Identitas resmi terverifikasi sistem HRIS Kurma Group
            </span>
            <span className="text-[10px] text-text-muted bg-subtle px-2 py-0.5 rounded border border-border-default/60">
              Format: JPG, PNG, WEBP · Maks. 2 MB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
