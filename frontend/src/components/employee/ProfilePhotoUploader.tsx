import React, { useState, useRef } from 'react';
import { Camera, Check, X, Loader2, AlertCircle, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { ImagePreviewModal } from '../ui/ImagePreviewModal';
import { validateProfileImage, resizeImageToMax512 } from '../../utils/imageUtils';
import api from '../../lib/api';

export interface ProfilePhotoUploaderProps {
  employeeId: number | string;
  currentPhotoUrl?: string | null;
  name?: string;
  size?: 'lg' | 'xl';
  onSuccess?: (newPhotoUrl: string) => void;
  className?: string;
}

export function ProfilePhotoUploader({
  employeeId,
  currentPhotoUrl,
  name,
  size = 'xl',
  onSuccess,
  className = '',
}: ProfilePhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Sync jika currentPhotoUrl berubah dari luar
  React.useEffect(() => {
    if (currentPhotoUrl !== undefined) {
      setPhotoUrl(currentPhotoUrl);
    }
  }, [currentPhotoUrl]);

  const handleTriggerPicker = () => {
    if (isUploading) return;
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe dan ukuran (maks 2 MB)
    const validation = validateProfileImage(file);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'File tidak valid');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSavePhoto = async () => {
    if (!selectedFile || !employeeId) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Kompres / resize sisi client ke maks 512x512 px
      const resizedBlob = await resizeImageToMax512(selectedFile);
      const compressedFile = new File([resizedBlob], selectedFile.name, {
        type: resizedBlob.type,
      });

      const formData = new FormData();
      formData.append('photo', compressedFile);

      const response = await api.post(`/employees/${employeeId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const savedUrl = response.data?.photo_url;
      setPhotoUrl(savedUrl);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onSuccess && savedUrl) {
        onSuccess(savedUrl);
      }
    } catch (err: any) {
      console.error('Upload photo error:', err);
      const serverMsg =
        err.response?.data?.errors?.photo?.[0] ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Gagal mengunggah foto profil. Silakan coba lagi.';
      setErrorMessage(serverMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const isPreviewing = Boolean(previewUrl);
  const activePhotoSrc = previewUrl || photoUrl;
  const hasPhoto = Boolean(activePhotoSrc);

  const containerDimension =
    size === 'xl' ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-14 h-14 sm:w-16 sm:h-16';

  const handleAvatarClick = () => {
    if (isUploading) return;
    if (hasPhoto) {
      setIsPreviewModalOpen(true);
    } else {
      handleTriggerPicker();
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Circular Profile Picture with Hover Overlay & Click to Preview */}
      <div className="relative group shrink-0">
        <div
          className={`${containerDimension} rounded-full overflow-hidden relative flex items-center justify-center`}
        >
          <Avatar
            src={activePhotoSrc}
            name={name}
            idKey={employeeId}
            size={size}
            className="w-full h-full"
          />

          {/* Hover Overlay "Lihat Foto" / "Unggah Foto" */}
          {!isUploading && (
            <button
              type="button"
              onClick={handleAvatarClick}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer select-none rounded-full"
              title={hasPhoto ? "Klik untuk melihat foto lebih besar" : "Klik untuk mengunggah foto"}
              aria-label={hasPhoto ? "Lihat Foto Profil" : "Unggah Foto Profil"}
            >
              {hasPhoto ? (
                <>
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-white" />
                  <span className="text-[10px] sm:text-[11px] font-medium leading-tight">Lihat Foto</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-white" />
                  <span className="text-[10px] sm:text-[11px] font-medium leading-tight">Unggah Foto</span>
                </>
              )}
            </button>
          )}

          {/* Uploading Spinner */}
          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-20 rounded-full">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-white mb-1" />
              <span className="text-[10px] font-medium">Menyimpan...</span>
            </div>
          )}
        </div>

        {/* Small floating camera badge to directly change photo */}
        {!isUploading && (
          <button
            type="button"
            onClick={handleTriggerPicker}
            className="absolute -bottom-0.5 -right-0.5 p-1 sm:p-1.5 rounded-full bg-primary text-white border-2 border-surface shadow-xs hover:bg-primary-hover transition-colors select-none z-10 cursor-pointer"
            title="Ubah Foto"
            aria-label="Ubah Foto"
          >
            <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        )}
      </div>

      {/* Tombol Simpan & Batal saat Preview File */}
      {isPreviewing && !isUploading && (
        <div className="mt-3 flex items-center gap-2 animate-in fade-in duration-150">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Check className="w-3.5 h-3.5" />}
            onClick={handleSavePhoto}
            className="h-8 text-xs px-3 font-medium"
          >
            Simpan
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<X className="w-3.5 h-3.5" />}
            onClick={handleCancelPreview}
            className="h-8 text-xs px-2.5 font-medium text-text-muted hover:text-text-primary"
          >
            Batal
          </Button>
        </div>
      )}

      {/* Pesan Error di Bawah Foto jika tidak sesuai */}
      {errorMessage && (
        <div className="mt-2.5 flex items-start gap-1.5 text-danger text-xs text-center max-w-[240px] leading-tight animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pop-up Modal Pratinjau Gambar */}
      <ImagePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        src={activePhotoSrc}
        title={name ? `Foto Profil - ${name}` : 'Foto Profil'}
        onReplacePhoto={handleTriggerPicker}
        replaceButtonText="Ganti Foto"
      />
    </div>
  );
}
