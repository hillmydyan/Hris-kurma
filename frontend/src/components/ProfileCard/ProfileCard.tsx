import React, { memo, useEffect, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { getTwoLetterInitials } from '../../utils/imageUtils';
import './ProfileCard.css';

export interface ProfileCardProps {
  avatarUrl?: string | null;
  iconUrl?: string;
  miniAvatarUrl?: string | null;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  statusColor?: string;
  contactText?: string;
  contactIcon?: React.ReactNode;
  contactAriaLabel?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
  isUploading?: boolean;
  initials?: string;
  theme?: 'dark' | 'light';
  backdropColor?: string;
  radius?: number;
  holo?: number;
  glare?: number;
  enableTilt?: boolean;
  tiltStrength?: number;
  parallax?: number;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  intro?: boolean;
  className?: string;
}

const THEMES: Record<'dark' | 'light', Record<string, string>> = {
  dark: {
    '--pc-frame': 'rgba(30, 27, 38, 0.75)',
    '--pc-frame-edge': 'rgba(255, 255, 255, 0.1)',
    '--pc-frame-highlight': 'rgba(255, 255, 255, 0.08)',
    '--pc-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--pc-tile': 'linear-gradient(180deg, #312d3b 0%, #1e1b26 100%)',
    '--pc-tile-edge': 'rgba(255, 255, 255, 0.08)',
    '--pc-tile-highlight': 'rgba(255, 255, 255, 0.14)',
    '--pc-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--pc-ink': '#f8fafc',
    '--pc-muted': 'rgba(241, 245, 249, 0.65)',
    '--pc-hover': 'brightness(1.12)',
    '--pc-press': 'brightness(0.8)',
    '--pc-shade': 'rgba(0, 0, 0, 0.4)',
    '--pc-btn-bg': '#4f46e5',
    '--pc-btn-fg': '#ffffff',
    '--pc-btn-hover': '#4338ca',
  },
  light: {
    '--pc-frame': 'rgba(255, 255, 255, 0.94)',
    '--pc-frame-edge': 'rgba(226, 232, 240, 0.9)',
    '--pc-frame-highlight': 'rgba(255, 255, 255, 1)',
    '--pc-frame-shadow': '0 16px 36px -16px rgba(15, 23, 42, 0.12), 0 4px 12px -6px rgba(15, 23, 42, 0.06)',
    '--pc-tile': 'linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%)',
    '--pc-tile-edge': 'rgba(226, 232, 240, 0.85)',
    '--pc-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--pc-tile-shadow': '0 4px 12px -4px rgba(15, 23, 42, 0.1)',
    '--pc-ink': '#0f172a',
    '--pc-muted': 'rgba(71, 85, 105, 0.8)',
    '--pc-hover': 'brightness(0.97)',
    '--pc-press': 'brightness(0.92)',
    '--pc-shade': 'rgba(15, 23, 42, 0.08)',
    '--pc-btn-bg': '#4f46e5',
    '--pc-btn-fg': '#ffffff',
    '--pc-btn-hover': '#4338ca',
  },
};

const FOILS: Record<'dark' | 'light', Record<string, string>> = {
  dark: {
    '--pc-blend': 'color-dodge',
    '--pc-holo-filter': 'hue-rotate(0deg)',
    '--pc-sheen': 'rgba(255, 255, 255, 0.18)',
  },
  light: {
    '--pc-blend': 'multiply',
    '--pc-holo-filter': 'invert(1) hue-rotate(180deg)',
    '--pc-sheen': 'rgba(255, 255, 255, 0)',
  },
};

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><filter id='g' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>"
)}")`;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const isDarkColor = (color: string): boolean | null => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color).trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].replace(/./g, (d) => d + d) : match[1];
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
};

interface Engine {
  aim: (nx: number, ny: number, on?: boolean) => void;
  release: () => void;
  write: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  avatarUrl = '',
  iconUrl,
  miniAvatarUrl,
  name = 'Karyawan',
  title = 'Staff',
  handle = 'Employee',
  status = 'Aktif',
  statusColor = '#22c55e',
  contactText = 'Ubah Foto',
  contactIcon,
  contactAriaLabel,
  showUserInfo = true,
  onContactClick,
  isUploading = false,
  initials,
  theme = 'light',
  backdropColor,
  radius = 16,
  holo = 0.65,
  glare = 0.45,
  enableTilt = true,
  tiltStrength = 10,
  parallax = 6,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  intro = true,
  className = '',
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const settings = { enableTilt, tiltStrength, parallax, mobileTiltSensitivity, intro };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const displayInitials = initials || getTwoLetterInitials(name);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const size = { width: root.offsetWidth, height: root.offsetHeight };
    const x = { p: 0, v: 0, target: 0 };
    const y = { p: 0, v: 0, target: 0 };
    const light = { p: 0, target: 0 };
    let raf = 0;
    let last = 0;
    let slowUntil = 0;
    let touchId: number | null = null;

