import React, { useEffect, useRef } from 'react';
import QRCodeStyling, { type Options } from 'qr-code-styling';

export interface CustomQrCodeProps {
  value: string;
  size?: number;
  color?: string; // Default: Forest green '#0F4C3A' (sesuai permintaan contoh)
  logoSrc?: string;
  showBrandLabel?: boolean;
  brandText?: string;
  id?: string;
  className?: string;
  onInstance?: (instance: QRCodeStyling) => void;
}

export const CustomQrCode: React.FC<CustomQrCodeProps> = ({
  value,
  size = 240,
  color = '#0F4C3A',
  logoSrc = '/kurma-logo-qr.png',
  showBrandLabel = true,
  brandText = 'KURMA GROUP',
  id,
  className = '',
  onInstance,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inisialisasi QRCodeStyling dengan pola titik (dots) dan sudut rounded sesuai permintaan user
    const options: Partial<Options> = {
      width: size,
      height: size,
      type: 'svg',
      data: value || 'KURMA-GROUP',
      image: logoSrc,
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'H', // Tingkat koreksi 30% agar logo & pola dot terbaca sangat cepat
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.32,
        margin: 3,
        crossOrigin: 'anonymous',
      },
      dotsOptions: {
        type: 'dots', // Pola titik-titik (dot pattern)
        color: color,
      },
      cornersSquareOptions: {
        type: 'extra-rounded', // Sudut rounded halus di 3 kotak luar
        color: color,
      },
      cornersDotOptions: {
        type: 'dot', // Titik bulat di dalam kotak sudut
        color: color,
      },
      backgroundOptions: {
        color: '#FFFFFF',
      },
    };

    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling(options);
      containerRef.current.innerHTML = '';
      qrCodeRef.current.append(containerRef.current);
      if (onInstance) {
        onInstance(qrCodeRef.current);
      }
    } else {
      qrCodeRef.current.update(options);
    }

    // Set id pada elemen SVG agar dapat diakses untuk cetak/unduh jika id diberikan
    if (id && containerRef.current) {
      const setSvgId = () => {
        if (!containerRef.current) return;
        const svgEl = containerRef.current.querySelector('svg');
        if (svgEl) {
          svgEl.setAttribute('id', id);
        }
      };
      setSvgId();
      const timer1 = setTimeout(setSvgId, 50);
      const timer2 = setTimeout(setSvgId, 250);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [value, size, color, logoSrc, id, onInstance]);

  return (
    <div
      className={`inline-flex flex-col items-center bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 transition-all ${className}`}
    >
      <div
        ref={containerRef}
        style={{ width: size, height: size }}
        className="flex items-center justify-center overflow-hidden rounded-xl bg-white"
      />
      {showBrandLabel && (
        <div className="mt-3 text-center select-none">
          <p
            className="text-[13px] font-bold tracking-[0.16em] uppercase"
            style={{ color: color }}
          >
            {brandText}
          </p>
          <div
            className="w-8 h-0.5 mx-auto mt-1 rounded-full opacity-60"
            style={{ backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
};

export default CustomQrCode;
