import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { 
  Search, 
  Plus, 
  FileText, 
  Loader2, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  X, 
  ChevronDown,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  status: string;
  basic_salary?: number;
  allowances?: number;
  current_assignment?: {
    department?: { name: string };
    job_position?: { name: string };
  };
}

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      const raw = response.data;
      setEmployees(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Authenticated Export
  const handleExport = async (format: 'xlsx' | 'csv' = 'xlsx') => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const response = await api.get(`/employees/export?format=${format}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: format === 'csv' 
          ? 'text/csv;charset=utf-8;' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `Data_Karyawan_KurmaGroup_${today}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Export error:', error);
      let errorMsg = 'Gagal mengekspor data karyawan.';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.error || parsed.message) {
            errorMsg += ' ' + (parsed.error || parsed.message);
          }
        } catch {
          // ignore parsing error
        }
      } else if (error.response?.data?.message) {
        errorMsg += ' ' + error.response.data.message;
      }
      alert(errorMsg);
    } finally {
      setIsExporting(false);
    }
  };

  // Download Import Template
  const handleDownloadTemplate = async (format: 'xlsx' | 'csv' = 'xlsx') => {
    try {
      setIsDownloadingTemplate(format);
      const response = await api.get(`/employees/template?format=${format}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: format === 'csv' 
          ? 'text/csv;charset=utf-8;' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Template_Import_Karyawan.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Template download error:', error);
      let errorMsg = 'Gagal mengunduh template import karyawan.';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.error || parsed.message) {
            errorMsg += ' ' + (parsed.error || parsed.message);
          }
        } catch {
          // ignore parsing error
        }
      } else if (error.response?.data?.message) {
        errorMsg += ' ' + error.response.data.message;
      }
      alert(errorMsg);
    } finally {
      setIsDownloadingTemplate(null);
    }
  };

  // File Select Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);
      setImportError(null);
      setImportSuccess(null);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImportFile(file);
      setImportError(null);
      setImportSuccess(null);
    }
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (!importFile) {
      setImportError('Silakan pilih file Excel (.xlsx) atau CSV terlebih dahulu.');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const response = await api.post('/employees/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const message = response.data?.message || 'Data karyawan berhasil diimpor!';
      setImportSuccess(message);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh list
      await fetchEmployees();
    } catch (error: any) {
      console.error('Import error:', error);
      const serverMsg = error.response?.data?.error || error.response?.data?.message || 'Gagal mengimpor file. Pastikan struktur kolom sesuai template.';
      setImportError(serverMsg);
    } finally {
      setIsImporting(false);
    }
  };

  const openImportModal = () => {
    setImportFile(null);
    setImportError(null);
    setImportSuccess(null);
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportError(null);
    setImportSuccess(null);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(val || 0);
  };

  // Search Filter
  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${emp.first_name} ${emp.last_name || ''}`.toLowerCase();
    const empId = (emp.employee_id || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const dept = (emp.current_assignment?.department?.name || '').toLowerCase();
    const job = (emp.current_assignment?.job_position?.name || '').toLowerCase();

    return fullName.includes(query) || empId.includes(query) || email.includes(query) || dept.includes(query) || job.includes(query);
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">Data Karyawan</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Kelola data, penempatan, dan gaji pokok karyawan.
          </p>
        </div>

        {/* Tiga Tombol Sejajar: Impor, Ekspor, Tambah */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={openImportModal}
            leftIcon={<Upload className="w-4 h-4 text-text-secondary" />}
            className="h-9 text-xs font-medium"
          >
            Impor
          </Button>

          {/* Tombol Ekspor with Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              leftIcon={isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-text-secondary" />}
              rightIcon={<ChevronDown className="w-3.5 h-3.5" />}
              className="h-9 text-xs font-medium"
            >
              {isExporting ? 'Mengekspor...' : 'Ekspor'}
            </Button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-surface rounded-lg shadow-md border border-border-default z-20 py-1 animate-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => handleExport('xlsx')}
                  className="w-full text-left px-3.5 py-2 text-xs text-text-primary hover:bg-subtle flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  Format Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-3.5 py-2 text-xs text-text-primary hover:bg-subtle flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-text-secondary" />
                  Format CSV (.csv)
                </button>
              </div>
            )}
          </div>

          {/* Tombol Tambah Karyawan */}
          <Link 
            to="/admin/karyawan/tambah" 
            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 h-9 px-3.5 bg-primary text-white hover:bg-primary-hover shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Tambah
          </Link>
        </div>
      </div>

      <Card className="shadow-xs border border-border-default overflow-hidden">
        <CardContent className="p-0">
          {/* Toolbar / Search Filter */}
          <div className="p-3.5 border-b border-border-default flex flex-col sm:flex-row justify-between items-center gap-3 bg-subtle/20">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text"
                placeholder="Cari nama, NIK, email, departemen..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border-default bg-surface text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                aria-label="Cari karyawan"
              />
            </div>
            <div className="text-xs text-text-secondary whitespace-nowrap">
              {searchQuery.trim() ? (
                <span>{filteredEmployees.length} dari {employees.length} karyawan</span>
              ) : (
                <span>{employees.length} karyawan</span>
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-subtle sticky top-0 z-10 border-b border-border-default">
                <tr>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Karyawan</th>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Departemen</th>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs text-right whitespace-nowrap">Gaji Pokok</th>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 font-semibold text-text-secondary text-xs text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-text-muted">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary mb-1.5" />
                      <p className="text-xs">Memuat data karyawan...</p>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-text-muted text-xs">
                      <p className="font-medium text-text-primary">Tidak ada karyawan yang cocok dengan pencarian.</p>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-xs text-primary font-medium hover:underline inline-block"
                        >
                          Reset Pencarian
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee: any) => {
                    const basic = Number(employee.basic_salary) || 0;
                    const allow = Number(employee.allowances) || 0;
                    const total = basic + allow;

                    return (
                      <tr 
                        key={employee.id} 
                        className="h-16 hover:bg-subtle/50 transition-colors border-b border-border-default last:border-0"
                      >
                        {/* Karyawan: avatar, nama, lalu NIK & email kecil abu-abu */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-subtle text-text-secondary flex items-center justify-center font-semibold text-xs shrink-0 border border-border-default">
                              {employee.first_name.charAt(0)}{employee.last_name ? employee.last_name.charAt(0) : ''}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-text-primary text-xs truncate leading-tight">
                                {employee.first_name} {employee.last_name || ''}
                              </p>
                              <p className="text-[11px] text-text-muted truncate mt-0.5 leading-tight">
                                {employee.employee_id} • {employee.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Departemen: nama departemen, jabatan kecil abu-abu */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-medium text-text-primary text-xs">
                            {employee.current_assignment?.department?.name || '-'}
                          </p>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {employee.current_assignment?.job_position?.name || '-'}
                          </p>
                        </td>

                        {/* Gaji Pokok: satu baris bersih, tabular-nums rata kanan */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="font-medium text-text-primary text-xs tabular-nums">
                            {basic > 0 ? formatRupiah(basic) : (total > 0 ? formatRupiah(total) : '-')}
                          </span>
                        </td>

                        {/* Status: badge satu baris */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            employee.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {employee.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>

                        {/* Aksi: selalu terlihat tanpa scroll horizontal */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link 
                              to={`/admin/karyawan/${employee.id}`} 
                              className="h-8 px-2.5 text-xs font-medium text-text-secondary hover:text-text-primary rounded-md border border-border-default hover:bg-subtle transition-colors inline-flex items-center"
                            >
                              Lihat
                            </Link>
                            <Link 
                              to={`/admin/karyawan/${employee.id}/edit`} 
                              className="h-8 px-2.5 text-xs font-medium text-primary rounded-md border border-border-default hover:bg-subtle transition-colors inline-flex items-center"
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< 1024px) */}
          <div className="lg:hidden p-4 space-y-3 bg-subtle/10">
            {loading ? (
              <div className="p-6 text-center text-text-muted">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary mb-1.5" />
                <p className="text-xs">Memuat data karyawan...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <p className="p-4 text-center text-text-muted text-xs">
                Tidak ada karyawan yang cocok dengan pencarian.
              </p>
            ) : (
              filteredEmployees.map((employee: any) => {
                const basic = Number(employee.basic_salary) || 0;
                const allow = Number(employee.allowances) || 0;
                const total = basic + allow;

                return (
                  <div key={`m-${employee.id}`} className="p-3.5 bg-surface rounded-lg border border-border-default shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-subtle text-text-secondary flex items-center justify-center font-semibold text-xs shrink-0 border border-border-default">
                          {employee.first_name.charAt(0)}{employee.last_name ? employee.last_name.charAt(0) : ''}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary text-xs truncate">
                            {employee.first_name} {employee.last_name || ''}
                          </p>
                          <p className="text-[11px] text-text-muted truncate">
                            {employee.employee_id} • {employee.email}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 ${
                        employee.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {employee.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border-default flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-text-muted block">Departemen:</span>
                        <span className="font-medium text-text-primary">
                          {employee.current_assignment?.department?.name || '-'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-text-muted block">Gaji Pokok:</span>
                        <span className="font-medium text-text-primary tabular-nums">
                          {basic > 0 ? formatRupiah(basic) : (total > 0 ? formatRupiah(total) : '-')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border-default flex items-center gap-2">
                      <Link 
                        to={`/admin/karyawan/${employee.id}`} 
                        className="flex-1 h-9 text-xs font-medium rounded-md border border-border-default hover:bg-subtle transition-colors inline-flex items-center justify-center text-text-secondary hover:text-text-primary"
                      >
                        Lihat
                      </Link>
                      <Link 
                        to={`/admin/karyawan/${employee.id}/edit`} 
                        className="flex-1 h-9 text-xs font-medium rounded-md border border-border-default hover:bg-subtle transition-colors inline-flex items-center justify-center text-primary"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* MODAL IMPOR KARYAWAN */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        title="Impor Data Karyawan Massal"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={closeImportModal} disabled={isImporting} className="h-9 text-xs">
              Tutup
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteImport}
              disabled={!importFile || isImporting}
              leftIcon={isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              className="h-9 text-xs"
            >
              {isImporting ? 'Memproses...' : 'Proses Impor File'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Alert status */}
          {importSuccess && (
            <Alert variant="success" title="Impor Berhasil!">
              {importSuccess}
            </Alert>
          )}

          {importError && (
            <Alert variant="danger" title="Gagal Mengimpor">
              {importError}
            </Alert>
          )}

          {/* Unduh Template Banner */}
          <div className="p-3.5 rounded-lg bg-subtle border border-border-default space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  Format Template Data
                </h4>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Gunakan template resmi agar struktur kolom terisi tepat:
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTemplate('xlsx')}
                  disabled={isDownloadingTemplate === 'xlsx'}
                  leftIcon={isDownloadingTemplate === 'xlsx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  className="h-8 text-xs"
                >
                  Template Excel (.xlsx)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTemplate('csv')}
                  disabled={isDownloadingTemplate === 'csv'}
                  leftIcon={isDownloadingTemplate === 'csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  className="h-8 text-xs"
                >
                  Template CSV (.csv)
                </Button>
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-primary bg-primary-soft/30' 
                : importFile 
                  ? 'border-emerald-500 bg-emerald-500/5' 
                  : 'border-border-default hover:border-primary/60 bg-subtle/30 hover:bg-subtle/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />

            {importFile ? (
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-default max-w-md mx-auto">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="p-2 rounded bg-emerald-50 text-emerald-600">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-primary line-clamp-1">{importFile.name}</p>
                    <p className="text-[11px] text-text-muted">
                      {(importFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1.5 text-text-muted hover:text-danger rounded-lg transition-colors"
                  aria-label="Hapus file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-subtle text-text-secondary flex items-center justify-center mx-auto border border-border-default">
                  <Upload className="w-5 h-5 text-text-muted" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text-primary">
                    Klik untuk memilih file atau seret file ke sini
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Format didukung: .xlsx, .xls, .csv (Maksimal 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Info Panduan Kolom */}
          <div className="p-3 rounded-lg bg-subtle border border-border-default space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 font-medium text-text-primary">
              <Info className="w-3.5 h-3.5 text-primary" />
              Ketentuan Format:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-text-secondary leading-relaxed">
              <li>Kolom wajib: Nama Depan, Email, Departemen, Jabatan, Tanggal Masuk (YYYY-MM-DD).</li>
              <li>NIK Karyawan: Jika dikosongkan, sistem membuatkan kode otomatis.</li>
              <li>Data gaji pokok dan rekening akan otomatis tersinkronisasi ke modul Payroll.</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}
