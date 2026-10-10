import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Search, Plus, Filter, MoreVertical, FileText, Loader2, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  status: string;
  current_assignment?: {
    department?: { name: string };
    job_position?: { name: string };
  };
}

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/employees');
        setEmployees(response.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleExport = () => {
    window.open('http://localhost:8000/api/employees/export', '_blank');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    
    try {
      await api.post('/employees/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Karyawan berhasil diimpor!');
      // Reload page to fetch new data
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      alert('Gagal mengimpor karyawan.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1 text-text-primary">Karyawan</h1>
          <p className="text-body text-text-secondary">Kelola data seluruh karyawan di perusahaan.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            id="import-excel" 
            className="hidden" 
            onChange={handleImport}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          />
          <label htmlFor="import-excel">
            <Button variant="secondary" asChild>
              <span className="cursor-pointer inline-flex items-center">
                <Upload className="w-4 h-4 mr-2" /> Impor
              </span>
            </Button>
          </label>
          <Button variant="secondary" onClick={handleExport} leftIcon={<FileText className="w-4 h-4" />}>
            Ekspor
          </Button>
          <Link to="/karyawan/tambah" className="inline-flex items-center justify-center rounded-sm text-label font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2 disabled:opacity-50 h-10 px-4 bg-primary text-surface hover:bg-primary-hover">
            <Plus className="w-4 h-4 mr-2" /> Tambah
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Toolbar / Filter */}
          <div className="p-4 border-b border-border-default flex flex-col sm:flex-row justify-between gap-4 bg-subtle/50">
            <div className="flex-1 max-w-md relative">
              <Input 
                label="" 
                placeholder="Cari nama, NIK, atau email..." 
                leftIcon={<Search className="w-5 h-5" />} 
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" leftIcon={<Filter className="w-4 h-4" />}>
                Filter
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table className="border-0 shadow-none rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>NIK / Kontak</TableHead>
                <TableHead>Departemen / Jabatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-text-secondary mt-2">Memuat data...</p>
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                    Tidak ada data karyawan.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold">
                          {employee.first_name.charAt(0)}{employee.last_name ? employee.last_name.charAt(0) : ''}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {employee.first_name} {employee.last_name || ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-body text-text-primary">{employee.employee_id}</p>
                      <p className="text-caption text-text-muted">{employee.email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-body text-text-primary">{employee.current_assignment?.department?.name || '-'}</p>
                      <p className="text-caption text-text-muted">{employee.current_assignment?.job_position?.name || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.status === 'active' ? 'success' : 'neutral'}>
                        {employee.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link to={`/karyawan/${employee.id}`} className="p-2 text-primary hover:bg-primary-soft rounded-sm transition-colors inline-block">
                        Lihat
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
          
          <div className="p-4 border-t border-border-default">
            <Pagination 
              currentPage={1} 
              totalPages={1} 
              totalItems={employees.length} 
              itemsPerPage={10} 
              onPageChange={() => {}} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
