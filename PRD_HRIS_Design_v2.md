# PRD Design — HRIS Kurma Group

**Dokumen:** Product Requirements Document — Design (UI/UX)  
**Perusahaan:** Kurma Group Indonesia  
**Versi:** 2.0 — memperluas bagian 6 pada `PRD_HRIS_Workflow_Design.md` (v1)  
**Tanggal:** 9 Oktober 2026  
**Status:** Draft untuk direview  
**Dokumen pasangan:** `PRD_HRIS_Sistem_v2.md` (requirement, aturan bisnis, database, implementasi)

> **Pembagian dokumen.** Dokumen ini menjawab *"tampilannya seperti apa dan pengguna berinteraksi bagaimana"*. Aturan bisnis, izin, dan data ada di PRD Sistem dan dirujuk dengan ID yang sama (`FR-…`, `BR-…`, `K-…`). Bila keduanya tampak bertentangan, PRD Sistem yang berlaku untuk perilaku, dan dokumen ini yang berlaku untuk tampilan.

## Daftar Isi

0. Cara membaca dokumen
1. Tujuan dan prinsip desain
2. Fondasi visual (design token)
3. Kerangka layout (app shell)
4. Navigasi per role
5. Pustaka komponen
6. Status: warna dan label
7. Pola interaksi
8. Spesifikasi halaman (P-01 s.d. P-25)
9. Microcopy dan bahasa
10. Aksesibilitas
11. Aturan responsif
12. Task breakdown desain
13. Checklist penerimaan desain
14. Aturan untuk implementasi

---

## 0. Cara Membaca Dokumen

| Awalan ID | Arti | Contoh |
|---|---|---|
| `P-nn` | Halaman | P-08 Absensi Saya |
| `C-nn` | Komponen | C-04 Tabel data |
| `D-nn` | Task desain | D-06 |
| `FR-…`, `BR-…`, `K-…`, `T…` | Requirement, aturan bisnis, keputusan, dan task sistem (lihat PRD Sistem) | FR-ATT-01 |

- **Bagian 2, 5, 6, dan 7 bersifat mengikat:** token, komponen, warna status, dan pola interaksi dipakai sama di semua halaman.
- **Bagian 8 menjelaskan susunan isi tiap halaman.** Wireframe berbentuk teks menunjukkan letak dan urutan, bukan ukuran persis.
- Fase rilis: **F1** = MVP, **F2** = Task & KPI, **F3** = Payroll, Rekrutmen, On/Offboarding.
- Dokumen ini bisa langsung dipakai sebagai patokan oleh developer maupun AI coding agent (lihat bagian 14).

---

## 1. Tujuan dan Prinsip Desain

### 1.1 Sasaran pengalaman (diuji saat UAT)

| # | Sasaran | Ukuran |
|--:|---|---|
| 1 | Staff bisa absen secepat mungkin dari HP | Clock-in selesai dalam 2 ketukan setelah aplikasi terbuka |
| 2 | Approver bisa memutuskan tanpa mencari-cari | Dari notifikasi sampai keputusan tersimpan ≤ 3 klik |
| 3 | HR cepat menemukan orang atau rekap | Menemukan satu karyawan ≤ 10 detik |
| 4 | Pengajuan cuti mudah dan tidak salah | Form selesai ≤ 1 menit; jumlah hari dan sisa saldo terlihat sebelum dikirim |
| 5 | Pengguna selalu tahu posisi pengajuannya | Setiap pengajuan menampilkan status, siapa yang memegang, dan langkah berikutnya |

### 1.2 Prinsip

1. **Tindakan dulu, data kemudian.** Tiap halaman menonjolkan satu tindakan utama.
2. **Sesuai peran.** Pengguna hanya melihat menu, kolom, dan tombol yang boleh ia pakai. Tidak ada tombol mati tanpa penjelasan.
3. **Status selalu terlihat.** Setiap pengajuan dan tugas menampilkan status, pemegang saat ini, dan langkah berikutnya.
4. **HP untuk staff, desktop untuk pengelola.** Halaman swalayan dirancang dari layar HP; halaman pengelolaan dirancang dari layar lebar.
5. **Padat tetapi lega.** Tabel informatif tanpa terasa sesak; ruang kosong konsisten.
6. **Satu pola untuk satu kebutuhan.** Satu gaya tabel, satu gaya form, satu gaya konfirmasi.
7. **Aman dari salah klik.** Tindakan yang tidak bisa dibatalkan selalu dikonfirmasi dan menyebut akibatnya.
8. **Warna bukan satu-satunya penanda.** Status selalu disertai teks, dan bila perlu ikon.

### 1.3 Arah visual

- Dashboard SaaS modern: sidebar tetap, topbar sederhana, konten bersih dan mudah dipindai.
- Latar abu-abu sangat muda, kartu putih, teks gelap, aksen hijau emerald.
- Sudut membulat sedang, ikon garis yang konsisten, animasi ringan.
- Hanya mode terang pada versi ini; mode gelap di luar cakupan.
- Angka dan data pada wireframe hanyalah ilustrasi; data nyata selalu berasal dari database.

---

## 2. Fondasi Visual (Design Token)

Semua warna, ukuran, dan jarak di aplikasi **harus** memakai token di bawah. Nilai warna setara dengan palet Tailwind (nama palet dicantumkan dalam kurung). Rasio kontras sudah dihitung terhadap latar yang disebut.

### 2.1 Warna netral

| Token | Nilai | Pemakaian | Kontras |
|---|---|---|---|
| `bg-page` | `#F8FAFC` (slate-50) | Latar halaman | – |
| `bg-surface` | `#FFFFFF` | Kartu, tabel, modal, sidebar | – |
| `bg-subtle` | `#F1F5F9` (slate-100) | Kepala tabel, baris hover, chip netral | – |
| `border-default` | `#E2E8F0` (slate-200) | Garis kartu dan pemisah (dekoratif) | – |
| `border-input` | `#7C8BA1` | Garis input, checkbox, radio | 3,46 : 1 di atas putih |
| `text-primary` | `#0F172A` (slate-900) | Judul dan isi utama | 17,85 : 1 di atas putih |
| `text-secondary` | `#475569` (slate-600) | Label dan keterangan | 7,58 : 1 di atas putih |
| `text-muted` | `#64748B` (slate-500) | Teks bantu, stempel waktu | 4,76 : 1 di atas putih |
| `text-placeholder` | `#94A3B8` (slate-400) | Placeholder dan ikon nonaktif saja, tidak untuk informasi | 2,56 : 1 |

Di atas `bg-subtle`, teks kecil memakai `text-secondary` (6,92 : 1). `text-muted` hanya dipakai di atas `bg-surface` atau `bg-page`, karena di atas `bg-subtle` kontrasnya turun menjadi 4,34 : 1.

### 2.2 Warna aksen

| Token | Nilai | Pemakaian | Kontras |
|---|---|---|---|
| `primary` | `#047857` (emerald-700) | Tombol utama, tautan, penanda menu aktif | Teks putih 5,48 : 1 |
| `primary-hover` | `#065F46` (emerald-800) | Hover dan tekan pada tombol utama | Teks putih 7,68 : 1 |
| `primary-soft` | `#ECFDF5` (emerald-50) | Latar menu aktif dan sorotan lembut | Teks emerald-800 7,29 : 1 |
| `primary-ring` | `#059669` (emerald-600) | Cincin fokus, ikon aksen, grafik | 3,77 : 1 di atas putih; hanya untuk elemen non-teks |
| `danger` | `#B91C1C` (red-700) | Tombol bahaya, teks galat | Teks putih 6,47 : 1 |
| `danger-hover` | `#991B1B` (red-800) | Hover tombol bahaya | Teks putih 8,31 : 1 |

Emerald-600 **tidak** dipakai sebagai latar tombol berteks putih, karena kontrasnya hanya 3,77 : 1.

### 2.3 Warna semantik (badge, alert, sorotan)

| Makna | Latar | Teks | Kontras |
|---|---|---|---|
| Sukses | `#D1FAE5` (emerald-100) | `#065F46` (emerald-800) | 6,78 : 1 |
| Peringatan | `#FEF3C7` (amber-100) | `#92400E` (amber-800) | 6,37 : 1 |
| Bahaya | `#FEE2E2` (red-100) | `#991B1B` (red-800) | 6,80 : 1 |
| Info | `#DBEAFE` (blue-100) | `#1E40AF` (blue-800) | 7,15 : 1 |
| Ungu | `#EDE9FE` (violet-100) | `#5B21B6` (violet-800) | 7,57 : 1 |
| Langit | `#E0F2FE` (sky-100) | `#075985` (sky-800) | 6,59 : 1 |
| Oranye | `#FFEDD5` (orange-100) | `#9A3412` (orange-800) | 6,38 : 1 |
| Netral | `#F1F5F9` (slate-100) | `#334155` (slate-700) | 9,45 : 1 |

**Urutan warna seri grafik:** `#059669`, `#2563EB`, `#D97706`, `#7C3AED`, `#DC2626`, `#64748B`. Semuanya berkontras minimal 3 : 1 terhadap putih. Grafik selalu punya legenda berteks dan nilai pada tooltip.

### 2.4 Tipografi

Jenis huruf: **Inter**, dengan cadangan `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Angka dalam tabel dan kartu statistik memakai angka selebar tetap (`tabular-nums`).

| Token | Ukuran / tinggi baris | Tebal | Pemakaian |
|---|---|:-:|---|
| `display` | 30 / 36 px | 700 | Angka besar di kartu statistik, jam pada widget absensi |
| `h1` | 24 / 32 px | 600 | Judul halaman |
| `h2` | 20 / 28 px | 600 | Judul bagian |
| `h3` | 16 / 24 px | 600 | Judul kartu dan modal |
| `body` | 14 / 20 px | 400 | Isi utama, tabel, form (desktop) |
| `body-lg` | 16 / 24 px | 400 | Isi dan input pada HP |
| `label` | 14 / 20 px | 500 | Label form, kepala tabel, tombol |
| `caption` | 12 / 16 px | 400 | Keterangan, stempel waktu, badge |

- Input pada HP memakai huruf 16 px supaya browser HP tidak memperbesar layar saat field disentuh.
- Tidak ada teks di bawah 12 px. Hindari huruf kapital semua.
- Panjang baris teks bacaan maksimal sekitar 75 karakter.

### 2.5 Jarak, ukuran, sudut, bayangan

| Kelompok | Nilai |
|---|---|
| Skala jarak | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px |
| Padding kartu | 20 px (HP: 16 px) |
| Jarak antar kartu / bagian | 24 px (HP: 16 px) |
| Jarak antar field form | 16 px; label ke input 6 px |
| Tinggi kontrol | `sm` 32 px · `md` 40 px · `lg` 48 px (tindakan utama di HP) |
| Target sentuh minimum | 44 × 44 px |
| Sudut | `sm` 6 px (input, tombol, badge kotak) · `md` 8 px (dropdown, toast) · `lg` 12 px (kartu, modal) · `full` (badge pil, avatar) |
| Bayangan `xs` | `0 1px 2px rgba(15,23,42,.06)` — kartu (bersama garis `border-default`) |
| Bayangan `md` | `0 4px 12px rgba(15,23,42,.10)` — dropdown, popover |
| Bayangan `lg` | `0 12px 32px rgba(15,23,42,.18)` — modal, laci |

### 2.6 Ikon dan gerak

- **Ikon:** satu set ikon garis untuk seluruh aplikasi (rekomendasi: Lucide), tebal garis 1,5–2 px. Ukuran 16 px (di dalam tombol kecil dan teks), 20 px (default), 24 px (navigasi HP).
- Tombol yang hanya berisi ikon wajib punya label aksesibel dan tooltip.
- **Gerak:** 150 ms (hover, fokus), 200 ms (dropdown, toast), 250 ms (modal, laci); kurva *ease-out*. Tidak ada animasi yang menunda pekerjaan. Hormati pengaturan `prefers-reduced-motion`.

### 2.7 Breakpoint dan lapisan

| Nama | Lebar layar | Tata letak |
|---|---|---|
| HP | < 640 px | 1 kolom, navigasi bawah, padding 16 px |
| Tablet | 640–1023 px | 2 kolom kartu, sidebar menjadi laci |
| Laptop | 1024–1279 px | Sidebar ringkas 72 px (ikon) yang bisa dilebarkan, grid 12 kolom |
| Desktop | ≥ 1280 px | Sidebar penuh 256 px, lebar konten maksimal 1440 px, padding 24–32 px |

Urutan lapisan (z-index): konten 0 · kepala lengket 10 · sidebar 20 · dropdown 30 · latar gelap modal/laci 40 · modal/laci 50 · toast 60 · tooltip 70.

### 2.8 Token sebagai variabel CSS

```css
:root {
  /* netral */
  --bg-page: #F8FAFC;        --bg-surface: #FFFFFF;     --bg-subtle: #F1F5F9;
  --border-default: #E2E8F0; --border-input: #7C8BA1;
  --text-primary: #0F172A;   --text-secondary: #475569;
  --text-muted: #64748B;     --text-placeholder: #94A3B8;
  /* aksen */
  --primary: #047857;        --primary-hover: #065F46;
  --primary-soft: #ECFDF5;   --primary-ring: #059669;
  --danger: #B91C1C;         --danger-hover: #991B1B;
  /* semantik: latar / teks */
  --success-bg: #D1FAE5;     --success-fg: #065F46;
  --warning-bg: #FEF3C7;     --warning-fg: #92400E;
  --danger-bg: #FEE2E2;      --danger-fg: #991B1B;
  --info-bg: #DBEAFE;        --info-fg: #1E40AF;
  --violet-bg: #EDE9FE;      --violet-fg: #5B21B6;
  --sky-bg: #E0F2FE;         --sky-fg: #075985;
  --orange-bg: #FFEDD5;      --orange-fg: #9A3412;
  --neutral-bg: #F1F5F9;     --neutral-fg: #334155;
  /* bentuk */
  --radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px;
  --shadow-xs: 0 1px 2px rgba(15,23,42,.06);
  --shadow-md: 0 4px 12px rgba(15,23,42,.10);
  --shadow-lg: 0 12px 32px rgba(15,23,42,.18);
  /* layout */
  --sidebar-w: 256px; --sidebar-w-collapsed: 72px; --topbar-h: 64px;
}
```

---

## 3. Kerangka Layout (App Shell)

### 3.1 Desktop dan laptop

```text
+------------------------------------------------------------------------------+
| [=] HRIS Kurma Group    Beranda / Absensi           [Lonceng 3]  (AV) Nama v |  topbar 64 px
+-------------------+----------------------------------------------------------+
| Dashboard         |  Judul Halaman                        [ Tindakan utama ] |
|                   |  Deskripsi singkat halaman                               |
| Saya              |                                                          |
|   Absensi         |  +-----------+ +-----------+ +-----------+ +-----------+ |
|   Cuti & Izin     |  |  kartu    | |  kartu    | |  kartu    | |  kartu    | |
|   Tugas           |  +-----------+ +-----------+ +-----------+ +-----------+ |
|   KPI             |                                                          |
| Tim               |  +----------------------------------------------------+  |
|   Persetujuan (4) |  |  konten utama: tabel, form, kalender, atau papan   |  |
|   Absensi Tim     |  |                                                    |  |
|   Kalender Cuti   |  +----------------------------------------------------+  |
| Perusahaan        |                                                          |
|   Karyawan        |                                                          |
|   Laporan         |                                                          |
| Sistem            |                                                          |
|   Pengaturan      |                                                          |
| [<< Ringkas]      |                                                          |
+-------------------+----------------------------------------------------------+
   sidebar 256 px                    konten, lebar maksimal 1440 px
