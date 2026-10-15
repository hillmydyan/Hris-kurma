# PROMPT AI AGENT — HRIS COMPANY MANAGEMENT SYSTEM

## 1. Role Agent

Bertindak sebagai **Senior Full-Stack Developer, System Analyst, UI/UX Designer, dan Software Architect**. Bangun aplikasi HRIS yang modern, profesional, aman, dan siap dikembangkan untuk kebutuhan operasional perusahaan.

Jangan hanya membuat mockup atau halaman statis. Implementasikan aplikasi dengan frontend, backend, database, autentikasi, otorisasi, workflow, validasi, dan penyimpanan data yang benar-benar berfungsi.

Jika repository sudah tersedia:
1. Periksa struktur project dan teknologi yang digunakan.
2. Pelajari kode, database, dan komponen UI yang sudah ada.
3. Pertahankan fitur yang masih relevan.
4. Jangan mengganti arsitektur utama tanpa alasan teknis yang kuat.
5. Buat rencana implementasi singkat sebelum melakukan perubahan besar.

## 2. Tujuan Aplikasi

HRIS memiliki dua area utama:

**A. User Portal**
Digunakan oleh seluruh karyawan untuk:
- Dashboard pribadi.
- Melihat dan memperbarui profil.
- Absensi menggunakan QR Code.
- Mengajukan izin/cuti.
- Mengisi Daily Report harian dalam bentuk tabel seperti spreadsheet.
- Melihat riwayat absensi, izin, dan laporan harian.

**B. Management Backend**
Digunakan oleh Admin Sistem, HR, Owner, Manager Departemen, dan pihak lain sesuai permission untuk:
- Mengelola karyawan dan organisasi.
- Memantau absensi.
- Menyetujui pengajuan izin/cuti.
- Memantau dan meninjau Daily Report.
- Mengelola penggajian dan slip gaji.
- Mengelola KPI dan evaluasi kinerja.
- Membuat laporan dan mengekspor data.

Pisahkan User Portal dan Management Backend secara jelas dari sisi navigasi, tampilan, serta hak akses. Keduanya boleh menggunakan satu aplikasi dan satu backend yang sama.

## 3. Struktur Organisasi

Buat struktur organisasi yang dapat dikonfigurasi melalui backend.

### Herbal Department
- Manager
- Staff Marketing
- Staff Riset
- Staff Copywriter

### Fashion MY PH Department
- Manager
- Staff Marketing
- Staff Riset
- Staff Copywriter

### Shopee Video Department
- Manager
- Staff Marketing
- Staff Iklan
- Staff Copywriter

### HR Department
- Staff HR
- Staff Finance
- Staff IT
- Staff Data
- Staff Support
- Manager Operasional
- Staff Operasional

Jangan hardcode nama departemen dan jabatan ke dalam logika aplikasi. Simpan di database agar Admin dapat menambah, mengubah, dan menonaktifkan jabatan atau departemen tanpa mengubah kode.

Setiap karyawan memiliki departemen, jabatan, status kerja, dan manager penanggung jawab sesuai struktur yang ditentukan.

## 4. User Portal

### 4.1 Dashboard User

Tampilkan:
- Sapaan dan informasi nama karyawan.
- Departemen dan jabatan.
- Status absensi hari ini.
- Tombol Scan QR.
- Ringkasan jam masuk dan jam pulang.
- Status pengajuan izin/cuti terakhir.
- Status Daily Report hari ini.
- Ringkasan laporan yang telah dikirim.
- Notifikasi dan pengingat aktivitas yang belum selesai.

Tampilkan hanya informasi yang relevan untuk pengguna yang sedang login.

### 4.2 Profile

Informasi profil:
- Foto profil, nama lengkap, Employee ID, email, nomor telepon.
- Departemen, jabatan, manager, tanggal bergabung, dan status karyawan.

