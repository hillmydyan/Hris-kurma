import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Wallet, 
  CreditCard, 
  Building2, 
  User, 
  Calendar,
  Loader2
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';

export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pribadi');

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await api.get(`/employees/${id}`);
        setEmployee(response.data);
      } catch (error) {
        console.error('Error fetching employee:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
        <p className="text-xs">Memuat data karyawan...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <p className="text-sm">Data karyawan tidak ditemukan.</p>
        <Link to="/admin/karyawan" className="mt-3 text-xs text-primary font-medium hover:underline">
          Kembali ke Data Karyawan
        </Link>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(val || 0);
  };

  const basicSalary = Number(employee.basic_salary) || 0;
  const mealRatePerDay = 11000;
  const estimatedDays = 21;
  const estimatedMealAllowance = estimatedDays * mealRatePerDay;
  const estimatedTotalSalary = basicSalary + estimatedMealAllowance;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
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
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Detail Karyawan</h1>
            <p className="text-xs text-text-muted mt-0.5">
              Informasi lengkap data diri, penempatan kerja, dan gaji karyawan.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            to={`/admin/karyawan/${id}/edit`} 
            className="h-9 px-3.5 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary-hover shadow-xs transition-colors inline-flex items-center"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Data
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Basic Profile Card */}
        <div className="space-y-4">
          <Card className="border border-border-default shadow-xs">
            <CardContent className="p-5 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-subtle text-text-secondary flex items-center justify-center font-bold text-xl mb-3 border border-border-default">
                {getInitials(employee.first_name, employee.last_name)}
              </div>
              <h2 className="text-base font-semibold text-text-primary">
                {employee.first_name} {employee.last_name || ''}
              </h2>
              <p className="text-xs text-text-secondary mt-0.5 font-medium">
                {employee.current_assignment?.job_position?.name || 'Staff'}
              </p>
              
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap justify-center">
                <Badge variant={employee.status === 'active' ? 'success' : 'neutral'}>
                  {employee.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-subtle text-text-secondary border border-border-default">
                  {employee.employment_type === 'permanent' ? 'Tetap' : employee.employment_type === 'contract' ? 'Kontrak' : 'Probation'}
                </span>
              </div>

              {/* Salary Preview Box */}
              <div className="w-full mt-4 p-3 rounded-lg bg-subtle border border-border-default text-left">
                <p className="text-[11px] text-text-muted">Estimasi Gaji Bulanan:</p>
                <p className="text-base font-semibold text-text-primary tabular-nums mt-0.5">
                  {formatRupiah(estimatedTotalSalary)}
                </p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Gaji Pokok + Uang Makan Kehadiran
                </p>
              </div>

              <div className="w-full border-t border-border-default my-4"></div>

              <div className="w-full space-y-3 text-left text-xs">
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-text-muted">Departemen</p>
                    <p className="font-medium text-text-primary">{employee.current_assignment?.department?.name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-text-muted">Email</p>
                    <p className="font-medium text-text-primary break-all">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-text-muted">Telepon / WhatsApp</p>
                    <p className="font-medium text-text-primary">{employee.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-text-muted">ID Karyawan</p>
                    <p className="font-medium text-text-primary">{employee.employee_id}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs 
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'pribadi', label: 'Data Pribadi' },
              { id: 'pekerjaan', label: 'Penempatan Kerja' },
              { id: 'gaji', label: 'Gaji & Payroll' },
            ]}
          />

          {/* TAB 1: DATA PRIBADI */}
          {activeTab === 'pribadi' && (
            <div className="space-y-4 animate-in fade-in">
              <Card className="border border-border-default shadow-xs">
                <CardHeader className="py-3.5 px-4 border-b border-border-default">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2 text-text-primary">
                    <User className="w-4 h-4 text-primary" />
                    Identitas & Data Pribadi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-subtle rounded-lg border border-border-default">
                      <p className="text-[11px] text-text-muted">Nama Lengkap</p>
                      <p className="font-medium text-text-primary mt-0.5">{employee.first_name} {employee.last_name || ''}</p>
                    </div>
                    <div className="p-3 bg-subtle rounded-lg border border-border-default">
                      <p className="text-[11px] text-text-muted">NIK KTP</p>
                      <p className="font-medium text-text-primary mt-0.5">{employee.nik || '-'}</p>
                    </div>
                    <div className="p-3 bg-subtle rounded-lg border border-border-default">
                      <p className="text-[11px] text-text-muted">Jenis Kelamin</p>
                      <p className="font-medium text-text-primary mt-0.5">
                        {employee.gender === 'female' ? 'Perempuan' : 'Laki-laki'}
                      </p>
                    </div>
                    <div className="p-3 bg-subtle rounded-lg border border-border-default">
                      <p className="text-[11px] text-text-muted">Tanggal Lahir</p>
                      <p className="font-medium text-text-primary mt-0.5">{employee.birth_date || '-'}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-subtle rounded-lg border border-border-default text-xs">
                    <p className="text-[11px] text-text-muted">Alamat Tinggal / Domisili</p>
                    <p className="font-medium text-text-primary mt-0.5">{employee.address || 'Belum diisi'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: PENEMPATAN KERJA */}
          {activeTab === 'pekerjaan' && (
            <div className="space-y-4 animate-in fade-in">
              <Card className="border border-border-default shadow-xs">
                <CardHeader className="py-3.5 px-4 border-b border-border-default">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2 text-text-primary">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Penempatan & Penugasan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-subtle rounded-lg border border-border-default">
                      <p className="text-[11px] text-text-muted">Departemen</p>
                      <p className="font-medium text-text-primary mt-0.5">{employee.current_assignment?.department?.name || '-'}</p>
                    </div>
                    <div className="p-3 bg-subtle rounded-lg border border-border-default">
                      <p className="text-[11px] text-text-muted">Jabatan</p>
                      <p className="font-medium text-text-primary mt-0.5">{employee.current_assignment?.job_position?.name || '-'}</p>
                    </div>
                    <div className="p-3 bg-subtle rounded-lg border border-border-default">
                      <p className="text-[11px] text-text-muted">Tanggal Bergabung</p>
                      <p className="font-medium text-text-primary mt-0.5">{employee.join_date || '-'}</p>
                    </div>
                    <div className="p-3 bg-subtle rounded-lg border border-border-default">
                      <p className="text-[11px] text-text-muted">Status Kepegawaian</p>
                      <p className="font-medium text-text-primary mt-0.5">
                        {employee.employment_type === 'permanent' ? 'Tetap (PKWTT)' : employee.employment_type === 'contract' ? 'Kontrak (PKWT)' : 'Probation'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-subtle border border-border-default rounded-lg space-y-1">
                    <p className="text-xs font-semibold text-text-primary">
                      Pola Jadwal Akhir Pekan (6 Hari Kerja / Minggu):
                    </p>
                    <p className="text-xs font-medium text-text-secondary">
                      {employee.weekend_pattern === 'sunday_fixed'
                        ? 'Tetap Masuk Minggu (Sabtu Libur Tetap)'
                        : employee.weekend_pattern === 'rotating'
                        ? 'Rotasi Akhir Pekan (Jadwal Bergantian Mingguan)'
                        : 'Tetap Masuk Sabtu (Minggu Libur Tetap)'}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Hari libur akhir pekan karyawan otomatis diakui tanpa perlu absen.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Riwayat Penempatan */}
              <Card className="border border-border-default shadow-xs overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-border-default">
                  <CardTitle className="text-xs font-semibold text-text-primary">Riwayat Penempatan & Mutasi</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-subtle border-b border-border-default text-text-secondary font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Tanggal Efektif</th>
                          <th className="py-2.5 px-4">Departemen</th>
                          <th className="py-2.5 px-4">Jabatan</th>
                          <th className="py-2.5 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {employee.assignments && employee.assignments.length > 0 ? (
                          employee.assignments.map((assignment: any) => (
                            <tr key={assignment.id} className="hover:bg-subtle/50 transition-colors">
                              <td className="py-2.5 px-4">{assignment.start_date}</td>
                              <td className="py-2.5 px-4">{assignment.department?.name}</td>
                              <td className="py-2.5 px-4">{assignment.job_position?.name}</td>
                              <td className="py-2.5 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  assignment.is_primary 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {assignment.is_primary ? 'Aktif' : 'Riwayat'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-text-muted text-xs">
                              Tidak ada riwayat penempatan tambahan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: GAJI & INFORMASI PAYROLL */}
          {activeTab === 'gaji' && (
            <div className="space-y-4 animate-in fade-in">
              <Card className="border border-border-default shadow-xs">
                <CardHeader className="py-3.5 px-4 border-b border-border-default flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-semibold flex items-center gap-2 text-text-primary">
                      <Wallet className="w-4 h-4 text-primary" />
                      Kompensasi Gaji Karyawan
                    </CardTitle>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Besaran gaji menjadi basis kalkulasi pada modul Payroll.
                    </p>
                  </div>
                  <Link to={`/admin/karyawan/${id}/edit`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-medium" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                      Ubah Gaji
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Three Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-subtle rounded-lg border border-border-default">
                      <p className="text-[11px] text-text-muted">Gaji Pokok</p>
                      <p className="text-base font-semibold text-text-primary tabular-nums mt-0.5">
                        {formatRupiah(basicSalary)}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">Gaji dasar bulanan</p>
                    </div>

                    <div className="p-3 bg-subtle rounded-lg border border-border-default">
                      <p className="text-[11px] text-text-muted">Uang Makan Presensi</p>
                      <p className="text-base font-semibold text-text-primary tabular-nums mt-0.5">
                        {formatRupiah(estimatedMealAllowance)}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">Estimasi {estimatedDays} hari (Rp 11.000/hari)</p>
                    </div>

                    <div className="p-3 bg-subtle rounded-lg border border-border-default">
                      <p className="text-[11px] text-text-muted">Estimasi Total Bruto</p>
                      <p className="text-base font-semibold text-text-primary tabular-nums mt-0.5">
                        {formatRupiah(estimatedTotalSalary)}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">Gaji Pokok + Uang Makan</p>
                    </div>
                  </div>

                  {/* Kebijakan Uang Makan Box */}
                  <div className="p-3 rounded-lg bg-subtle border border-border-default text-xs space-y-0.5">
                    <p className="font-medium text-text-primary">
                      Ketentuan Uang Makan Harian:
                    </p>
                    <p className="text-text-secondary text-[11px] leading-relaxed">
                      Uang makan dihitung Rp 11.000 per hari kerja efektif. Kehadiran setelah 08:15 WIB tidak mendapatkan uang makan harian.
                    </p>
                  </div>

                  {/* Bank Information Card */}
                  <div className="p-3.5 rounded-lg bg-subtle border border-border-default space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-text-muted" />
                        Rekening Bank Pembayaran Gaji
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        Tervalidasi Payroll
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                      <div>
                        <p className="text-[11px] text-text-muted">Bank Penampung</p>
                        <p className="font-semibold text-text-primary mt-0.5">{employee.bank_name || 'BCA'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-text-muted">Nomor Rekening</p>
                        <p className="font-medium text-text-primary mt-0.5 tabular-nums">{employee.bank_account_number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-text-muted">Nama Pemilik Rekening</p>
                        <p className="font-medium text-text-primary mt-0.5">{employee.bank_account_holder || '-'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