```

### 3.2 HP

```text
+----------------------------------+
| Beranda              [Lonceng 3] |  topbar 56 px
+----------------------------------+
|                                  |
|  konten satu kolom               |
|  kartu ditumpuk ke bawah         |
|                                  |
|  [   Tindakan utama (lebar)   ]  |
|                                  |
+----------------------------------+
| Beranda Absensi Cuti Notif Lain  |  navigasi bawah 64 px
+----------------------------------+
```

### 3.3 Sidebar

| Bagian | Spesifikasi |
|---|---|
| Wadah | Lebar 256 px, latar `bg-surface`, garis kanan `border-default`, tetap di tempat saat konten digulir |
| Kepala | Logo dan nama aplikasi "HRIS Kurma Group" |
| Judul grup | Gaya `caption`, warna `text-muted`: Saya, Tim, Perusahaan, Sistem |
| Item menu | Tinggi 40 px, ikon 20 px + label gaya `label`. Hover: `bg-subtle` |
| Item aktif | Latar `primary-soft`, teks emerald-800, garis kiri 3 px berwarna `primary` |
| Badge angka | Pil kecil di kanan item: jumlah menunggu pada Persetujuan, jumlah terlambat pada Tugas |
| Mode ringkas | Lebar 72 px, hanya ikon; label muncul sebagai tooltip. Otomatis pada lebar 1024–1279 px |
| Kaki | Tombol ringkas/lebarkan dan nomor versi aplikasi |

### 3.4 Topbar

| Posisi | Isi |
|---|---|
| Kiri | Tombol menu (hanya pada lebar ≤ 1023 px), lalu breadcrumb |
| Kanan | Pencarian cepat karyawan (hanya bagi pemilik cakupan tim/semua), lonceng notifikasi dengan angka belum dibaca (C-24), menu pengguna |
| Menu pengguna | Avatar, nama, jabatan → Profil Saya, Ganti Password, Keluar |

### 3.5 Kepala halaman

- Judul (`h1`), deskripsi satu kalimat (`text-secondary`, opsional), dan **satu** tindakan utama di kanan.
- Tindakan lain memakai tombol sekunder atau menu "Lainnya".
- Breadcrumb tampil pada halaman dengan kedalaman dua tingkat atau lebih (mis. Karyawan / Nama Karyawan).
- Di HP, tindakan utama menjadi tombol selebar layar di bawah judul. Pada halaman daftar panjang, tombol itu menempel di atas navigasi bawah.

### 3.6 Navigasi bawah (HP)

Lima slot, ikon 24 px + label 12 px. Item aktif berwarna `primary`. Slot terakhir "Lainnya" membuka laci berisi menu lengkap sesuai role.

| Pengguna | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 |
|---|---|---|---|---|---|
| Staff | Beranda | Absensi | Cuti | Notifikasi (F1) → Tugas (F2) | Lainnya |
| Manager, Manager Operasional | Beranda | Absensi | Persetujuan | Cuti (F1) → Tugas (F2) | Lainnya |
| HR Admin | Beranda | Absensi | Persetujuan | Karyawan | Lainnya |
| Management Viewer | Beranda | Laporan | Notifikasi | – | Lainnya |
| System Admin | Beranda | Pengaturan | Notifikasi | – | Lainnya |

---

## 4. Navigasi per Role

Kolom: **STF** Staff · **MGR** Department Manager · **OPS** Operations Manager · **HR** HR Admin · **FIN** Finance Staff · **MGT** Management Viewer · **SA** System Admin. Isi sel menyebut cakupan data yang tampil; "–" berarti menu tidak dirender.

| Menu | Grup | STF | MGR | OPS | HR | FIN | MGT | SA | Fase |
|---|---|---|---|---|---|---|---|---|:-:|
| Dashboard | – | Ya | Ya | Ya | Ya | Ya | Ya | Ya | F1 |
| Absensi | Saya | Sendiri | Sendiri | Sendiri | Sendiri | Sendiri | – | – | F1 |
| Cuti & Izin | Saya | Sendiri | Sendiri | Sendiri | Sendiri | Sendiri | – | – | F1 |
| Tugas | Saya | Sendiri | Sendiri | Sendiri | Sendiri | Sendiri | – | – | F2 |
| Checklist Harian | Saya | Sendiri | Sendiri | Sendiri | Sendiri | Sendiri | – | – | F2 |
| KPI | Saya | Sendiri | Sendiri | Sendiri | Sendiri | Sendiri | – | – | F2 |
| Slip Gaji | Saya | Sendiri | Sendiri | Sendiri | Sendiri | Sendiri | – | – | F3 |
| Persetujuan | Tim | – | Tim | Tim | Tim + tahap HR | – | – | – | F1 |
| Absensi Tim | Tim | – | Tim | Semua (lihat) | Semua (kelola) | – | Semua (lihat) | – | F1 |
| Kalender Cuti | Tim | Departemen, tanpa jenis | Tim | Tim | Semua | Departemen, tanpa jenis | Semua | – | F1 |
| Tugas Tim | Tim | – | Tim | Semua | – | – | Semua (lihat) | – | F2 |
| KPI Tim | Tim | – | Tim | Tim | Semua (rekap) | – | Semua (lihat) | – | F2 |
| Karyawan | Perusahaan | – | Tim | Semua (lihat) | Semua (kelola) | Direktori | Semua (lihat) | Direktori | F1 |
| Laporan | Perusahaan | – | Tim | Semua | Semua | Payroll | Semua | – | F1 |
| Payroll | Perusahaan | – | – | – | Kelola | Kelola | Laporan | – | F3 |
| Rekrutmen | Perusahaan | – | Kandidat departemen | – | Kelola | – | Lihat | – | F3 |
| Pengaturan | Sistem | – | – | – | Sebagian | – | – | Semua | F1 |
| Audit Log | Sistem | – | – | – | Ya | – | – | Ya | F1 |
| Notifikasi (lonceng) | Topbar | Ya | Ya | Ya | Ya | Ya | Ya | Ya | F1 |
| Profil Saya (menu pengguna) | Topbar | Ya | Ya | Ya | Ya | Ya | Ya | Ya | F1 |

Aturan navigasi:

1. Menu yang tidak diizinkan **tidak dirender sama sekali**, bukan disembunyikan dengan CSS.
2. Menu milik fase berikutnya tidak tampil sebelum fasenya dirilis.
3. Urutan grup dan item sama untuk semua role, supaya pengguna yang rolenya bertambah tidak kehilangan orientasi.
4. Grup tanpa item tidak ditampilkan. Grup "Saya" tidak tampil bagi akun tanpa data karyawan.
5. Checklist Harian hanya tampil bagi karyawan yang menjadi sasaran task rutin.
6. Pengguna dengan beberapa role melihat gabungan menu; cakupan terluas yang berlaku.
7. Setelah login, semua role mendarat di Dashboard.

---

## 5. Pustaka Komponen

Setiap komponen dibuat sekali lalu dipakai ulang. Halaman tidak boleh membuat varian baru tanpa menambahkannya ke daftar ini.

### 5.1 Daftar komponen

| ID | Komponen | Varian | State yang wajib dirancang |
|---|---|---|---|
| C-01 | Tombol | Utama, sekunder, teks, bahaya; ukuran sm/md/lg; dengan ikon; hanya ikon | Default, hover, fokus, ditekan, nonaktif, memuat |
| C-02 | Field form | Teks, angka, area teks, pilihan, pilihan dengan pencarian, tanggal, rentang tanggal, jam, unggah berkas, kotak centang, radio, sakelar | Default, fokus, terisi, galat, nonaktif, hanya-baca |
| C-03 | Kartu | Konten, statistik, daftar ringkas | Default, memuat, kosong, bisa diklik |
| C-04 | Tabel data | Standar, padat, dengan pilih baris, versi kartu untuk HP | Memuat, kosong, galat, baris hover, baris terpilih, kolom terurut |
| C-05 | Badge status | Pil berwarna semantik, dengan titik atau ikon | Statis |
| C-06 | Tab | Garis bawah, dengan angka | Aktif, hover, fokus, nonaktif |
| C-07 | Modal dan dialog konfirmasi | Informasi, form singkat, konfirmasi, konfirmasi bahaya | Terbuka, memproses, galat |
| C-08 | Laci (drawer) | Kanan (detail cepat, filter di HP), bawah (aksi di HP) | Terbuka, memuat |
| C-09 | Toast | Sukses, galat, info | Muncul, hilang otomatis, ditutup manual |
| C-10 | Alert inline | Info, sukses, peringatan, bahaya | Dengan atau tanpa tindakan, bisa ditutup |
| C-11 | Kepala halaman dan breadcrumb | Dengan atau tanpa tindakan | – |
| C-12 | Bilah filter | Pencarian, pilihan, rentang tanggal, chip filter aktif, reset | Default, ada filter aktif |
| C-13 | Avatar dan chip pengguna | Foto atau inisial; ukuran 24/32/40/64 px | – |
| C-14 | Linimasa | Approval, aktivitas | Selesai, aktif, menunggu, ditolak, dilewati |
| C-15 | Keadaan kosong | Belum ada data, hasil filter kosong, tanpa izin | – |
| C-16 | Skeleton dan spinner | Baris tabel, kartu, teks | – |
| C-17 | Paginasi | Nomor halaman + jumlah per halaman; "Muat lagi" di HP | – |
| C-18 | Menu aksi dan dropdown | – | Terbuka, item hover/fokus, item bahaya, item nonaktif |
| C-19 | Tooltip | – | – |
| C-20 | Stepper | Mendatar (desktop), ringkas "Langkah 2 dari 3" (HP) | Selesai, aktif, belum, galat |
| C-21 | Progres | Batang, cincin | 0–100%, warna menurut ambang |
| C-22 | Kalender bulan | Cuti, hari libur, absensi pribadi | Hari ini, hari libur, akhir pekan, terisi, terpilih |
| C-23 | Papan kanban dan kartu tugas | – | Default, hover, terlambat |
| C-24 | Lonceng dan panel notifikasi | – | Ada/tidak ada yang belum dibaca, kosong, memuat |
| C-25 | Grafik | Batang, garis, donat | Memuat, kosong, tooltip |
| C-26 | Widget jam absensi | Sebelum clock-in, sudah clock-in, sudah clock-out, diblokir | Menyimpan, galat |
| C-27 | Komentar | Kotak tulis + daftar | Kosong, mengirim, galat |
| C-28 | Daftar deskripsi | Label–nilai 1 atau 2 kolom; nilai ter-*mask* dengan tombol "Tampilkan" | Ter-*mask*, terbuka |

### 5.2 C-01 Tombol

| Varian | Latar | Teks | Garis | Dipakai untuk |
|---|---|---|---|---|
| Utama | `primary`, hover `primary-hover` | Putih | – | Satu per layar atau bagian: Simpan, Ajukan, Setujui |
| Sekunder | `bg-surface`, hover `bg-subtle` | `text-primary` | `border-input` | Batal, Kembali, Ekspor |
| Teks | Transparan, hover `bg-subtle` | `primary` | – | Tindakan ringan di dalam baris atau kartu |
| Bahaya | `danger`, hover `danger-hover` | Putih | – | Konfirmasi akhir: Tolak, Nonaktifkan, Hapus |

- **Fokus:** cincin 2 px `primary-ring` berjarak 2 px dari tombol.
- **Nonaktif:** opasitas 50%, tidak bisa diklik maupun difokus. Bila penyebabnya tidak jelas, beri tooltip alasannya.
- **Memuat:** spinner menggantikan ikon, label tetap, tombol terkunci untuk mencegah klik ganda.
- **Label:** kata kerja + objek, mis. "Ajukan Cuti", "Simpan Perubahan". Hindari "OK", "Submit", "Ya".
- **Letak:** tindakan utama di kanan (desktop). Di HP tombol ditumpuk selebar layar, tindakan utama di atas.
- **Tolak** pada layar keputusan tampil sebagai tombol sekunder berteks `danger`; varian Bahaya baru muncul di dialog alasan penolakan.

### 5.3 C-02 Field form

- Susunan tetap: **label di atas → input → teks bantu atau pesan galat di bawah**.
- Label selalu terlihat; placeholder bukan pengganti label. Field wajib ditandai `*`; field tidak wajib ditulis "(opsional)".
- Tinggi 40 px (HP 48 px), garis `border-input`. Fokus: garis `primary` + cincin fokus. Galat: garis `danger`, ikon, dan pesan berwarna `danger`.
- **Tanggal:** pemilih tanggal menandai hari libur dan akhir pekan; format tampil "9 Okt 2026".
- **Unggah berkas:** area seret-lepas dan tombol pilih, menyebut jenis serta ukuran maksimal. Setelah dipilih tampil nama, ukuran, progres unggah, dan tombol hapus.
- Pilihan dengan lebih dari 7 opsi memakai pencarian.
- Field hanya-baca tetap berkontras normal dan bisa disalin; berbeda dari nonaktif.

### 5.4 C-04 Tabel data

- **Kepala:** latar `bg-subtle`, teks `text-secondary` bergaya `label`, lengket saat digulir; kolom yang bisa diurutkan diberi ikon panah.
- **Baris:** tinggi 52 px (padat 44 px), garis bawah `border-default`, hover `bg-subtle`. Bila ada halaman detail, seluruh baris bisa diklik.
- **Kolom:** teks rata kiri, angka rata kanan, status berupa badge, aksi di kolom terakhir (maksimal 2 tombol ikon + menu aksi).
- **Kolom pertama** adalah identitas: avatar + nama + keterangan kecil (mis. jabatan).
- Di atas tabel: bilah filter (C-12) dan jumlah hasil, mis. "42 karyawan". Di bawah: paginasi (C-17).
- **Pilih banyak:** kotak centang di kolom pertama; bilah aksi massal muncul di atas tabel saat ada baris terpilih.
- **Di HP:** tiap baris menjadi kartu berisi identitas, 2–4 pasangan label–nilai terpenting, badge status, dan menu aksi. Tabel laporan yang lebar boleh digulir mendatar dengan kolom pertama terkunci.

### 5.5 C-05 Badge status

Tinggi 24 px, padding 2 × 8 px, sudut `full`, gaya `caption` tebal 500. Selalu berisi teks; titik 6 px atau ikon bersifat tambahan. Warna mengikuti bagian 6.

### 5.6 C-07 Modal dan dialog konfirmasi

- Lebar: `sm` 400 px, `md` 560 px, `lg` 720 px. Di HP tampil sebagai lembar dari bawah selebar layar.
- Susunan: judul (`h3`) + tombol tutup → isi → kaki berisi tombol (sekunder di kiri, utama di kanan).
- Bisa ditutup lewat tombol tutup, tombol Esc, atau klik latar. Bila form di dalamnya sudah diubah, minta konfirmasi sebelum menutup.
- Fokus keyboard dikurung di dalam modal dan kembali ke pemicunya saat modal ditutup.
- **Konfirmasi bahaya:** judul berupa pertanyaan spesifik, isi menyebut akibatnya, dan tombol berlabel tindakan (mis. "Nonaktifkan Karyawan"), bukan "Ya".

### 5.7 C-09 Toast dan C-10 Alert

- **Toast:** kanan atas (desktop) atau atas tengah (HP). Sukses hilang setelah 4 detik; galat bertahan sampai ditutup. Maksimal 3 bertumpuk. Isi satu kalimat, boleh dengan tautan "Lihat".
- **Alert inline:** untuk informasi yang harus tetap terlihat di halaman, mis. "Periode Oktober 2026 sudah dikunci. Koreksi tidak bisa diajukan."

### 5.8 C-14 Linimasa

Tiap langkah berisi ikon status, nama langkah, nama pemutus, waktu, dan catatan. Selesai memakai warna Sukses, langkah aktif Info, menunggu Netral, ditolak Bahaya, dilewati Netral dengan keterangan "dilewati". Pengalihan dan delegasi tampil sebagai baris keterangan di bawah langkahnya.

### 5.9 C-15 Keadaan kosong

Ikon sederhana + judul + satu kalimat penjelasan + tombol tindakan (hanya bila pengguna boleh melakukannya).

| Jenis | Contoh judul | Tindakan |
|---|---|---|
| Belum ada data | "Belum ada pengajuan cuti" | [Ajukan Cuti] |
| Hasil filter kosong | "Tidak ada hasil untuk filter ini" | [Reset filter] |
| Tidak berizin | "Halaman ini tidak tersedia untuk akun Anda" | [Kembali ke Dashboard] |

---

## 6. Status: Warna dan Label

Satu status memakai satu label dan satu warna yang sama di semua halaman, ekspor, dan notifikasi. Nama warna merujuk ke tabel 2.3.

### 6.1 Absensi

| Status / penanda | Label yang tampil | Warna |
|---|---|---|
| `present` | Hadir | Sukses |
| `late` | Terlambat 11 mnt (menit ikut ditulis) | Peringatan |
| `permit` | Izin | Langit |
| `sick` | Sakit | Ungu |
| `leave` | Cuti | Info |
| `absent` | Alpa | Bahaya |
| Lupa clock-out | Lupa clock-out | Oranye |
| Pulang cepat | Pulang cepat (badge tambahan) | Oranye |
| Belum clock-in hari ini | Belum absen | Netral |
| Hari libur / di luar hari kerja | Libur | Netral |

### 6.2 Pengajuan (cuti, izin, koreksi absensi)

| Keadaan | Label yang tampil | Warna |
|---|---|---|
| Langkah atasan aktif | Menunggu atasan | Peringatan |
| Langkah HR aktif | Menunggu HR | Peringatan |
| `approved` | Disetujui | Sukses |
| `rejected` | Ditolak | Bahaya |
| `cancelled` | Dibatalkan | Netral |

### 6.3 Tugas

| Status | Label | Warna |
|---|---|---|
| `todo` | Belum dimulai | Netral |
| `in_progress` | Dikerjakan | Info |
| `in_review` | Menunggu review | Ungu |
| `revision` | Revisi | Oranye |
| `done` | Selesai | Sukses |
| `cancelled` | Dibatalkan (judul dicoret) | Netral |
| `missed` | Terlewat | Bahaya |

- **Terlambat** bukan status: tampil sebagai teks `danger` dengan ikon jam di samping tenggat, mis. "Terlambat 2 hari".
- **Prioritas** tampil sebagai badge kecil berikon bendera: Rendah (Netral), Sedang (Info), Tinggi (Oranye), Mendesak (Bahaya).

### 6.4 KPI

| Hal | Label | Warna |
|---|---|---|
| Grade | A · B · C · D | Sukses · Info · Peringatan · Bahaya |
| Lembar `target_setting` | Penetapan target | Netral |
| Lembar `in_progress` | Berjalan | Info |
| Lembar `in_review` | Menunggu penilaian | Peringatan |
| Lembar `reviewed` | Sudah dinilai | Ungu |
| Lembar `acknowledged` | Sudah dibaca | Sukses |
| Periode `draft` / `active` / `in_review` / `closed` | Draf / Aktif / Penilaian / Ditutup | Netral / Info / Peringatan / Netral |

Batang progres pencapaian: ≥ 90 `#059669` · 75–89,99 `#2563EB` · 60–74,99 `#D97706` · < 60 `#DC2626`, selalu disertai angka.