Karyawan hanya boleh mengubah kolom yang diizinkan, misalnya foto profil, nomor telepon, atau informasi kontak tertentu. Perubahan departemen, jabatan, status kerja, dan data sensitif hanya boleh dilakukan oleh role berwenang.

### 4.3 Absensi QR Code

Workflow:
1. User login dan membuka halaman Absensi.
2. User memilih Absen Masuk atau Absen Pulang.
3. User memberikan izin kamera jika diperlukan.
4. User memindai QR Code perusahaan.
5. Backend memvalidasi QR, pengguna, waktu, jadwal kerja, dan aturan absensi.
6. Jika valid, backend menyimpan waktu absensi.
7. User menerima notifikasi berhasil atau alasan kegagalan.
8. Data muncul pada riwayat absensi dan dashboard.

Fitur:
- Absen masuk dan pulang.
- Riwayat absensi.
- Status hadir, terlambat, izin, cuti, dan tidak hadir.
- Informasi waktu scan.
- Pencegahan scan ganda.
- Penanganan QR kedaluwarsa atau tidak valid.
- Pengajuan koreksi absensi.

**Keamanan QR:**
- Jangan menjadikan QR statis tanpa batas sebagai satu-satunya validasi.
- Gunakan token atau QR dengan masa berlaku dan validasi server.
- Simpan secret dan aturan validasi di backend.
- Jangan mempercayai waktu atau status yang dikirim dari browser.
- Sediakan halaman admin untuk menghasilkan dan menampilkan QR dinamis jika metode ini dipilih.
- Tolak QR kedaluwarsa atau yang sudah digunakan sesuai aturan.
- Jangan menyatakan scan berhasil sebelum backend mengonfirmasi transaksi.

Buat konfigurasi untuk metode absensi, jadwal, lokasi, dan aturan tambahan jika diperlukan.

### 4.4 Pengajuan Izin dan Cuti

Form berisi:
- Jenis izin.
- Tanggal mulai dan selesai.
- Durasi.
- Alasan.
- Lampiran opsional.
- Tanggal pengajuan.
- Status.
- Catatan approver.

Status: Draft, Pending Approval, Approved, Rejected, Cancelled.

Workflow:
1. User membuat pengajuan.
2. Sistem memvalidasi data.
3. Pengajuan masuk ke Manager terkait.
4. Manager menyetujui atau menolak dengan catatan.
5. Jika kebijakan membutuhkan validasi HR, pengajuan diteruskan ke HR setelah persetujuan Manager.
6. User menerima notifikasi perubahan status.
7. Pengajuan yang disetujui tercermin pada kalender dan rekap absensi.

Pengajuan belum dianggap disetujui sebelum approver mengambil keputusan. Buat workflow yang dapat dikonfigurasi.

## 5. Daily Report — Fitur Utama User

Daily Report bukan task management berbasis proyek yang kompleks. Fitur ini adalah laporan pekerjaan harian dengan pengalaman seperti spreadsheet.

### 5.1 Tabel Daily Report

| Kolom | Fungsi |
|---|---|
| No. | Nomor urut otomatis |
| Waktu Mulai | Waktu mulai aktivitas |
| Waktu Selesai | Waktu selesai aktivitas |
| Aktivitas | Deskripsi pekerjaan |
| Hasil | Hasil atau output pekerjaan |
| Status | Pending, In Progress, Completed |
| Catatan | Informasi tambahan |

Setiap baris merepresentasikan satu aktivitas pekerjaan dalam satu hari.

### 5.2 Interaksi Spreadsheet

Implementasikan:
- Tambah, edit, dan hapus baris sebelum laporan dikirim.
- Edit sel secara langsung dan navigasi keyboard jika memungkinkan.
- Validasi input.
- Simpan draft dan autosave dengan indikator status.
- Tombol Submit Laporan dengan konfirmasi.
- Riwayat laporan sebelumnya dan filter tanggal.
- Tampilan detail laporan.
- Export Excel jika diizinkan.