    const write = () => {
      const { enableTilt: tiltOn, tiltStrength: strength, parallax: depth } = settingsRef.current;
      const angle = tiltOn && !reduced ? strength : 0;
      const tilt = Math.min(1, Math.hypot(x.p, y.p));
      const style = root.style;
      style.setProperty('--pc-light-x', `${((x.p + 1) * 0.5 * size.width).toFixed(1)}px`);
      style.setProperty('--pc-light-y', `${((y.p + 1) * 0.5 * size.height).toFixed(1)}px`);
      style.setProperty('--pc-pointer-x', `${((x.p + 1) * 50).toFixed(2)}%`);
      style.setProperty('--pc-pointer-y', `${((y.p + 1) * 50).toFixed(2)}%`);
      style.setProperty('--pc-band-x', `${(50 + x.p * 15).toFixed(2)}%`);
      style.setProperty('--pc-band-y', `${(50 + y.p * 15).toFixed(2)}%`);
      style.setProperty('--pc-rotate-x', `${(y.p * angle).toFixed(3)}deg`);
      style.setProperty('--pc-rotate-y', `${(-x.p * angle).toFixed(3)}deg`);
      style.setProperty('--pc-shift-x', `${(x.p * (reduced ? 0 : depth)).toFixed(2)}px`);
      style.setProperty('--pc-shift-y', `${(y.p * (reduced ? 0 : depth)).toFixed(2)}px`);
      style.setProperty('--pc-reach', tilt.toFixed(4));
      style.setProperty('--pc-tilt', (tilt * light.p).toFixed(4));
      style.setProperty('--pc-active', light.p.toFixed(4));
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      const slow = now < slowUntil;
      const stiffness = slow ? 24 : 120;
      const damping = slow ? 9 : 16;
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        for (const axis of [x, y]) {
          axis.v += (stiffness * (axis.target - axis.p) - damping * axis.v) * h;
          axis.p += axis.v * h;
        }
      }
      const tau = light.target > light.p ? 0.18 : slow ? 0.9 : 0.45;
      light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau));
      write();
      const moving =
        Math.abs(x.target - x.p) > 0.0005 ||
        Math.abs(y.target - y.p) > 0.0005 ||
        Math.abs(x.v) > 0.0005 ||
        Math.abs(y.v) > 0.0005 ||
        Math.abs(light.target - light.p) > 0.002;
      if (moving) {
        raf = requestAnimationFrame(frame);
      } else {
        x.p = x.target;
        y.p = y.target;
        light.p = light.target;
        write();
        raf = 0;
      }
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const aim = (nx: number, ny: number, on = true) => {
      x.target = clamp(nx, -1, 1);
      y.target = clamp(ny, -1, 1);
      light.target = on ? 1 : 0;
      slowUntil = 0;
      wake();
    };

    const aimAt = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      aim(((event.clientX - rect.left) / rect.width) * 2 - 1, ((event.clientY - rect.top) / rect.height) * 2 - 1);
    };

    const release = () => aim(0, 0, false);

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') aimAt(event);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || event.pointerId === touchId) aimAt(event);
    };
    const onLeave = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') release();
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      touchId = event.pointerId;
      aimAt(event);
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== touchId) return;
      touchId = null;
      release();
    };

    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);

    const observer = new ResizeObserver(() => {
      size.width = root.offsetWidth;
      size.height = root.offsetHeight;
      write();
    });
    observer.observe(root);

    engineRef.current = { aim, release, write };

    if (settingsRef.current.intro && !reduced) {
      x.p = 0.5;
      y.p = -0.4;
      light.p = 1;
      slowUntil = performance.now() + 1200;
      write();
      wake();
    } else {
      write();
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.write();
  }, [enableTilt, tiltStrength, parallax]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enableMobileTilt) return;

    let listening = false;
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta == null || event.gamma == null) return;
      const sensitivity = settingsRef.current.mobileTiltSensitivity;
      engineRef.current?.aim((event.gamma * sensitivity) / 150, ((event.beta - 20) * sensitivity) / 150);
    };
    const listen = () => {
      if (listening) return;
      listening = true;
      window.addEventListener('deviceorientation', onOrientation);
    };
    const onClick = () => {
      const DeviceOrientationEventWithPermission = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (DeviceOrientationEventWithPermission && typeof DeviceOrientationEventWithPermission.requestPermission === 'function') {
        DeviceOrientationEventWithPermission.requestPermission()
          .then((permissionState) => {
            if (permissionState === 'granted') listen();
          })
          .catch(() => {});
      } else {
        listen();
      }
    };

    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
      window.removeEventListener('deviceorientation', onOrientation);
    };
  }, [enableMobileTilt]);

  const palette: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light';
  const foil: 'light' | 'dark' = backdropColor
    ? (isDarkColor(backdropColor) ?? palette === 'dark')
      ? 'dark'
      : 'light'
    : palette;
  const backdrop = backdropColor
    ? `linear-gradient(180deg, color-mix(in srgb, ${backdropColor}, #ffffff 12%) 0%, color-mix(in srgb, ${backdropColor}, #000000 18%) 100%)`
    : 'var(--pc-tile)';

  const activePhotoSrc = avatarUrl?.trim() || null;
  const activeMiniPhotoSrc = miniAvatarUrl?.trim() || activePhotoSrc;

  return (
    <div
      ref={rootRef}
      className={`profile-card ${className}`.trim()}
      style={{
        ...THEMES[palette],
        ...FOILS[foil],
        '--pc-radius': `${Math.max(0, radius)}px`,
        '--pc-backdrop': backdrop,
        '--pc-holo': clamp(holo, 0, 1),
        '--pc-glare': clamp(glare, 0, 1),
        '--pc-parallax': `${Math.max(0, parallax)}px`,
        '--pc-status': statusColor,
        '--pc-grain': GRAIN,
        '--pc-pattern': iconUrl ? `url("${iconUrl}")` : 'linear-gradient(#000, #000)',
        '--pc-pattern-size': iconUrl ? '180% auto' : '100% 100%',
        '--pc-holo-gain': iconUrl ? 1.25 : 0.75,
        '--pc-holo-detail': iconUrl && foil === 'dark' ? 1 : 0,
      } as React.CSSProperties}
    >
      <div className="profile-card__body">
        <div className="profile-card__tile">
          <span className="profile-card__sheen" />
          <span className="profile-card__holo">
            <span className="profile-card__holo-glow" />
            <span className="profile-card__holo-shift" />
          </span>

          {activePhotoSrc ? (
            <img
              className="profile-card__photo"
              src={activePhotoSrc}
              alt={name || 'Foto Profil'}
              loading="lazy"
              draggable={false}
            />
          ) : (
            <div className="profile-card__initials-tile" aria-hidden="true">
              <span className="profile-card__initials-text">{displayInitials}</span>
            </div>
          )}

          {(name || title) && (
            <>
              <span className="profile-card__scrim" />
              <div className="profile-card__info">
                {name && <h3 className="profile-card__name">{name}</h3>}
                {title && <p className="profile-card__title">{title}</p>}
              </div>
            </>
          )}

          <span className="profile-card__tile-rim" />
        </div>

        {showUserInfo && (
          <div className="profile-card__footer">
            <span className="profile-card__avatar">
              {activeMiniPhotoSrc ? (
                <img src={activeMiniPhotoSrc} alt={name || ''} loading="lazy" draggable={false} />
              ) : (
                <span className="profile-card__mini-initials" aria-hidden="true">
                  {displayInitials}
                </span>
              )}
            </span>

            <div className="profile-card__meta">
              {handle && <span className="profile-card__handle">{handle}</span>}
              {status && <span className="profile-card__status">{status}</span>}
            </div>

            {contactText && (
              <button
                type="button"
                className="profile-card__contact"
                onClick={onContactClick}
                disabled={isUploading}
                aria-label={contactAriaLabel || (name ? `${contactText} ${name}` : contactText)}
              >
                {contactIcon ? (
                  contactIcon
                ) : isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>{isUploading ? 'Menyimpan...' : contactText}</span>
              </button>
            )}
          </div>
        )}

        <span className="profile-card__glare" />
        <span className="profile-card__shade" />
        <span className="profile-card__rim" />
      </div>
    </div>
  );
};

export default memo(ProfileCard);