### 6.5 Karyawan

| Hal | Label | Warna |
|---|---|---|
| Status akun | Aktif / Nonaktif | Sukses / Netral |
| Keluar terjadwal | Keluar 30 Nov 2026 (tanggal ikut ditulis) | Peringatan |
| Status kerja | Tetap / Kontrak / Percobaan / Magang | Netral / Info / Peringatan / Ungu |

### 6.6 Payroll dan rekrutmen (F3)

| Hal | Label | Warna |
|---|---|---|
| Periode payroll | Draf / Dihitung / Menunggu persetujuan / Disetujui / Dibayar | Netral / Info / Peringatan / Sukses / Sukses dengan ikon centang |
| Tahap kandidat | Lamaran masuk / Seleksi berkas / Interview / Penawaran / Diterima / Tidak lolos / Mengundurkan diri | Netral / Info / Ungu / Peringatan / Sukses / Bahaya / Netral |

---

## 7. Pola Interaksi

### 7.1 Form

- Satu kolom untuk form di HP dan form pendek. Dua kolom hanya untuk form panjang di desktop, bagi field yang memang berpasangan.
- **Validasi:** format diperiksa saat field ditinggalkan; semuanya diperiksa saat dikirim. Galat tampil di field terkait; bila lebih dari satu, tambahkan ringkasan di atas form ("Periksa 3 isian berikut") dan pindahkan fokus ke galat pertama.
- Tombol kirim **tidak** dinonaktifkan hanya karena form belum lengkap; biarkan ditekan lalu tunjukkan apa yang kurang. Tombol hanya terkunci saat memproses.
- Meninggalkan form yang sudah diubah memunculkan peringatan.
- Setelah berhasil: toast sukses, lalu kembali ke daftar atau detail terkait dengan item baru tersorot sesaat.
- Form panjang memakai stepper; tiap langkah divalidasi sebelum lanjut, dan "Kembali" tidak menghapus isian.

### 7.2 Konfirmasi

| Tindakan | Pola |
|---|---|
| Simpan atau ubah biasa | Tanpa konfirmasi |
| Kirim pengajuan cuti | Ringkasan di dalam form (jumlah hari, sisa saldo setelah pengajuan); tanpa modal tambahan |
| Setujui satu pengajuan | Tanpa modal; catatan opsional diisi di tempat |
| Tolak | Modal alasan, wajib minimal 10 karakter |
| Batalkan pengajuan | Modal konfirmasi yang menyebut akibat pada saldo |
| Nonaktifkan karyawan, kunci periode, tutup periode KPI, finalisasi payroll | Modal konfirmasi bahaya yang menyebut akibatnya |
| Hapus dokumen atau lampiran | Modal konfirmasi |

### 7.3 Keputusan approval

Layar keputusan selalu tersusun: (1) ringkasan pengajuan — pemohon, jenis, tanggal, jumlah hari, alasan, lampiran; (2) konteks — sisa saldo pemohon dan siapa lagi di tim yang cuti pada tanggal yang sama; (3) linimasa; (4) tombol **[Tolak] [Setujui]**. Setelah keputusan tersimpan: toast, lalu otomatis membuka pengajuan berikutnya yang menunggu, atau kembali ke kotak masuk bila sudah habis.

### 7.4 Filter dan pencarian

- Pencarian menunggu 300 ms setelah ketikan terakhir sebelum memuat.
- Di desktop, filter langsung diterapkan saat dipilih. Di HP, filter dibuka di laci dengan tombol "Terapkan".
- Filter aktif tampil sebagai chip yang bisa dihapus satu per satu, ditambah "Reset".
- Filter, urutan, dan nomor halaman tersimpan di URL, sehingga tombol kembali dan tautan yang dibagikan tetap menunjukkan hasil yang sama.
- Jumlah hasil selalu tampil.