Jangan membuat spreadsheet hanya sebagai gambar atau tabel statis. Data harus dapat diedit, divalidasi, dan disimpan ke database.

### 5.3 Workflow Daily Report

1. User membuka Daily Report dan memilih tanggal.
2. Sistem menampilkan laporan untuk tanggal tersebut.
3. User menambahkan baris aktivitas dan mengisi waktu, aktivitas, hasil, serta status.
4. Data dapat disimpan sebagai Draft.
5. User menekan Submit Laporan.
6. Sistem memvalidasi kelengkapan dan konsistensi waktu.
7. Laporan dikirim ke Manager terkait.
8. Manager menerima laporan atau meminta revisi.
9. User menerima notifikasi dan dapat memperbaiki laporan sesuai status.
10. Laporan final tersimpan sebagai histori dan dapat digunakan dalam evaluasi kinerja.

Status: Draft, Submitted, Needs Revision, Accepted.

Setelah laporan diterima, user tidak boleh mengubahnya langsung. Untuk koreksi, sediakan workflow revisi atau pembukaan kembali dengan audit log.

### 5.4 Template Departemen

Kolom dasar tetap konsisten, tetapi dukung template tambahan berdasarkan departemen/jabatan:
- Marketing: campaign, platform, target, hasil.
- Riset: topik, sumber data, temuan, rekomendasi.
- Copywriter: jenis konten, jumlah output, status review.
- Iklan: campaign, anggaran atau metrik relevan, hasil.
- HR: jenis pekerjaan administrasi, output.
- Finance: jenis transaksi/laporan, periode, status.
- IT: tiket, jenis masalah, penyelesaian.
- Data: jenis laporan, sumber data, status validasi.
- Support: tiket, jenis permintaan, penyelesaian.
- Operasional: aktivitas, output, status pekerjaan.

Template dapat dikelola Admin tanpa mengubah kode.

## 6. Management Backend

### 6.1 Dashboard Management

Tampilkan data aktual:
- Total karyawan aktif dan jumlah per departemen.
- Rekap kehadiran hari ini.
- Karyawan terlambat.
- Pengajuan izin menunggu persetujuan.
- Daily Report menunggu review.
- Ringkasan laporan belum selesai.
- Ringkasan KPI.
- Ringkasan payroll sesuai hak akses.
- Aktivitas terbaru.

Jangan gunakan angka dummy di production. Jika database kosong, tampilkan empty state yang informatif.

### 6.2 Employee Management

Fitur:
- Tambah/edit karyawan dan profil lengkap.
- Penempatan departemen, jabatan, dan manager.
- Status aktif/nonaktif serta tanggal bergabung.
- Riwayat mutasi jabatan/departemen.
- Pengaturan akun.
- Import Excel jika diperlukan.
- Export sesuai permission.

Data historis tidak boleh hilang ketika karyawan dinonaktifkan atau dipindahkan.

### 6.3 Attendance Management

Fitur:
- Monitoring absensi.
- Rekap harian dan bulanan.
- Filter departemen dan karyawan.
- Riwayat scan QR.
- Penanganan keterlambatan.
- Pengajuan koreksi absensi.
- Konfigurasi jadwal kerja dan hari libur.
- Pengaturan QR Code.
- Export Excel/PDF.

### 6.4 Approval Management

Buat halaman khusus untuk:
- Pengajuan izin/cuti.
- Koreksi absensi.
- Daily Report.
- Approval lain yang ditambahkan di masa depan.

Tampilkan pemohon, departemen, jabatan, jenis permintaan, tanggal, detail, status, approver, riwayat keputusan, dan catatan penolakan/revisi.

Sediakan Approve, Reject, dan Request Revision sesuai permission.

### 6.5 Daily Report Management

Fitur:
- Daftar laporan tim sesuai akses.
- Filter tanggal, departemen, jabatan, karyawan, dan status.
- Detail laporan dalam bentuk tabel.
- Review, Accept, atau Request Revision.
- Catatan manager dan riwayat revisi.
- Rekap produktivitas.
- Export Excel.

