<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\AttendanceQrToken;
use Carbon\Carbon;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    /**
     * Get attendance list (personal or admin/team depending on role).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->can('attendance.view_all')) {
            $query = Attendance::with(['employee.currentAssignment.department', 'employee.currentAssignment.jobPosition'])->latest('date');

            if ($request->filled('date')) {
                $query->where('date', $request->date);
            }
            if ($request->filled('department_id')) {
                $query->whereHas('employee.currentAssignment', function ($q) use ($request) {
                    $q->where('department_id', $request->department_id);
                });
            }

            return response()->json($query->paginate(20));
        }

        $employee = $user->employee;
        if (!$employee) {
            return response()->json(['error' => 'Profil karyawan tidak ditemukan.'], 403);
        }

        $attendances = $employee->attendances()->latest('date')->paginate(15);
        return response()->json($attendances);
    }

    /**
     * Ringkasan kehadiran pribadi untuk dashboard karyawan di bulan berjalan.
     * Basis standar kerja Kurma Group: 26 hari kerja per bulan.
     */
    public function mySummary(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;

        $standardWorkingDays = 26;

        if (!$employee) {
            return response()->json([
                'present_days' => 0,
                'standard_working_days' => $standardWorkingDays,
                'attendance_rate' => 0,
                'on_time_days' => 0,
                'late_days' => 0,
                'today_attendance' => null,
            ]);
        }

        $today = Carbon::today();
        $todayStr = $today->toDateString();
        $startOfMonth = $today->copy()->startOfMonth()->toDateString();
        $endOfMonth = $today->copy()->endOfMonth()->toDateString();

        $monthAttendances = $employee->attendances()
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->get();

        $presentDays = $monthAttendances->whereIn('status', ['present', 'late'])->count();
        $lateDays = $monthAttendances->where('status', 'late')->count();
        $onTimeDays = $monthAttendances->where('status', 'present')->count();

        $attendanceRate = $standardWorkingDays > 0 
            ? round(($presentDays / $standardWorkingDays) * 100) 
            : 0;

        $todayAttendance = $employee->attendances()->where('date', $todayStr)->first();

        return response()->json([
            'month' => $today->translatedFormat('F Y'),
            'start_date' => $startOfMonth,
            'end_date' => $endOfMonth,
            'present_days' => $presentDays,
            'standard_working_days' => $standardWorkingDays,
            'attendance_rate' => $attendanceRate,
            'on_time_days' => $onTimeDays,
            'late_days' => $lateDays,
            'today_attendance' => $todayAttendance,
        ]);
    }

    /**
     * Generate rotating Dynamic QR code for office TV / screen display.
     * Rotating every 45-60 seconds to prevent photo/screenshot fraud.
     */
    public function getQrCode(Request $request)
    {
        // Expire older active tokens
        AttendanceQrToken::where('expires_at', '<', Carbon::now())
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $tokenString = Str::random(40);
        $secretHash = hash_hmac('sha256', $tokenString . Carbon::now()->timestamp, config('app.key'));
        $ttlSeconds = 60;
        $expiresAt = Carbon::now()->addSeconds($ttlSeconds);

        $qrRecord = AttendanceQrToken::create([
            'token' => $tokenString,
            'secret_hash' => $secretHash,
            'type' => $request->input('type', 'all'),
            'expires_at' => $expiresAt,
            'is_active' => true,
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'token' => $qrRecord->token,
            'date' => Carbon::now()->toDateString(),
            'date_formatted' => Carbon::now()->translatedFormat('l, d F Y'),
            'expires_at' => $expiresAt->toIso8601String(),
            'expires_in_seconds' => $ttlSeconds,
            'refresh_interval_seconds' => 45,
            'server_time' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * Get or generate Daily Office QR code for printing / wall display.
     * Berlaku khusus HARI INI saja (otomatis kedaluwarsa pukul 23:59:59 WIB tengah malam).
     * Mencegah penyalahgunaan QR cetak kemarin untuk hari esok.
     */
    public function getStaticQrCode(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $dailyToken = 'KURMA-DAILY-QR-' . $today . '-' . substr(hash('sha256', config('app.key') . 'daily_qr_' . $today), 0, 10);
        $expiresAt = Carbon::today()->endOfDay(); // 23:59:59 WIB

        $qrRecord = AttendanceQrToken::firstOrCreate(
            ['token' => $dailyToken],
            [
                'secret_hash' => hash_hmac('sha256', 'daily_office_' . $today, config('app.key')),
                'type' => 'all',
                'expires_at' => $expiresAt,
                'is_active' => true,
                'created_by' => $request->user()?->id,
            ]
        );

        return response()->json([
            'token' => $qrRecord->token,
            'date' => $today,
            'date_formatted' => Carbon::today()->locale('id')->isoFormat('dddd, D MMMM Y'),
            'expires_at' => $expiresAt->toIso8601String(),
            'expires_at_formatted' => 'Pukul 23:59 WIB',
            'label' => 'QR Code Harian Kantor (Khusus Hari Ini)',
            'type' => 'daily_office',
            'is_permanent' => false,
            'is_daily' => true,
        ]);
    }

    /**
     * Scan Dynamic QR code by employee (Absen Pagi & Absen Sore).
     */
    public function scanQrCode(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'type' => 'nullable|string|in:pagi,sore,check_in,check_out',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $tokenRecord = AttendanceQrToken::where('token', $request->token)->first();

        if (!$tokenRecord || !$tokenRecord->isValid()) {
            return response()->json([
                'error' => 'QR Code tidak valid atau sudah kedaluwarsa. Pastikan Anda melakukan scan QR resmi yang aktif khusus untuk hari ini.'
            ], 422);
        }

        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['error' => 'Profil karyawan tidak ditemukan untuk akun ini.'], 403);
        }

        $today = Carbon::today()->toDateString();
        $currentTime = Carbon::now()->toTimeString();
        $formattedTime = Carbon::now()->format('H:i');
        $scanType = $request->input('type'); // 'pagi', 'sore', 'check_in', 'check_out', or null

        $attendance = Attendance::firstOrNew([
            'employee_id' => $employee->id,
            'date' => $today,
        ]);

        // Scenario 1: Absen Pagi (Jam Masuk)
        if ($scanType === 'pagi' || $scanType === 'check_in' || (!$scanType && !$attendance->exists)) {
            if ($attendance->time_in) {
                return response()->json([
                    'error' => 'Anda sudah melakukan Absen Pagi hari ini pada ' . substr($attendance->time_in, 0, 5) . ' WIB.'
                ], 400);
            }

            $isLate = Carbon::now()->format('H:i:s') > '08:15:00';
            $attendance->time_in = $currentTime;
            $attendance->status = $isLate ? 'late' : 'present';
            $attendance->type = 'qr_scan';
            $attendance->location_lat = $request->latitude;
            $attendance->location_lng = $request->longitude;
            $attendance->notes = $isLate ? 'Terlambat (Absen Pagi setelah 08:15)' : 'Tepat Waktu (Absen Pagi)';
            $attendance->save();

            $tokenRecord->increment('used_count');

            return response()->json([
                'message' => 'Absen Pagi berhasil dicatat pada ' . $formattedTime . ' WIB (' . ($isLate ? 'Terlambat' : 'Tepat Waktu') . ')',
                'action' => 'check_in',
                'type' => 'pagi',
                'status' => $attendance->status,
                'time' => $attendance->time_in,
                'data' => $attendance,
            ]);
        }

        // Scenario 2: Absen Sore (Jam Pulang)
        if ($scanType === 'sore' || $scanType === 'check_out' || (!$scanType && $attendance->exists && !$attendance->time_out)) {
            if ($attendance->time_out) {
                return response()->json([
                    'error' => 'Anda sudah melakukan Absen Sore hari ini pada ' . substr($attendance->time_out, 0, 5) . ' WIB.'
                ], 400);
            }

            $isEarly = Carbon::now()->format('H:i:s') < '16:00:00';
            $attendance->time_out = $currentTime;
            if ($attendance->notes) {
                $attendance->notes .= $isEarly ? ' | Pulang Cepat' : ' | Absen Sore Selesai';
            } else {
                $attendance->notes = $isEarly ? 'Pulang Cepat (Sebelum 16:00)' : 'Absen Sore Selesai';
            }
            if ($request->latitude) $attendance->location_lat = $request->latitude;
            if ($request->longitude) $attendance->location_lng = $request->longitude;
            $attendance->save();

            $tokenRecord->increment('used_count');

            return response()->json([
                'message' => 'Absen Sore berhasil dicatat pada ' . $formattedTime . ' WIB (' . ($isEarly ? 'Pulang Sebelum 16:00' : 'Selesai Kerja') . ')',
                'action' => 'check_out',
                'type' => 'sore',
                'status' => $attendance->status,
                'time' => $attendance->time_out,
                'data' => $attendance,
            ]);
        }

        // Scenario 3: Keduanya sudah lengkap
        return response()->json([
            'error' => 'Anda telah menyelesaikan Absen Pagi (' . substr($attendance->time_in, 0, 5) . ' WIB) dan Absen Sore (' . substr($attendance->time_out, 0, 5) . ' WIB) hari ini.'
        ], 400);
    }
}
