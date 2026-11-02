# HRIS Kurma Group

Sistem Informasi Manajemen Sumber Daya Manusia (Human Resource Information System) terintegrasi berbasis **Laravel (Backend)** dan **React + TypeScript + Vite (Frontend)**.

---

## 🛠️ Prasyarat Sistem

- **PHP**: >= 8.1 (dengan ekstensi `pdo_mysql`, `mbstring`, `openssl`, `bcmath`, `fileinfo`)
- **Composer**: >= 2.x
- **Node.js**: >= 18.x & **npm**
- **MySQL / MariaDB**: >= 8.0 / 10.4
- Web Server / Environment Lokal: **Laragon / XAMPP / Docker**

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Konfigurasi Backend (Laravel)

1. Masuk ke direktori `backend`:
   ```bash
   cd backend
   ```
2. Pasang dependensi PHP:
   ```bash
   composer install
   ```
3. Buat file `.env` dari template:
   ```bash
   cp .env.example .env
   ```
4. Sesuaikan konfigurasi database di file `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=hris_db
   DB_USERNAME=root
   DB_PASSWORD=
   ```
5. Generate application key:
   ```bash
   php artisan key:generate
   ```
6. Buat database baru bernama `hris_db` di MySQL Anda, kemudian jalankan migrasi & seeder data awal:
   ```bash
   php artisan migrate --seed
   ```
   *(Opsional: Anda juga dapat langsung mengimpor file dump SQL yang sudah bersih di `backend/database/hris_clean_initial.sql`)*

7. Buat symlink storage untuk upload foto/dokumen:
   ```bash
   php artisan storage:link
   ```
8. Jalankan server backend:
   ```bash
   php artisan serve
   ```
   Backend berjalan di: `http://localhost:8000`

---

### 2. Konfigurasi Frontend (React + Vite)

1. Buka terminal baru dan masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Pasang dependensi JavaScript:
   ```bash
   npm install
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```
   Frontend berjalan di: `http://localhost:5173`

---

## 🔐 Akun Default (Super Admin)

Setelah database dimigrasi dan diseed, sistem menyediakan 1 akun administrator bawaan:

- **Email**: `admin@kurma.group`
- **Password**: `password123`
- **Role**: `super-admin` (Akses penuh seluruh modul portal karyawan & backend manajemen)

---

## 📦 Struktur Direktori Utama

```
HRIS/
├── backend/                  # RESTful API Laravel 10
│   ├── app/                  # Controller, Models, Policies, Services
│   ├── database/             # Migrations, Seeders, & dump SQL awal (hris_clean_initial.sql)
│   ├── routes/api.php        # Definisi rute API
│   └── .env.example          # Template konfigurasi environment backend
├── frontend/                 # Single Page Application React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/       # Komponen UI modular
│   │   ├── context/          # State management (AuthContext, ThemeContext)
│   │   ├── pages/            # Halaman Portal Karyawan & Backend HR/Admin
│   │   └── services/         # API integration services
│   └── vite.config.ts        # Konfigurasi Vite & API proxy
├── docker-compose.yml        # Konfigurasi containerization Docker
└── README.md                 # Petunjuk instalasi dan dokumentasi
```

---

## 📌 Fitur Unggulan

- **Portal Karyawan**: Absensi QR Code (scan & token dinamis), Profil Karyawan, Pengajuan Cuti/Izin, Daily Report (spreadsheet style), Notifikasi Internal, Slip Gaji Pribadi.
- **Backend HR & Manajemen**: Manajemen Karyawan & Struktur Organisasi, Monitoring & Koreksi Absensi, Approval Berjenjang Cuti & Laporan Kerja, Modul Payroll (Cut-off periode, rilis slip gaji, ekspor Excel), Rekrutmen, dan Audit Log.