Manager hanya melihat laporan anggota timnya kecuali diberi akses lintas-departemen. Owner atau role berwenang dapat melihat laporan lintas-departemen.

### 6.6 Payroll Management

Fitur:
- Periode penggajian.
- Gaji pokok, tunjangan, bonus/insentif, dan potongan.
- Rekap gaji.
- Persetujuan payroll.
- Status pembayaran.
- Slip gaji individual.
- Export laporan payroll.

Aturan:
- Staff hanya melihat slip gaji sendiri.
- Staff HR tidak otomatis mendapat akses nominal gaji seluruh karyawan.
- Finance hanya mengakses komponen sesuai kewenangannya.
- Owner dapat melihat rekap payroll jika diberi permission.
- Manager tidak otomatis dapat melihat gaji anggota tim.
- Perubahan nominal dan status pembayaran wajib masuk audit log.
- Jangan tampilkan data payroll sensitif pada log atau notifikasi umum.

### 6.7 KPI Management

Fitur:
- Periode evaluasi.
- Template KPI berdasarkan jabatan.
- Target dan bobot indikator.
- Nilai aktual dan skor.
- Catatan manager dan review karyawan.
- Rekap departemen dan riwayat evaluasi.

Gunakan indikator yang sesuai dengan jabatan:
- Marketing: pencapaian target dan efektivitas campaign.
- Riset: akurasi dan kualitas rekomendasi.
- Copywriter: kualitas output dan ketepatan deadline.
- Iklan: performa campaign dan efisiensi.
- HR: ketepatan administrasi.
- Finance: akurasi pencatatan dan ketepatan laporan.
- IT: waktu respons dan kualitas penyelesaian tiket.
- Data: akurasi data dan ketepatan laporan.
- Support: penyelesaian tiket dan kualitas layanan.
- Operasional: kualitas dan ketepatan penyelesaian pekerjaan.

Daily Report dapat menjadi bukti evaluasi, tetapi skor KPI tidak boleh hanya berdasarkan jumlah laporan atau aktivitas. Rumus, bobot, dan sumber penilaian harus dapat dikonfigurasi.

## 7. Roles dan Permissions

Implementasikan permission di backend dan frontend.

### System Admin
- Mengelola konfigurasi sistem, akun, role, permission, departemen, dan jabatan.
- Melihat audit log teknis.
- Tidak otomatis memiliki hak mengubah atau menyetujui payroll jika kewenangan tersebut dipisahkan.

### Owner
- Melihat dashboard perusahaan dan laporan lintas-departemen.
- Melihat KPI dan rekap payroll sesuai permission.
- Mengakses laporan manajemen.
- Menyetujui keputusan tertentu jika dikonfigurasi.

### HR
- Mengelola data karyawan sesuai izin.
- Mengelola administrasi cuti/izin dan memantau absensi.
- Mengelola onboarding/offboarding.
- Mengakses KPI atau payroll hanya jika diberi permission.

### Finance
- Mengelola payroll sesuai kewenangan.
- Memproses rekap penggajian dan status pembayaran jika diizinkan.
- Tidak otomatis mendapat akses ke seluruh data pribadi karyawan.

### Department Manager
- Melihat anggota tim.
- Meninjau Daily Report tim.
- Menyetujui izin/cuti dan koreksi absensi.
- Menilai KPI tim.
- Tidak otomatis dapat melihat payroll anggota tim.

### Manager Operasional
- Memantau laporan operasional.
- Mengelola pekerjaan operasional.
- Mengakses laporan lintas-departemen hanya jika diizinkan.

### Staff
- Mengakses profil pribadi.
- Melakukan absensi dan mengajukan izin/cuti.
- Mengisi Daily Report.
- Melihat status dan riwayat sendiri.
- Melihat slip gaji sendiri jika fitur payroll diaktifkan.