### 7.5 Umpan balik sistem

| Situasi | Pola |
|---|---|
| Memuat halaman atau daftar | Skeleton berbentuk konten, bukan spinner selayar penuh |
| Menyimpan | Tombol berstatus memuat |
| Berhasil | Toast sukses |
| Galat validasi | Pesan di field + ringkasan |
| Galat server atau jaringan | Alert bahaya dengan tombol "Coba lagi"; isian form tidak hilang |
| Proses panjang (ekspor, impor) | Toast "Sedang disiapkan…", lalu notifikasi saat selesai |
| Tidak berizin | Halaman 403 dengan penjelasan dan tombol kembali |
| Sesi habis | Diarahkan ke login dengan pesan; setelah login kembali ke halaman semula |

### 7.6 Data sensitif

Nilai tampil ter-*mask* (mis. `************1234`). Tombol "Tampilkan" berikon mata hanya ada bagi yang berizin, dengan tooltip "Akses ini dicatat". Nilai kembali ter-*mask* setelah 30 detik atau saat pindah halaman.

### 7.7 Tanggal, waktu, dan angka

| Jenis | Format | Contoh |
|---|---|---|
| Tanggal | Tanggal, bulan singkat, tahun | 9 Okt 2026 |
| Rentang tanggal | Digabung bila sebulan | 9–11 Okt 2026 |
| Jam | 24 jam; zona waktu ditulis pada jam absensi | 08:05 WIB |
| Waktu relatif | Untuk kejadian kurang dari 24 jam, dengan tooltip waktu lengkap | 5 menit lalu |
| Durasi | Jam dan menit | 7 j 45 mnt |
| Angka | Pemisah ribuan titik, desimal koma | 1.234,5 |
| Uang | Rp tanpa spasi | Rp1.250.000 |
| Hari cuti | Satu desimal hanya bila perlu | 4 hari |

---

## 8. Spesifikasi Halaman

### 8.0 Daftar halaman

| ID | Halaman | Rute | Pengguna | Dirancang dari | Fase |
|---|---|---|---|---|:-:|
| P-01 | Login | `/login` | Semua | HP | F1 |
| P-02 | Ganti dan lupa password | `/password/*` | Semua | HP | F1 |
| P-03 | Dashboard | `/` | Semua | HP (staff), desktop (pengelola) | F1 |
| P-04 | Daftar Karyawan | `/karyawan` | Manager, Ops, HR, Finance, Management, Admin | Desktop | F1 |
| P-05 | Tambah / Ubah Karyawan | `/karyawan/tambah` | HR | Desktop | F1 |
| P-06 | Detail Karyawan | `/karyawan/{id}` | Sesuai cakupan | Desktop | F1 |
| P-07 | Profil Saya | `/profil` | Semua | HP | F1 |
| P-08 | Absensi Saya | `/absensi` | Karyawan | HP | F1 |
| P-09 | Absensi Tim | `/absensi/tim` | Manager, Ops, HR, Management | Desktop | F1 |
| P-10 | Koreksi Absensi | `/absensi/koreksi` | Karyawan, approver | HP | F1 |
| P-11 | Cuti Saya dan Form Pengajuan | `/cuti` | Karyawan | HP | F1 |
| P-12 | Persetujuan | `/persetujuan` | Approver | HP dan desktop | F1 |
| P-13 | Detail Pengajuan | `/pengajuan/{id}` | Pemohon, approver, HR | HP | F1 |
| P-14 | Kalender Cuti | `/cuti/kalender` | Sesuai cakupan | Desktop | F1 |
| P-15 | Tugas | `/tugas` | Karyawan, manager | Desktop dan HP | F2 |
| P-16 | Detail Tugas | `/tugas/{id}` | Sesuai cakupan | HP | F2 |
| P-17 | Checklist Harian | `/tugas/checklist` | Karyawan sasaran, manager | HP | F2 |
| P-18 | KPI Saya dan KPI Tim | `/kpi` | Karyawan, manager, HR | Desktop dan HP | F2 |
| P-19 | Lembar KPI | `/kpi/{id}` | Pemilik, penilai, HR | Desktop | F2 |
| P-20 | Laporan | `/laporan` | Manager, Ops, HR, Finance, Management | Desktop | F1 |
| P-21 | Notifikasi | `/notifikasi` | Semua | HP | F1 |
| P-22 | Pengaturan | `/pengaturan` | HR, Admin | Desktop | F1 |
| P-23 | Payroll dan Slip Gaji | `/payroll`, `/slip-gaji` | HR, Finance; karyawan | Desktop; slip dari HP | F3 |
| P-24 | Rekrutmen dan Checklist | `/rekrutmen` | HR, Manager | Desktop | F3 |
| P-25 | Halaman sistem | 403, 404, 500, pemeliharaan | Semua | HP | F1 |

Setiap halaman wajib punya empat keadaan: **memuat** (skeleton), **kosong** (C-15), **galat** (alert + "Coba lagi"), dan **terisi**. Keadaan ini tidak diulang di tiap halaman di bawah kecuali ada yang khusus.

---

### P-01 — Login (F1)

**Tujuan:** masuk dengan cepat dan aman. **Requirement:** FR-AUTH-01, 05, 08; BR-AUTH-02. **Tindakan utama:** Masuk.

- Kartu di tengah layar (lebar maksimal 400 px) di atas `bg-page`: logo, nama "HRIS Kurma Group", field Email, field Password dengan tombol tampilkan/sembunyikan, kotak centang "Ingat saya", tombol utama **Masuk** (ukuran `lg`, selebar kartu), tautan "Lupa password?".
- Galat kredensial: alert bahaya di atas form, "Email atau password salah." Pesan ini sama untuk semua penyebab, ditambah teks bantu "Jika masih bermasalah, hubungi HR."
- Terkunci: "Terlalu banyak percobaan. Coba lagi dalam 15 menit."
- Datang karena sesi habis: alert info "Sesi Anda berakhir. Silakan masuk kembali."

**Diterima bila:** bisa login hanya dengan keyboard; pesan galat tidak membedakan email salah dan password salah; tampil rapi pada lebar 360 px.

### P-02 — Ganti dan Lupa Password (F1)

**Requirement:** FR-AUTH-03, 04, 06, 07; BR-AUTH-03.

- **Ganti password wajib (login pertama):** layar penuh tanpa sidebar. Penjelasan singkat "Demi keamanan, ganti password sementara Anda." Field Password baru dan Ulangi password. Daftar syarat (minimal 8 karakter, ada huruf, ada angka) tercentang langsung saat mengetik. Tombol **Simpan Password**.
- **Lupa password:** satu field email. Setelah dikirim selalu tampil pesan yang sama: "Jika email terdaftar, tautan reset sudah dikirim."
- **Reset dari tautan:** form password baru. Tautan kedaluwarsa atau sudah dipakai → pesan dan tombol "Minta tautan baru".

**Diterima bila:** pengguna tidak bisa melewati layar ganti password wajib; syarat password terlihat sebelum pengguna salah.

---

### P-03 — Dashboard (F1, diperluas F2/F3)

**Tujuan:** menjawab "apa yang perlu saya lakukan hari ini". **Requirement:** FR-DSH-01 s.d. 06; daftar widget pada M09. **Tindakan utama:** clock-in/out (karyawan), tinjau pengajuan (approver).

**Varian Staff, HP:**

```text
+----------------------------------+
| Beranda              [Lonceng 2] |
+----------------------------------+
| Selamat pagi, Rina               |
| Jumat, 9 Okt 2026                |
| +------------------------------+ |
| |          08:02 WIB           | |
| |  Jadwal 08:00 - 16:00        | |
| |  [        Clock-in        ]  | |
| +------------------------------+ |
| +-------------+ +--------------+ |
| | Sisa cuti   | | Pengajuan    | |
| | 6 hari      | | 1 menunggu   | |
| +-------------+ +--------------+ |
| Pengajuan saya                   |
|  Cuti Tahunan, 14-15 Okt         |
|  [Menunggu atasan]               |
| Tugas hari ini (F2)              |
|  Checklist harian 3 dari 5       |
+----------------------------------+
| Beranda Absensi Cuti Notif Lain  |
+----------------------------------+
```

**Varian Manager, desktop:**

```text
+----------------------------------------------------------------------------+
| Dashboard                                                                  |
| Selamat pagi, Dimas - Jumat, 9 Okt 2026                                    |
+----------------------------------------------------------------------------+
| +----------------+ +----------------+ +----------------+ +---------------+ |
| | Absensi saya   | | Perlu          | | Tim hadir      | | Cuti 7 hari   | |
| | 07:55 Hadir    | | keputusan      | | 9 dari 12      | | ke depan      | |
| | [Clock-out]    | | 4              | | 1 terlambat    | | 2 orang       | |
| +----------------+ +----------------+ +----------------+ +---------------+ |
| +--------------------------------------+ +-------------------------------+ |
| | Kehadiran tim hari ini               | | Menunggu keputusan Anda       | |
| | Nama       Masuk   Status            | | Rina - Cuti Tahunan, 2 hari   | |
| | Rina       07:58   [Hadir]           | |   14-15 Okt        [Tinjau]   | |
| | Bayu       08:14   [Terlambat 14 mnt]| | Bayu - Koreksi absensi        | |
| | Sari       -       [Belum absen]     | |   7 Okt            [Tinjau]   | |
| | Tono       -       [Cuti]            | |                               | |
| | [Lihat semua]                        | | [Lihat semua]                 | |
| +--------------------------------------+ +-------------------------------+ |
+----------------------------------------------------------------------------+
```

**Varian HR, desktop** (susunan dari atas ke bawah):

1. Kartu statistik: Karyawan aktif · Hadir hari ini (jumlah dan persen) · Menunggu keputusan saya · Pengajuan macet.
2. Grafik garis tren kehadiran 30 hari, dengan filter departemen.
3. Dua kolom: "Kontrak/percobaan berakhir dalam 30 hari" dan "Siapa cuti 7 hari ke depan".
4. Dua kolom: "Karyawan baru dan keluar bulan ini" dan "Profil belum lengkap".

**Varian lain:** Manager Operasional memakai susunan Manager dengan tambahan kartu kehadiran seluruh perusahaan. Management Viewer memakai susunan HR tanpa widget tindakan. System Admin melihat kartu status sistem: akun aktif, login gagal 24 jam, backup terakhir, job gagal.

**Aturan widget**

- Urutan: tindakan pribadi → yang menunggu tindakan → pantauan tim/perusahaan → informasi.
- Kartu statistik berisi label (`caption`), angka (`display`), dan keterangan kecil. Seluruh kartu bisa diklik menuju daftar terfilter.
- Maksimal 4 kartu statistik per baris di desktop, 2 di tablet dan HP.
- Daftar ringkas di widget maksimal 5 baris, lalu "Lihat semua".
- Tiap widget dimuat sendiri dengan skeleton masing-masing, sehingga satu widget yang lambat tidak menahan yang lain.
- Widget milik fase berikutnya tidak ditampilkan sebagai "segera hadir".

**Diterima bila:** staff di HP melihat tombol clock tanpa menggulir; setiap angka membuka daftar yang jumlahnya sama; widget tanpa data menampilkan pesan, bukan angka 0 kosong; pengguna dua role melihat gabungan widget tanpa duplikat.

---

### P-04 — Daftar Karyawan (F1)

**Tujuan:** menemukan karyawan dan masuk ke profilnya. **Requirement:** FR-EMP-03, 12, 13. **Tindakan utama:** Tambah Karyawan (hanya HR).

```text
+----------------------------------------------------------------------------+
| Karyawan                                     [Impor] [Ekspor] [+ Tambah]   |
| 42 karyawan                                                                |
+----------------------------------------------------------------------------+
| [Cari nama, nomor, email...] [Departemen v] [Jabatan v] [Status v] [Reset] |
+----------------------------------------------------------------------------+
| Karyawan             Departemen     Status kerja   Bergabung     Status    |
| (AV) Rina Putri      Herbal         [Tetap]        12 Jan 2024   [Aktif] : |
|      KG-24003 - Staff Copywriter                                           |
| (AV) Bayu Saputra    Shopee Video   [Kontrak]      3 Mar 2026    [Aktif] : |
|      KG-26007 - Staff Iklan                                                |
+----------------------------------------------------------------------------+
| 1-25 dari 42                                         [<] 1 2 [>]  25/hal v |
+----------------------------------------------------------------------------+
```

