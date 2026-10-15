<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WeekendSchedule;
use App\Models\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class WeekendScheduleController extends Controller
{
    /**
     * Get weekend schedule roster for a specific week.
     */
    public function index(Request $request)
    {
        // Monday of the requested week
        $weekStartParam = $request->query('week_start');
        $weekStart = $weekStartParam ? Carbon::parse($weekStartParam)->startOfWeek() : Carbon::now()->startOfWeek();
        $weekStartStr = $weekStart->toDateString();
        $saturdayDate = $weekStart->copy()->addDays(5)->toDateString();
        $sundayDate = $weekStart->copy()->addDays(6)->toDateString();

        $employees = Employee::with([
            'currentAssignment.department',
            'currentAssignment.jobPosition',
            'weekendSchedules' => function ($q) use ($weekStartStr) {
                $q->where('week_start_date', $weekStartStr);
            }
        ])->where('status', 'active')->get();

        $roster = $employees->map(function ($emp) use ($weekStartStr, $saturdayDate, $sundayDate) {
            $scheduleInfo = $emp->getWeekendScheduleForWeek($weekStartStr);

            return [
                'employee_id' => $emp->id,
                'employee_code' => $emp->employee_id,
                'name' => $emp->full_name,
                'department' => $emp->currentAssignment?->department?->name ?? 'Umum',
                'job_position' => $emp->currentAssignment?->jobPosition?->name ?? 'Staff',
                'weekend_pattern' => $emp->weekend_pattern ?? 'saturday_fixed',
                'week_start_date' => $weekStartStr,
                'assigned_workday' => $scheduleInfo['assigned_workday'],
                'off_workday' => $scheduleInfo['off_workday'],
                'saturday_date' => $saturdayDate,
                'sunday_date' => $sundayDate,
                'has_custom_schedule' => $scheduleInfo['has_custom_schedule'],
                'is_auto_rotating' => $scheduleInfo['is_auto_rotating'] ?? false,
                'next_week_workday' => $scheduleInfo['next_week_workday'] ?? null,
                'rotating_start_workday' => $emp->rotating_start_workday,
                'rotating_start_week' => $emp->rotating_start_week,
            ];
        });

        // Summary counts
        $saturdayWorkers = $roster->where('assigned_workday', 'saturday')->count();
        $sundayWorkers = $roster->where('assigned_workday', 'sunday')->count();

        return response()->json([
            'week_start_date' => $weekStartStr,
            'week_label' => 'Minggu ' . $weekStart->translatedFormat('d M Y') . ' s/d ' . $weekStart->copy()->addDays(6)->translatedFormat('d M Y'),
            'saturday_date' => $saturdayDate,
            'sunday_date' => $sundayDate,
            'counts' => [
                'total_employees' => $employees->count(),
                'saturday_workers' => $saturdayWorkers,
                'sunday_workers' => $sundayWorkers,
            ],
            'roster' => $roster,
        ]);
    }

    /**
     * Set rotating schedule for one employee.
     * Untuk karyawan 'rotating', ini akan menetapkan titik acuan rotasi otomatis bergantian mulai pekan ini.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'week_start_date' => 'required|date',
            'assigned_workday' => 'required|in:saturday,sunday',
            'notes' => 'nullable|string|max:255',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $weekStart = Carbon::parse($validated['week_start_date'])->startOfWeek()->toDateString();
        $targetDay = $validated['assigned_workday'];

        // Jika karyawan berpola 'rotating':
        // Menentukan jadwal ini akan menjadi acuan rotasi otomatis baru mulai pekan ini!
        if ($employee->weekend_pattern === 'rotating') {
            $employee->update([
                'rotating_start_workday' => $targetDay,
                'rotating_start_week' => $weekStart,
            ]);

            // Hapus manual override pekan ini agar bersih mengikuti acuan baru
            WeekendSchedule::where('employee_id', $employee->id)
                ->where('week_start_date', $weekStart)
                ->delete();

            $dayLabel = $targetDay === 'saturday' ? 'Sabtu' : 'Minggu';
            $nextDayLabel = $targetDay === 'saturday' ? 'Minggu' : 'Sabtu';

            return response()->json([
                'message' => "Jadwal rotasi diatur: Mulai pekan ini masuk {$dayLabel}, dan otomatis pekan depan masuk {$nextDayLabel}.",
                'schedule' => $employee->getWeekendScheduleForWeek($weekStart),
            ]);
        }

        // Untuk pola non-rotating (jika ada override)
        $schedule = WeekendSchedule::updateOrCreate(
            [
                'employee_id' => $validated['employee_id'],
                'week_start_date' => $weekStart,
            ],
            [
                'assigned_workday' => $targetDay,
                'created_by' => $request->user()?->id,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Jadwal akhir pekan berhasil disimpan.',
            'schedule' => $schedule
        ]);
    }

    /**
     * Bulk save weekend assignments for a week.
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'week_start_date' => 'required|date',
            'assignments' => 'required|array',
            'assignments.*.employee_id' => 'required|exists:employees,id',
            'assignments.*.assigned_workday' => 'required|in:saturday,sunday',
        ]);

        $weekStart = Carbon::parse($validated['week_start_date'])->startOfWeek()->toDateString();
        $userId = $request->user()?->id;

        DB::beginTransaction();
        try {
            foreach ($validated['assignments'] as $item) {
                $employee = Employee::find($item['employee_id']);
                if ($employee && $employee->weekend_pattern === 'rotating') {
                    $employee->update([
                        'rotating_start_workday' => $item['assigned_workday'],
                        'rotating_start_week' => $weekStart,
                    ]);
                    WeekendSchedule::where('employee_id', $employee->id)
                        ->where('week_start_date', $weekStart)
                        ->delete();
                } else {
                    WeekendSchedule::updateOrCreate(
                        [
                            'employee_id' => $item['employee_id'],
                            'week_start_date' => $weekStart,
                        ],
                        [
                            'assigned_workday' => $item['assigned_workday'],
                            'created_by' => $userId,
                        ]
                    );
                }
            }
            DB::commit();

            return response()->json(['message' => 'Semua jadwal akhir pekan berhasil disimpan dan disinkronkan.']);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Gagal menyimpan jadwal: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update employee default weekend pattern.
     */
    public function updatePattern(Request $request, string $employeeId)
    {
        $validated = $request->validate([
            'weekend_pattern' => 'required|in:saturday_fixed,sunday_fixed,rotating',
            'starting_workday' => 'nullable|in:saturday,sunday',
            'week_start_date' => 'nullable|date',
        ]);

        $employee = Employee::findOrFail($employeeId);
        $updateData = ['weekend_pattern' => $validated['weekend_pattern']];

        if ($validated['weekend_pattern'] === 'rotating') {
            $weekStart = !empty($validated['week_start_date'])
                ? Carbon::parse($validated['week_start_date'])->startOfWeek()->toDateString()
                : Carbon::now()->startOfWeek()->toDateString();

            $updateData['rotating_start_workday'] = $validated['starting_workday'] ?? 'saturday';
            $updateData['rotating_start_week'] = $weekStart;
        }

        $employee->update($updateData);

        return response()->json([
            'message' => "Pola jadwal akhir pekan untuk {$employee->full_name} berhasil diperbarui.",
            'weekend_pattern' => $employee->weekend_pattern,
            'rotating_start_workday' => $employee->rotating_start_workday,
            'rotating_start_week' => $employee->rotating_start_week,
        ]);
    }
}
