import React, { useEffect, useState } from 'react';
import { X, Camera, ExternalLink, Download } from 'lucide-react';
import { Button } from './Button';
import { resolveStorageUrl } from '../../utils/imageUtils';

export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  src?: string | null;
  title?: string;
  subtitle?: string;
  onReplacePhoto?: () => void;
  replaceButtonText?: string;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  src,
  title = 'Foto Profil',
  subtitle,
  onReplacePhoto,
  replaceButtonText = 'Ganti Foto',
}: ImagePreviewModalProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const resolvedSrc = resolveStorageUrl(src);

  // Kunci scrolling latar saat modal terbuka & listener Escape key
  useEffect(() => {
    if (!isOpen) {
      setIsLoaded(false);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !resolvedSrc) return null;

  const handleOpenExternal = () => {
    if (resolvedSrc) {
      window.open(resolvedSrc, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    if (!resolvedSrc) return;
    const a = document.createElement('a');
    a.href = resolvedSrc;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_') || 'foto_profil'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop Gelap dengan Efek Blur Halus */}
      <div
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Kontainer Modal */}
      <div className="relative w-full max-w-xl bg-surface rounded-xl sm:rounded-2xl shadow-xl border border-border-default overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-border-default flex items-center justify-between bg-surface shrink-0">
          <div className="min-w-0 pr-3">
            <h2 className="text-sm sm:text-base font-semibold text-text-primary truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-text-secondary truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Buka di Tab Baru */}
            <button
              type="button"
              onClick={handleOpenExternal}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Buka gambar di tab baru"
              aria-label="Buka di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Unduh Foto */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Unduh foto"
              aria-label="Unduh foto"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary min-w-[32px] min-h-[32px] flex items-center justify-center ml-1"
              title="Tutup (Esc)"
              aria-label="Tutup pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Area Tampilan Gambar Tengah */}
        <div className="relative p-4 sm:p-6 flex items-center justify-center bg-slate-950/5 min-h-[260px] sm:min-h-[360px] overflow-auto flex-1">
          {/* Skeleton / Placeholder saat loading gambar */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <img
            src={resolvedSrc}
            alt={title}
            onLoad={() => setIsLoaded(true)}
            className={`max-h-[60vh] sm:max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-sm border border-border-default/60 transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* Footer Modal: Tombol Tutup & Ganti Foto (jika ada handler) */}
        <div className="px-5 py-3 border-t border-border-default bg-subtle/50 flex items-center justify-between gap-3 shrink-0">
          <div>
            {onReplacePhoto && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Camera className="w-4 h-4 text-primary" />}
                onClick={() => {
                  onClose();
                  onReplacePhoto();
                }}
                className="text-xs font-medium"
              >
                {replaceButtonText}
              </Button>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="text-xs font-medium px-4"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
