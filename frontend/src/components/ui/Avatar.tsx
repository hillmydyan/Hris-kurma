import React, { useState } from 'react';
import { getTwoLetterInitials, getConsistentAvatarPalette, resolveStorageUrl } from '../../utils/imageUtils';
import { ImagePreviewModal } from './ImagePreviewModal';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  idKey?: string | number;
  previewable?: boolean;
  onClick?: () => void;
}

const FONT_SIZE_CLASSES: Record<string, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg sm:text-xl',
  xl: 'text-2xl sm:text-3xl',
};

const DEFAULT_DIMENSION_CLASSES: Record<string, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14 sm:w-16 sm:h-16',
  xl: 'w-20 h-20 sm:w-24 sm:h-24',
};

export function Avatar({
  src,
  name,
  size = 'md',
  className = '',
  alt,
  idKey,
  previewable = false,
  onClick,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const resolvedSrc = resolveStorageUrl(src);

  // Jika URL berubah, reset error state
  const [prevSrc, setPrevSrc] = useState(resolvedSrc);
  if (prevSrc !== resolvedSrc) {
    setPrevSrc(resolvedSrc);
    setImageError(false);
  }

  const initials = getTwoLetterInitials(name);
  const palette = getConsistentAvatarPalette(idKey || name);
  
  const hasCustomDimensions = className.includes('w-') || className.includes('h-');
  const dimensionClass = hasCustomDimensions ? '' : (DEFAULT_DIMENSION_CLASSES[size] || DEFAULT_DIMENSION_CLASSES.md);
  const fontClass = FONT_SIZE_CLASSES[size] || FONT_SIZE_CLASSES.md;

  const hasValidPhoto = Boolean(resolvedSrc && !imageError);

  const handleClick = (e: React.MouseEvent) => {
    if (previewable && hasValidPhoto) {
      e.stopPropagation();
      setIsPreviewOpen(true);
    } else if (onClick) {
      onClick();
    }
  };

  const isClickable = (previewable && hasValidPhoto) || Boolean(onClick);
  const interactiveClass = isClickable ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : '';

  if (hasValidPhoto) {
    return (
      <>
        <div
          onClick={handleClick}
          className={`relative rounded-full overflow-hidden shrink-0 border border-border-default bg-subtle ${interactiveClass} ${dimensionClass} ${className}`}
          title={previewable ? `Klik untuk melihat foto ${name || ''}` : (name || 'Avatar')}
          role={isClickable ? 'button' : undefined}
          tabIndex={isClickable ? 0 : undefined}
          onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e as any); } : undefined}
        >
          <img
            src={resolvedSrc!}
            alt={alt || name || 'Avatar'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-full select-none"
            loading="lazy"
          />
        </div>

        {previewable && (
          <ImagePreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            src={resolvedSrc}
            title={name ? `Foto Profil - ${name}` : 'Foto Profil'}
          />
        )}
      </>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-full flex items-center justify-center font-bold shrink-0 select-none border ${interactiveClass} ${palette.bg} ${palette.text} ${palette.border} ${dimensionClass} ${fontClass} ${className}`}
      title={name || 'Avatar'}
      aria-label={name || 'Avatar'}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {initials}
    </div>
  );
}
