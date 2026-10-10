import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';

export function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    employee_id: '',
    email: '',
    department_id: '',
    job_position_id: '',
    join_date: '',
    status: 'active',
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
            employee_id: emp.employee_id || '',
            email: emp.email || '',
            department_id: emp.current_assignment?.department_id || '',
            job_position_id: emp.current_assignment?.job_position_id || '',
            join_date: emp.join_date || '',
            status: emp.status || 'active',
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchOptionsAndData();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/employees/${id}`, formData);
      } else {
        await api.post('/employees', {
          ...formData,
          create_user: true,
        });
      }
      navigate('/karyawan');
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Gagal menyimpan data karyawan. Periksa kembali input Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div className="flex items-center gap-4">
          <Link to="/karyawan" className="p-2 rounded-sm text-text-secondary hover:bg-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="h1 text-text-primary">{isEdit ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h1>
            <p className="text-body text-text-secondary">{isEdit ? 'Ubah informasi karyawan.' : 'Lengkapi data pribadi dan pekerjaan karyawan.'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/karyawan" className="inline-flex items-center justify-center rounded-sm text-label font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2 disabled:opacity-50 h-10 px-4 bg-surface text-text-primary border border-border-input hover:bg-subtle">
            Batal
          </Link>
          <Button type="submit" variant="primary" disabled={loading} leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
            Simpan Data
          </Button>
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar Nav (Mobile Tabs, Desktop Sidebar) */}
        <div className="w-full lg:w-64 shrink-0">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                <a href="#pribadi" className="flex items-center px-3 py-2 text-label text-primary bg-primary-soft rounded-sm">Data Pribadi</a>
                <a href="#pekerjaan" className="flex items-center px-3 py-2 text-label text-text-secondary hover:bg-subtle rounded-sm">Pekerjaan & Posisi</a>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Form Sections */}
        <div className="flex-1 space-y-6">
          <Card id="pribadi">
            <CardHeader>
              <CardTitle>Data Pribadi</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                name="first_name" 
                value={formData.first_name} 
                onChange={handleChange} 
                label="Nama Depan" 
                placeholder="Nama depan sesuai KTP" 
                required 
              />
              <Input 
                name="last_name" 
                value={formData.last_name} 
                onChange={handleChange} 
                label="Nama Belakang" 
                placeholder="Nama belakang" 
              />
              <Input 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                label="Email Pribadi/Kerja" 
                placeholder="nama@contoh.com" 
                required 
              />
            </CardContent>
          </Card>

          <Card id="pekerjaan">
            <CardHeader>
              <CardTitle>Pekerjaan & Posisi</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                name="employee_id" 
                value={formData.employee_id} 
                onChange={handleChange} 
                label="Nomor Karyawan (NIK)" 
                placeholder="ID Karyawan" 
                required 
              />
              <Input 
                name="join_date" 
                type="date" 
                value={formData.join_date} 
                onChange={handleChange} 
                label="Tanggal Bergabung" 
                required 
              />
              <div className="space-y-1.5">
                <label className="text-label text-text-primary">Departemen <span className="text-danger">*</span></label>
                <select 
                  name="department_id" 
                  value={formData.department_id} 
                  onChange={handleChange} 
                  className="w-full h-10 px-3 rounded-sm border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring"
                >
                  <option value="">Pilih departemen</option>
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
                  className="w-full h-10 px-3 rounded-sm border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring"
                >
                  <option value="">Pilih jabatan</option>
                  {jobPositions.map((job) => (
                    <option key={job.id} value={job.id}>{job.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-label text-text-primary">Status Karyawan <span className="text-danger">*</span></label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className="w-full h-10 px-3 rounded-sm border bg-surface text-text-primary border-border-input focus:ring-2 focus:ring-primary-ring"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
