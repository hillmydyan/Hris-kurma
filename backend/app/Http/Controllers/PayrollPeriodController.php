<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\WorkdaySwap;
use Carbon\Carbon;

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
     * Get live payroll overview directly calculated from Employee Data and Attendance records.
     * Formula:
     * - Basis: 26 hari kerja sebulan (6 hari kerja seminggu).
     * - Tarif harian = Gaji Pokok / 26.
     * - Gaji Pokok Diterima = (Hari Hadir / 26) * Gaji Pokok.
     * - Sakit / Izin / Alpa memotong gaji (terhitung tidak hadir).
     * - Uang Makan: Rp 11.000 / hari jika hadir & kedatangan <= 09:15 WIB. Telat > 15m = Uang makan hangus.
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

        // Ambil data koreksi manual dari HR untuk periode ini
        $adjustments = \App\Models\PayrollAdjustment::where('period_key', $periodKey)->get()->keyBy('employee_id');

        $employees = Employee::with([
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
        ])->where('status', 'active')->get();

        $mealRatePerDay = self::MEAL_RATE_PER_DAY;
        $standardWorkingDays = self::STANDARD_WORKING_DAYS;
        $maxToleranceTime = self::MAX_ONTIME_TOLERANCE;

        $employeeData = $employees->map(function ($e) use ($mealRatePerDay, $standardWorkingDays, $maxToleranceTime, $adjustments, $startDate, $endDate) {
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
            // 1. Karyawan Prorata (karena tidak masuk full 1 bulan, misal join date di pertengahan periode):
            //    Gaji Pokok dihitung proporsional sesuai hari kerja aktif yang dijalani.
            // 2. Karyawan Terdaftar Penuh (1 bulan):
            //    Gaji Pokok SELALU UTUH 100% (segala jenis izin, sakit, alpa tidak memotong gaji pokok).
            if ($isProrated) {
                $earnedBasicSalary = $basicSalary > 0 
                    ? (float)round(($presentDays / $standardWorkingDays) * $basicSalary)
                    : 0;
                $prorataDeduction = max(0, $basicSalary - $earnedBasicSalary);
            } else {
                $earnedBasicSalary = $basicSalary;
                $prorataDeduction = 0;
            }

            // Gaji pokok tidak dipotong untuk izin/sakit/alpa karyawan reguler
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
            'standard_working_days' => $standardWorkingDays,
            'total_monthly_payroll' => $totalMonthlyPayroll,
            'total_basic_registered' => $totalBasicRegistered,
            'total_earned_basic' => $totalEarnedBasic,
            'total_prorata_deduction' => $totalProrataDeduction,
            'total_deduction' => $totalDeduction,
            'total_meal_allowance' => $totalMealAllowance,
            'total_meal_deduction' => $totalMealDeduction,
            'meal_rate_per_day' => $mealRatePerDay,
            'active_employees_count' => $employees->count(),
            'notes' => 'Siklus cut-off tanggal 28 s/d 27. Prorata berlaku untuk yang tidak masuk full 1 bulan (karyawan baru). Gaji pokok karyawan reguler utuh 100% (segala jenis izin/sakit/alpa hanya memotong uang makan Rp 11.000/hari).',
            'employees' => $employeeData,
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
