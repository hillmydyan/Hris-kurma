import React, { useState, useEffect, useRef } from 'react';
import { CustomQrCode } from '../../components/ui/CustomQrCode';
import { 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  Maximize2,
  Minimize2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/api';

export function QrScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(45);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [tokenRefreshCount, setTokenRefreshCount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [qrSize, setQrSize] = useState<number>(280);

  // Live Clock updater (format titik dua konsisten HH:mm:ss WIB)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());
      
      setCurrentTime(`${hours}:${minutes}:${seconds} WIB`);
      setCurrentDate(
        now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Responsive QR Size calculation based on viewport height & fullscreen mode
  useEffect(() => {
    const calculateQrSize = () => {
      const vh = window.innerHeight;
      if (document.fullscreenElement) {
        // Mode layar penuh: QR membesar mengikuti layar TV
        const target = Math.floor(vh * 0.44);
        setQrSize(Math.max(300, Math.min(target, 440)));
      } else {
        // Mode normal: sekitar 36-40% tinggi layar, min 280px
        const target = Math.floor(vh * 0.38);
        setQrSize(Math.max(280, Math.min(target, 320)));
      }
    };

    calculateQrSize();
    window.addEventListener('resize', calculateQrSize);
    return () => window.removeEventListener('resize', calculateQrSize);
  }, [isFullscreen]);

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fetch QR Token
  const fetchNewToken = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/attendance/qr-code');
      setToken(res.data.token);
      setCountdown(res.data.refresh_interval_seconds || 45);
      setTokenRefreshCount((prev) => prev + 1);
      setIsError(false);
    } catch (err) {
      console.error('Failed to generate dynamic QR token:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNewToken();
  }, []);

  // Countdown & auto-refresh 45s
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchNewToken();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch((err) => console.error(err));
      } else {
        document.documentElement.requestFullscreen().catch((err) => console.error(err));
      }
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`
        w-full bg-surface border border-border-default rounded-xl shadow-xs flex flex-col justify-between items-center text-center
        ${isFullscreen 
          ? 'fixed inset-0 z-50 rounded-none border-0 p-6 sm:p-8 bg-surface overflow-y-auto' 
          : 'p-5 sm:p-6 max-w-2xl mx-auto my-auto'
        }
      `}
    >
      {/* 1. Header: Logo KG + Judul Layar + Badge Status + Tombol Fullscreen */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-border-default shrink-0">
        <div className="flex items-center text-left gap-3">
          <img 
            src="/logo.ico" 
            alt="Logo Kurma Group" 
            className="w-8 h-8 rounded-md object-contain shrink-0" 
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-text-primary tracking-tight leading-tight">
              Layar Absensi Kurma Group
            </h1>
            <p className="text-xs text-text-muted leading-tight mt-0.5">
              Absen Pagi (Masuk) dan Absen Sore (Pulang)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isError ? (
            <Badge variant="danger" dot className="px-2.5 py-0.5 text-xs font-medium">
              Koneksi Terputus
            </Badge>
          ) : (
            <Badge variant="success" dot className="px-2.5 py-0.5 text-xs font-medium">
              QR Aktif
            </Badge>
          )}

          <button
            type="button"
            onClick={handleFullscreen}
            className="p-2 rounded-md hover:bg-subtle text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label={isFullscreen ? 'Keluar layar penuh' : 'Mode layar penuh'}
            title={isFullscreen ? 'Keluar layar penuh' : 'Mode layar penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Jam & Tanggal (Teks paling besar, angka tabular tidak goyang, format HH:mm:ss WIB) */}
      <div className="py-2.5 sm:py-3 shrink-0 space-y-0.5">
        <div className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold text-text-primary tracking-tight tabular-nums">
          {currentTime || '08:00:00 WIB'}
        </div>
        <p className="text-xs sm:text-sm text-text-secondary font-medium">
          {currentDate}
        </p>
      </div>

      {/* 3. QR Code: Hitam di atas putih polos dengan margin putih, tanpa logo/efek */}
      <div className="shrink-0 flex flex-col items-center">
        {isLoading && !token ? (
          <div className="p-4 bg-white border border-border-default rounded-2xl shadow-xs flex items-center justify-center">
            <div 
              style={{ width: qrSize, height: qrSize }} 
              className="flex flex-col items-center justify-center text-text-muted space-y-2"
            >
              <RefreshCw className="w-7 h-7 animate-spin text-primary" />
              <p className="text-xs font-medium">Memuat kode QR...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="p-4 bg-white border border-border-default rounded-2xl shadow-xs flex items-center justify-center">
            <div 
              style={{ width: qrSize, height: qrSize }} 
              className="flex flex-col items-center justify-center text-center p-4"
            >
              <AlertCircle className="w-8 h-8 text-danger mb-2" />
              <p className="text-xs font-semibold text-text-primary">Gagal Memuat Kode QR</p>
              <p className="text-[11px] text-text-muted mt-0.5 max-w-[200px]">
                Koneksi server terputus. Pastikan terminal terhubung ke jaringan kantor.
              </p>
              <button
                type="button"
                onClick={fetchNewToken}
                className="mt-3 px-3 py-1.5 rounded-md bg-subtle hover:bg-page text-xs font-medium text-text-primary border border-border-default transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        ) : (
          <CustomQrCode
            value={token}
            size={qrSize}
            color="#0F4C3A"
            showBrandLabel={true}
            brandText="KURMA GROUP"
            className="border border-slate-200/90 shadow-sm"
          />
        )}

        {/* 4. Hitung Mundur: Teks + progress bar tipis lebar tetap */}
        <div className="mt-3 w-[280px] space-y-1.5">
          <div className="text-xs font-medium text-text-muted tabular-nums">
            Kode baru dalam <span className="font-semibold text-text-primary">{countdown} detik</span>
          </div>
          <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden border border-border-default/60">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full" 
              style={{ width: `${Math.max(0, Math.min(100, (countdown / 45) * 100))}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 5. Petunjuk: Satu kalimat utama jelas + keterangan keamanan abu-abu */}
      <div className="py-2 shrink-0 space-y-0.5">
        <p className="text-sm font-semibold text-text-primary">
          Arahkan kamera HP ke kode QR untuk absen
        </p>
        <p className="text-xs text-text-muted">
          Kode QR berganti otomatis setiap 45 detik untuk memastikan kehadiran langsung di kantor.
        </p>
      </div>

      {/* 6. Info Jam Absen: Dua kotak kecil berdampingan dengan gaya netral seragam */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md shrink-0">
        <div className="bg-subtle border border-border-default rounded-md px-3.5 py-2 text-left">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Absen Pagi (Masuk)
          </p>
          <p className="text-xs font-medium text-text-primary mt-0.5">
            08:00 WIB (Toleransi s/d 08:15)
          </p>
        </div>
        <div className="bg-subtle border border-border-default rounded-md px-3.5 py-2 text-left">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Absen Sore (Pulang)
          </p>
          <p className="text-xs font-medium text-text-primary mt-0.5">
            Mulai Pukul 16:00 WIB
          </p>
        </div>
      </div>

      {/* 7. Catatan Server & Nomor Token */}
      <div className="pt-3 mt-1 border-t border-border-default w-full text-[11px] text-text-muted flex items-center justify-center gap-1.5 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-text-muted" />
        <span>
          Verifikasi Server Kurma Group • Token #{tokenRefreshCount} {token ? `(${token.slice(0, 16)}...)` : ''}
        </span>
      </div>
    </div>
  );
}
