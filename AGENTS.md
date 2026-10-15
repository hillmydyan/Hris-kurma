# HRIS Kurma Group - Agent Guidelines & Design Rules

Dokumentasi aturan pengembangan antarmuka dan kode untuk AI Agent pada project HRIS Kurma Group (React + Vite + TypeScript + Laravel).

## 1. Aturan Global: Tanpa Emoji Sebagai Ikon
Berlaku untuk seluruh halaman web, baik sisi **Portal Karyawan** maupun **Backend HR / Admin**:
- **DILARANG** menggunakan emoji atau emotikon (misal: 📅, 📺, ✅, ⚠️, 🚫, dll.) sebagai ikon di antarmuka mana pun: menu navigasi, tombol, judul, badge status, tabel, empty state, toast, notifikasi, tab, maupun modal.
- **Semua ikon harus berupa SVG** dari library resmi project (`lucide-react`) dengan gaya seragam dan ukuran proporsional (14px, 16px, 20px, atau 24px).
- Teks yang berasal dari data dinamis atau ketikan pengguna (misal: isi daily report atau catatan absensi) tidak diubah.

## 2. Sistem Desain & Token Tampilan
- **Warna Aksen Tunggal**: Gunakan **Indigo** (`#4F46E5`, `--primary`) untuk elemen interaktif utama: menu aktif, tombol primer, link, dan logo KG.
- **Warna Status Semantik**: Hijau (Success), Amber/Kuning (Warning), dan Merah (Danger) **hanya** dipakai untuk status (misal: Hadir/Disetujui, Terlambat/Menunggu, Alpa/Ditolak).
- **Latar & Kartu**:
  - Latar halaman: Abu sangat muda (`#F8FAFC`, `--bg-page`).
  - Kartu: Putih bersih (`#FFFFFF`, `--bg-surface`) dengan border tipis 1px (`#E2E8F0`, `--border-default`), tanpa bayangan tebal (`--shadow-xs`).
  - Radius sudut: Seragam 8px–10px (`--radius-md`, `--radius-lg`).
- **Format Jam**: Gunakan pemisah titik dua konsisten di semua tempat (`HH:mm:ss WIB` atau `HH:mm WIB`), hindari format titik (`11.57.46`).
- **Bahasa**: Seluruh teks antarmuka tetap menggunakan Bahasa Indonesia baku dan profesional.
- **Tipografi**: Maksimal 4 level ukuran teks (judul halaman, judul kartu, isi, keterangan/caption). Kontras teks minimal 4.5:1.
