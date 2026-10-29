import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Check, 
  Info,
  User,
  RotateCcw,
  Wallet
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth, isHrOrExecutive } from '../../context/AuthContext';
import { getLocalDateString } from '../../utils/date';
import { formatRupiah } from '../../utils/slipGenerator';

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_HEADER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

interface AttendanceRecord {
  id?: number;
  employee_id: number;
  date: string;
  status: 'present' | 'late' | 'leave' | 'absent';
  notes?: string | null;
  time_in?: string | null;
  time_out?: string | null;
}

export interface AttendanceCorrectionCalendarProps {
  initialEmployeeId?: number | string;
  onCorrectionSaved?: (updatedRecord?: any) => void;
  hideHeader?: boolean;
}

export function AttendanceCorrectionCalendar({
  initialEmployeeId,
  onCorrectionSaved,
  hideHeader = false
}: AttendanceCorrectionCalendarProps = {}) {
  const { user } = useAuth();
  const isAuthorized = isHrOrExecutive(user);

  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | string>(initialEmployeeId || '');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Navigasi Bulan: Default Bulan Berjalan
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (0 = Januari, 9 = Oktober)

  const [attendancesMap, setAttendancesMap] = useState<Record<string, AttendanceRecord>>({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State untuk Edit Tanggal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    dateStr: string;
    formattedDate: string;
    currentRecord?: AttendanceRecord;
    selectedStatus: 'present' | 'late' | 'leave';
    notes: string;
    isSaving: boolean;
  }>({
    isOpen: false,
    dateStr: '',
    formattedDate: '',
    selectedStatus: 'present',
    notes: '',
    isSaving: false,
  });

  // Tampilkan toast selama 3.5 detik
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch Daftar Karyawan
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const res = await api.get('/employees');
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const activeList = list.filter((e: any) => e.status === 'active');
        setEmployees(activeList);
        if (activeList.length > 0) {
          const defaultId = initialEmployeeId || activeList[0].id;
          setSelectedEmployeeId(defaultId);
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [initialEmployeeId]);

  // Sync selected employee when prop initialEmployeeId changes
  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmployeeId(initialEmployeeId);
    }
  }, [initialEmployeeId]);

  // Fetch Data Absensi Bulanan untuk Karyawan Terpilih
  useEffect(() => {
    if (!selectedEmployeeId) return;

    const fetchMonthAttendance = async () => {
      setLoadingAttendance(true);
      try {
        const monthPad = String(month + 1).padStart(2, '0');
        const monthQuery = `${year}-${monthPad}`;
        const res = await api.get('/attendance', {
          params: {
            employee_id: selectedEmployeeId,
            month: monthQuery,
            per_page: 'all',
          },
        });

        const raw = res.data;
        const list: AttendanceRecord[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : [];

        const map: Record<string, AttendanceRecord> = {};
        list.forEach((item) => {
          if (item.date) {
            map[item.date] = item;
          }
        });
        setAttendancesMap(map);
      } catch (err) {
        console.error('Error fetching attendance for calendar:', err);
        setAttendancesMap({});
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchMonthAttendance();
  }, [selectedEmployeeId, year, month]);

  // Karyawan Terpilih
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => String(e.id) === String(selectedEmployeeId));
  }, [employees, selectedEmployeeId]);

  // Simulasi Perhitungan Gaji Berdasarkan Hasil Koreksi Absensi
  const salarySimulation = useMemo(() => {
    if (!selectedEmployee) return null;
    const basicSalary = Number(selectedEmployee.basic_salary || 0);
    const standardDays = 26;

    // Filter kehadiran di bulan ini
    const records = Object.values(attendancesMap);
    const presentDays = records.filter((r) => r.status === 'present' || r.status === 'late').length;
    const eligibleMealDays = records.filter((r) => r.status === 'present').length;
    const lateDays = records.filter((r) => r.status === 'late').length;
    const leaveDays = records.filter((r) => r.status === 'leave').length;

    const isProrated = Boolean(selectedEmployee.is_prorated);
    // Aturan Perusahaan: Izin TIDAK memotong gaji pokok, hanya memotong uang makan Rp 11.000
    const payableDays = Math.min(standardDays, presentDays + leaveDays);
    const earnedBasic = isProrated
      ? Math.round((payableDays / standardDays) * basicSalary)
      : basicSalary;
    const mealAllowance = eligibleMealDays * 11000;
    const totalSalary = earnedBasic + mealAllowance;

    return {
      presentDays,
      eligibleMealDays,
      lateDays,
      leaveDays,
      basicSalary,
      earnedBasic,
      mealAllowance,
      totalSalary,
      isProrated,
    };
  }, [selectedEmployee, attendancesMap]);

  // Filter Karyawan untuk dropdown pencarian
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const q = employeeSearch.toLowerCase();
    return employees.filter(
      (e) =>
        e.first_name.toLowerCase().includes(q) ||
        (e.last_name && e.last_name.toLowerCase().includes(q)) ||
        (e.employee_id && e.employee_id.toLowerCase().includes(q))
    );
  }, [employees, employeeSearch]);

  // Navigasi Bulan
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Helper format tanggal Indonesia
  const formatIndoDateTitle = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }).format(dateObj);
    } catch {
      return dateStr;
    }
  };

  // Klik Sel Tanggal
  const handleCellClick = (dateStr: string, isFuture: boolean) => {
    if (isFuture) return; // Tanggal lebih besar dari hari ini tidak bisa diklik

    const empName = selectedEmployee
      ? `${selectedEmployee.first_name} ${selectedEmployee.last_name || ''}`.trim()
      : 'Karyawan';

    const currentRecord = attendancesMap[dateStr];
    let defaultStatus: 'present' | 'late' | 'leave' = 'present';
    if (currentRecord?.status === 'late') defaultStatus = 'late';
    if (currentRecord?.status === 'leave') defaultStatus = 'leave';

    setModalState({
      isOpen: true,
      dateStr,
      formattedDate: `${empName} — ${formatIndoDateTitle(dateStr)}`,
      currentRecord,
      selectedStatus: defaultStatus,
      notes: currentRecord?.notes || '',
      isSaving: false,
    });
  };

  // Simpan Koreksi Absensi
  const handleSaveCorrection = async () => {
    if (!selectedEmployeeId || !modalState.dateStr) return;

    setModalState((prev) => ({ ...prev, isSaving: true }));

    try {
      const payload = {
        employee_id: selectedEmployeeId,
        date: modalState.dateStr,
        status: modalState.selectedStatus,
        notes: modalState.notes.trim() || undefined,
      };

      const res = await api.post('/attendance/correct', payload);

      // Perbarui state lokal secara langsung tanpa reload
      const updatedAttendance: AttendanceRecord = res.data?.data || {
        employee_id: Number(selectedEmployeeId),
        date: modalState.dateStr,
        status: modalState.selectedStatus,
        notes: modalState.notes,
      };

      setAttendancesMap((prev) => ({
        ...prev,
        [modalState.dateStr]: updatedAttendance,
      }));

      // Tutup modal & tampilkan toast
      setModalState((prev) => ({ ...prev, isOpen: false }));
      triggerToast('Absensi berhasil diperbarui. Gaji otomatis disesuaikan.');
      if (onCorrectionSaved) {
        onCorrectionSaved(updatedAttendance);
      }
    } catch (err: any) {
      console.error('Error saving attendance correction:', err);
      alert(err.response?.data?.error || err.response?.data?.message || 'Gagal menyimpan koreksi absensi.');
    } finally {
      setModalState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Tanggal Hari Ini (WIB)
  const todayStr = getLocalDateString();

  // Grid Generator (Senin - Minggu)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    // getDay() 0 = Minggu, 1 = Senin, dst.
    // Kita ubah agar 0 = Senin, ..., 6 = Minggu
    const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isFuture: boolean;
      isSunday: boolean;
    }> = [];

    // Hari dari bulan sebelumnya
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDateObj = new Date(year, month - 1, d);
      const prevYear = prevDateObj.getFullYear();
      const prevM = String(prevDateObj.getMonth() + 1).padStart(2, '0');
      const prevD = String(d).padStart(2, '0');
      const dStr = `${prevYear}-${prevM}-${prevD}`;
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isFuture: dStr > todayStr,
        isSunday: prevDateObj.getDay() === 0,
      });
    }

    // Hari dari bulan berjalan
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const curM = String(month + 1).padStart(2, '0');
      const curD = String(d).padStart(2, '0');
      const dStr = `${year}-${curM}-${curD}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isFuture: dStr > todayStr,
        isSunday: dayOfWeek === 0,
      });
    }

    // Hari dari bulan berikutnya untuk mengisi sisa baris grid (kelipatan 7)
    const remainder = cells.length % 7;
    if (remainder > 0) {
      const nextDaysNeeded = 7 - remainder;
      for (let d = 1; d <= nextDaysNeeded; d++) {
        const nextDateObj = new Date(year, month + 1, d);
        const nextYear = nextDateObj.getFullYear();
        const nextM = String(nextDateObj.getMonth() + 1).padStart(2, '0');
        const nextD = String(d).padStart(2, '0');
        const dStr = `${nextYear}-${nextM}-${nextD}`;
        cells.push({
          dateStr: dStr,
          dayNum: d,
          isCurrentMonth: false,
          isToday: dStr === todayStr,
          isFuture: dStr > todayStr,
          isSunday: nextDateObj.getDay() === 0,
        });
      }
    }

    return cells;
  }, [year, month, todayStr]);

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center bg-surface border border-border-default rounded-lg">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h2 className="text-base font-semibold text-text-primary">Akses Terbatas</h2>
        <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">
          Hanya role HR / Admin yang berwenang mengakses dan mengubah kalender koreksi absensi karyawan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Toast Notifikasi Sukses */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman (Hanya ditampilkan jika hideHeader false) */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Koreksi Absensi</h1>
            <p className="text-xs text-text-muted mt-0.5">
              Pantau dan sesuaikan status kehadiran karyawan per hari melalui tampilan kalender bulanan.
            </p>
          </div>
        </div>
      )}

      {/* Control Bar: Pilih Karyawan & Navigasi Bulan */}
      <Card className="border border-border-default shadow-xs bg-surface">
        <CardContent className="p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* 1. Pilih Karyawan */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 max-w-xl">
              <label htmlFor="select-employee" className="text-xs font-medium text-text-secondary whitespace-nowrap shrink-0">
                Pilih Karyawan:
              </label>
              <div className="relative flex-1">
                <select
                  id="select-employee"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  disabled={loadingEmployees}
                  className="w-full h-9 pl-3 pr-8 rounded-lg border border-border-default bg-surface text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary truncate"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name || ''} ({emp.employee_id} • {emp.current_assignment?.department?.name || 'Umum'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && (
                <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-border-default">
                  <Avatar
                    src={selectedEmployee.photo_url || selectedEmployee.photo}
                    name={`${selectedEmployee.first_name} ${selectedEmployee.last_name || ''}`}
                    idKey={selectedEmployee.id}
                    size="sm"
                  />
                  <div className="text-left leading-tight min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {selectedEmployee.first_name} {selectedEmployee.last_name || ''}
                    </p>
                    <p className="text-[10px] text-text-muted truncate">
                      {selectedEmployee.current_assignment?.job_position?.name || 'Staff'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Navigasi Bulan (Panah Kiri/Kanan + Nama Bulan & Tahun) */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCurrentMonth}
                className="h-9 px-2.5 text-xs font-medium text-text-secondary hover:text-text-primary"
                title="Kembali ke bulan berjalan saat ini"
              >
                Bulan Ini
              </Button>

              <div className="flex items-center gap-1 bg-subtle border border-border-default rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-md hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
                  title="Bulan sebelumnya"
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 text-xs font-semibold text-text-primary tabular-nums min-w-[130px] text-center select-none">
                  {INDO_MONTHS[month]} {year}
                </span>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-md hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
                  title="Bulan berikutnya"
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Banner Live Perhitungan Dampak Gaji Karyawan */}
          {salarySimulation && (
            <div className="pt-2.5 border-t border-border-default flex flex-wrap items-center justify-between gap-2.5 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">
                    Dampak Gaji ({INDO_MONTHS[month]} {year}):
                  </p>
                  <p className="text-[11px] text-text-muted">
                    Hadir: <strong className="text-emerald-700">{salarySimulation.presentDays} hari</strong> · Uang Makan: <strong className="text-emerald-700">{salarySimulation.eligibleMealDays} hari</strong>
                    {salarySimulation.lateDays > 0 && <span> · Telat: <strong className="text-amber-700">{salarySimulation.lateDays}</strong></span>}
                    {salarySimulation.leaveDays > 0 && <span> · Izin: <strong className="text-purple-700">{salarySimulation.leaveDays}</strong></span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs tabular-nums">
                <div>
                  <span className="text-[10px] text-text-muted block">Gaji Pokok</span>
                  <span className="font-semibold text-text-primary">{formatRupiah(salarySimulation.earnedBasic)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Uang Makan</span>
                  <span className="font-semibold text-text-primary">{formatRupiah(salarySimulation.mealAllowance)}</span>
                </div>
                <div className="pl-3 border-l border-indigo-200">
                  <span className="text-[10px] text-primary font-medium block">Total Diterima</span>
                  <span className="font-bold text-primary text-sm">{formatRupiah(salarySimulation.totalSalary)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid Kalender Bulanan */}
      <Card className="border border-border-default shadow-xs overflow-hidden bg-surface">
        <div className="p-3 sm:p-4">
          {/* Header Hari: Senin s/d Minggu */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-semibold text-text-secondary">
            {DAYS_HEADER.map((day, idx) => (
              <div 
                key={day} 
                className={`py-1.5 rounded-md text-[11px] sm:text-xs ${
                  idx === 6 ? 'text-rose-600 bg-rose-50/50' : 'bg-subtle/50'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Sel Kalender */}
          {loadingAttendance ? (
            <div className="py-24 text-center text-text-muted">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
              <p className="text-xs">Memuat data absensi kalender...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarCells.map((cell, idx) => {
                const record = attendancesMap[cell.dateStr];
                const status = record?.status;

                // Warna sel sesuai status absensi hari itu:
                // Hijau  = Hadir / Masuk
                // Kuning = Telat
                // Ungu   = Izin
                // Abu-abu muda / tanpa warna = tidak ada data (termasuk hari Minggu/libur)
                let statusClasses = 'bg-slate-50/70 border-border-default text-text-primary hover:border-slate-300';
                let badgeText = '';
                let badgeClass = '';

                if (status === 'present') {
                  statusClasses = 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100/70';
                  badgeText = 'Hadir';
                  badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                } else if (status === 'late') {
                  statusClasses = 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100/70';
                  badgeText = 'Telat';
                  badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                } else if (status === 'leave') {
                  statusClasses = 'bg-purple-50 border-purple-300 text-purple-950 hover:bg-purple-100/70';
                  badgeText = 'Izin';
                  badgeClass = 'bg-purple-100 text-purple-800 border-purple-300';
                }

                // Opasitas untuk bulan sebelum / sesudah
                const opacityClass = !cell.isCurrentMonth ? 'opacity-40' : '';

                // Tanggal lebih besar dari hari ini tidak bisa diklik (disabled)
                const disabledClass = cell.isFuture 
                  ? 'cursor-not-allowed opacity-35 bg-slate-100 border-dashed border-slate-200 hover:border-slate-200' 
                  : 'cursor-pointer hover:shadow-xs active:scale-[0.98] transition-all';

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => handleCellClick(cell.dateStr, cell.isFuture)}
                    className={`min-h-[72px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-lg border flex flex-col justify-between ${statusClasses} ${opacityClass} ${disabledClass}`}
                    title={
                      cell.isFuture 
                        ? 'Tanggal mendatang belum dapat dikoreksi' 
                        : `${cell.dateStr}: ${badgeText || 'Tidak ada data'} (Klik untuk koreksi)`
                    }
                  >
                    {/* Header Tanggal */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-bold tabular-nums ${
                          cell.isToday
                            ? 'w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] sm:text-xs shadow-xs'
                            : cell.isSunday
                            ? 'text-rose-600'
                            : 'text-text-primary'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Indikator Titik Status di Layar Sangat Kecil */}
                      {badgeText && (
                        <span className="sm:hidden w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              status === 'present'
                                ? '#10B981'
                                : status === 'late'
                                ? '#F59E0B'
                                : '#8B5CF6',
                          }}
                        />
                      )}
                    </div>

                    {/* Badge Status untuk Layar Sm ke Atas */}
                    <div className="mt-1 sm:mt-1.5">
                      {badgeText ? (
                        <span
                          className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeClass} truncate max-w-full`}
                        >
                          {badgeText}
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted hidden sm:inline-block">
                          -
                        </span>
                      )}

                      {/* Catatan Keterangan jika ada */}
                      {record?.notes && (
                        <p className="hidden sm:block text-[9px] text-text-muted truncate mt-0.5 leading-tight" title={record.notes}>
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legenda Warna di Bawah Kalender */}
          <div className="mt-4 pt-3.5 border-t border-border-default flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium text-text-secondary">Legenda Status:</span>
              
              {/* 1. Hijau = Hadir / Masuk */}
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-400 shrink-0" />
                <span className="text-text-secondary text-xs">Hadir / Masuk</span>
              </div>

              {/* 2. Kuning = Telat */}
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400 shrink-0" />
                <span className="text-text-secondary text-xs">Telat</span>
              </div>

              {/* 3. Ungu = Izin */}
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-purple-100 border border-purple-400 shrink-0" />
                <span className="text-text-secondary text-xs">Izin</span>
              </div>

              {/* 4. Abu-abu = Tanpa Data / Libur */}
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 shrink-0" />
                <span className="text-text-muted text-xs">Tanpa Data / Libur</span>
              </div>
            </div>

            <p className="text-[11px] text-text-muted">
              Klik tanggal untuk mengoreksi data absensi.
            </p>
          </div>
        </div>
      </Card>

      {/* MODAL POP UP KOREKSI TANGGAL */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => !modalState.isSaving && setModalState((prev) => ({ ...prev, isOpen: false }))}
        title="Koreksi Absensi Karyawan"
        size="md"
      >
        <div className="space-y-4 text-xs">
          {/* Judul: Nama Karyawan + Tanggal (Contoh: "Hartina — Senin, 13 Oktober 2026") */}
          <div className="p-3 bg-subtle rounded-lg border border-border-default">
            <p className="text-[11px] text-text-muted font-medium">Karyawan & Tanggal:</p>
            <h3 className="text-sm font-bold text-text-primary mt-0.5">
              {modalState.formattedDate}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-text-secondary">Status saat ini:</span>
              {modalState.currentRecord?.status === 'present' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Hadir
                </span>
              ) : modalState.currentRecord?.status === 'late' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Telat
                </span>
              ) : modalState.currentRecord?.status === 'leave' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                  Izin
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Tidak Ada Data
                </span>
              )}
            </div>
          </div>

          {/* 3 Pilihan Status Berupa Tombol / Radio: Hadir, Telat, Izin (Warna Mengikuti Status) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary block">
              Pilih Status Baru:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Tombol Hadir (Hijau) */}
              <button
                type="button"
                onClick={() => setModalState((prev) => ({ ...prev, selectedStatus: 'present' }))}
                className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  modalState.selectedStatus === 'present'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-200'
                    : 'bg-emerald-50/60 text-emerald-800 border-emerald-300 hover:bg-emerald-100/70'
                }`}
              >
                {modalState.selectedStatus === 'present' && <Check className="w-3.5 h-3.5 text-white" />}
                <span>Hadir</span>
              </button>

              {/* Tombol Telat (Kuning) */}
              <button
                type="button"
                onClick={() => setModalState((prev) => ({ ...prev, selectedStatus: 'late' }))}
                className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  modalState.selectedStatus === 'late'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-200'
                    : 'bg-amber-50/60 text-amber-800 border-amber-300 hover:bg-amber-100/70'
                }`}
              >
                {modalState.selectedStatus === 'late' && <Check className="w-3.5 h-3.5 text-white" />}
                <span>Telat</span>
              </button>

              {/* Tombol Izin (Ungu) */}
              <button
                type="button"
                onClick={() => setModalState((prev) => ({ ...prev, selectedStatus: 'leave' }))}
                className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  modalState.selectedStatus === 'leave'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs ring-2 ring-purple-200'
                    : 'bg-purple-50/60 text-purple-800 border-purple-300 hover:bg-purple-100/70'
                }`}
              >
                {modalState.selectedStatus === 'leave' && <Check className="w-3.5 h-3.5 text-white" />}
                <span>Izin</span>
              </button>
            </div>
          </div>

          {/* Kolom Keterangan (Opsional) */}
          <div className="space-y-1.5">
            <label htmlFor="correction-notes" className="text-xs font-semibold text-text-primary block">
              Keterangan <span className="text-text-muted font-normal">(Opsional):</span>
            </label>
            <textarea
              id="correction-notes"
              rows={3}
              value={modalState.notes}
              onChange={(e) => setModalState((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Contoh: Koreksi lupa scan masuk / penugasan dinas luar kota"
              className="w-full p-2.5 rounded-lg border border-border-default bg-surface text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-placeholder"
            />
          </div>

          {/* Tombol Simpan dan Batal */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-default">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
              disabled={modalState.isSaving}
              className="h-9 px-4 text-xs font-medium"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={modalState.isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              onClick={handleSaveCorrection}
              disabled={modalState.isSaving}
              className="h-9 px-4 text-xs font-medium"
            >
              {modalState.isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
export default AttendanceCorrectionCalendar;