Jangan samakan jabatan dengan role aplikasi. Gunakan permission granular, misalnya:
- `employees.view`
- `employees.manage`
- `attendance.view_team`
- `attendance.correct`
- `leave.submit`
- `leave.approve`
- `daily_report.submit`
- `daily_report.review_team`
- `payroll.view`
- `payroll.manage`
- `kpi.view_team`
- `kpi.manage`
- `reports.view_company`
- `settings.manage_roles`

## 8. UI/UX Design Requirements

Buat desain modern, profesional, dan mudah digunakan.

### Visual Direction
- Modern SaaS dashboard.
- Sidebar yang jelas.
- Topbar dengan notifikasi dan profil pengguna.
- Card statistik yang ringkas.
- Tabel dengan pencarian, filter, sort, dan pagination.
- Form konsisten.
- Badge status yang mudah dibedakan.
- Empty, loading, error, dan success state.
- Responsif untuk desktop, tablet, dan mobile.
- Animasi ringan dan tidak berlebihan.
- Hindari terlalu banyak card dan warna berlebihan.

### User Portal Sidebar
1. Dashboard
2. Profile
3. Absensi
4. Pengajuan Izin
5. Daily Report
6. Riwayat
7. Notifikasi

### Management Backend Sidebar
1. Dashboard
2. Employee Management
3. Department & Position
4. Attendance Management
5. Leave & Approval
6. Daily Report Management
7. KPI & Performance
8. Payroll
9. Reports & Export
10. Notifications
11. User & Role Management
12. System Settings
13. Audit Logs

Tampilkan menu berdasarkan permission. Jangan menampilkan menu sensitif kepada role yang tidak berwenang.

Daily Report harus memiliki tabel yang dapat diedit, baris yang dapat ditambah/dihapus, input tanpa banyak modal, horizontal scroll bila perlu, indikator autosave, tombol submit yang jelas, dan status/catatan reviewer yang mudah dibaca.

## 9. Database dan Model Data

Rancang database relasional dengan tabel minimal:
- `users`
- `employees`
- `departments`
- `positions`
- `employee_assignments`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `attendance_records`
- `attendance_qr_tokens` atau struktur token QR yang sesuai
- `attendance_corrections`
- `leave_requests`
- `approval_steps`
- `daily_reports`
- `daily_report_entries`
- `daily_report_reviews`
- `kpi_periods`
- `kpi_indicators`
- `employee_kpis`
- `performance_reviews`
- `payroll_periods`
- `payroll_records`
- `payroll_items`
- `notifications`
- `audit_logs`

Sesuaikan skema akhir dengan kebutuhan implementasi.

Ketentuan:
- Gunakan foreign key dan indeks yang sesuai.
- Gunakan timestamps untuk data yang perlu dilacak.
- Gunakan transaksi database untuk operasi yang perlu konsisten.
- Simpan histori perubahan departemen dan jabatan.
- Pisahkan header Daily Report dari detail baris aktivitas.
- Gunakan tabel review untuk mencatat keputusan manager.
- Simpan nominal payroll dengan tipe decimal, bukan floating-point.
- Gunakan penyimpanan privat untuk dokumen dan lampiran.
- Jangan menghapus data historis ketika user dinonaktifkan.

## 10. Teknologi

Jika tidak ada stack yang ditetapkan dalam repository, gunakan:
- Backend: Laravel.
- Frontend: React + TypeScript.
- UI: Tailwind CSS dan komponen UI konsisten.
- Database: MySQL.
- Authentication: session atau Sanctum sesuai arsitektur.
- Authorization: Laravel Policies/Gates dan RBAC.
- Deployment: Docker Compose pada VPS.
- Web server: Nginx.
- Testing backend: PHPUnit/Pest.
- Testing alur UI: Playwright.

Jika project yang ada sudah menggunakan stack berbeda dan masih layak, evaluasi dahulu sebelum migrasi.