- Filter bawaan: Aktif. HR punya tab cepat Aktif | Nonaktif | Semua.
- Menu aksi baris (HR): Lihat, Ubah, Mutasi/Promosi, Nonaktifkan.
- Tampilan direktori (Finance, System Admin): kolom Karyawan, Departemen, Jabatan, Email kerja, Status.
- Tidak ada kolom sensitif di tabel ini untuk role mana pun.
- **Impor** (modal 3 langkah): unduh template → unggah berkas → pratinjau hasil validasi ("18 baris siap, 2 bermasalah", dengan tombol unduh laporan error) → **Impor 18 Baris**.
- **HP:** kartu per karyawan (avatar, nama, jabatan dan departemen, badge status); filter di laci.

**Diterima bila:** satu karyawan bisa ditemukan dalam 10 detik; Manager tidak melihat tombol Tambah, Impor, maupun Ekspor data lengkap; filter tetap ada setelah kembali dari halaman detail.

### P-05 — Tambah / Ubah Karyawan (F1)

**Requirement:** FR-EMP-01, 02, 06, 07; FR-AUTH-02, 03. **Tindakan utama:** Simpan Karyawan.

Stepper tiga langkah (C-20):

| Langkah | Isi (`*` wajib) |
|---|---|
| 1. Data Pribadi | Nama lengkap\*, nama panggilan, jenis kelamin, tempat dan tanggal lahir, foto, nomor HP\*, email pribadi, alamat, kontak darurat |
| 2. Kepegawaian | Tanggal bergabung\*, status kerja\*, tanggal akhir (muncul bila bukan Tetap)\*, departemen\*, jabatan\* (tersaring menurut departemen), atasan langsung\* (terisi manager departemen, bisa diganti), lokasi kerja\*, jadwal kerja\* |
| 3. Akun dan Role | Email kerja\*, role (terisi dari default jabatan, bisa diubah), pilihan "Kirim email undangan" atau "Tampilkan password sementara" |

- Nomor karyawan tampil sebagai pratinjau: "Akan dibuat: KG-26012".
- Sebelum menyimpan, tampil ringkasan ketiga langkah.
- Setelah tersimpan: layar sukses berisi nomor karyawan, email, dan (bila dipilih) password sementara yang **tampil sekali** dengan tombol salin; lalu **Lihat Profil** atau **Tambah Lagi**.
- Data sensitif (KTP, BPJS, rekening, NPWP) tidak diisi di sini, melainkan dari Detail Karyawan.
- **Ubah data:** dilakukan per bagian dari Detail Karyawan, bukan lewat stepper.
- **Mutasi/Promosi:** modal berisi jenis perubahan\*, tanggal efektif\*, departemen, jabatan, atasan, catatan, dengan tampilan "Sebelum → Sesudah".
- **Nonaktifkan:** modal konfirmasi bahaya berisi tanggal keluar\*, alasan\*, catatan, serta akibatnya, mis. "Akun tidak bisa login mulai 30 Nov 2026. 2 pengajuan yang menunggu akan dibatalkan. 3 bawahan perlu atasan baru." (dengan pemilih atasan pengganti).

**Diterima bila:** HR bisa menyelesaikan AC-EMP-01 tanpa berpindah menu; galat ditunjukkan pada langkah dan field yang tepat; password sementara tidak bisa dilihat lagi setelah layar sukses ditutup.

### P-06 — Detail Karyawan (F1)

**Requirement:** FR-EMP-04, 10, 11, 15.

```text
+----------------------------------------------------------------------------+
| Karyawan / Rina Putri                                                      |
| (AV)  Rina Putri   [Aktif] [Tetap]               [Ubah] [Mutasi/Promosi] : |
|       KG-24003 - Staff Copywriter - Herbal Department                      |
|       Atasan: Dimas Pratama                                                |
+----------------------------------------------------------------------------+
| Ringkasan | Kepegawaian & Histori | Dokumen | Absensi | Cuti | Tugas | KPI |
+----------------------------------------------------------------------------+
| Kontak                         | Bulan ini                                 |
|  Email    rina@contoh.id       |  Hadir 6   Terlambat 1   Izin 0   Alpa 0  |
|  HP       0812-xxxx-xxxx       | Saldo cuti                                |
|  Darurat  Ibu, 0813-xxxx-xxxx  |  Cuti Tahunan: sisa 6 dari 12 hari        |
+----------------------------------------------------------------------------+
```

| Tab | Isi | Terlihat oleh |
|---|---|---|
| Ringkasan | Kontak, kepegawaian singkat, kehadiran bulan ini, saldo cuti | Semua yang berhak membuka profil |
| Kepegawaian & Histori | Linimasa penempatan, histori perubahan data, data sensitif ter-*mask* (C-28) | HR; pemilik profil (tanpa histori perubahan oleh orang lain) |
| Dokumen | Tabel dokumen berkategori, unggah, unduh | HR; pemilik profil (lihat saja) |
| Absensi | Kalender dan rekap bulanan | Atasan, HR, pemilik |
| Cuti | Saldo dan riwayat pengajuan | Atasan, HR, pemilik |
| Tugas, KPI (F2) | Daftar tugas dan lembar KPI | Atasan, pemilik; HR untuk KPI |

- Tab yang tidak diizinkan tidak dirender.
- Atasan tidak melihat alamat, tanggal lahir, dokumen, maupun data sensitif.
- Karyawan nonaktif: kepala profil memuat alert netral "Nonaktif sejak 30 Nov 2026 — Resign" dan tombol **Reaktivasi** (HR).

**Diterima bila:** histori penempatan terbaca sebagai linimasa berurutan; nilai sensitif hanya terbuka lewat tombol "Tampilkan" bagi yang berizin; tab mengikuti izin.

### P-07 — Profil Saya (F1)

**Requirement:** FR-EMP-05, FR-AUTH-07.

- Kartu bertumpuk: Data Pribadi, Kepegawaian, Dokumen Saya, Keamanan.
- Field yang boleh diubah sendiri (foto, nomor HP, alamat, email pribadi, kontak darurat) punya tombol **Ubah** yang membuka lembar bawah (HP) atau modal (desktop).
- Field lain tampil hanya-baca dengan keterangan "Hubungi HR untuk mengubah data ini."
- Keamanan: tombol **Ganti Password** (password lama, password baru, ulangi).

**Diterima bila:** field yang tidak boleh diubah tidak pernah tampil sebagai input; setiap perubahan yang tersimpan memberi toast.

---

### P-08 — Absensi Saya (F1)

**Tujuan:** clock-in/out secepat mungkin, lalu melihat riwayat sendiri. **Requirement:** FR-ATT-01, 02, 03, 05, 08, 11, 16; BR-ATT-05, BR-ATT-10. **Tindakan utama:** Clock-in / Clock-out.

```text
+----------------------------------+
| Absensi              [Lonceng 2] |
+----------------------------------+
| +------------------------------+ |
| |  Jumat, 9 Okt 2026           | |
| |          08:02:14            | |
| |  WIB - Jadwal 08:00-16:00    | |
| |                              | |
| |  [        Clock-in        ]  | |
| |  Batas tepat waktu 08:10     | |
| +------------------------------+ |
| Oktober 2026             [<] [>] |
| Hadir 6   Terlambat 1   Izin 0   |
| Cuti 0    Alpa 0   Jam 38 j 55 m |
| +------------------------------+ |
| | Kam 8  07:56-16:03  [Hadir]  | |
| | Rab 7  08:14- ...            | |
| |  [Terlambat 14 mnt]          | |
| |  [Lupa clock-out] [Koreksi]  | |
| | Sel 6  07:59-16:01  [Hadir]  | |
| +------------------------------+ |
+----------------------------------+
| Beranda Absensi Cuti Notif Lain  |
+----------------------------------+
```

**Keadaan widget jam (C-26):**

| Keadaan | Tampilan |
|---|---|
| Belum clock-in | Jam berjalan, jadwal, tombol utama **Clock-in** (`lg`), teks "Batas tepat waktu 08:10" |
| Sudah clock-in | "Masuk 07:58" + badge status, durasi berjalan "Sudah bekerja 3 j 12 mnt", tombol utama **Clock-out** |
| Clock-out sebelum jam pulang | Konfirmasi singkat: "Jam pulang Anda 16:00. Clock-out sekarang tercatat pulang cepat." [Batal] [Clock-out] |
| Sudah clock-out | "Masuk 07:58 · Pulang 16:04 · Total 7 j 06 mnt", tanpa tombol, tautan "Ada yang salah? Ajukan koreksi" |
| Ada cuti/izin disetujui hari ini | Alert info "Anda sedang Cuti Tahunan hari ini. Clock-in tidak tersedia." dan tautan ke pengajuannya |
| Hari libur atau di luar hari kerja | Keterangan "Hari libur: (nama)" dan tombol sekunder "Clock-in di hari libur" |
| Menyimpan | Tombol berstatus memuat dan tidak bisa ditekan lagi |
| Gagal karena jaringan | Alert bahaya "Clock-in belum tersimpan. Periksa koneksi lalu coba lagi." [Coba lagi] |
| Di luar jaringan kantor (bila FR-ATT-17 aktif) | Alert "Clock-in hanya bisa dilakukan dari jaringan kantor." |

- Jam yang tampil adalah **waktu server** (disinkronkan saat halaman dimuat), bukan jam perangkat.
- Riwayat di HP berupa daftar per hari, terbaru di atas. Di desktop: kalender bulan (C-22) di kiri dan tabel harian di kanan.
- Hari yang bermasalah (lupa clock-out, Alpa) punya tombol **Koreksi** yang membuka P-10 dengan tanggal terisi.

**Diterima bila:** clock-in selesai dalam 2 ketukan; ketukan ganda tidak menghasilkan dua record; status hari ini terlihat tanpa menggulir pada layar 360 × 640 px.

### P-09 — Absensi Tim (F1)

**Requirement:** FR-ATT-09, 10, 12, 13. **Tindakan utama:** Ekspor (dan Kunci Periode bagi HR).

- **Tab Harian:** pemilih tanggal (bawaan: hari ini), filter departemen (bagi cakupan semua) dan status. Kartu ringkas Hadir · Terlambat · Belum absen · Izin/Sakit/Cuti · Alpa; mengeklik kartu menyaring tabel. Kolom tabel: Karyawan, Jadwal, Masuk, Pulang, Durasi, Status, Sumber (ikon bila hasil koreksi atau input HR), Aksi.
- **Tab Rekap:** pemilih periode (minggu atau bulan; bawaan: bulan berjalan). Kolom: Karyawan, Hari kerja, Hadir, Terlambat, Menit terlambat, Izin, Sakit, Cuti, Alpa, Lupa clock-out, Jam kerja; baris total di bawah. Klik baris membuka rincian harian karyawan itu.
- **Kunci periode (HR):** tombol **Kunci Periode** dengan konfirmasi bahaya. Setelah terkunci, alert inline "Periode Oktober 2026 dikunci oleh (nama) pada (waktu)" dan tombol "Buka Kunci" (wajib alasan).
- **Ubah manual (HR):** modal berisi nilai tercatat saat ini, jam masuk, jam pulang, status, dan alasan\*.
- **HP:** tab Harian menjadi kartu per karyawan; tab Rekap digulir mendatar dengan kolom nama terkunci.

**Diterima bila:** angka kartu ringkas sama dengan jumlah baris terfilter; Manager tidak melihat tombol ubah manual dan kunci; status kunci periode selalu terlihat.

### P-10 — Koreksi Absensi (F1)

**Requirement:** FR-ATT-06, 07; BR-ATT-07, BR-ATT-08; K-06. **Tindakan utama:** Ajukan Koreksi.

- Form tampil sebagai lembar bawah (HP) atau modal `md` (desktop):
  - **Tanggal**\* — hanya tanggal yang diizinkan yang bisa dipilih; tanggal lain nonaktif dengan keterangan alasannya (melewati batas 7 hari, periode terkunci, atau sudah ada koreksi yang menunggu).
  - **Tercatat saat ini** — hanya-baca, mis. "Masuk 08:14 · Pulang –".
  - **Jam masuk yang benar** dan **Jam pulang yang benar** — isi salah satu atau keduanya.
  - **Alasan**\* (minimal 10 karakter) dan **Lampiran** (opsional).
- Daftar "Koreksi Saya": tanggal, perubahan yang diminta ("Pulang: – → 16:05"), badge status, aksi **Batalkan** selama masih menunggu.
- Approver meninjau lewat P-12/P-13 dengan tampilan **Sebelum → Sesudah** berdampingan beserta dampaknya, mis. "Lupa clock-out → Hadir, 7 j 51 mnt".

**Diterima bila:** tanggal yang tidak diizinkan tidak bisa dipilih dan alasannya terlihat; approver melihat dampak koreksi sebelum memutuskan.

---

### P-11 — Cuti Saya dan Form Pengajuan (F1)

**Tujuan:** melihat saldo dan mengajukan cuti/izin tanpa salah hitung. **Requirement:** FR-LEV-01, 02, 03, 05, 06, 07; BR-LEV-04, 05, 06. **Tindakan utama:** Ajukan Cuti.

**Halaman Cuti Saya**

