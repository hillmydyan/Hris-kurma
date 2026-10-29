/**
|--------------------------------------------------------------------------
| Konfigurasi Jam Operasional Absensi Kurma Group
|--------------------------------------------------------------------------
| Rentang jam operasional dibuat sebagai konstanta/konfigurasi terpusat
| agar mudah disesuaikan sewaktu-waktu tanpa hardcode di banyak tempat.
*/

export const ATTENDANCE_CONFIG = {
  // Rentang jam Absen Sore (WIB, Asia/Jakarta)
  AFTERNOON_START: '15:00',
  AFTERNOON_END: '17:00',

  // Pesan keterangan status Absen Sore
  AFTERNOON_DISABLED_HINT: 'Absen sore hanya bisa dilakukan pukul 15.00–17.00',
  AFTERNOON_ALREADY_HINT: 'Sudah absen sore hari ini',

  // Jam kerja standar
  STANDARD_OFFICE_HOURS: '08:00–16:00 WIB',
  MORNING_TARGET: '08:00',
  MORNING_TOLERANCE: '08:15',
} as const;
