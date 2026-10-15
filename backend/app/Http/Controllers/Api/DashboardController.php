<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Leave;
use App\Models\AttendanceCorrection;
use App\Models\WorkdaySwap;
use App\Models\DailyReport;
use App\Models\Setting;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Mengambil ringkasan data real-time untuk Dashboard Eksekutif/Manajemen.
     */
    public function overview(Request $request)
    {
        $today = Carbon::today()->toDateString();

        // 1. Kehadiran Tim Hari Ini
        $todayAttendancesQuery = Attendance::with([
            'employee.currentAssignment.department',
            'employee.currentAssignment.jobPosition'
        ])
        ->where('date', $today)
        ->latest('time_in')
        ->latest('created_at');

        $todayAttendances = $todayAttendancesQuery->limit(10)->get();
        $isTodayData = $todayAttendances->isNotEmpty();

        // Jika hari ini belum ada karyawan yang absen, ambil data absensi terkini agar widget tetap informatif
        $displayAttendances = $isTodayData 
            ? $todayAttendances 
            : Attendance::with([
                'employee.currentAssignment.department',
                'employee.currentAssignment.jobPosition'
            ])
            ->latest('date')
            ->latest('time_in')
            ->latest('created_at')
            ->limit(6)
            ->get();

        $formattedAttendances = $displayAttendances->map(function ($att) {
            $emp = $att->employee;
            $deptName = $emp?->currentAssignment?->department?->name ?? 'Operasional';
            $fullName = $emp?->full_name ?? ($emp?->first_name ?? 'Karyawan');
            
            // Format inisial nama
            $words = explode(' ', trim($fullName));
            $initials = strtoupper(substr($words[0] ?? '', 0, 1) . (isset($words[1]) ? substr($words[1], 0, 1) : ''));

            return [
                'id' => $att->id,
                'employee_id' => $att->employee_id,
                'employee_name' => $fullName,
                'department_name' => $deptName,
                'initials' => $initials ?: 'K',
                'status' => $att->status, // present, late, absent, leave, half_day
                'date' => $att->date,
                'time_in' => $att->time_in ? Carbon::parse($att->time_in)->format('H:i') : '-',
                'time_out' => $att->time_out ? Carbon::parse($att->time_out)->format('H:i') : '-',
                'notes' => $att->notes,
            ];
        });

        // 2. Persetujuan Menunggu (Pending Approvals: Cuti/Izin, Koreksi Absensi, Tukar Hari)
        $leaveTypeLabels = [
            'sick' => 'Izin Sakit',
            'annual' => 'Cuti Tahunan',
            'family' => 'Izin Keluarga',
            'event' => 'Acara Keluarga',
            'urgent' => 'Keperluan Mendesak',
            'unpaid' => 'Cuti Tanpa Gaji',
            'maternity' => 'Cuti Melahirkan',
            'other' => 'Izin Lainnya',
        ];

        $pendingLeaves = Leave::with('employee')
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($l) use ($leaveTypeLabels) {
                $typeLabel = $leaveTypeLabels[$l->type] ?? ucfirst($l->type);
                $empName = $l->employee?->full_name ?? ($l->employee?->first_name ?? 'Karyawan');
                
                $start = Carbon::parse($l->start_date);
                $end = Carbon::parse($l->end_date);
                $days = $start->diffInDays($end) + 1;
                $dateStr = $start->format('d M Y');
                if ($l->start_date !== $l->end_date) {
                    $dateStr .= ' - ' . $end->format('d M Y') . " ({$days} Hari)";
                }

                return [
                    'id' => $l->id,
                    'category' => 'leave',
                    'title' => "{$typeLabel} - {$empName}",
                    'subtitle' => $dateStr . ($l->reason ? " • {$l->reason}" : ''),
                    'created_at' => $l->created_at,
                    'link' => '/admin/persetujuan',
                ];
            });

        $pendingCorrections = AttendanceCorrection::with('employee')
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($c) {
                $empName = $c->employee?->full_name ?? ($c->employee?->first_name ?? 'Karyawan');
                $dateStr = Carbon::parse($c->date)->format('d M Y');
                $reasonStr = $c->reason ?: 'Koreksi Jam Kerja';

                return [
                    'id' => $c->id,
                    'category' => 'correction',
                    'title' => "Koreksi Absensi - {$empName}",
                    'subtitle' => "{$dateStr} • {$reasonStr}",
                    'created_at' => $c->created_at,
                    'link' => '/admin/persetujuan',
                ];
            });

        $pendingSwaps = WorkdaySwap::with('employee')
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($s) {
                $empName = $s->employee?->full_name ?? ($s->employee?->first_name ?? 'Karyawan');
                $orig = Carbon::parse($s->original_date)->format('d M');
                $repl = Carbon::parse($s->replacement_date)->format('d M Y');
                $reasonStr = $s->reason ?: 'Tukar Jadwal Libur';

                return [
                    'id' => $s->id,
                    'category' => 'swap',
                    'title' => "Tukar Hari - {$empName}",
                    'subtitle' => "{$orig} ➔ {$repl} • {$reasonStr}",
                    'created_at' => $s->created_at,
                    'link' => '/admin/persetujuan',
                ];
            });

        $allPending = collect($pendingLeaves)
            ->merge($pendingCorrections)
            ->merge($pendingSwaps)
            ->sortByDesc('created_at')
            ->values()
            ->take(6);

        $countLeaves = Leave::where('status', 'pending')->count();
        $countCorrections = AttendanceCorrection::where('status', 'pending')->count();
        $countSwaps = WorkdaySwap::where('status', 'pending')->count();
        $totalPending = $countLeaves + $countCorrections + $countSwaps;

        // 3. Statistik Ringkas Header Eksekutif
        $totalActiveEmployees = Employee::where('status', 'active')->count();
        $presentTodayCount = Attendance::where('date', $today)->whereIn('status', ['present', 'late'])->count();
        $lateTodayCount = Attendance::where('date', $today)->where('status', 'late')->count();
        $leaveTodayCount = Attendance::where('date', $today)->where('status', 'leave')->count();

        // Hitung pengajuan cuti/izin yang sedang aktif hari ini (walaupun belum terdata di attendance)
        $leavesActiveToday = Leave::where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->count();

        $effectiveLeavesCount = max($leaveTodayCount, $leavesActiveToday);

        // Daily report hari ini
        $submittedReportsCount = DailyReport::where('report_date', $today)
            ->whereIn('status', ['submitted', 'reviewed'])
            ->count();

        $mealAllowance = Setting::where('key', 'meal_allowance')->value('value') ?? '11000';
        $toleranceMinutes = Setting::where('key', 'attendance_tolerance_minutes')->value('value') ?? '15';
        $workStartTime = Setting::where('key', 'work_start_time')->value('value') ?? '08:00';
        $workEndTime = Setting::where('key', 'work_end_time')->value('value') ?? '16:00';
        $maxOntimeTolerance = Setting::where('key', 'max_ontime_tolerance')->value('value') ?? '08:15:00';

        $attendanceRate = $totalActiveEmployees > 0 
            ? round(($presentTodayCount / $totalActiveEmployees) * 100, 1) 
            : 0;

        return response()->json([
            'today' => $today,
            'is_today_data' => $isTodayData,
            'today_attendances' => $formattedAttendances,
            'pending_approvals' => $allPending,
            'total_pending' => $totalPending,
            'pending_breakdown' => [
                'leaves' => $countLeaves,
                'corrections' => $countCorrections,
                'swaps' => $countSwaps,
            ],
            'stats' => [
                'total_active_employees' => $totalActiveEmployees,
                'present_today' => $presentTodayCount,
                'late_today' => $lateTodayCount,
                'on_leave_today' => $effectiveLeavesCount,
                'attendance_rate' => $attendanceRate,
                'daily_reports_submitted' => $submittedReportsCount,
                'daily_reports_total' => $totalActiveEmployees,
                'meal_allowance' => (int) $mealAllowance,
                'tolerance_minutes' => (int) $toleranceMinutes,
                'work_start_time' => $workStartTime,
                'work_end_time' => $workEndTime,
                'max_ontime_tolerance' => $maxOntimeTolerance,
            ]
        ]);
    }
}