- Kartu saldo untuk tiap jenis yang memotong saldo: "Cuti Tahunan — sisa 6 hari", dengan rincian kecil "Jatah 12 · Terpakai 4 · Dicadangkan 2" dan batang progres.
- Daftar pengajuan: jenis, tanggal, jumlah hari, badge status, dan pemegang saat ini ("di Dimas Pratama"). Filter status dan tahun. Klik membuka P-13.

**Form pengajuan, HP:**

```text
+----------------------------------+
| < Ajukan Cuti / Izin             |
+----------------------------------+
| Jenis *                          |
| [ Cuti Tahunan                v] |
| Sisa saldo: 8 hari               |
|                                  |
| Mulai *          Selesai *       |
| [14 Okt 2026]    [15 Okt 2026]   |
|                                  |
| +------------------------------+ |
| | Terhitung 2 hari kerja       | |
| | Sisa saldo setelah ini: 6    | |
| | Persetujuan: Atasan, lalu HR | |
| +------------------------------+ |
|                                  |
| Alasan *                         |
| [                              ] |
| Lampiran (opsional)              |
| [ Pilih berkas ]                 |
|                                  |
| [         Ajukan Cuti         ]  |
+----------------------------------+
```

- Setelah jenis dipilih, tampil sisa saldo dan aturan jenis itu sebagai teks bantu, mis. "Diajukan minimal 3 hari sebelumnya" atau "Lampiran wajib bila lebih dari 1 hari".
- Pemilih tanggal menandai hari libur, akhir pekan, dan tanggal yang sudah punya pengajuan.
- **Kotak ringkasan** diperbarui langsung: jumlah hari terhitung, sisa saldo setelah pengajuan, alur persetujuan, dan nama approver.
- Masalah ditampilkan di kotak ringkasan sebelum dikirim:
  - "Saldo tidak cukup. Sisa 1 hari, pengajuan 2 hari."
  - "Bentrok dengan pengajuan 14–15 Okt yang masih menunggu."
  - "Rentang ini tidak memuat hari kerja."
- Belum berhak cuti tahunan: jenis tetap tampil dengan teks bantu "Anda berhak Cuti Tahunan mulai 12 Jan 2027."

**Diterima bila:** jumlah hari dan sisa saldo terlihat sebelum dikirim; form bisa diselesaikan dalam 1 menit; masalah saldo dan bentrok muncul sebelum tombol kirim ditekan.

### P-12 — Persetujuan (F1)

**Tujuan:** memutuskan pengajuan berurutan tanpa berpindah-pindah halaman. **Requirement:** FR-APR-04 s.d. 08, 11; FR-LEV-15. **Tindakan utama:** Setujui / Tolak.

```text
+----------------------------------------------------------------------------+
| Persetujuan                                                                |
| [Menunggu 4] [Riwayat] [Delegasi]                              [Jenis v]   |
+-------------------------------+--------------------------------------------+
| (AV) Rina Putri               | Cuti Tahunan - Rina Putri [Menunggu atasan]|
|  Cuti Tahunan, 2 hari         | 14-15 Okt 2026 - 2 hari kerja              |
|  14-15 Okt - menunggu 2 hari  | Alasan: Acara keluarga di luar kota        |
|-------------------------------| Lampiran: -                                |
| (AV) Bayu Saputra             |--------------------------------------------|
|  Koreksi absensi, 7 Okt       | Konteks                                    |
|  menunggu 1 hari              |  Sisa saldo Rina: 8 hari (menjadi 6)       |
|-------------------------------|  Cuti di tanggal sama: Tono (14 Okt)       |
| (AV) Sari Dewi                |--------------------------------------------|
|  Izin, 1 hari - 10 Okt        | Linimasa                                   |
|                               |  (v) Diajukan - 7 Okt 09:12                |
|                               |  (>) Atasan: Dimas Pratama - menunggu      |
|                               |  ( ) HR - belum giliran                    |
|                               |--------------------------------------------|
|                               | Catatan (opsional) [                     ] |
|                               |                       [Tolak]  [Setujui]   |
+-------------------------------+--------------------------------------------+
```

- **Tab Menunggu:** terlama di atas. Tiap item memuat pemohon, jenis, tanggal, jumlah hari, dan lama menunggu (berwarna peringatan bila lebih dari 1 hari kerja). Item dari delegasi diberi keterangan "atas nama (nama)".
- **Desktop:** dua panel, daftar di kiri dan detail (P-13) di kanan. **HP:** daftar saja; mengetuk item membuka P-13.
- **Tab Riwayat:** keputusan yang pernah saya buat (tanggal, pemohon, jenis, keputusan).
- **Tab Delegasi:** status delegasi saya, form **Tunjuk Pengganti** (pengganti\*, tanggal mulai\*, tanggal selesai\*, alasan), dan tombol akhiri. HR melihat semua delegasi dan bisa mengalihkan langkah yang menunggu.
- Kosong: "Tidak ada yang menunggu keputusan Anda."

**Diterima bila:** dari notifikasi sampai keputusan tersimpan ≤ 3 klik; setelah memutuskan, item berikutnya terbuka otomatis; angka badge di sidebar ikut berkurang.

### P-13 — Detail Pengajuan (F1)

**Requirement:** FR-APR-08; FR-LEV-07, 08, 09; BR-LEV-09.

Susunan: kepala (jenis, pemohon, badge status, pemegang saat ini) → ringkasan → konteks (hanya approver dan HR) → lampiran (hanya yang berhak) → linimasa (C-14) → tombol.

| Yang membuka | Keadaan pengajuan | Tombol |
|---|---|---|
| Pemohon | Menunggu | Batalkan Pengajuan |
| Pemohon | Disetujui, belum mulai | Batalkan Cuti |
| Approver langkah aktif | Menunggu | Tolak, Setujui |
| HR | Menunggu | Alihkan Approver |
| HR | Disetujui, termasuk yang sedang berjalan | Batalkan atau Pendekkan Cuti |

- Pengajuan ditolak: alasan penolakan tampil sebagai alert bahaya di bagian atas.
- Di HP, tombol keputusan menempel di bawah layar.

**Diterima bila:** pemohon selalu melihat siapa pemegang pengajuannya; alasan penolakan terlihat tanpa menggulir; hanya tombol yang sah untuk peran dan keadaan itu yang tampil.

### P-14 — Kalender Cuti (F1)

**Requirement:** FR-LEV-12, FR-ATT-15; K-11.

- Tampilan bulan (C-22). Tiap hari memuat chip nama yang cuti/izin, maksimal 3, lalu "+2 lainnya" yang membuka popover.
- Hari libur diberi latar `bg-subtle` dan namanya; akhir pekan diredupkan.
- **Manager dan HR:** chip berwarna menurut jenis (Cuti = Info, Sakit = Ungu, Izin = Langit); pengajuan yang masih menunggu bergaris putus-putus. Klik chip membuka P-13. Filter departemen bagi cakupan semua.
- **Staff:** chip netral berisi nama saja, tanpa jenis dan alasan, dan tidak bisa diklik.
- **HP:** tampilan agenda (daftar per tanggal) menggantikan kisi bulan.

**Diterima bila:** staff tidak pernah melihat jenis atau alasan cuti rekannya; hari libur mudah dikenali.

---

### P-15 — Tugas (F2)

**Requirement:** FR-TSK-01, 02, 10, 11, 13. **Tindakan utama:** Buat Tugas (pemegang izin penugasan).

- **Lingkup (tab):** Tugas Saya | Tim | Semua, sesuai izin. **Tampilan:** Daftar | Papan.
- **Tugas Saya** dikelompokkan: Terlambat, Hari ini, Minggu ini, Nanti, Selesai (terlipat).
- **Daftar:** Judul (dengan ikon lampiran dan komentar), PIC, Prioritas, Tenggat (dengan penanda terlambat), Progres, Status.
- **Papan (C-23):** kolom Belum dimulai | Dikerjakan | Menunggu review | Revisi | Selesai. Kartu memuat judul, avatar PIC, tenggat, prioritas, dan progres checklist ("3/5").
  - Kartu hanya bisa dipindah lewat transisi yang sah; kolom yang tidak sah meredup saat kartu diseret.
  - Transisi yang butuh isian (bukti hasil, catatan revisi) memunculkan modal sebelum kartu berpindah.
- **Form Buat Tugas** (laci kanan): Judul\*, Deskripsi, Departemen\*, PIC\* (pencarian dalam cakupan), Anggota, Reviewer (bawaan: saya), Prioritas\* (bawaan: Sedang), Tanggal mulai, Tenggat\*, Checklist, Lampiran.
- **HP:** hanya tampilan daftar berkelompok; papan tidak ditampilkan.

**Diterima bila:** tugas terlambat dikenali tanpa membuka detail; kartu tidak bisa dipindah ke status yang tidak sah; staff tidak melihat tombol Buat Tugas.

### P-16 — Detail Tugas (F2)

**Requirement:** FR-TSK-03 s.d. 09, 14, 15, 19.

- **Desktop, dua kolom.** Kiri: judul, deskripsi, checklist (centang mengubah progres), bukti hasil, komentar (C-27). Kanan: status, PIC, reviewer, anggota, prioritas, tenggat, departemen, pembuat, lalu riwayat aktivitas (C-14).
- **Tombol utama berubah menurut peran dan status:**

| Peran | Status | Tombol |
|---|---|---|
| PIC | Belum dimulai | Mulai Kerjakan |
| PIC | Dikerjakan, Revisi | Kirim untuk Review — modal berisi catatan hasil, tautan, lampiran (minimal satu) |
| Reviewer | Menunggu review | Setujui Hasil; Minta Revisi (modal, catatan wajib) |
| Reviewer | Selesai | Buka Kembali (di menu aksi) |
| Pembuat atau manager | Selain Selesai dan Dibatalkan | Ubah, Ganti PIC, Batalkan (di menu aksi) |

- Saat berstatus Revisi, catatan revisi terakhir tampil sebagai alert oranye di atas.
- **HP:** satu kolom, panel info terlipat, tombol utama menempel di bawah.

**Diterima bila:** PIC mengetahui langkah berikutnya dari satu tombol; catatan revisi tidak mungkin terlewat; riwayat menunjukkan siapa melakukan apa dan kapan.

### P-17 — Checklist Harian (F2)

**Requirement:** FR-TSK-16, 17, 18; BR-TSK-06, 07.

- **Staff (HP):** tanggal hari ini dan progres "3 dari 5". Item berupa kotak centang besar (target sentuh 48 px). Centang tersimpan langsung tanpa tombol simpan. Bila semua tuntas: "Checklist hari ini tuntas." Di bawahnya riwayat 7 hari terakhir (tuntas, terlewat, libur, cuti).
- **Manager:** tabel kepatuhan; baris = karyawan, kolom = tanggal dalam minggu berjalan, sel = tuntas / sebagian ("3/5") / terlewat / cuti / libur, ditambah persen kepatuhan per orang. Klik sel membuka rincian. Sel Terlewat punya aksi **Maafkan** (alasan wajib).
- **Kelola template:** daftar template dan form (judul, item, sasaran, pola ulang, perlu review atau tidak).

**Diterima bila:** mencentang satu item cukup satu ketukan; hari cuti dan hari libur tidak pernah tampil sebagai terlewat.

### P-18 — KPI Saya dan KPI Tim (F2)

**Requirement:** FR-KPI-05, 06, 09, 12; BR-KPI-09.

- **KPI Saya:** pemilih periode; kartu skor (cincin progres, skor, badge grade, status lembar); daftar indikator dengan bobot, target, realisasi, batang pencapaian, dan skor. Indikator otomatis diberi label "Otomatis" dengan tooltip sumber datanya. Tombol **Isi Realisasi** untuk indikator manual. Grafik garis tren skor antarperiode.
- **KPI Tim (atasan):** kartu ringkas (rata-rata skor, sebaran grade, belum dinilai) dan tabel anggota: nama, jabatan, status lembar, skor, grade, aksi **Atur Target** atau **Nilai**.
- **HR:** rekap semua departemen dengan filter dan ekspor.
- Staff tidak melihat skor atau peringkat karyawan lain di mana pun.

**Diterima bila:** staff bisa membaca asal skornya lewat tautan "Cara hitung"; atasan langsung melihat siapa yang belum dinilai.

### P-19 — Lembar KPI (F2)

**Requirement:** FR-KPI-05 s.d. 11; BR-KPI-05, BR-KPI-10.

