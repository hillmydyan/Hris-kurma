import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  Bell, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Megaphone, 
  Send, 
  Users, 
  Building2, 
  Trash2, 
  CheckCheck, 
  Loader2, 
  Plus, 
  Info, 
  Filter, 
  Eye, 
  X,
  Search,
  Check
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth, isHrOrExecutive } from '../../context/AuthContext';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  category: 'announcement' | 'info' | 'reminder' | 'urgent';
  sender_name: string;
  broadcast_id?: number | null;
  read_at: string | null;
  is_unread: boolean;
  created_at: string;
  time_ago: string;
}

interface BroadcastItem {
  id: number;
  title: string;
  message: string;
  category: string;
  target_type: 'all' | 'department' | 'specific';
  recipients_count: number;
  created_at: string;
  department?: { id: number; name: string };
  sender?: { id: number; name: string };
}

export function Notifications() {
  const { user } = useAuth();
  const canBroadcast = isHrOrExecutive(user) || Boolean(user?.can_access_backend);

  const [activeTab, setActiveTab] = useState<'inbox' | 'broadcasts'>('inbox');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);
  
  // Data Notifikasi Pribadi
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(true);
  
  // Data Broadcast Terkirim (HR/Admin)
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState<boolean>(false);

  // Modal Buat Broadcast
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingFormOptions, setLoadingFormOptions] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'announcement' as 'announcement' | 'info' | 'reminder' | 'urgent',
    target_type: 'all' as 'all' | 'department' | 'specific',
    target_department_id: '',
    target_employee_ids: [] as number[],
  });

  const [employeeSearch, setEmployeeSearch] = useState<string>('');

  useEffect(() => {
    fetchNotifications();
  }, [filterUnreadOnly]);

  useEffect(() => {
    if (activeTab === 'broadcasts' && canBroadcast) {
      fetchBroadcasts();
    }
  }, [activeTab]);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const url = filterUnreadOnly ? '/notifications?unread_only=true' : '/notifications';
      const res = await api.get(url);
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchBroadcasts = async () => {
    setLoadingBroadcasts(true);
    try {
      const res = await api.get('/notifications/broadcasts');
      setBroadcasts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
    } finally {
      setLoadingBroadcasts(false);
    }
  };

  const handleOpenBroadcastModal = async () => {
    setIsModalOpen(true);
    if (departments.length === 0 || employees.length === 0) {
      setLoadingFormOptions(true);
      try {
        const [deptRes, empRes] = await Promise.all([
          api.get('/departments'),
          api.get('/employees')
        ]);
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.data || []);
        setEmployees(Array.isArray(empRes.data) ? empRes.data : empRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load options:', err);
      } finally {
        setLoadingFormOptions(false);
      }
    }
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_unread: false, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_unread: false, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleDeleteBroadcast = async (id: number) => {
    if (!confirm('Tarik & hapus broadcast ini beserta seluruh notifikasi yang telah diterima karyawan?')) return;
    try {
      await api.delete(`/notifications/broadcasts/${id}`);
      fetchBroadcasts();
      fetchNotifications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus broadcast.');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Judul dan pesan notifikasi wajib diisi.');
      return;
    }

    if (formData.target_type === 'department' && !formData.target_department_id) {
      alert('Silakan pilih departemen tujuan.');
      return;
    }

    if (formData.target_type === 'specific' && formData.target_employee_ids.length === 0) {
      alert('Silakan pilih minimal satu karyawan penerima.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        message: formData.message,
        category: formData.category,
        target_type: formData.target_type,
      };

      if (formData.target_type === 'department') {
        payload.target_department_id = formData.target_department_id;
      } else if (formData.target_type === 'specific') {
        payload.target_employee_ids = formData.target_employee_ids;
      }

      const res = await api.post('/notifications/broadcast', payload);
      alert(res.data.message || 'Notifikasi berhasil disiarkan!');

      setIsModalOpen(false);
      setFormData({
        title: '',
        message: '',
        category: 'announcement',
        target_type: 'all',
        target_department_id: '',
        target_employee_ids: [],
      });

      fetchNotifications();
      if (canBroadcast) {
        fetchBroadcasts();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Gagal mengirim notifikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'urgent':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          iconBg: 'bg-danger-bg text-danger-fg',
          badge: <Badge variant="danger">Mendesak</Badge>,
          label: 'Mendesak / Peringatan'
        };
      case 'reminder':
        return {
          icon: <Clock className="w-5 h-5" />,
          iconBg: 'bg-warning-bg text-warning-fg',
          badge: <Badge variant="warning">Pengingat</Badge>,
          label: 'Pengingat Kerja'
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5" />,
          iconBg: 'bg-info-bg text-info-fg',
          badge: <Badge variant="info">Informasi</Badge>,
          label: 'Informasi Umum'
        };
      case 'announcement':
      default:
        return {
          icon: <Megaphone className="w-5 h-5" />,
          iconBg: 'bg-primary-soft text-primary',
          badge: <Badge variant="primary">Pengumuman</Badge>,
          label: 'Pengumuman Penting'
        };
    }
  };

  const filteredEmployees = employees.filter((emp: any) => {
    if (!employeeSearch) return true;
    const q = employeeSearch.toLowerCase();
    const name = `${emp.first_name} ${emp.last_name || ''}`.toLowerCase();
    const code = (emp.employee_id || '').toLowerCase();
    const dept = (emp.current_assignment?.department?.name || '').toLowerCase();
    return name.includes(q) || code.includes(q) || dept.includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="h1 text-text-primary">Notifikasi & Pengumuman</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-caption font-bold bg-danger-bg text-danger-fg">
                {unreadCount} Baru
              </span>
            )}
          </div>
          <p className="text-body text-text-secondary mt-1">
            Pusat pembaruan, pengumuman perusahaan, dan pemberitahuan penting untuk seluruh karyawan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && activeTab === 'inbox' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMarkAllAsRead}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Tandai Semua Dibaca
            </Button>
          )}

          {canBroadcast && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleOpenBroadcastModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + Buat Notifikasi Baru
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Menu (Khusus HR/Admin memiliki tab Riwayat Broadcast) */}
      {canBroadcast && (
        <div className="flex border-b border-border-default space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'inbox'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Bell className="w-4 h-4" />
            Kotak Masuk Saya
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-danger-fg" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('broadcasts')}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'broadcasts'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Riwayat Broadcast Terkirim ({broadcasts.length})
          </button>
        </div>
      )}

      {/* ================= TAB 1: KOTAK MASUK NOTIFIKASI ================= */}
      {activeTab === 'inbox' && (
        <div className="space-y-4 max-w-4xl">
          {/* Filter Sub-Bar */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterUnreadOnly(false)}
                className={`px-3 py-1 rounded-full text-caption font-semibold transition-colors ${
                  !filterUnreadOnly 
                    ? 'bg-primary-soft text-primary' 
                    : 'bg-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                Semua Notifikasi ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterUnreadOnly(true)}
                className={`px-3 py-1 rounded-full text-caption font-semibold transition-colors ${
                  filterUnreadOnly 
                    ? 'bg-primary-soft text-primary' 
                    : 'bg-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                Hanya Belum Dibaca ({unreadCount})
              </button>
            </div>
          </div>

          {loadingNotifications ? (
            <div className="py-16 text-center text-text-muted flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
              <p className="text-body-sm">Memuat notifikasi Anda...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center bg-subtle/50 rounded-xl border border-dashed border-border-default">
              <Bell className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <h3 className="h3 text-text-primary">Tidak Ada Notifikasi</h3>
              <p className="text-caption text-text-muted mt-1 max-w-sm mx-auto">
                {filterUnreadOnly 
                  ? 'Semua notifikasi telah Anda baca. Tidak ada pemberitahuan baru yang tertunda.' 
                  : 'Belum ada notifikasi atau pengumuman yang masuk ke akun Anda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const meta = getCategoryMeta(notif.category);
                return (
                  <Card 
                    key={notif.id}
                    onClick={() => notif.is_unread && handleMarkAsRead(notif.id)}
                    className={`transition-all duration-200 hover:border-primary/50 cursor-pointer ${
                      notif.is_unread 
                        ? 'border-primary/40 bg-primary-soft/10 shadow-xs' 
                        : 'border-border-default bg-surface'
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5 flex gap-4 items-start">
                      <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${meta.iconBg}`}>
                        {meta.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`text-label ${notif.is_unread ? 'text-text-primary font-bold' : 'text-text-primary font-medium'}`}>
                              {notif.title}
                            </h4>
                            {meta.badge}
                            {notif.is_unread && (
                              <Badge variant="info" dot>Baru</Badge>
                            )}
                          </div>
                          <span className="text-caption text-text-muted shrink-0">
                            {notif.time_ago}
                          </span>
                        </div>

                        <p className="text-body text-text-secondary whitespace-pre-line break-words leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border-default/60 text-caption text-text-muted">
                          <span>
                            Pengirim: <strong className="text-text-primary">{notif.sender_name}</strong>
                          </span>

                          <div className="flex items-center gap-3">
                            {notif.is_unread && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkAsRead(notif.id, e)}
                                className="text-primary hover:underline font-medium text-caption flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Tandai Dibaca
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotification(notif.id, e)}
                              className="text-text-muted hover:text-danger transition-colors p-1"
                              title="Hapus notifikasi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: RIWAYAT BROADCAST TERKIRIM (HR/ADMIN) ================= */}
      {activeTab === 'broadcasts' && canBroadcast && (
        <div className="space-y-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <p className="text-body-sm text-text-secondary">
              Daftar seluruh siaran notifikasi yang telah dibuat dan dikirimkan ke kotak masuk karyawan.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenBroadcastModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Buat Broadcast Baru
            </Button>
          </div>

          {loadingBroadcasts ? (
            <div className="py-16 text-center text-text-muted flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
              <p className="text-body-sm">Memuat riwayat broadcast...</p>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="py-16 text-center bg-subtle/50 rounded-xl border border-dashed border-border-default">
              <Megaphone className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <h3 className="h3 text-text-primary">Belum Ada Broadcast Terkirim</h3>
              <p className="text-caption text-text-muted mt-1 max-w-sm mx-auto mb-4">
                Anda belum pernah menyiarkan notifikasi. Klik tombol di bawah untuk membuat pengumuman baru.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenBroadcastModal}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Buat Broadcast Pertama
              </Button>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border-default overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-subtle border-b border-border-default text-text-secondary uppercase font-bold text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Judul & Kategori</th>
                      <th className="py-3 px-4">Sasaran Target</th>
                      <th className="py-3 px-4 text-center">Jumlah Penerima</th>
                      <th className="py-3 px-4">Pengirim</th>
                      <th className="py-3 px-4">Waktu Dikirim</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {broadcasts.map((b) => {
                      const meta = getCategoryMeta(b.category);
                      return (
                        <tr key={b.id} className="hover:bg-subtle/50 transition-colors">
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex items-center gap-2 mb-1">
                              {meta.badge}
                            </div>
                            <p className="font-bold text-text-primary text-sm truncate" title={b.title}>
                              {b.title}
                            </p>
                            <p className="text-caption text-text-muted line-clamp-1 mt-0.5" title={b.message}>
                              {b.message}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            {b.target_type === 'all' && (
                              <span className="font-semibold text-primary inline-flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> Seluruh Karyawan
                              </span>
                            )}
                            {b.target_type === 'department' && (
                              <span className="font-semibold text-info-fg inline-flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" /> Dept: {b.department?.name || 'Departemen'}
                              </span>
                            )}
                            {b.target_type === 'specific' && (
                              <span className="font-semibold text-warning-fg inline-flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> Karyawan Tertentu
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold px-2.5 py-0.5 rounded-full bg-subtle text-text-primary text-caption">
                              {b.recipients_count} User
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-text-secondary font-medium">
                            {b.sender?.name || 'HR Admin'}
                          </td>
                          <td className="py-3.5 px-4 text-text-muted font-medium">
                            {new Date(b.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteBroadcast(b.id)}
                              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                              className="text-xs"
                            >
                              Tarik / Hapus
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL BUAT BROADCAST NOTIFIKASI ================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Notifikasi & Siaran Baru"
        size="lg"
      >
        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <p className="text-body-sm text-text-secondary">
            Pesan notifikasi ini akan langsung terkirim ke menu notifikasi masing-masing user atau karyawan yang dipilih.
          </p>

          {/* Judul Notifikasi */}
          <div>
            <label className="block text-label font-medium text-text-primary mb-1">
              Judul Notifikasi <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pengumuman Libur Bersama Idul Fitri"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-body rounded-lg border border-border-default focus:border-primary focus:ring-1 focus:ring-primary bg-page"
            />
          </div>

          {/* Kategori Notifikasi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'announcement', label: 'Pengumuman', icon: <Megaphone className="w-4 h-4 text-primary" /> },
              { id: 'info', label: 'Informasi Umum', icon: <Info className="w-4 h-4 text-info-fg" /> },
              { id: 'reminder', label: 'Pengingat Kerja', icon: <Clock className="w-4 h-4 text-warning-fg" /> },
              { id: 'urgent', label: 'Mendesak / Alert', icon: <AlertTriangle className="w-4 h-4 text-danger-fg" /> },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.id as any })}
                className={`p-3 rounded-lg border text-left flex flex-col items-start gap-1 transition-all ${
                  formData.category === cat.id
                    ? 'border-primary bg-primary-soft/30 text-primary font-bold shadow-xs'
                    : 'border-border-default bg-surface hover:bg-subtle text-text-secondary'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  {cat.icon}
                  <span>{cat.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Sasaran Penerima */}
          <div>
            <label className="block text-label font-medium text-text-primary mb-1.5">
              Sasaran Penerima <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, target_type: 'all' })}
                className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                  formData.target_type === 'all'
                    ? 'border-primary bg-primary-soft/30 text-primary font-bold shadow-xs'
                    : 'border-border-default bg-surface hover:bg-subtle text-text-secondary'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="text-xs">Seluruh Karyawan (Semua User)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, target_type: 'department' })}
                className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                  formData.target_type === 'department'
                    ? 'border-primary bg-primary-soft/30 text-primary font-bold shadow-xs'
                    : 'border-border-default bg-surface hover:bg-subtle text-text-secondary'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span className="text-xs">Per Departemen Tertentu</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, target_type: 'specific' })}
                className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                  formData.target_type === 'specific'
                    ? 'border-primary bg-primary-soft/30 text-primary font-bold shadow-xs'
                    : 'border-border-default bg-surface hover:bg-subtle text-text-secondary'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="text-xs">Pilih Karyawan Spesifik</span>
              </button>
            </div>
          </div>

          {/* Pilihan Departemen jika target = department */}
          {formData.target_type === 'department' && (
            <div className="p-3.5 bg-subtle/60 rounded-lg border border-border-default space-y-2">
              <label className="block text-xs font-bold text-text-primary">
                Pilih Departemen:
              </label>
              <select
                required
                value={formData.target_department_id}
                onChange={(e) => setFormData({ ...formData, target_department_id: e.target.value })}
                className="w-full px-3 py-2 text-body rounded-lg border border-border-default focus:border-primary focus:ring-1 focus:ring-primary bg-page"
              >
                <option value="">-- Pilih Departemen --</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code || 'Dept'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pilihan Karyawan Spesifik jika target = specific */}
          {formData.target_type === 'specific' && (
            <div className="p-3.5 bg-subtle/60 rounded-lg border border-border-default space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary">
                  Pilih Karyawan Penerima ({formData.target_employee_ids.length} dipilih):
                </span>
                {filteredEmployees.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.target_employee_ids.length === filteredEmployees.length) {
                        setFormData({ ...formData, target_employee_ids: [] });
                      } else {
                        setFormData({ ...formData, target_employee_ids: filteredEmployees.map((e: any) => e.id) });
                      }
                    }}
                    className="text-primary font-semibold hover:underline"
                  >
                    {formData.target_employee_ids.length === filteredEmployees.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                )}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama karyawan atau divisi..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border-default focus:border-primary focus:ring-1 focus:ring-primary bg-page"
                />
              </div>

              {/* Employees List */}
              <div className="divide-y divide-border-default max-h-[180px] overflow-y-auto border border-border-default rounded-lg bg-surface">
                {filteredEmployees.length === 0 ? (
                  <div className="py-4 text-center text-text-muted text-xs">
                    Tidak ada karyawan ditemukan.
                  </div>
                ) : (
                  filteredEmployees.map((emp: any) => {
                    const isSelected = formData.target_employee_ids.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            target_employee_ids: isSelected 
                              ? prev.target_employee_ids.filter(id => id !== emp.id)
                              : [...prev.target_employee_ids, emp.id]
                          }));
                        }}
                        className={`p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary-soft/40' : 'hover:bg-subtle'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-border-default"
                          />
                          <div className="min-w-0 text-xs">
                            <p className="font-semibold text-text-primary truncate">
                              {emp.first_name} {emp.last_name}
                            </p>
                            <p className="text-[11px] text-text-muted truncate">
                              {emp.current_assignment?.department?.name || 'Umum'} • {emp.employee_id}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[11px] font-semibold ${isSelected ? 'text-primary' : 'text-text-muted'}`}>
                          {isSelected ? 'Terpilih' : '+ Pilih'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Pesan Notifikasi */}
          <div>
            <label className="block text-label font-medium text-text-primary mb-1">
              Isi Pesan Notifikasi <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Tuliskan isi pesan pengumuman atau informasi lengkap di sini..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 text-body rounded-lg border border-border-default focus:border-primary focus:ring-1 focus:ring-primary bg-page resize-y"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex justify-end gap-2.5 border-t border-border-default">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              {isSubmitting ? 'Mengirimkan Siaran...' : 'Siarkan Notifikasi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