## 11. Security Requirements

- Validasi seluruh input di backend.
- Terapkan otorisasi pada setiap endpoint.
- Cegah akses lintas-departemen tanpa permission.
- Gunakan password hashing.
- Terapkan rate limiting pada login dan endpoint sensitif.
- Validasi token QR di backend.
- Simpan file sensitif di private storage.
- Jangan mengirim data payroll ke client yang tidak berhak.
- Catat perubahan penting dalam audit log.
- Gunakan transaksi database untuk approval dan proses payroll.
- Hindari double submission pada absensi dan pengajuan.
- Terapkan backup database dan prosedur pemulihan.
- Jangan menaruh secret atau credential dalam source code.

## 12. Acceptance Criteria

Aplikasi memenuhi MVP jika:
1. User dapat login dan melihat dashboard pribadi.
2. User dapat melihat profil dan mengubah data yang diizinkan.
3. QR absensi dipindai dan divalidasi backend.
4. Sistem mencegah scan ganda dan QR tidak valid.
5. User dapat mengajukan izin/cuti dan memantau statusnya.
6. Manager dapat menyetujui atau menolak sesuai permission.
7. User dapat mengisi Daily Report seperti spreadsheet.
8. Daily Report dapat disimpan sebagai draft, disubmit, direview, dan direvisi.
9. Admin/HR dapat mengelola karyawan dan organisasi.
10. Management Backend dapat memantau absensi dan laporan sesuai akses.
11. Payroll dan KPI hanya dapat diakses role berwenang.
12. Dashboard menampilkan data database aktual, bukan dummy.
13. Perubahan penting tercatat di audit log.
14. Data historis tetap tersimpan ketika karyawan dinonaktifkan.
15. Sistem memiliki validasi, error handling, dan feedback UI yang baik.

## 13. Urutan Implementasi

### Phase 1 — Foundation
- Analisis repository.
- Setup database dan environment.
- Authentication.
- RBAC dan permission.
- Departemen, jabatan, karyawan.
- Layout User Portal dan Management Backend.

### Phase 2 — User Portal
- Dashboard.
- Profile.
- QR Attendance.
- Leave Request.
- Daily Report spreadsheet.
- Riwayat dan notifikasi.

### Phase 3 — Management Backend
- Employee Management.
- Attendance Management.
- Approval Management.
- Daily Report Review.
- Dashboard management.

### Phase 4 — Performance and Payroll
- KPI Management.
- Payroll Management.
- Slip gaji.
- Laporan manajemen.
- Export Excel/PDF.

### Phase 5 — Quality Assurance
- Testing permission.
- Testing workflow approval.
- Testing QR dan pencegahan scan ganda.
- Testing Daily Report dan revisi.
- Testing keamanan data.
- Testing responsive UI.
- Testing backup/restore.
- Dokumentasi instalasi dan deployment.

## 14. Instruksi Eksekusi Agent

Mulai dengan mengaudit repository dan menyampaikan:
1. Struktur project saat ini.
2. Teknologi yang digunakan.
3. Fitur yang sudah tersedia.
4. Fitur yang belum tersedia.
5. Rencana implementasi dan file yang akan dibuat/diubah.

Setelah itu, lanjutkan implementasi secara bertahap. Jangan berhenti hanya pada rencana atau mockup.

Pastikan setiap fitur memiliki:
- UI yang berfungsi.
- Validasi frontend dan backend.
- Integrasi database.
- Authorization.
- Loading, empty, success, dan error state.
- Test untuk workflow penting.
- Dokumentasi konfigurasi jika diperlukan.

Jangan mengisi production dengan data palsu. Jika membutuhkan seed data untuk development, pisahkan dengan jelas dari data produksi.

Prioritas utama adalah menghasilkan HRIS yang benar-benar berfungsi, aman, mudah digunakan, dan sesuai workflow perusahaan.
