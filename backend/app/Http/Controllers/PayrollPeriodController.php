<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\WorkdaySwap;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PayrollPeriodController extends Controller
{
    const STANDARD_WORKING_DAYS = 26;
    const MEAL_RATE_PER_DAY = 11000;
    const MAX_ONTIME_TOLERANCE = '08:15:00'; // Maksimal toleransi kedatangan pukul 08:15 WIB (15 mnt dari jam masuk 08:00)

    public function index()
    {
        $periods = PayrollPeriod::latest()->get();
        $activeEmployees = Employee::where('status', 'active')->get();
        $employeeCount = $activeEmployees->count();

        // Standard estimate: 26 working days basis
        $monthlyPayrollTotal = $activeEmployees->sum(function ($e) {
            $basic = $e->basic_salary ?? 0;
            $meal = self::STANDARD_WORKING_DAYS * self::MEAL_RATE_PER_DAY;
            return $basic + $meal;
        });

        $periods->transform(function ($p) use ($monthlyPayrollTotal, $employeeCount) {
            $p->total_employees = $employeeCount;
            $p->total_amount = $monthlyPayrollTotal;
            return $p;
        });

        return response()->json($periods);
    }

    /**
     * Hitung kalkulasi payroll karyawan untuk rentang tanggal dan period_key tertentu.
     * Digunakan bersama oleh summary(), publishAll(), dan publishSingle().
     */
    private function calculatePayrollForPeriod($startDate, $endDate, $periodKey, $targetEmployeeId = null)
    {
        // Ambil data koreksi manual dari HR untuk periode ini
        $adjustments = \App\Models\PayrollAdjustment::where('period_key', $periodKey)->get()->keyBy('employee_id');

        $query = Employee::with([
            'currentAssignment.department',
            'currentAssignment.jobPosition',
            'attendances' => function ($q) use ($startDate, $endDate) {
                $q->whereBetween('date', [$startDate, $endDate]);
            },
            'leaves' => function ($q) use ($startDate, $endDate) {
                $q->where('status', 'approved')
                  ->where(function ($sub) use ($startDate, $endDate) {
                      $sub->whereBetween('start_date', [$startDate, $endDate])
                          ->orWhereBetween('end_date', [$startDate, $endDate]);
                  });
            },
            'workdaySwaps' => function ($q) use ($startDate, $endDate) {
                $q->where('status', 'approved')
                  ->where(function ($sub) use ($startDate, $endDate) {
                      $sub->whereBetween('original_date', [$startDate, $endDate])
                          ->orWhereBetween('replacement_date', [$startDate, $endDate]);
                  });
            },
            'user'
        ])->where('status', 'active');

        if ($targetEmployeeId) {
            $query->where('id', $targetEmployeeId);
        }

        $employees = $query->get();

        $mealRatePerDay = self::MEAL_RATE_PER_DAY;
        $standardWorkingDays = self::STANDARD_WORKING_DAYS;
        $maxToleranceTime = self::MAX_ONTIME_TOLERANCE;

        return $employees->map(function ($e) use ($mealRatePerDay, $standardWorkingDays, $maxToleranceTime, $adjustments, $startDate, $endDate) {
            $basicSalary = (float)($e->basic_salary ?? 0);
            $dailyRate = $basicSalary > 0 ? round($basicSalary / $standardWorkingDays) : 0;
            $joinDate = $e->join_date ? Carbon::parse($e->join_date)->toDateString() : null;
            $isNewJoiner = $joinDate && $joinDate > $startDate;

            $hasManualAdjustment = isset($adjustments[$e->id]);

            if ($hasManualAdjustment) {
                // Prioritas 1: Gunakan Koreksi Manual HR jika ada
                $adj = $adjustments[$e->id];
                $presentDays = (int)$adj->present_days;
                $eligibleMealDays = (int)$adj->eligible_meal_days;
                $lateOver15Days = (int)$adj->late_over_15_days;
                $unattendedDays = max(0, $standardWorkingDays - $presentDays);
                $isAdjusted = true;
                $adjustmentNote = $adj->note ?: 'Koreksi Manual HR';
                $sickOrLeaveDays = 0;
                $isProrated = $adj->is_prorated !== null ? (bool)$adj->is_prorated : $isNewJoiner;
            } else {
                $isAdjusted = false;
                $attendances = $e->attendances;
                $hasAttendances = $attendances && $attendances->count() > 0;

                if ($hasAttendances) {
                    // Kehadiran aktual dari absensi di sistem
                    $presentDays = $attendances->filter(fn($a) => in_array($a->status, ['present', 'late']))->count();
                    $presentDays = min($standardWorkingDays, $presentDays);

                    $eligibleMealDays = $attendances->filter(function ($a) use ($maxToleranceTime) {
                        return in_array($a->status, ['present', 'late']) && $a->time_in && substr($a->time_in, 0, 8) <= $maxToleranceTime;
                    })->count();
                    $eligibleMealDays = min($presentDays, $eligibleMealDays);

                    $lateOver15Days = $attendances->filter(function ($a) use ($maxToleranceTime) {
                        return in_array($a->status, ['present', 'late']) && $a->time_in && substr($a->time_in, 0, 8) > $maxToleranceTime;
                    })->count();

                    $sickOrLeaveDays = $e->leaves ? $e->leaves->count() : 0;
                    $unattendedDays = max(0, $standardWorkingDays - $presentDays);
                    $adjustmentNote = null;
                    $isProrated = $isNewJoiner;
                } elseif ($isNewJoiner) {
                    // Karyawan baru masuk setelah tanggal mulai cut-off (misal join 8 Okt)
                    // Hitung estimasi hari kerja prorata (Senin - Sabtu) sejak join_date sampai tanggal 27
                    $joinCarbon = Carbon::parse($joinDate);
                    $endCarbon = Carbon::parse($endDate);
                    $workdayCount = 0;
                    $cur = $joinCarbon->copy();
                    while ($cur->lte($endCarbon)) {
                        if ($cur->dayOfWeek !== Carbon::SUNDAY) {
                            $workdayCount++;
                        }
                        $cur->addDay();
                    }
                    $presentDays = min($standardWorkingDays, $workdayCount);
                    $eligibleMealDays = $presentDays;
                    $lateOver15Days = 0;
                    $unattendedDays = max(0, $standardWorkingDays - $presentDays);
                    $sickOrLeaveDays = 0;
                    $adjustmentNote = 'Prorata Karyawan Baru (Masuk ' . Carbon::parse($joinDate)->format('d/m/Y') . ')';
                    $isProrated = true;
                } else {
                    // Karyawan lama di masa transisi jika belum ada log absensi online:
                    // Tetap dihitung hadir penuh standar (26 hari) agar gaji tidak salah potong
                    $presentDays = $standardWorkingDays;
                    $eligibleMealDays = $standardWorkingDays;
                    $lateOver15Days = 0;
                    $unattendedDays = 0;
                    $sickOrLeaveDays = 0;
                    $adjustmentNote = null;
                    $isProrated = false;
                }
            }

            // PERHITUNGAN GAJI POKOK & PRORATA:
            if ($isProrated) {
                $earnedBasicSalary = $basicSalary > 0 
                    ? (float)round(($presentDays / $standardWorkingDays) * $basicSalary)
                    : 0;
                $prorataDeduction = max(0, $basicSalary - $earnedBasicSalary);
            } else {
                $earnedBasicSalary = $basicSalary;
                $prorataDeduction = 0;
            }

            $unattendedDeduction = 0;

            // Total Uang Makan Aktual (Rp 11.000 / hari hadir memenuhi syarat <= 08:15 WIB)
            $totalMealAllowance = $eligibleMealDays * $mealRatePerDay;

            // Potongan Uang Makan akibat izin/sakit/alpa/belum masuk (unattendedDays x Rp 11.000)
            $unattendedMealDeduction = $unattendedDays * $mealRatePerDay;

            // Total Gaji Diterima (Take Home Pay) = Gaji Pokok (Utuh / Prorata) + Total Uang Makan Aktual
            $totalSalary = $earnedBasicSalary + $totalMealAllowance;

            // Info Jadwal Weekend
            $patternLabels = [
                'saturday_fixed' => 'Tetap Masuk Sabtu (Minggu OFF)',
                'sunday_fixed' => 'Tetap Masuk Minggu (Sabtu OFF)',
                'rotating' => 'Rotasi Akhir Pekan (Ditentukan HR)',
            ];

            return [
                'id' => $e->id,
                'employee_id' => $e->employee_id,
                'user_id' => $e->user_id,
                'nik' => $e->nik ?? ('3271' . str_pad($e->id, 12, '0', STR_PAD_LEFT)),
                'name' => $e->first_name . ' ' . ($e->last_name ?? ''),
                'department' => $e->currentAssignment?->department?->name ?? 'Umum',
                'job_position' => $e->currentAssignment?->jobPosition?->name ?? 'Staff',
                'employment_type' => $e->employment_type ?? 'permanent',
                'join_date' => $joinDate,
                'is_new_joiner' => $isNewJoiner,
                'is_prorated' => $isProrated,
                'prorata_deduction' => $prorataDeduction,
                'is_manually_adjusted' => $isAdjusted,
                'adjustment_note' => $adjustmentNote,
                'weekend_pattern' => $e->weekend_pattern ?? 'saturday_fixed',
                'weekend_pattern_label' => $patternLabels[$e->weekend_pattern ?? 'saturday_fixed'] ?? 'Tetap Masuk Sabtu',
                'standard_working_days' => $standardWorkingDays,
                'daily_rate' => $dailyRate,
                'basic_salary' => $basicSalary,
                'present_days' => $presentDays,
                'unattended_days' => $unattendedDays,
                'sick_or_leave_days' => $sickOrLeaveDays,
                'earned_basic_salary' => $earnedBasicSalary,
                'unattended_deduction' => $unattendedDeduction,
                'meal_rate_per_day' => $mealRatePerDay,
                'eligible_meal_days' => $eligibleMealDays,
                'late_over_15_days' => $lateOver15Days,
                'meal_allowance' => $totalMealAllowance,
                'meal_deduction' => $unattendedMealDeduction,
                'total_salary' => $totalSalary,
                'bank_name' => $e->bank_name ?? 'BCA',
                'bank_account_number' => $e->bank_account_number ?? '-',
                'bank_account_holder' => $e->bank_account_holder ?? ($e->first_name . ' ' . ($e->last_name ?? '')),
                'status' => $e->status,
            ];
        });
    }

    /**
     * Get live payroll overview directly calculated from Employee Data and Attendance records.
     */
    public function summary(Request $request)
    {
        $today = Carbon::now();
        // Cut-off penggajian mulai setelah tanggal 27 (yaitu tanggal 28 s/d tanggal 27)
        if ($today->day > 27) {
            $defaultStart = $today->copy()->day(28)->toDateString();
            $defaultEnd = $today->copy()->addMonthNoOverflow()->day(27)->toDateString();
            $defaultPeriodKey = $today->copy()->addMonthNoOverflow()->format('Y-m');
            $defaultPeriodName = 'Periode 28 ' . $today->translatedFormat('M') . ' - 27 ' . $today->copy()->addMonthNoOverflow()->translatedFormat('M Y');
        } else {
            $defaultStart = $today->copy()->subMonthNoOverflow()->day(28)->toDateString();
            $defaultEnd = $today->copy()->day(27)->toDateString();
            $defaultPeriodKey = $today->copy()->format('Y-m');
            $defaultPeriodName = 'Periode 28 ' . $today->copy()->subMonthNoOverflow()->translatedFormat('M') . ' - 27 ' . $today->translatedFormat('M Y');
        }

        $startDate = $request->input('start_date', $defaultStart);
        $endDate = $request->input('end_date', $defaultEnd);
        $periodKey = $request->input('period_key', $defaultPeriodKey);

        $employeeData = $this->calculatePayrollForPeriod($startDate, $endDate, $periodKey);

        // Ambil data publikasi yang sudah tersimpan untuk periode ini
        $publishedRecords = PayrollRecord::where('period_key', $periodKey)->get()->keyBy('employee_id');
        $payrollPeriod = PayrollPeriod::where('period_key', $periodKey)->first();

        $employeeData = $employeeData->map(function ($emp) use ($publishedRecords) {
            $rec = $publishedRecords->get($emp['id']);
            $emp['is_published'] = $rec ? (bool)$rec->is_published : false;
            $emp['published_at'] = $rec?->published_at ? $rec->published_at->translatedFormat('d M Y H:i') : null;
            $emp['payroll_record_id'] = $rec?->id;
            return $emp;
        });

        $publishedCount = $employeeData->where('is_published', true)->count();
        $isPeriodPublished = $payrollPeriod ? (bool)$payrollPeriod->is_published : ($publishedCount > 0 && $publishedCount === $employeeData->count());

        $totalBasicRegistered = $employeeData->sum('basic_salary');
        $totalEarnedBasic = $employeeData->sum('earned_basic_salary');
        $totalProrataDeduction = $employeeData->sum('prorata_deduction');
        $totalDeduction = 0;
        $totalMealAllowance = $employeeData->sum('meal_allowance');
        $totalMealDeduction = $employeeData->sum('meal_deduction');
        $totalMonthlyPayroll = $employeeData->sum('total_salary');

        return response()->json([
            'cutoff_start_date' => $startDate,
            'cutoff_end_date' => $endDate,
            'period_key' => $periodKey,
            'period_label' => $defaultPeriodName,
            'standard_working_days' => self::STANDARD_WORKING_DAYS,
            'total_monthly_payroll' => $totalMonthlyPayroll,
            'total_basic_registered' => $totalBasicRegistered,
            'total_earned_basic' => $totalEarnedBasic,
            'total_prorata_deduction' => $totalProrataDeduction,
            'total_deduction' => $totalDeduction,
            'total_meal_allowance' => $totalMealAllowance,
            'total_meal_deduction' => $totalMealDeduction,
            'meal_rate_per_day' => self::MEAL_RATE_PER_DAY,
            'active_employees_count' => $employeeData->count(),
            'notes' => 'Siklus cut-off tanggal 28 s/d 27. Prorata berlaku untuk yang tidak masuk full 1 bulan (karyawan baru). Gaji pokok karyawan reguler utuh 100% (segala jenis izin/sakit/alpa hanya memotong uang makan Rp 11.000/hari).',
            'is_period_published' => $isPeriodPublished,
            'period_published_at' => $payrollPeriod?->published_at ? $payrollPeriod->published_at->translatedFormat('d M Y H:i') : null,
            'published_employees_count' => $publishedCount,
            'employees' => $employeeData,
        ]);
    }

    /**
     * Rilis / Kirim seluruh slip gaji karyawan dalam periode cut-off ke Dashboard masing-masing.
     */
    public function publishAll(Request $request)
    {
        $user = $request->user();
        if (!$user->can('payroll.process') && !$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr'])) {
            return response()->json(['error' => 'Anda tidak memiliki hak akses untuk menerbitkan slip gaji.'], 403);
        }

        $validated = $request->validate([
            'period_key' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'period_label' => 'nullable|string',
        ]);

        $periodKey = $validated['period_key'];
        $startDate = $validated['start_date'];
        $endDate = $validated['end_date'];
        $periodLabel = $validated['period_label'] ?: "Periode {$startDate} s/d {$endDate}";

        $period = PayrollPeriod::updateOrCreate(
            ['period_key' => $periodKey],
            [
                'name' => $periodLabel,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'pay_date' => $endDate,
                'status' => 'approved',
                'is_published' => true,
                'published_at' => Carbon::now(),
                'published_by' => $user->id,
            ]
        );

        $calculatedEmployees = $this->calculatePayrollForPeriod($startDate, $endDate, $periodKey);
        $publishedCount = 0;

        foreach ($calculatedEmployees as $empData) {
            $record = PayrollRecord::updateOrCreate(
                [
                    'payroll_period_id' => $period->id,
                    'employee_id' => $empData['id'],
                ],
                [
                    'period_key' => $periodKey,
                    'gross_pay' => (int)($empData['basic_salary'] + $empData['meal_allowance']),
                    'total_deductions' => (int)($empData['prorata_deduction'] + $empData['meal_deduction']),
                    'net_pay' => (int)$empData['total_salary'],
                    'snapshot_data' => array_merge($empData, [
                        'period_name' => $periodLabel,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'published_at' => Carbon::now()->toIso8601String(),
                    ]),
                    'status' => 'final',
                    'is_published' => true,
                    'published_at' => Carbon::now(),
                    'published_by' => $user->id,
                ]
            );

            // Kirim in-app notifikasi jika karyawan memiliki akun user
            if (!empty($empData['user_id'])) {
                DB::table('notifications')->insert([
                    'id' => (string) Str::uuid(),
                    'type' => 'App\Notifications\PayslipPublished',
                    'notifiable_type' => User::class,
                    'notifiable_id' => $empData['user_id'],
                    'data' => json_encode([
                        'title' => 'Slip Gaji Diterbitkan',
                        'message' => "Slip gaji resmi Anda untuk {$periodLabel} telah diterbitkan dan dapat diunduh di Dashboard Anda.",
                        'category' => 'payroll',
                        'sender_name' => 'HR Management',
                        'period_key' => $periodKey,
                        'payroll_record_id' => $record->id,
                    ]),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }

            $publishedCount++;
        }

        return response()->json([
            'message' => "Berhasil menerbitkan {$publishedCount} slip gaji ke Dashboard karyawan.",
            'published_count' => $publishedCount,
            'published_at' => Carbon::now()->translatedFormat('d M Y H:i'),
        ]);
    }

    /**
     * Kirim slip gaji ke satu karyawan tertentu.
     */
    public function publishSingle(Request $request)
    {
        $user = $request->user();
        if (!$user->can('payroll.process') && !$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr'])) {
            return response()->json(['error' => 'Anda tidak memiliki hak akses untuk menerbitkan slip gaji.'], 403);
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period_key' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'period_label' => 'nullable|string',
        ]);

        $empId = $validated['employee_id'];
        $periodKey = $validated['period_key'];
        $startDate = $validated['start_date'];
        $endDate = $validated['end_date'];
        $periodLabel = $validated['period_label'] ?: "Periode {$startDate} s/d {$endDate}";

        $period = PayrollPeriod::firstOrCreate(
            ['period_key' => $periodKey],
            [
                'name' => $periodLabel,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'pay_date' => $endDate,
                'status' => 'draft',
            ]
        );

        $calculated = $this->calculatePayrollForPeriod($startDate, $endDate, $periodKey, $empId);
        $empData = $calculated->firstWhere('id', $empId);

        if (!$empData) {
            return response()->json(['error' => 'Data karyawan tidak ditemukan untuk kalkulasi payroll.'], 404);
        }

        $record = PayrollRecord::updateOrCreate(
            [
                'payroll_period_id' => $period->id,
                'employee_id' => $empId,
            ],
            [
                'period_key' => $periodKey,
                'gross_pay' => (int)($empData['basic_salary'] + $empData['meal_allowance']),
                'total_deductions' => (int)($empData['prorata_deduction'] + $empData['meal_deduction']),
                'net_pay' => (int)$empData['total_salary'],
                'snapshot_data' => array_merge($empData, [
                    'period_name' => $periodLabel,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'published_at' => Carbon::now()->toIso8601String(),
                ]),
                'status' => 'final',
                'is_published' => true,
                'published_at' => Carbon::now(),
                'published_by' => $user->id,
            ]
        );

        // Notifikasi ke karyawan
        if (!empty($empData['user_id'])) {
            DB::table('notifications')->insert([
                'id' => (string) Str::uuid(),
                'type' => 'App\Notifications\PayslipPublished',
                'notifiable_type' => User::class,
                'notifiable_id' => $empData['user_id'],
                'data' => json_encode([
                    'title' => 'Slip Gaji Diterbitkan',
                    'message' => "Slip gaji resmi Anda untuk {$periodLabel} telah diterbitkan dan dapat diunduh di Dashboard Anda.",
                    'category' => 'payroll',
                    'sender_name' => 'HR Management',
                    'period_key' => $periodKey,
                    'payroll_record_id' => $record->id,
                ]),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        return response()->json([
            'message' => "Slip gaji {$empData['name']} berhasil diterbitkan ke Dashboard karyawan.",
            'employee_id' => $empId,
            'is_published' => true,
            'published_at' => Carbon::now()->translatedFormat('d M Y H:i'),
        ]);
    }

    /**
     * Batalkan / Tarik penerbitan slip gaji jika ada revisi.
     */
    public function unpublish(Request $request)
    {
        $user = $request->user();
        if (!$user->can('payroll.process') && !$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr'])) {
            return response()->json(['error' => 'Anda tidak memiliki hak akses.'], 403);
        }

        $validated = $request->validate([
            'period_key' => 'required|string',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        $periodKey = $validated['period_key'];
        $empId = $request->input('employee_id');

        if ($empId) {
            PayrollRecord::where('period_key', $periodKey)
                ->where('employee_id', $empId)
                ->update(['is_published' => false]);
            return response()->json(['message' => 'Publikasi slip gaji karyawan berhasil ditarik/dibatalkan.']);
        } else {
            PayrollRecord::where('period_key', $periodKey)->update(['is_published' => false]);
            PayrollPeriod::where('period_key', $periodKey)->update(['is_published' => false]);
            return response()->json(['message' => 'Seluruh publikasi slip gaji untuk periode ini berhasil dibatalkan.']);
        }
    }

    /**
     * Get all published payslips for the logged-in employee (Riwayat Slip Gaji Saya).
     */
    public function mySlips(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json([]);
        }

        $records = PayrollRecord::with('period')
            ->where('employee_id', $employee->id)
            ->where('is_published', true)
            ->orderByDesc('published_at')
            ->get();

        $formatted = $records->map(function ($r) {
            $snap = $r->snapshot_data ?: [];
            return [
                'id' => $r->id,
                'period_key' => $r->period_key,
                'period_name' => $snap['period_name'] ?? $r->period?->name ?? 'Slip Gaji',
                'start_date' => $snap['start_date'] ?? $r->period?->start_date,
                'end_date' => $snap['end_date'] ?? $r->period?->end_date,
                'published_at' => $r->published_at ? $r->published_at->translatedFormat('d M Y H:i') : null,
                'published_at_raw' => $r->published_at?->toIso8601String(),
                'net_pay' => $r->net_pay,
                'gross_pay' => $r->gross_pay,
                'total_deductions' => $r->total_deductions,
                'details' => $snap,
            ];
        });

        return response()->json($formatted);
    }

    /**
     * Get latest published payslip for the logged-in employee (Widget Dashboard Karyawan).
     */
    public function myLatestSlip(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['slip' => null]);
        }

        $record = PayrollRecord::with('period')
            ->where('employee_id', $employee->id)
            ->where('is_published', true)
            ->orderByDesc('published_at')
            ->first();

        if (!$record) {
            return response()->json(['slip' => null]);
        }

        $snap = $record->snapshot_data ?: [];
        return response()->json([
            'slip' => [
                'id' => $record->id,
                'period_key' => $record->period_key,
                'period_name' => $snap['period_name'] ?? $record->period?->name ?? 'Slip Gaji Terbaru',
                'start_date' => $snap['start_date'] ?? $record->period?->start_date,
                'end_date' => $snap['end_date'] ?? $record->period?->end_date,
                'published_at' => $record->published_at ? $record->published_at->translatedFormat('d M Y H:i') : null,
                'net_pay' => $record->net_pay,
                'gross_pay' => $record->gross_pay,
                'total_deductions' => $record->total_deductions,
                'details' => $snap,
            ]
        ]);
    }

    /**
     * Simpan koreksi manual kehadiran & payroll oleh HR.
     */
    public function adjust(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period_key' => 'required|string',
            'present_days' => 'required|integer|min:0|max:31',
            'eligible_meal_days' => 'required|integer|min:0|max:31',
            'late_over_15_days' => 'nullable|integer|min:0|max:31',
            'is_prorated' => 'nullable|boolean',
            'note' => 'nullable|string|max:255',
        ]);

        $adj = \App\Models\PayrollAdjustment::updateOrCreate(
            [
                'employee_id' => $validated['employee_id'],
                'period_key' => $validated['period_key'],
            ],
            [
                'present_days' => $validated['present_days'],
                'eligible_meal_days' => $validated['eligible_meal_days'],
                'late_over_15_days' => $validated['late_over_15_days'] ?? 0,
                'unattended_days' => max(0, self::STANDARD_WORKING_DAYS - $validated['present_days']),
                'is_prorated' => isset($validated['is_prorated']) ? (bool)$validated['is_prorated'] : null,
                'note' => $validated['note'] ?: 'Koreksi Manual HR',
                'adjusted_by' => $request->user()?->id,
            ]
        );

        return response()->json([
            'message' => 'Koreksi presensi & payroll berhasil disimpan!',
            'data' => $adj
        ]);
    }

    /**
     * Reset koreksi manual HR kembali ke perhitungan otomatis sistem.
     */
    public function resetAdjustment(Request $request, $employeeId)
    {
        $periodKey = $request->input('period_key');
        $query = \App\Models\PayrollAdjustment::where('employee_id', $employeeId);
        if ($periodKey) {
            $query->where('period_key', $periodKey);
        }
        $query->delete();

        return response()->json([
            'message' => 'Koreksi payroll berhasil direset ke perhitungan otomatis sistem.'
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'pay_date' => 'nullable|date',
        ]);
        
        $data['status'] = 'draft';
        $data['pay_date'] = $data['pay_date'] ?? $data['end_date'];
        $period = PayrollPeriod::create($data);

        // Auto-generate payroll records directly with 26-day presence rule
        $activeEmployees = Employee::where('status', 'active')->get();
        foreach ($activeEmployees as $emp) {
            $basic = $emp->basic_salary ?? 0;
            // Standard full presence calculation (26 days)
            $earnedBasic = $basic;
            $meal = self::STANDARD_WORKING_DAYS * self::MEAL_RATE_PER_DAY;
            $net = $earnedBasic + $meal;

            PayrollRecord::create([
                'payroll_period_id' => $period->id,
                'employee_id' => $emp->id,
                'gross_pay' => $net,
                'total_deductions' => 0,
                'net_pay' => $net,
                'status' => 'draft',
            ]);
        }

        return response()->json($period->load('records'), 201);
    }
}
