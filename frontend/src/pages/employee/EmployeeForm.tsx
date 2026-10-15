import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Briefcase, 
  Wallet, 
  CreditCard,
  Info,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';

export function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'pribadi' | 'pekerjaan' | 'gaji'>('pribadi');
  
  const [formData, setFormData] = useState({
    // 1. Data Diri
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    nik: '',
    birth_date: '',
    gender: 'male',
    address: '',

    // 2. Pekerjaan
    employee_id: '',
    department_id: '',
    job_position_id: '',
    join_date: new Date().toISOString().split('T')[0],
    employment_type: 'permanent',
    weekend_pattern: 'saturday_fixed',
    status: 'active',

    // 3. Gaji & Rekening
    basic_salary: 0,
    allowances: 0,
    bank_name: 'BCA',
    bank_account_number: '',
    bank_account_holder: '',
  });

  useEffect(() => {
    const fetchOptionsAndData = async () => {
      try {
        const [deptRes, jobRes] = await Promise.all([
          api.get('/departments'),
          api.get('/job-positions')
        ]);
        setDepartments(deptRes.data);
        setJobPositions(jobRes.data);

        if (isEdit) {
          const empRes = await api.get(`/employees/${id}`);
          const emp = empRes.data;
          setFormData({
            first_name: emp.first_name || '',
            last_name: emp.last_name || '',
            email: emp.email || '',
            phone: emp.phone || '',
            nik: emp.nik || '',
            birth_date: emp.birth_date || '',
            gender: emp.gender || 'male',
            address: emp.address || '',

            employee_id: emp.employee_id || '',
            department_id: emp.current_assignment?.department_id || '',
            job_position_id: emp.current_assignment?.job_position_id || '',
            join_date: emp.join_date || new Date().toISOString().split('T')[0],
            employment_type: emp.employment_type || 'permanent',
            weekend_pattern: emp.weekend_pattern || 'saturday_fixed',
            status: emp.status || 'active',

            basic_salary: Number(emp.basic_salary) || 0,
            allowances: Number(emp.allowances) || 0,
            bank_name: emp.bank_name || 'BCA',
            bank_account_number: emp.bank_account_number || '',
            bank_account_holder: emp.bank_account_holder || (emp.first_name + ' ' + (emp.last_name || '')).trim(),
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchOptionsAndData();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
    if (errorMessage) setErrorMessage(null);
  };

  const mealRatePerDay = 11000;
  const estimatedWorkingDays = 21;
  const estimatedMealAllowance = estimatedWorkingDays * mealRatePerDay;
  const totalMonthlySalary = (Number(formData.basic_salary) || 0) + estimatedMealAllowance;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(val || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Tab 1 Validation: Personal info
    if (!formData.first_name.trim()) {
      setActiveSection('pribadi');
      setErrorMessage('Nama Depan wajib diisi.');
      return;
    }
    if (!formData.email.trim()) {
      setActiveSection('pribadi');
      setErrorMessage('Email karyawan wajib diisi.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      setActiveSection('pribadi');
      setErrorMessage('Format email tidak valid (contoh: user@perusahaan.com).');
      return;
    }

    // Tab 2 Validation: Work & Placement
    if (!formData.department_id) {
      setActiveSection('pekerjaan');
      setErrorMessage('Silakan pilih Departemen untuk penempatan karyawan.');
      return;
    }
    if (!formData.job_position_id) {
      setActiveSection('pekerjaan');
      setErrorMessage('Silakan pilih Jabatan karyawan.');
      return;
    }
    if (!formData.join_date) {
      setActiveSection('pekerjaan');
      setErrorMessage('Tanggal Bergabung wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        create_user: true,
      };

      if (isEdit) {
        await api.put(`/employees/${id}`, payload);
        alert('Data karyawan berhasil diperbarui.');
      } else {
        await api.post('/employees', payload);
        alert('Karyawan baru berhasil ditambahkan.');
      }
      navigate('/admin/karyawan');
    } catch (error: any) {
      console.error('Error saving employee:', error);
      const resData = error.response?.data;
      if (resData?.errors) {
        const firstKey = Object.keys(resData.errors)[0];
        const errorMessages = Object.values(resData.errors).flat().join('\n');
        setErrorMessage(errorMessages);
        if (['first_name', 'last_name', 'email', 'phone', 'nik'].includes(firstKey)) {
          setActiveSection('pribadi');
        } else if (['department_id', 'job_position_id', 'employee_id', 'join_date'].includes(firstKey)) {
          setActiveSection('pekerjaan');
        } else {
          setActiveSection('gaji');
        }
      } else {
        setErrorMessage(resData?.error || resData?.message || 'Gagal menyimpan data karyawan. Periksa kembali input Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 animate-in fade-in duration-200">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link 
            to="/admin/karyawan" 
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-subtle transition-colors"
            aria-label="Kembali ke Data Karyawan"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">
              {isEdit ? 'Edit Data Karyawan' : 'Tambah Karyawan'}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Kelola data pribadi, penempatan kerja, dan gaji karyawan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            to="/admin/karyawan" 
            className="h-9 px-3.5 rounded-md border border-border-default text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-subtle transition-colors inline-flex items-center justify-center"
          >
            Batal
          </Link>
          <Button 
            type="submit" 
            variant="primary" 
            size="sm"
            disabled={loading} 
            leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            className="h-9 text-xs font-medium"
          >
            {isEdit ? 'Simpan Perubahan' : 'Simpan Karyawan'}
          </Button>
        </div>
      </div>

      {/* Pesan Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="whitespace-pre-line">{errorMessage}</div>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)} 
            className="text-xs font-semibold px-2 py-0.5 hover:bg-rose-100 rounded text-rose-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Navigation Sidebar / Step Tabs */}
        <div className="w-full lg:w-60 shrink-0">
          <Card className="sticky top-4 border border-border-default shadow-xs">
            <CardContent className="p-2.5">
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveSection('pribadi')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md text-left transition-colors ${
                    activeSection === 'pribadi' 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'text-text-secondary hover:bg-subtle hover:text-text-primary'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  1. Data Pribadi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('pekerjaan')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md text-left transition-colors ${
                    activeSection === 'pekerjaan' 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'text-text-secondary hover:bg-subtle hover:text-text-primary'
                  }`}
                >
                  <Briefcase className="w-4 h-4 shrink-0" />
                  2. Penempatan Kerja
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('gaji')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md text-left transition-colors ${
                    activeSection === 'gaji' 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'text-text-secondary hover:bg-subtle hover:text-text-primary'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 shrink-0" />
                    3. Gaji & Rekening
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-primary border border-indigo-200 font-semibold">
                    Payroll
                  </span>
                </button>
              </nav>

              <div className="mt-4 pt-3 border-t border-border-default px-2 space-y-1">
                <p className="text-[11px] text-text-muted">Estimasi Gaji Bulanan:</p>
                <p className="text-sm font-semibold text-text-primary tabular-nums">
                  {formatRupiah(totalMonthlySalary)}
                </p>
                <p className="text-[10px] text-text-secondary leading-tight">
                  Gaji pokok + estimasi uang makan ({estimatedWorkingDays} hari kerja).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Sections */}
        <div className="flex-1 space-y-4">

          {/* SECTION 1: DATA PRIBADI */}
          <Card className={`border border-border-default shadow-xs ${activeSection !== 'pribadi' ? 'hidden' : ''}`}>
            <CardHeader className="border-b border-border-default py-3.5 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-text-primary">
                <User className="w-4 h-4 text-primary" />
                Data Pribadi & Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Input 
                  name="first_name" 
                  value={formData.first_name} 
                  onChange={handleChange} 
                  label="Nama Depan *" 
                  placeholder="Nama depan sesuai KTP" 
                />
                <Input 
                  name="last_name" 
                  value={formData.last_name} 
                  onChange={handleChange} 
                  label="Nama Belakang" 
                  placeholder="Nama belakang" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Input 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  label="Email *" 
                  placeholder="nama@kurma.group" 
                />
                <Input 
                  name="phone" 
                  type="tel"
                  value={formData.phone} 
                  onChange={handleChange} 
                  label="No. Telepon / WhatsApp" 
                  placeholder="0812xxxxxxxx" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <Input 
                  name="nik" 
                  value={formData.nik} 
                  onChange={handleChange} 
                  label="NIK KTP (16 Digit)" 
                  placeholder="3271xxxxxxxxxxxx" 
                />
                <Input 
                  name="birth_date" 
                  type="date" 
                  value={formData.birth_date} 
                  onChange={handleChange} 
                  label="Tanggal Lahir" 
                />
                <div className="space-y-1.5">
                  <label className="text-label text-text-primary">Jenis Kelamin</label>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleChange} 
                    className="w-full h-10 px-3 rounded-lg border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring text-xs"
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-text-primary">Alamat Tinggal / Domisili</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Alamat lengkap tempat tinggal saat ini..."
                  className="w-full p-2.5 rounded-lg border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring text-xs resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveSection('pekerjaan')}
                  className="h-9 text-xs"
                >
                  Lanjut ke Penempatan Kerja
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: PENEMPATAN KERJA */}
          <Card className={`border border-border-default shadow-xs ${activeSection !== 'pekerjaan' ? 'hidden' : ''}`}>
            <CardHeader className="border-b border-border-default py-3.5 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-text-primary">
                <Briefcase className="w-4 h-4 text-primary" />
                Penempatan Kerja & Jabatan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <Input 
                  name="employee_id" 
                  value={formData.employee_id} 
                  onChange={handleChange} 
                  label="ID Karyawan / NIK Kerja" 
                  placeholder="Otomatis jika kosong (misal: EMP-001)" 
                />
                <Input 
                  name="join_date" 
                  type="date" 
                  value={formData.join_date} 
                  onChange={handleChange} 
                  label="Tanggal Bergabung *" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-label text-text-primary">Departemen <span className="text-danger">*</span></label>
                  <select 
                    name="department_id" 
                    value={formData.department_id} 
                    onChange={handleChange} 
                    className="w-full h-10 px-3 rounded-lg border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring text-xs"
                  >
                    <option value="">Pilih Departemen</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-primary">Jabatan <span className="text-danger">*</span></label>
                  <select 
                    name="job_position_id" 
                    value={formData.job_position_id} 
                    onChange={handleChange} 
                    className="w-full h-10 px-3 rounded-lg border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring text-xs"
                  >
                    <option value="">Pilih Jabatan</option>
                    {jobPositions.map((job) => (
                      <option key={job.id} value={job.id}>{job.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-label text-text-primary">Tipe Ikatan Kerja</label>
                  <select 
                    name="employment_type" 
                    value={formData.employment_type} 
                    onChange={handleChange} 
                    className="w-full h-10 px-3 rounded-lg border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring text-xs"
                  >
                    <option value="permanent">Karyawan Tetap (PKWTT)</option>
                    <option value="contract">Karyawan Kontrak (PKWT)</option>
                    <option value="probation">Probation (Masa Percobaan)</option>
                    <option value="intern">Internship / Magang</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label text-text-primary">Status Karyawan <span className="text-danger">*</span></label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    className="w-full h-10 px-3 rounded-lg border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring text-xs"
                  >
                    <option value="active">Aktif Bekerja</option>
                    <option value="inactive">Nonaktif / Resign</option>
                  </select>
                </div>
              </div>

              {/* Weekend Workday Schedule Pattern */}
              <div className="p-3.5 rounded-lg bg-subtle border border-border-default space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary">
                    Pola Jadwal Akhir Pekan (6 Hari Kerja / Minggu)
                  </label>
                  <span className="text-[11px] text-text-muted">1 Hari Libur per Minggu</span>
                </div>
                <select 
                  name="weekend_pattern" 
                  value={formData.weekend_pattern} 
                  onChange={handleChange} 
                  className="w-full h-9 px-3 rounded-lg border bg-surface text-text-primary border-border-default focus:ring-1 focus:ring-primary text-xs"
                >
                  <option value="saturday_fixed">Tetap Masuk Sabtu (Minggu Libur Tetap)</option>
                  <option value="sunday_fixed">Tetap Masuk Minggu (Sabtu Libur Tetap)</option>
                  <option value="rotating">Rotasi Akhir Pekan (Jadwal Bergantian Mingguan)</option>
                </select>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {formData.weekend_pattern === 'saturday_fixed' && 'Karyawan bekerja Senin–Sabtu. Hari Minggu otomatis dianggap libur.'}
                  {formData.weekend_pattern === 'sunday_fixed' && 'Karyawan bekerja Senin–Jumat & Minggu. Hari Sabtu otomatis dianggap libur.'}
                  {formData.weekend_pattern === 'rotating' && 'Karyawan memiliki jadwal pergantian yang ditentukan HR setiap minggunya di menu Roster.'}
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveSection('pribadi')}
                  className="h-9 text-xs"
                >
                  Kembali ke Data Pribadi
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveSection('gaji')}
                  className="h-9 text-xs"
                >
                  Lanjut ke Gaji & Payroll
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: GAJI & REKENING PAYROLL */}
          <Card className={`border border-border-default shadow-xs ${activeSection !== 'gaji' ? 'hidden' : ''}`}>
            <CardHeader className="border-b border-border-default py-3.5 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-text-primary">
                <Wallet className="w-4 h-4 text-primary" />
                Gaji & Rekening Payroll
              </CardTitle>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-primary border border-indigo-200 font-medium">
                Sinkron ke Payroll
              </span>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              
              {/* Alert Info */}
              <div className="p-3 rounded-lg bg-subtle border border-border-default text-xs flex items-start gap-2 text-text-secondary">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-text-muted" />
                <div>
                  <strong className="font-medium text-text-primary">Acuan Payroll:</strong> Besaran gaji pokok yang diinput di sini akan menjadi acuan dasar perhitungan otomatis pada slip gaji dan rekap periode.
                </div>
              </div>

              {/* Salary Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Input 
                    name="basic_salary" 
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.basic_salary} 
                    onChange={handleChange} 
                    label="Gaji Pokok Bulanan (Rp) *" 
                    placeholder="Contoh: 5000000" 
                    helperText={`Format: ${formatRupiah(Number(formData.basic_salary) || 0)}`}
                  />
                </div>
                
                {/* Uang Makan Information Card */}
                <div className="p-3.5 rounded-lg bg-subtle border border-border-default space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">Uang Makan Presensi</span>
                    <span className="font-medium text-text-primary">Rp 11.000 / Hari</span>
                  </div>
                  <p className="text-text-muted text-[11px]">
                    Uang makan dihitung otomatis dari kehadiran presensi harian.
                  </p>
                  <p className="text-text-muted text-[11px]">
                    Catatan: Kehadiran setelah 08:15 WIB tidak mendapatkan uang makan harian.
                  </p>
                </div>
              </div>

              {/* Total Salary Preview Card */}
              <div className="p-3.5 rounded-lg bg-subtle border border-border-default flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-text-muted">
                    Estimasi Total Gaji Bulanan:
                  </p>
                  <p className="text-lg font-semibold text-text-primary tabular-nums mt-0.5">
                    {formatRupiah(totalMonthlySalary)}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Gaji Pokok ({formatRupiah(Number(formData.basic_salary) || 0)}) + Estimasi Uang Makan ({formatRupiah(estimatedMealAllowance)} / {estimatedWorkingDays} hari kerja)
                  </p>
                </div>
              </div>

              {/* Bank Details */}
              <div className="pt-2 border-t border-border-default">
                <h4 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-text-muted" />
                  Informasi Rekening Bank
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-label text-text-primary">Nama Bank</label>
                    <select 
                      name="bank_name" 
                      value={formData.bank_name} 
                      onChange={handleChange} 
                      className="w-full h-10 px-3 rounded-lg border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring text-xs"
                    >
                      <option value="BCA">BCA (Bank Central Asia)</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                      <option value="BNI">BNI (Bank Negara Indonesia)</option>
                      <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                      <option value="CIMB Niaga">CIMB Niaga</option>
                      <option value="Permata">Bank Permata</option>
                      <option value="Danamon">Bank Danamon</option>
                      <option value="Lainnya">Bank Lainnya</option>
                    </select>
                  </div>
                  <Input 
                    name="bank_account_number" 
                    value={formData.bank_account_number} 
                    onChange={handleChange} 
                    label="Nomor Rekening" 
                    placeholder="Contoh: 8820192831" 
                  />
                  <Input 
                    name="bank_account_holder" 
                    value={formData.bank_account_holder} 
                    onChange={handleChange} 
                    label="Nama Pemilik Rekening" 
                    placeholder="Sesuai buku tabungan" 
                  />
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-border-default">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveSection('pekerjaan')}
                  className="h-9 text-xs"
                >
                  Kembali ke Penempatan Kerja
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="sm"
                  disabled={loading} 
                  leftIcon={loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  className="h-9 text-xs font-medium"
                >
                  {isEdit ? 'Simpan Perubahan' : 'Simpan Karyawan'}
                </Button>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </form>
  );
}
