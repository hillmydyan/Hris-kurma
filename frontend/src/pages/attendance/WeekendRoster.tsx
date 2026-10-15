import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import api from '../../lib/api';

export function WeekendRoster() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [rosterData, setRosterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingTargetDay, setSavingTargetDay] = useState<'saturday' | 'sunday' | null>(null);
  const [filterPattern, setFilterPattern] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Helper: Format tanggal Indonesia (misal: "17 Okt 2026")
  const formatDateIndo = (dateOrStr: Date | string, options?: Intl.DateTimeFormatOptions) => {
    if (!dateOrStr) return '-';
    const d = typeof dateOrStr === 'string' ? new Date(dateOrStr) : dateOrStr;
    return new Intl.DateTimeFormat('id-ID', options || {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  };

  // Helper: Format label pekan (misal: "Pekan 12–18 Okt 2026")
  const getWeekRangeLabel = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const monDay = monday.getDate();
    const sunDay = sunday.getDate();
    const monMonth = monday.toLocaleDateString('id-ID', { month: 'short' });
    const sunMonth = sunday.toLocaleDateString('id-ID', { month: 'short' });
    const year = sunday.getFullYear();

    if (monday.getMonth() === sunday.getMonth()) {
      return `Pekan ${monDay}–${sunDay} ${sunMonth} ${year}`;
    }
    return `Pekan ${monDay} ${monMonth} – ${sunDay} ${sunMonth} ${year}`;
  };

  // Calculate Monday date string for current selected week
  const getMondayDateStr = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const fetchRoster = async (targetDate: Date) => {
    setLoading(true);
    const mondayStr = getMondayDateStr(targetDate);
    try {
      const response = await api.get(`/weekend-schedules?week_start=${mondayStr}`);
      setRosterData(response.data);
    } catch (error) {
      console.error('Error fetching weekend roster:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster(currentDate);
  }, [currentDate]);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleThisWeek = () => {
    setCurrentDate(new Date());
  };

  // Change workday assignment for rotating employee for this week
  const handleChangeWorkday = async (empId: number, assignedWorkday: 'saturday' | 'sunday') => {
    if (!rosterData?.week_start_date) return;
    setSavingId(empId);
    setSavingTargetDay(assignedWorkday);
    try {
      const response = await api.post('/weekend-schedules', {
        employee_id: empId,
        week_start_date: rosterData.week_start_date,
        assigned_workday: assignedWorkday,
      });

      const nextDay = assignedWorkday === 'saturday' ? 'sunday' : 'saturday';

      // Optimistic update
      setRosterData((prev: any) => {
        if (!prev) return prev;
        const updatedList = prev.roster.map((item: any) => {
          if (item.employee_id === empId) {
            return {
              ...item,
              assigned_workday: assignedWorkday,
              off_workday: assignedWorkday === 'saturday' ? 'sunday' : 'saturday',
              has_custom_schedule: false,
              is_auto_rotating: true,
              next_week_workday: nextDay,
            };
          }
          return item;
        });

        const satCount = updatedList.filter((i: any) => i.assigned_workday === 'saturday').length;
        const sunCount = updatedList.filter((i: any) => i.assigned_workday === 'sunday').length;

        return {
          ...prev,
          counts: {
            ...prev.counts,
            saturday_workers: satCount,
            sunday_workers: sunCount,
          },
          roster: updatedList,
        };
      });

      const dayLabel = assignedWorkday === 'saturday' ? 'Sabtu' : 'Minggu';
      const nextDayLabel = assignedWorkday === 'saturday' ? 'Minggu' : 'Sabtu';
      setFeedback({ 
        type: 'success', 
        message: response.data?.message || `Jadwal diatur: Masuk ${dayLabel} pekan ini, otomatis pekan depan masuk ${nextDayLabel}.` 
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (error: any) {
      setFeedback({ 
        type: 'error', 
        message: error.response?.data?.error || 'Gagal mengubah jadwal kerja akhir pekan.' 
      });
      fetchRoster(currentDate);
    } finally {
      setSavingId(null);
      setSavingTargetDay(null);
    }
  };

  // Change employee general pattern (saturday_fixed, sunday_fixed, rotating)
  const handleChangePattern = async (empId: number, newPattern: string) => {
    try {
      await api.post(`/employees/${empId}/weekend-pattern`, {
        weekend_pattern: newPattern
      });
      setFeedback({ type: 'success', message: 'Pola default karyawan berhasil diperbarui.' });
      setTimeout(() => setFeedback(null), 3000);
      fetchRoster(currentDate);
    } catch (error: any) {
      setFeedback({ 
        type: 'error', 
        message: error.response?.data?.error || 'Gagal memperbarui pola jadwal.' 
      });
    }
  };

  const rosterList = rosterData?.roster || [];
  const filteredRoster = rosterList.filter((item: any) => {
    const matchesFilter = filterPattern === 'all' || item.weekend_pattern === filterPattern;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const saturdayFormatted = rosterData?.saturday_date 
    ? formatDateIndo(rosterData.saturday_date, { day: 'numeric', month: 'short' })
    : '17 Okt';
  const sundayFormatted = rosterData?.sunday_date 
    ? formatDateIndo(rosterData.sunday_date, { day: 'numeric', month: 'short' })
    : '18 Okt';

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman & Navigasi Pekan Ringkas Satu Baris */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Roster Akhir Pekan
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Atur siapa masuk Sabtu atau Minggu. Untuk pola rotasi, sistem otomatis bergantian setiap pekan (Sabtu ➔ Minggu ➔ Sabtu ➔ Minggu).
          </p>
        </div>

        {/* Kontrol Navigasi Pekan Satu Baris */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center rounded-md border border-border-default bg-surface shadow-xs">
            <button 
              type="button" 
              onClick={handlePrevWeek}
              aria-label="Pekan sebelumnya"
              className="p-2 hover:bg-subtle text-text-secondary transition-colors rounded-l-md min-w-[36px] min-h-[36px] flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-text-primary whitespace-nowrap tabular-nums">
              {getWeekRangeLabel(currentDate)}
            </span>
            <button 
              type="button" 
              onClick={handleNextWeek}
              aria-label="Pekan berikutnya"
              className="p-2 hover:bg-subtle text-text-secondary transition-colors rounded-r-md min-w-[36px] min-h-[36px] flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleThisWeek}
            className="h-9 text-xs whitespace-nowrap font-medium"
          >
            Pekan Ini
          </Button>
        </div>
      </div>

      {/* Pesan Feedback Sukses/Gagal */}
      {feedback && (
        <div className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-success-bg text-success-fg border border-success-bg' 
            : 'bg-danger-bg text-danger-fg border border-danger-bg'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success-fg" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-danger-fg" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)} 
            aria-label="Tutup pesan" 
            className="p-1 rounded hover:opacity-75 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Ringkasan Pekan: Dua Kartu Bersih Berdampingan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-muted">
                Sabtu, {saturdayFormatted}
              </p>
              <div className="text-2xl font-bold text-text-primary tracking-tight tabular-nums mt-0.5">
                {rosterData?.counts?.saturday_workers ?? 0} <span className="text-sm font-normal text-text-muted">orang masuk</span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Minggu libur, tidak perlu absen
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-muted">
                Minggu, {sundayFormatted}
              </p>
              <div className="text-2xl font-bold text-text-primary tracking-tight tabular-nums mt-0.5">
                {rosterData?.counts?.sunday_workers ?? 0} <span className="text-sm font-normal text-text-muted">orang masuk</span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Sabtu libur, tidak perlu absen
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Tabel Roster Card */}
      <Card className="overflow-hidden">
        {/* Pencarian dan Filter Sejajar Satu Baris */}
        <div className="p-4 border-b border-border-default flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Cari nama atau NIK..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-md border bg-surface text-text-primary border-border-input text-xs w-full focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={filterPattern}
            onChange={(e) => setFilterPattern(e.target.value)}
            className="h-9 px-3 rounded-md border bg-surface text-text-primary border-border-input text-xs w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            <option value="all">Semua Pola ({rosterList.length})</option>
            <option value="rotating">Rotasi Otomatis Saja</option>
            <option value="saturday_fixed">Tetap Masuk Sabtu</option>
            <option value="sunday_fixed">Tetap Masuk Minggu</option>
          </select>
        </div>

        {/* Tabel Tiga Kolom (Tampilan Layar Lebar >= 1024px) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-subtle z-10 border-b border-border-default">
              <tr className="text-text-muted text-xs font-semibold">
                <th className="px-5 py-3 font-semibold">Karyawan</th>
                <th className="px-5 py-3 font-semibold w-48">Pola Jadwal</th>
                <th className="px-5 py-3 font-semibold w-72">Masuk Akhir Pekan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                    <p className="text-xs">Memuat data roster akhir pekan...</p>
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-text-muted text-xs">
                    Tidak ada karyawan yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((item: any) => {
                  const isLocked = item.weekend_pattern !== 'rotating';
                  const isSaving = savingId === item.employee_id;

                  return (
                    <tr 
                      key={item.employee_id} 
                      className="hover:bg-subtle/60 transition-colors"
                      style={{ height: '64px' }}
                    >
                      {/* Kolom 1: Karyawan */}
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-subtle text-text-secondary border border-border-default flex items-center justify-center text-xs font-semibold shrink-0">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-text-primary text-xs truncate leading-tight">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-text-muted truncate leading-tight mt-0.5">
                              {item.employee_code} • {item.department} • {item.job_position}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: Pola Jadwal */}
                      <td className="px-5 py-2.5">
                        <select
                          value={item.weekend_pattern}
                          onChange={(e) => handleChangePattern(item.employee_id, e.target.value)}
                          className="h-8 px-2.5 rounded-md border border-border-default bg-surface text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-[170px]"
                        >
                          <option value="rotating">Rotasi Otomatis</option>
                          <option value="saturday_fixed">Tetap Sabtu</option>
                          <option value="sunday_fixed">Tetap Minggu</option>
                        </select>
                      </td>

                      {/* Kolom 3: Masuk Akhir Pekan (Kontrol Dua Segmen [Sabtu | Minggu]) */}
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2">
                            <div 
                              role="group" 
                              aria-label={`Jadwal akhir pekan untuk ${item.name}`}
                              className="inline-flex p-0.5 rounded-md bg-subtle border border-border-default"
                            >
                              <button
                                type="button"
                                disabled={isLocked || isSaving}
                                onClick={() => handleChangeWorkday(item.employee_id, 'saturday')}
                                aria-pressed={item.assigned_workday === 'saturday'}
                                className={`px-3 py-1.5 text-xs rounded transition-all min-h-[32px] font-medium flex items-center justify-center ${
                                  item.assigned_workday === 'saturday'
                                    ? 'bg-primary text-white font-semibold shadow-xs'
                                    : isLocked 
                                      ? 'text-text-muted hover:text-text-muted cursor-not-allowed opacity-60'
                                      : 'text-text-secondary hover:text-text-primary'
                                }`}
                              >
                                {isSaving && savingTargetDay === 'saturday' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                ) : null}
                                Sabtu
                              </button>
                              <button
                                type="button"
                                disabled={isLocked || isSaving}
                                onClick={() => handleChangeWorkday(item.employee_id, 'sunday')}
                                aria-pressed={item.assigned_workday === 'sunday'}
                                className={`px-3 py-1.5 text-xs rounded transition-all min-h-[32px] font-medium flex items-center justify-center ${
                                  item.assigned_workday === 'sunday'
                                    ? 'bg-primary text-white font-semibold shadow-xs'
                                    : isLocked 
                                      ? 'text-text-muted hover:text-text-muted cursor-not-allowed opacity-60'
                                      : 'text-text-secondary hover:text-text-primary'
                                }`}
                              >
                                {isSaving && savingTargetDay === 'sunday' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                ) : null}
                                Minggu
                              </button>
                            </div>

                            {item.weekend_pattern === 'rotating' && (
                              <Badge 
                                variant={item.has_custom_schedule ? 'primary' : 'neutral'} 
                                className="text-[10px] px-1.5 py-0.5"
                              >
                                {item.has_custom_schedule ? 'Kustom' : 'Bergantian'}
                              </Badge>
                            )}
                          </div>

                          <span className="text-[11px] text-text-muted">
                            {isLocked ? (
                              item.assigned_workday === 'saturday' 
                                ? 'Pola tetap masuk Sabtu (Minggu libur)' 
                                : 'Pola tetap masuk Minggu (Sabtu libur)'
                            ) : item.weekend_pattern === 'rotating' ? (
                              `Pekan ini: Masuk ${item.assigned_workday === 'saturday' ? 'Sabtu' : 'Minggu'} • Pekan depan: Masuk ${item.next_week_workday === 'saturday' ? 'Sabtu' : 'Minggu'}`
                            ) : item.assigned_workday === 'saturday' ? (
                              'Libur Minggu, tidak perlu absen'
                            ) : (
                              'Libur Sabtu, tidak perlu absen'
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Tampilan Daftar Kartu di Layar < 1024px */}
        <div className="block lg:hidden divide-y divide-border-default">
          {loading ? (
            <div className="py-10 text-center text-text-muted">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
              <p className="text-xs">Memuat data roster akhir pekan...</p>
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs">
              Tidak ada karyawan yang cocok dengan filter atau pencarian.
            </div>
          ) : (
            filteredRoster.map((item: any) => {
              const isLocked = item.weekend_pattern !== 'rotating';
              const isSaving = savingId === item.employee_id;

              return (
                <div key={item.employee_id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-subtle text-text-secondary border border-border-default flex items-center justify-center text-xs font-semibold shrink-0">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-text-muted truncate mt-0.5">
                          {item.employee_code} • {item.department} • {item.job_position}
                        </p>
                      </div>
                    </div>
                    {item.weekend_pattern === 'rotating' && (
                      <Badge 
                        variant={item.has_custom_schedule ? 'primary' : 'neutral'} 
                        className="text-[10px] shrink-0"
                      >
                        {item.has_custom_schedule ? 'Kustom' : 'Bergantian'}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                        Pola Jadwal
                      </label>
                      <select
                        value={item.weekend_pattern}
                        onChange={(e) => handleChangePattern(item.employee_id, e.target.value)}
                        className="h-9 px-2.5 rounded-md border border-border-default bg-surface text-xs font-medium text-text-primary w-full focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="rotating">Rotasi Otomatis</option>
                        <option value="saturday_fixed">Tetap Masuk Sabtu</option>
                        <option value="sunday_fixed">Tetap Masuk Minggu</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1">
                        Masuk Akhir Pekan
                      </label>
                      <div 
                        role="group" 
                        aria-label={`Jadwal akhir pekan untuk ${item.name}`}
                        className="grid grid-cols-2 p-0.5 rounded-md bg-subtle border border-border-default"
                      >
                        <button
                          type="button"
                          disabled={isLocked || isSaving}
                          onClick={() => handleChangeWorkday(item.employee_id, 'saturday')}
                          aria-pressed={item.assigned_workday === 'saturday'}
                          className={`py-1.5 text-xs rounded transition-all min-h-[36px] font-medium flex items-center justify-center ${
                            item.assigned_workday === 'saturday'
                              ? 'bg-primary text-white font-semibold shadow-xs'
                              : isLocked 
                                ? 'text-text-muted hover:text-text-muted cursor-not-allowed opacity-60'
                                : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {isSaving && savingTargetDay === 'saturday' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : null}
                          Sabtu
                        </button>
                        <button
                          type="button"
                          disabled={isLocked || isSaving}
                          onClick={() => handleChangeWorkday(item.employee_id, 'sunday')}
                          aria-pressed={item.assigned_workday === 'sunday'}
                          className={`py-1.5 text-xs rounded transition-all min-h-[36px] font-medium flex items-center justify-center ${
                            item.assigned_workday === 'sunday'
                              ? 'bg-primary text-white font-semibold shadow-xs'
                              : isLocked 
                                ? 'text-text-muted hover:text-text-muted cursor-not-allowed opacity-60'
                                : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {isSaving && savingTargetDay === 'sunday' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : null}
                          Minggu
                        </button>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">
                        {isLocked ? (
                          item.assigned_workday === 'saturday' ? 'Pola tetap masuk Sabtu' : 'Pola tetap masuk Minggu'
                        ) : item.weekend_pattern === 'rotating' ? (
                          `Pekan ini: Masuk ${item.assigned_workday === 'saturday' ? 'Sabtu' : 'Minggu'} • Pekan depan: Masuk ${item.next_week_workday === 'saturday' ? 'Sabtu' : 'Minggu'}`
                        ) : item.assigned_workday === 'saturday' ? (
                          'Libur Minggu, tidak perlu absen'
                        ) : (
                          'Libur Sabtu, tidak perlu absen'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
