import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  Search, 
  Plus, 
  Filter, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  User, 
  Mail, 
  KeyRound, 
  Loader2,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  UserCog
} from 'lucide-react';
import api from '../../lib/api';

interface UserItem {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  roles: string[];
  primary_role: string;
  created_at: string;
  employee?: {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string | null;
    full_name: string;
    department: string;
    job_position: string;
  } | null;
}

interface RoleOption {
  id: number;
  name: string;
  label: string;
}

interface UnlinkedEmployee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string | null;
  email: string;
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [unlinkedEmployees, setUnlinkedEmployees] = useState<UnlinkedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Notifications
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  // Modal States
  // 1. Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // 2. Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'employee',
    is_active: true,
    employee_id: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  // 3. Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    is_active: true,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // 4. Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, unlinkedRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/roles'),
        api.get('/users/unlinked-employees')
      ]);

      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setUnlinkedEmployees(unlinkedRes.data);
    } catch (err) {
      console.error('Error fetching users data:', err);
      showAlert('danger', 'Gagal memuat data pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showAlert = (type: 'success' | 'danger', message: string) => {
    setAlertInfo({ type, message });
    setTimeout(() => {
      setAlertInfo(null);
    }, 6000);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) || 
      (u.employee?.employee_id || '').toLowerCase().includes(q) ||
      (u.employee?.department || '').toLowerCase().includes(q);

    const matchRole = !roleFilter || u.roles.includes(roleFilter);
    const matchStatus = !statusFilter || (statusFilter === 'active' ? u.is_active : !u.is_active);

    return matchSearch && matchRole && matchStatus;
  });

  // Stats
  const totalCount = users.length;
  const activeCount = users.filter(u => u.is_active).length;
  const inactiveCount = totalCount - activeCount;
  const adminCount = users.filter(u => u.roles.some(r => ['super-admin', 'owner', 'direksi', 'hr-manager'].includes(r))).length;

  // 1. Reset Password Handlers
  const openResetModal = (u: UserItem) => {
    setSelectedUserForReset(u);
    setNewPassword('password123'); // Default suggested
    setShowPassword(false);
    setResetModalOpen(true);
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
    setShowPassword(true);
  };

  const handleExecuteResetPassword = async () => {
    if (!selectedUserForReset) return;
    if (!newPassword || newPassword.length < 6) {
      alert('Kata sandi minimal 6 karakter.');
      return;
    }

    try {
      setIsResetting(true);
      const res = await api.post(`/users/${selectedUserForReset.id}/reset-password`, {
        password: newPassword,
      });

      showAlert('success', res.data.message || `Kata sandi untuk ${selectedUserForReset.name} berhasil diperbarui.`);
      setResetModalOpen(false);
    } catch (err: any) {
      console.error('Reset password error:', err);
      showAlert('danger', err.response?.data?.message || 'Gagal mengubah kata sandi pengguna.');
    } finally {
      setIsResetting(false);
    }
  };

  // 2. Toggle Status Handler
  const handleToggleStatus = async (u: UserItem) => {
    if (currentUser?.id === u.id) {
      alert('Anda tidak dapat menonaktifkan akun Anda sendiri.');
      return;
    }

    try {
      const res = await api.post(`/users/${u.id}/toggle-status`);
      showAlert('success', res.data.message);
      // Update local state
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, is_active: res.data.is_active } : item));
    } catch (err: any) {
      console.error('Toggle status error:', err);
      showAlert('danger', err.response?.data?.error || 'Gagal mengubah status akun.');
    }
  };

  // 3. Create User Handlers
  const openCreateModal = () => {
    setCreateForm({
      name: '',
      email: '',
      password: 'password123',
      role: 'employee',
      is_active: true,
      employee_id: '',
    });
    setCreateModalOpen(true);
  };

  const handleSelectUnlinkedEmployee = (empIdStr: string) => {
    const emp = unlinkedEmployees.find(e => String(e.id) === empIdStr);
    if (emp) {
      setCreateForm(prev => ({
        ...prev,
        employee_id: empIdStr,
        name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
        email: emp.email,
      }));
    } else {
      setCreateForm(prev => ({ ...prev, employee_id: '' }));
    }
  };

  const handleExecuteCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      alert('Mohon lengkapi Nama, Email, dan Kata Sandi.');
      return;
    }

    try {
      setIsCreating(true);
      await api.post('/users', createForm);
      showAlert('success', 'Pengguna baru berhasil dibuat!');
      setCreateModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error('Create user error:', err);
      const resMsg = err.response?.data?.message || err.response?.data?.error || 'Gagal membuat pengguna.';
      alert(resMsg);
    } finally {
      setIsCreating(false);
    }
  };

  // 4. Edit User Handlers
  const openEditModal = (u: UserItem) => {
    setSelectedUserForEdit(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.primary_role,
      is_active: u.is_active,
    });
    setEditModalOpen(true);
  };

  const handleExecuteUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    try {
      setIsUpdating(true);
      await api.put(`/users/${selectedUserForEdit.id}`, editForm);
      showAlert('success', 'Data pengguna berhasil diperbarui!');
      setEditModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error('Update user error:', err);
      alert(err.response?.data?.message || 'Gagal memperbarui pengguna.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 5. Delete User Handlers
  const openDeleteModal = (u: UserItem) => {
    if (currentUser?.id === u.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    setSelectedUserForDelete(u);
    setDeleteModalOpen(true);
  };

  const handleExecuteDeleteUser = async () => {
    if (!selectedUserForDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/users/${selectedUserForDelete.id}`);
      showAlert('success', `Pengguna ${selectedUserForDelete.name} berhasil dihapus.`);
      setDeleteModalOpen(false);
      setUsers(prev => prev.filter(u => u.id !== selectedUserForDelete.id));
    } catch (err: any) {
      console.error('Delete user error:', err);
      showAlert('danger', err.response?.data?.error || 'Gagal menghapus pengguna.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super-admin':
      case 'owner':
      case 'direksi':
        return 'primary';
      case 'hr-manager':
      case 'hr':
        return 'success';
      case 'dept-head':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1 text-text-primary flex items-center gap-2.5">
            <UserCog className="w-7 h-7 text-primary" />
            Manajemen Akun Pengguna
          </h1>
          <p className="text-body text-text-secondary">
            Kelola akun login karyawan, penetapan role hak akses, status aktif/nonaktif, dan ubah kata sandi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={fetchData} 
            disabled={loading}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            onClick={openCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah Pengguna
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertInfo && (
        <Alert variant={alertInfo.type} onClose={() => setAlertInfo(null)}>
          {alertInfo.message}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface border-border-default">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-soft text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Total Akun</p>
              <p className="text-xl font-bold text-text-primary">{totalCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border-default">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Akun Aktif</p>
              <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border-default">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Akun Nonaktif</p>
              <p className="text-xl font-bold text-amber-600">{inactiveCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border-default">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Admin & HR</p>
              <p className="text-xl font-bold text-indigo-600">{adminCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardContent className="p-0">
          {/* Filters Bar */}
          <div className="p-4 border-b border-border-default flex flex-col md:flex-row justify-between gap-4 bg-subtle/50">
            <div className="flex-1 max-w-md">
              <Input 
                label=""
                placeholder="Cari nama, email, NIK, atau departemen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-text-muted" />}
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 px-3 text-xs rounded-lg border border-border-input bg-surface text-text-primary focus:ring-2 focus:ring-primary-ring"
              >
                <option value="">Semua Role</option>
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.label}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-xs rounded-lg border border-border-input bg-surface text-text-primary focus:ring-2 focus:ring-primary-ring"
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <Table className="border-0 shadow-none rounded-none">
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna / Akun</TableHead>
                <TableHead>Role Akses</TableHead>
                <TableHead>Karyawan Terhubung</TableHead>
                <TableHead>Status Akun</TableHead>
                <TableHead className="text-right">Aksi & Keamanan</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-text-secondary mt-2 text-xs">Memuat daftar akun pengguna...</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-text-secondary text-xs">
                    {searchQuery ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada data pengguna.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <TableRow key={u.id}>
                      {/* Name & Email */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-text-primary text-sm">{u.name}</p>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-surface">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-muted font-mono">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {u.roles.map(r => (
                            <Badge key={r} variant={getRoleBadgeVariant(r)}>
                              {roles.find(ro => ro.name === r)?.label || r}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>

                      {/* Linked Employee */}
                      <TableCell>
                        {u.employee ? (
                          <div>
                            <p className="text-xs font-medium text-text-primary font-mono">
                              {u.employee.employee_id} - {u.employee.full_name}
                            </p>
                            <p className="text-[11px] text-text-muted">
                              {u.employee.department} • {u.employee.job_position}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted italic">
                            Tanpa Profil Karyawan
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={u.is_active ? 'success' : 'neutral'}>
                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className="text-[11px] text-primary hover:underline"
                              title="Klik untuk ubah status"
                            >
                              {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ubah Sandi Button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openResetModal(u)}
                            className="text-xs"
                            leftIcon={<KeyRound className="w-3.5 h-3.5 text-amber-600" />}
                          >
                            Ubah Sandi
                          </Button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-2 text-text-secondary hover:text-primary hover:bg-subtle rounded-lg transition-colors"
                            title="Edit Pengguna"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => openDeleteModal(u)}
                              className="p-2 text-text-secondary hover:text-danger hover:bg-danger-subtle rounded-lg transition-colors"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </Table>

          <div className="p-4 border-t border-border-default flex items-center justify-between text-xs text-text-secondary">
            <span>Menampilkan <strong>{filteredUsers.length}</strong> dari {totalCount} akun</span>
            <Pagination 
              currentPage={1} 
              totalPages={1} 
              totalItems={filteredUsers.length} 
              itemsPerPage={25} 
              onPageChange={() => {}} 
            />
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 1. MODAL RESET KATA SANDI (UBAH SANDI) */}
      {/* ============================================================ */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Ubah / Reset Kata Sandi Pengguna"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={() => setResetModalOpen(false)} disabled={isResetting}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteResetPassword}
              disabled={isResetting || !newPassword || newPassword.length < 6}
              leftIcon={isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            >
              {isResetting ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Target user info card */}
          {selectedUserForReset && (
            <div className="p-3.5 rounded-xl bg-subtle border border-border-default flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold shrink-0">
                {selectedUserForReset.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{selectedUserForReset.name}</p>
                <p className="text-xs text-text-secondary truncate">{selectedUserForReset.email}</p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Role: <span className="font-semibold">{selectedUserForReset.primary_role}</span>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-label text-text-primary">Kata Sandi Baru *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPassword('password123')}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  Gunakan password123
                </button>
                <span className="text-text-muted text-xs">•</span>
                <button
                  type="button"
                  onClick={handleGenerateRandomPassword}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3" /> Acak
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru (min. 6 karakter)"
                className="w-full h-10 px-3 pr-10 rounded-lg border border-border-input bg-surface text-text-primary text-sm focus:ring-2 focus:ring-primary-ring font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-text-muted">
              Pastikan memberitahukan kata sandi baru ini kepada pengguna setelah diubah agar dapat melakukan login.
            </p>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* 2. MODAL TAMBAH PENGGUNA BARU */}
      {/* ============================================================ */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tambah Akun Pengguna Baru"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={isCreating}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteCreateUser}
              disabled={isCreating}
              leftIcon={isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            >
              {isCreating ? 'Menyimpan...' : 'Buat Pengguna'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleExecuteCreateUser} className="space-y-4">
          {/* Quick link unlinked employee */}
          {unlinkedEmployees.length > 0 && (
            <div className="p-3 rounded-xl bg-primary-soft/40 border border-primary/20 space-y-1.5">
              <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Pilih dari Karyawan yang belum punya akun (Otomatis isi form):
              </label>
              <select
                value={createForm.employee_id}
                onChange={(e) => handleSelectUnlinkedEmployee(e.target.value)}
                className="w-full h-9 px-2.5 text-xs rounded-lg border border-border-input bg-surface text-text-primary"
              >
                <option value="">-- Buat akun bebas (tanpa link karyawan) --</option>
                {unlinkedEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employee_id} - {emp.first_name} {emp.last_name || ''} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Input
              label="Nama Lengkap Pengguna"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="Contoh: Budi Santoso"
              required
            />
          </div>

          <div>
            <Input
              label="Email Login"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="budi@kurma.group"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label text-text-primary">Role Hak Akses *</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-lg border border-border-input bg-surface text-text-primary focus:ring-2 focus:ring-primary-ring"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-label text-text-primary">Status Akun</label>
              <select
                value={createForm.is_active ? '1' : '0'}
                onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.value === '1' })}
                className="w-full h-10 px-3 text-sm rounded-lg border border-border-input bg-surface text-text-primary focus:ring-2 focus:ring-primary-ring"
              >
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Input
              label="Kata Sandi Awal"
              type="text"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Default: password123"
              required
            />
            <p className="text-[11px] text-text-muted">
              Password default adalah <code>password123</code>. Pengguna dapat mengubahnya mandiri di menu Profil.
            </p>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* 3. MODAL EDIT PENGGUNA */}
      {/* ============================================================ */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Data Pengguna"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isUpdating}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteUpdateUser}
              disabled={isUpdating}
              leftIcon={isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            >
              {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleExecuteUpdateUser} className="space-y-4">
          <div>
            <Input
              label="Nama Lengkap"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Input
              label="Email Login"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label text-text-primary">Role Hak Akses</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-lg border border-border-input bg-surface text-text-primary focus:ring-2 focus:ring-primary-ring"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-label text-text-primary">Status Akun</label>
              <select
                value={editForm.is_active ? '1' : '0'}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === '1' })}
                disabled={currentUser?.id === selectedUserForEdit?.id}
                className="w-full h-10 px-3 text-sm rounded-lg border border-border-input bg-surface text-text-primary focus:ring-2 focus:ring-primary-ring disabled:opacity-50"
              >
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* 4. MODAL KONFIRMASI HAPUS PENGGUNA */}
      {/* ============================================================ */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus Akun Pengguna"
        size="sm"
        danger
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleExecuteDeleteUser}
              disabled={isDeleting}
              leftIcon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-primary">
            Apakah Anda yakin ingin menghapus akun pengguna <strong>{selectedUserForDelete?.name}</strong> ({selectedUserForDelete?.email})?
          </p>
          <div className="p-3 rounded-lg bg-danger-subtle border border-danger-border text-xs text-danger-fg">
            Pengguna tidak akan dapat login lagi ke sistem. Data karyawan yang tertaut tidak akan terhapus, hanya tautan akun yang dilepas.
          </div>
        </div>
      </Modal>
    </div>
  );
}
