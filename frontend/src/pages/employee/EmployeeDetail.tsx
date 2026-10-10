import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { ArrowLeft, Edit, Download, Mail, Phone, MapPin, Briefcase, Upload, FileText, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';

export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pribadi');
  const [uploadingDoc, setUploadingDoc] = useState(false);

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
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <p className="text-text-secondary">Data karyawan tidak ditemukan.</p>
        <Link to="/karyawan" className="mt-4 text-primary hover:underline">Kembali ke Daftar Karyawan</Link>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Aktif</Badge>;
      case 'inactive':
        return <Badge variant="danger">Nonaktif</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('document_type', 'Lainnya'); // Default type for now
    
    try {
      const response = await api.post(`/employees/${id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Update employee documents list
      setEmployee({
        ...employee,
        documents: [...(employee.documents || []), response.data]
      });
      alert('Dokumen berhasil diunggah!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Gagal mengunggah dokumen.');
    } finally {
      setUploadingDoc(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Yakin ingin menghapus dokumen ini?')) return;
    
    try {
      await api.delete(`/employees/${id}/documents/${docId}`);
      setEmployee({
        ...employee,
        documents: employee.documents.filter((d: any) => d.id !== docId)
      });
    } catch (error) {
      console.error('Delete error:', error);
      alert('Gagal menghapus dokumen.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/karyawan" className="p-2 rounded-sm text-text-secondary hover:bg-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="h1 text-text-primary">Profil Karyawan</h1>
            <p className="text-body text-text-secondary">Detail informasi, absensi, dan cuti karyawan.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            Unduh Data
          </Button>
          <Link to={`/karyawan/${id}/edit`} className="inline-flex items-center justify-center rounded-sm text-label font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2 disabled:opacity-50 h-10 px-4 bg-primary text-surface hover:bg-primary-hover">
            <Edit className="w-4 h-4 mr-2" /> Edit Karyawan
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Profile */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-display mb-4">
                {getInitials(employee.first_name, employee.last_name)}
              </div>
              <h2 className="h2 text-text-primary">{employee.first_name} {employee.last_name}</h2>
              <p className="text-body text-text-secondary mt-1">{employee.current_assignment?.job_position?.name || '-'}</p>
              
              <div className="mt-4">
                {getStatusBadge(employee.status)}
              </div>

              <div className="w-full border-t border-border-default my-6"></div>

              <div className="w-full space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-text-muted shrink-0" />
                  <div>
                    <p className="text-caption text-text-muted">Departemen</p>
                    <p className="text-body text-text-primary">{employee.current_assignment?.department?.name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-text-muted shrink-0" />
                  <div>
                    <p className="text-caption text-text-muted">Email Kerja</p>
                    <p className="text-body text-text-primary">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-text-muted shrink-0" />
                  <div>
                    <p className="text-caption text-text-muted">Telepon</p>
                    <p className="text-body text-text-primary">{employee.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-text-muted shrink-0" />
                  <div>
                    <p className="text-caption text-text-muted">ID Karyawan</p>
                    <p className="text-body text-text-primary">{employee.employee_id}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs 
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'pribadi', label: 'Data Pribadi' },
              { id: 'pekerjaan', label: 'Riwayat Pekerjaan' },
              { id: 'dokumen', label: 'Dokumen' },
            ]}
          />

          {activeTab === 'pribadi' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Karyawan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-caption text-text-muted">Tanggal Bergabung</p>
                      <p className="text-body text-text-primary font-medium">{employee.join_date || '-'}</p>
                    </div>
                    <div>
                      <p className="text-caption text-text-muted">Email Pribadi / Kerja</p>
                      <p className="text-body text-text-primary font-medium">{employee.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'pekerjaan' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Riwayat Penempatan (Mutasi/Promosi)</CardTitle>
                  <Button variant="secondary" size="sm">Penempatan Baru</Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-default text-label text-text-muted">
                          <th className="py-3 px-4 font-medium">Tanggal Efektif</th>
                          <th className="py-3 px-4 font-medium">Departemen</th>
                          <th className="py-3 px-4 font-medium">Jabatan</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employee.assignments && employee.assignments.length > 0 ? (
                          employee.assignments.map((assignment: any) => (
                            <tr key={assignment.id} className="border-b border-border-subtle hover:bg-subtle transition-colors">
                              <td className="py-3 px-4 text-body text-text-primary">{assignment.start_date}</td>
                              <td className="py-3 px-4 text-body text-text-primary">{assignment.department?.name}</td>
                              <td className="py-3 px-4 text-body text-text-primary">{assignment.job_position?.name}</td>
                              <td className="py-3 px-4">
                                {assignment.is_primary ? (
                                  <Badge variant="primary">Aktif</Badge>
                                ) : (
                                  <Badge variant="neutral">Selesai</Badge>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-text-secondary">Tidak ada riwayat penempatan.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'dokumen' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Dokumen Karyawan</CardTitle>
                  <div>
                    <input 
                      type="file" 
                      id="upload-doc" 
                      className="hidden" 
                      onChange={handleUploadDocument}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label htmlFor="upload-doc">
                      <Button variant="secondary" size="sm" asChild disabled={uploadingDoc}>
                        <span className="cursor-pointer inline-flex items-center">
                          {uploadingDoc ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div> : <Upload className="w-4 h-4 mr-2" />}
                          Unggah Dokumen
                        </span>
                      </Button>
                    </label>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employee.documents && employee.documents.length > 0 ? (
                      employee.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border border-border-default rounded-md hover:bg-subtle transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-soft text-primary rounded-full">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{doc.document_type} - {doc.document_number || 'Tanpa Nomor'}</p>
                              <p className="text-caption text-text-muted">Diunggah pada: {new Date(doc.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={`http://localhost:8000/storage/${doc.file_path}`} target="_blank" rel="noopener noreferrer" className="p-2 text-primary hover:bg-primary-soft rounded-sm transition-colors">
                              Lihat
                            </a>
                            <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-danger hover:bg-danger/10 rounded-sm transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-text-secondary border-2 border-dashed border-border-default rounded-md">
                        <FileText className="w-12 h-12 mx-auto text-text-muted mb-4" />
                        <p>Belum ada dokumen yang diunggah.</p>
                      </div>
                    )}
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
