/**
 * Utility untuk validasi dan kompresi/resize gambar sisi client
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateProfileImage(file: File): ImageValidationResult {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const validExtension = /\.(jpg|jpeg|png|webp)$/i.test(fileName);

  if (!ALLOWED_IMAGE_TYPES.includes(fileType) && !validExtension) {
    return {
      isValid: false,
      error: 'Format file tidak didukung. Harap pilih file JPG, JPEG, PNG, atau WEBP.'
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'Ukuran foto melebihi 2 MB. Harap pilih foto dengan ukuran maksimal 2 MB.'
    };
  }

  return { isValid: true };
}

/**
 * Resize dan kompres gambar ke maksimal 512x512 px dengan rasio proporsional
 */
export function resizeImageToMax512(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 512;
        const maxHeight = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context tidak tersedia'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Gagal mengompresi gambar'));
            }
          },
          mimeType,
          0.88
        );
      };

      img.onerror = () => reject(new Error('Gagal memuat gambar untuk di-resize'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
}

/**
 * Helper untuk mendapatkan inisial 2 huruf dari nama
 */
export function getTwoLetterInitials(name?: string): string {
  if (!name) return 'KG';
  const clean = name.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ').filter(Boolean);

  if (parts.length === 0) return 'KG';
  if (parts.length === 1) {
    const single = parts[0];
    return single.length >= 2 ? single.slice(0, 2).toUpperCase() : single.toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Palet warna harmonis & konsisten per orang berdasarkan nama/ID
 */
const COLOR_PALETTES = [
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
];

export function getConsistentAvatarPalette(identifier?: string | number): {
  bg: string;
  text: string;
  border: string;
} {
  if (!identifier) return COLOR_PALETTES[0];
  const str = String(identifier);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
}

/**
 * Memastikan URL foto storage selalu diarahkan ke backend host (misal http://localhost:8000)
 * bukan ke host Vite frontend (http://localhost:5173).
 */
export function resolveStorageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Jika sudah merupakan absolute URL, blob, atau data url
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';
  const backendBase = apiUrl.replace(/\/api\/?$/, '');

  let path = trimmed;
  // Jika path belum diawali dengan storage/ atau /storage, tambahkan /storage/
  if (!path.startsWith('/storage') && !path.startsWith('storage')) {
    path = '/storage/' + path.replace(/^\/+/, '');
  } else if (!path.startsWith('/')) {
    path = '/' + path;
  }

  return `${backendBase}${path}`;
}