```text
+----------------------------------------------------------------------------+
| KPI / Rina Putri - Minggu 41 (5-11 Okt 2026)         [Menunggu penilaian]  |
| Staff Copywriter - Herbal Department           Skor sementara 89,18  [B]   |
+----------------------------------------------------------------------------+
| Indikator            Bobot  Target  Realisasi  Pencapaian          Skor    |
| Output konten         40%      60        54    [=========-]  90,00  36,00  |
| Ketepatan deadline    25%     95%       90%    [=========-]  94,74  23,68  |
|   Otomatis                                                                 |
| Kualitas copy         25%       5     [ 4 v]   [========--]  80,00  20,00  |
| Checklist harian      10%    100%       95%    [=========-]  95,00   9,50  |
|   Otomatis                                                                 |
+----------------------------------------------------------------------------+
| Catatan atasan   [                                                       ] |
| Tanggapan staff  (terisi setelah hasil dibagikan)                          |
|                                         [Simpan Draf]  [Selesaikan Review] |
+----------------------------------------------------------------------------+
```

| Status lembar | Yang bisa diubah |
|---|---|
| Penetapan target | Atasan mengubah kolom Target (dan Bobot bila diizinkan) |
| Berjalan | Staff mengisi Realisasi indikator manual beserta catatan/bukti |
| Menunggu penilaian | Atasan memverifikasi realisasi, mengisi rating 1–5, menulis catatan |
| Sudah dinilai | Staff menulis tanggapan dan menekan **Tandai Sudah Dibaca** |
| Periode ditutup | Semua hanya-baca, dengan alert "Periode ini sudah ditutup" |

- Realisasi yang dikoreksi atasan menampilkan nilai asli dari staff (dicoret), nilai baru, dan catatan koreksi.
- Indikator "tidak dinilai": baris diredupkan dengan keterangan "Tidak dinilai pada periode ini; bobotnya dibagi ke indikator lain."
- Tautan **Cara hitung** membuka popover berisi rumus.
- Total bobot selain 100% memunculkan alert bahaya dan lembar tidak bisa disimpan.

**Diterima bila:** data contoh pada PRD Sistem tampil dengan skor 89,18 dan grade B; nilai asli staff tetap terlihat setelah dikoreksi.

---

### P-20 — Laporan (F1, diperluas F2/F3)

**Requirement:** FR-RPT-01 s.d. 08; laporan R-01 s.d. R-09. **Tindakan utama:** Ekspor.

- **Halaman utama:** kartu per laporan yang boleh diakses (judul, satu kalimat isi, ikon), dikelompokkan: Karyawan, Absensi, Cuti, Tugas & KPI (F2), Payroll (F3). Tab kedua **Unduhan Saya** berisi daftar ekspor (laporan, filter, waktu, status, kedaluwarsa).
- **Halaman tiap laporan,** dari atas ke bawah: kepala dengan tombol **Ekspor** (Excel / PDF) → bilah filter (periode wajib; departemen, karyawan, status) → 3–5 kartu ringkasan → grafik ringkas (bila ada) → tabel pratinjau berpaginasi dengan baris total.
- **Ekspor:** sampai 5.000 baris langsung terunduh. Lebih dari itu: toast "Laporan sedang disiapkan. Kami beri tahu saat siap.", lalu notifikasi berisi tautan unduh yang berlaku 24 jam.
- **Template PDF:** A4 (lanskap bila lebih dari 7 kolom). Kop berisi logo, nama perusahaan, alamat, dan kontak dari Pengaturan → Profil Perusahaan. Lalu judul laporan, periode, dan filter. Kepala tabel berulang di tiap halaman. Kaki: "Dicetak oleh (nama) pada (waktu)" dan "Halaman x dari y".
- **Template Excel:** baris atas berisi judul, periode, filter, dan pencetak; kepala tabel tebal dan dibekukan; kolom angka bertipe angka dan kolom tanggal bertipe tanggal.
- **HP:** laporan bisa dibuka (ringkasan dan tabel bergulir mendatar), tetapi rancangan utamanya untuk desktop.

**Diterima bila:** PDF memuat kop, periode, filter, dan nama pencetak; angka di Excel bisa langsung dijumlahkan; pengguna hanya melihat laporan yang diizinkan.

### P-21 — Notifikasi (F1)

**Requirement:** FR-NTF-01, 02, 03, 05, 08.

- **Lonceng (C-24):** angka belum dibaca, maksimal tertulis "99+". Klik membuka panel selebar 380 px (di HP: halaman penuh) berisi 10 notifikasi terbaru.
- **Tiap notifikasi:** ikon jenis, judul (tebal bila belum dibaca), ringkasan satu baris, waktu relatif, titik penanda belum dibaca.
- **Pola judul:** "(Siapa) (melakukan apa) — (objek)", mis. "Rina Putri mengajukan Cuti Tahunan — 14–15 Okt".
- Panel punya "Tandai semua dibaca" dan "Lihat semua".
- **Halaman daftar:** tab Semua | Belum dibaca, dikelompokkan Hari ini / Kemarin / Lebih lama. Klik membuka objek terkait dan menandai sudah dibaca.
- **Preferensi** (di Profil Saya): sakelar email per kategori — Persetujuan, Absensi, Tugas, KPI, Lainnya.
- Kosong: "Belum ada notifikasi."

**Diterima bila:** angka pada lonceng berubah tanpa memuat ulang halaman dalam 60 detik; setiap notifikasi membawa ke objek yang tepat.

### P-22 — Pengaturan (F1)

**Requirement:** FR-SET-01 s.d. 08; FR-ORG-01 s.d. 06; FR-ATT-14, 15; FR-LEV-16; FR-APR-09; FR-KPI-01.

Tata letak: navigasi sekunder tegak di kiri, konten di kanan. Di HP, sub-menu tampil sebagai daftar yang membuka halaman masing-masing. Semua sub-halaman berpola sama: tabel + tombol Tambah + form di modal atau laci. Data master **dinonaktifkan dengan sakelar**, tidak dihapus; item nonaktif diredupkan dan diberi badge "Nonaktif".

| Sub-halaman | Isi khusus |
|---|---|
| Profil Perusahaan | Nama, alamat, kontak, logo, dengan pratinjau kop laporan di samping form |
| Umum | Zona waktu default, format nomor karyawan (dengan pratinjau hasil), lama sesi, email aktif/mati dan tombol "Kirim Email Uji" |
| Organisasi | Tab Departemen · Jabatan · Lokasi Kerja, serta bagan organisasi |
| Jadwal & Libur | Tab Jadwal Kerja (pemilih hari, jam, toleransi) · Hari Libur (kalender setahun, tabel, impor) · Aturan Absensi (batas koreksi, pengingat clock-in, pembatasan IP) |
| Jenis Cuti & Saldo | Tabel jenis cuti dan formnya; kebijakan saldo tahunan; tabel saldo karyawan dengan aksi **Sesuaikan Saldo** |
| Approval | Approver cadangan, approver puncak, ambang pengingat dan eskalasi, daftar delegasi aktif |
| KPI (F2) | Template per jabatan dengan penjumlah bobot langsung ("Total 100%"), ambang grade, batas atas pencapaian |
| Akun | Tabel akun: nama, email, role, status, login terakhir; aksi Reset Password, Ubah Role, Nonaktifkan |
| Role & Permission | Matriks kotak centang: baris permission berkelompok, kolom role. Perubahan ditandai dan disimpan sekaligus |
| Audit Log | Filter (tanggal, pelaku, modul, aksi), tabel (waktu, pelaku, aksi, objek), dan laci detail "Sebelum / Sesudah" berdampingan |

- Perubahan aturan menampilkan keterangan: "Berlaku mulai sekarang. Data sebelumnya tidak dihitung ulang."
- Menyimpan perubahan permission memunculkan konfirmasi yang menyebut jumlah pengguna terdampak.

**Diterima bila:** editor template KPI langsung menolak total bobot selain 100%; perubahan permission selalu dikonfirmasi; detail audit log menampilkan nilai sebelum dan sesudah.

---

### P-23 — Payroll dan Slip Gaji (F3)

**Requirement:** FR-PAY-01 s.d. 12.

- **Daftar periode:** tabel (periode, tanggal bayar, jumlah karyawan, total neto, status) dan tombol **Buat Periode**.
- **Detail periode:**
  - Stepper status di atas: Draf → Dihitung → Menunggu persetujuan → Disetujui → Dibayar.
  - Kartu total: pendapatan, potongan, neto, jumlah karyawan.
  - Alert peringatan: absensi belum dikunci, neto negatif, rekening kosong.
  - Tabel karyawan: nama, hari hadir, pendapatan, potongan, neto, selisih terhadap periode lalu. Klik baris membuka laci rincian komponen; komponen manual bisa diubah selama status Draf atau Dihitung.
  - Tombol utama mengikuti status: **Hitung Draf** → **Ajukan Persetujuan** → (penyetuju) **Setujui** / **Tolak** → **Tandai Dibayar**. Tombol sekunder: **Ekspor Rekap Transfer**.
- Nominal rata kanan dengan angka selebar tetap. Ada tombol berikon mata untuk menyamarkan seluruh kolom nominal sementara.
- **Slip Gaji Saya (HP):** daftar periode → slip berisi kop, identitas, periode, tabel Pendapatan dan Potongan, serta Neto yang menonjol. Neto disamarkan sampai pengguna mengetuk "Tampilkan". Tombol **Unduh PDF**.

**Diterima bila:** slip terbaca di HP tanpa menggulir ke samping; nominal tidak pernah muncul di notifikasi atau email; penyetuju bisa melihat selisih terbesar tanpa mengekspor.

### P-24 — Rekrutmen dan Checklist (F3)

**Requirement:** FR-REC-01 s.d. 10.

- **Lowongan:** tabel (jabatan, departemen, kebutuhan, kandidat aktif, status). Detail lowongan berisi papan tahap kandidat: kolom = tahap, kartu = nama, sumber, dan lama di tahap itu. Memindahkan ke "Tidak lolos" wajib mengisi alasan.
- **Detail kandidat:** data, CV (pratinjau dan unduh), riwayat tahap, form penilaian interview (skor 1–5 dan catatan). Tombol **Jadikan Karyawan** hanya pada tahap Diterima dan membuka P-05 dengan data terisi.
- **Checklist:** tab Onboarding | Offboarding | Template. Daftar karyawan dengan batang progres ("5/8") → rincian item (judul, penanggung jawab, tenggat, status). Item terlambat ditandai. Penanggung jawab melihat "Checklist Saya", yang juga muncul di dashboard.

**Diterima bila:** konversi kandidat tidak butuh mengetik ulang; item checklist yang terlambat mudah dikenali; Manager hanya melihat lowongan departemennya.

### P-25 — Halaman Sistem (F1)

| Keadaan | Judul | Isi dan tindakan |
|---|---|---|
| 403 | "Halaman ini tidak tersedia untuk akun Anda" | Penjelasan singkat dan tombol **Kembali ke Dashboard** |
| 404 | "Halaman tidak ditemukan" | Tombol **Kembali ke Dashboard** |
| 500 | "Terjadi gangguan di sistem" | "Coba lagi beberapa saat. Jika berlanjut, hubungi Admin.", kode rujukan, tombol **Muat Ulang** |
| Pemeliharaan | "Sistem sedang diperbarui" | Perkiraan waktu selesai |
| Tanpa koneksi | Banner di atas: "Tidak ada koneksi internet" | Hilang otomatis saat tersambung kembali |

Halaman galat tidak pernah menampilkan rincian teknis. Bila pengguna sudah login, halaman 403 dan 404 tetap memakai app shell agar navigasi tetap tersedia.

---

## 9. Microcopy dan Bahasa

### 9.1 Gaya bahasa

- Bahasa Indonesia yang baku tetapi ramah; menyapa dengan "Anda".
- Kalimat aktif dan pendek. Tidak ada istilah teknis di depan pengguna (mis. "galat 422").
- Tombol dan judul memakai huruf kapital di awal tiap kata ("Ajukan Cuti"); pesan memakai gaya kalimat biasa.
- Satu istilah untuk satu hal, sesuai tabel di bawah.

### 9.2 Istilah baku

| Pakai | Jangan pakai |
|---|---|
| Clock-in, Clock-out | Check-in, Absen masuk, Tap in |
| Cuti, Izin, Sakit | Leave, Permit |
| Pengajuan | Request, Permohonan |
| Persetujuan; Setujui, Tolak | Approval; Approve, Reject, Terima |
| Atasan | Supervisor, Manager (sebagai sebutan umum) |
| Karyawan | Pegawai, Employee |
| Tugas | Task |
| Tenggat | Deadline, Due date |
| Alpa | Mangkir, Absen |
| Lampiran | Attachment, File |
| Nonaktifkan | Hapus (untuk karyawan dan data master) |
| Ekspor, Impor | Download laporan, Upload data |

### 9.3 Pola pesan

| Jenis | Pola | Contoh |
|---|---|---|
| Berhasil | Apa yang berhasil | "Pengajuan cuti terkirim ke Dimas Pratama." |
| Galat validasi | Apa yang kurang + cara memperbaiki | "Alasan minimal 10 karakter." |
| Galat sistem | Apa yang terjadi + apa yang bisa dilakukan | "Data belum tersimpan karena koneksi terputus. Coba lagi." |
| Konfirmasi | Pertanyaan spesifik + akibatnya | "Batalkan cuti 14–15 Okt? Saldo 2 hari akan dikembalikan." |
| Kosong | Keadaan + langkah berikutnya | "Belum ada pengajuan cuti." |
| Teks bantu | Aturan, sebelum pengguna salah | "PDF, JPG, atau PNG. Maksimal 5 MB." |
| Notifikasi | Siapa, melakukan apa, objeknya | "Dimas Pratama menyetujui cuti Anda — 14–15 Okt" |

Yang dihindari: menyalahkan pengguna ("Anda salah memasukkan…"), tanda seru berlebihan, "Oops", kode galat tanpa penjelasan, dan "Apakah Anda yakin?" tanpa menyebut apa yang akan terjadi.

### 9.4 Label tombol baku

| Keperluan | Label |
|---|---|
| Menyimpan form | Simpan Perubahan (atau Simpan Karyawan, Simpan Password, sesuai objek) |
| Menutup form tanpa menyimpan | Batal |
| Mengirim pengajuan | Ajukan Cuti, Ajukan Koreksi |
| Memutuskan | Setujui, Tolak |
| Membatalkan sebuah pengajuan | Batalkan Pengajuan — tombol pasangannya di dialog: **Tidak Jadi** |
| Data keluar-masuk | Ekspor, Impor |
| Lain-lain | Tambah Karyawan, Kunci Periode, Tampilkan, Terapkan, Reset, Coba Lagi, Kembali, Lihat Semua |

"Batal" berarti menutup tanpa menyimpan; "Batalkan Pengajuan" berarti membatalkan objeknya. Keduanya tidak boleh muncul berdampingan di satu dialog.

---

## 10. Aksesibilitas

Target: WCAG 2.1 tingkat AA.

| Area | Ketentuan |
|---|---|
| Kontras | Teks ≥ 4,5 : 1 (teks besar ≥ 3 : 1); garis komponen dan grafik ≥ 3 : 1. Nilai token sudah dihitung di bagian 2 |
| Keyboard | Semua fungsi bisa dipakai dengan keyboard; urutan tab mengikuti urutan baca; Esc menutup modal, laci, dan dropdown; tersedia tautan "Lewati ke konten" |
| Fokus | Selalu terlihat (cincin 2 px `primary-ring`); dikurung di dalam modal dan kembali ke pemicu saat modal ditutup |
| Form | Tiap input punya label yang terhubung; pesan galat terhubung ke field dan diumumkan; field wajib ditandai juga secara program; kelompok radio/kotak centang punya legenda |
| Struktur | Satu `h1` per halaman, heading berurutan, landmark `header`/`nav`/`main`; tabel memakai sel kepala; judul halaman unik, mis. "Absensi Saya – HRIS Kurma Group" |
| Non-teks | Ikon bermakna punya teks alternatif; ikon hiasan disembunyikan dari pembaca layar; grafik punya ringkasan teks atau tabel datanya |
| Status | Tidak hanya warna; toast dan alert diumumkan ke pembaca layar |
| Sentuh | Target minimal 44 × 44 px, jarak antar target minimal 8 px |
| Zoom dan orientasi | Tetap berfungsi pada zoom 200%; orientasi layar tidak dikunci |
| Gerak | Menghormati `prefers-reduced-motion`; tidak ada kedipan |
| Bahasa | Atribut bahasa halaman `id` |

---

## 11. Aturan Responsif

| Elemen | HP (< 640 px) | Tablet (640–1023 px) | Laptop dan desktop (≥ 1024 px) |
|---|---|---|---|
| Navigasi | Navigasi bawah + laci "Lainnya" | Laci lewat tombol menu | Sidebar ringkas atau penuh |
| Tindakan utama | Tombol selebar layar; menempel di bawah pada halaman panjang | Di kepala halaman | Di kepala halaman |
| Kartu statistik | 2 per baris | 2–3 per baris | 4 per baris |
| Tabel | Kartu per baris; tabel laporan bergulir mendatar | Tabel dengan kolom terpenting | Tabel penuh |
| Filter | Tombol "Filter" membuka laci dengan "Terapkan" | Bilah; sisanya di "Filter lain" | Bilah penuh |
| Form | 1 kolom, input 48 px, huruf 16 px | 1–2 kolom | 2 kolom untuk form panjang |
| Modal | Lembar dari bawah selebar layar | Modal di tengah | Modal di tengah |
| Tampilan dua panel (Persetujuan) | Daftar, lalu halaman detail | Daftar, lalu halaman detail | Dua panel berdampingan |
| Tab yang banyak | Bergulir mendatar | Bergulir mendatar | Semua terlihat |
| Kalender | Agenda (daftar per tanggal) | Kisi bulan ringkas | Kisi bulan |
| Papan kanban | Diganti daftar berkelompok | Bergulir mendatar | Penuh |
| Grafik | Tinggi 200 px, legenda di bawah | Tinggi 240 px | Tinggi 280–320 px |

Aturan umum:

1. Tidak ada gulir mendatar pada tingkat halaman di lebar 360 px.
2. Konten tidak tertutup navigasi bawah; area aman layar (poni/lekuk) dihormati.
3. Ukuran uji wajib: 360 × 640, 390 × 844, 768 × 1024, 1366 × 768, 1920 × 1080.
4. **Wajib nyaman di HP:** P-01, P-02, P-03 (varian staff dan manager), P-07, P-08, P-10, P-11, P-12, P-13, P-16, P-17, P-21, dan slip gaji pada P-23. Halaman lain cukup berfungsi di HP.

---

## 12. Task Breakdown Desain

Task desain berjalan seiring task sistem pada PRD Sistem bagian 11. Kolom "Mendukung" menyebut task sistem yang memerlukan hasilnya. D-01 s.d. D-04 harus selesai sebelum halaman apa pun dibuat.

| ID | Task | Cakupan | Keluaran | Selesai bila | Mendukung | Fase |
|---|---|---|---|---|---|:-:|
| D-01 | Token dan tema | Bagian 2 sebagai variabel CSS/konfigurasi tema; huruf Inter; set ikon | Berkas tema dan halaman contoh token | Tidak ada warna atau ukuran di luar token; kontras sesuai tabel | T1.03 | F1 |
| D-02 | Komponen dasar | C-01, C-02, C-03, C-05, C-06, C-07, C-08, C-09, C-10, C-13, C-18, C-19, C-21 | Halaman galeri komponen | Semua state pada tabel 5.1 tersedia dan bisa dipakai dengan keyboard | T1.03 | F1 |
| D-03 | Komponen data | C-04, C-12, C-14, C-15, C-16, C-17, C-28, termasuk versi kartu untuk HP | Galeri dan contoh tabel berisi data | Keadaan memuat, kosong, galat, dan terisi tersedia; tabel menjadi kartu di HP | T1.03 | F1 |
| D-04 | App shell dan navigasi | Sidebar penuh dan ringkas, topbar, navigasi bawah, laci, C-11, menu per role (bagian 3 dan 4) | Shell yang berfungsi | Menu sesuai matriks bagian 4 untuk 7 role; nyaman pada lebar 360 px | T1.03, T1.05 | F1 |
| D-05 | Halaman autentikasi | P-01, P-02 | Halaman jadi | Kriteria "Diterima bila" P-01 dan P-02 | T1.04 | F1 |
| D-06 | Notifikasi | C-24, P-21 | Panel dan halaman | Kriteria P-21 | T1.11 | F1 |
| D-07 | Pengaturan dan audit log | P-22 (sub-halaman F1) | Halaman jadi | Kriteria P-22 | T1.06–T1.09 | F1 |
| D-08 | Karyawan | C-20, P-04, P-05, P-06, P-07 | Halaman jadi | Kriteria P-04 s.d. P-07 | T2.02–T2.08 | F1 |
| D-09 | Absensi | C-22, C-26, P-08, P-09, P-10 | Halaman jadi | Kriteria P-08 s.d. P-10 | T3.01–T3.08 | F1 |
| D-10 | Cuti dan persetujuan | P-11, P-12, P-13, P-14 | Halaman jadi | Kriteria P-11 s.d. P-14 | T3.05, T3.09–T3.12 | F1 |
| D-11 | Dashboard | C-25, P-03 (semua varian F1) | Halaman jadi | Kriteria P-03 | T4.01, T4.02 | F1 |
| D-12 | Laporan dan template ekspor | P-20, template PDF dan Excel | Halaman dan template | Kriteria P-20 | T4.03–T4.05 | F1 |
| D-13 | Halaman sistem | P-25 | Halaman jadi | Semua keadaan tersedia tanpa rincian teknis | T1.03 | F1 |
| D-14 | Uji desain F1 | Uji responsif pada 5 ukuran layar, uji keyboard, uji kontras, uji sasaran pengalaman (bagian 1.1) dengan 3–5 pengguna | Catatan temuan dan perbaikannya | Checklist bagian 13 terpenuhi di semua halaman F1 | T4.06, T4.08 | F1 |
| D-15 | Tugas dan checklist | C-23, C-27, P-15, P-16, P-17 | Halaman jadi | Kriteria P-15 s.d. P-17 | T5.02–T5.07 | F2 |
| D-16 | KPI | P-18, P-19, sub-halaman KPI pada P-22, widget F2 pada P-03 | Halaman jadi | Kriteria P-18 dan P-19 | T5.08–T5.13 | F2 |
| D-17 | Payroll dan slip | P-23, template slip PDF | Halaman dan template | Kriteria P-23 | T6.02–T6.05 | F3 |
| D-18 | Rekrutmen dan checklist | P-24 | Halaman jadi | Kriteria P-24 | T6.06–T6.09 | F3 |

**Urutan F1:** D-01 → D-02 → D-03 → D-04 → (D-05, D-06, D-07, D-13 bisa paralel) → D-08 → D-09 → D-10 → D-11 → D-12 → D-14.

---

## 13. Checklist Penerimaan Desain

Berlaku untuk setiap halaman sebelum dianggap selesai:

- [ ] Hanya memakai token bagian 2; tidak ada warna, ukuran huruf, atau sudut di luar token.
- [ ] Hanya memakai komponen bagian 5.
- [ ] Empat keadaan tersedia: memuat, kosong, galat, terisi.
- [ ] Ada satu tindakan utama yang jelas; tombol berlabel kata kerja + objek.
- [ ] Menu, kolom, tab, dan tombol mengikuti izin; tidak ada elemen untuk fitur yang tidak boleh dipakai.
- [ ] Status memakai label dan warna bagian 6, selalu disertai teks.
- [ ] Form: label di atas, tanda wajib, pesan galat spesifik, isian tidak hilang saat galat.
- [ ] Tindakan yang tidak bisa dibatalkan dikonfirmasi dengan menyebut akibatnya.
- [ ] Format tanggal, jam, angka, dan uang sesuai bagian 7.7.
- [ ] Teks memakai istilah baku bagian 9.2.
- [ ] Bisa dipakai sepenuhnya dengan keyboard; fokus selalu terlihat.
- [ ] Kontras memenuhi AA; target sentuh minimal 44 px.
- [ ] Tidak ada gulir mendatar pada lebar 360 px; sudah diuji pada 5 ukuran layar.
- [ ] Data sensitif ter-*mask* sesuai bagian 7.6.
- [ ] Kriteria "Diterima bila" pada halaman tersebut terpenuhi.

---

## 14. Aturan untuk Implementasi

Untuk developer maupun AI coding agent yang membangun tampilan dari dokumen ini:

1. Baca bagian 2 s.d. 7 sebelum membuat halaman apa pun, dan selesaikan D-01 s.d. D-04 lebih dulu.
2. Jangan menulis nilai warna, ukuran, atau bayangan langsung di halaman. Pakai token.
3. Jangan membuat komponen baru bila sudah ada di bagian 5. Bila memang perlu varian baru, tambahkan dulu ke pustaka komponen dan ke dokumen ini.
4. Elemen yang tidak diizinkan **tidak dirender** dari server, bukan disembunyikan dengan CSS. Izin tetap diperiksa lagi di backend (PRD Sistem bagian 6.5).
5. Setiap halaman daftar mendukung keadaan memuat, kosong, dan galat, serta menyimpan filter di URL.
6. Semua teks antarmuka ditaruh di berkas bahasa, tidak ditulis langsung di tampilan.
7. Pakai satu pustaka ikon dan satu pustaka grafik untuk seluruh aplikasi; jangan menambah pustaka UI besar tanpa persetujuan.
8. Wireframe menunjukkan susunan dan isi. Nama dan angka di dalamnya hanya contoh dan tidak boleh menjadi data nyata.
9. Bila suatu kasus belum diatur di sini, ikuti pola terdekat yang sudah ada, lalu catat keputusannya supaya bisa ditambahkan ke dokumen.
10. Sebelum menyerahkan halaman, jalankan checklist bagian 13.
