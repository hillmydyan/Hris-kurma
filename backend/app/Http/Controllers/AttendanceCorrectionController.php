<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AttendanceCorrection;
use App\Models\Attendance;
use Illuminate\Support\Facades\DB;

class AttendanceCorrectionController extends Controller
{
    const MAX_ONTIME_TOLERANCE = '08:15:00';

    public function index(Request $request)
    {
        $user = $request->user();
        $isManagement = $user->can('attendance.manage') || $user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr', 'dept-head', 'manager']);

        if ($isManagement) {
            $corrections = AttendanceCorrection::with([
                'employee.currentAssignment.department',
                'employee.currentAssignment.jobPosition',
                'approver'
            ])->latest()->get();
            return response()->json($corrections);
        }

        $employee = $user->employee;
        if (!$employee) return response()->json([]);

        $corrections = $employee->attendanceCorrections()->with('approver')->latest()->get();
        return response()->json($corrections);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'nullable|exists:employees,id',
            'date' => 'required|date',
            'time_in' => 'nullable|date_format:H:i',
            'time_out' => 'nullable|date_format:H:i',
            'reason' => 'required|string',
        ]);

        $user = $request->user();
        $isManagement = $user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr']);

        $employeeId = ($isManagement && $request->filled('employee_id')) 
            ? $request->employee_id 
            : $user->employee?->id;

        if (!$employeeId) {
            return response()->json(['error' => 'Profil karyawan tidak ditemukan.'], 403);
        }

        $correction = AttendanceCorrection::create([
            'employee_id' => $employeeId,
            'date' => $request->date,
            'time_in' => $request->time_in,
            'time_out' => $request->time_out,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Permintaan koreksi absensi berhasil diajukan.',
            'data' => $correction->load('employee')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        if (!$user->can('attendance.approve') && !$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr', 'dept-head', 'manager'])) {
            return response()->json(['error' => 'Anda tidak memiliki wewenang untuk menyetujui koreksi absensi.'], 403);
        }

        $attendanceCorrection = AttendanceCorrection::findOrFail($id);

        DB::transaction(function () use ($request, $attendanceCorrection, $user) {
            $attendanceCorrection->update([
                'status' => $request->status,
                'approved_by' => $user->id,
            ]);

            if ($request->status === 'approved') {
                $attendance = Attendance::firstOrNew([
                    'employee_id' => $attendanceCorrection->employee_id,
                    'date' => $attendanceCorrection->date,
                ]);

                if ($attendanceCorrection->time_in) {
                    $attendance->time_in = $attendanceCorrection->time_in;
                }
                if ($attendanceCorrection->time_out) {
                    $attendance->time_out = $attendanceCorrection->time_out;
                }
                
                $attendance->type = 'manual';
                // Batas toleransi tepat waktu: 08:15:00 WIB
                $timeInStr = $attendance->time_in ? substr($attendance->time_in, 0, 8) : null;
                if ($timeInStr) {
                    $attendance->status = ($timeInStr > self::MAX_ONTIME_TOLERANCE) ? 'late' : 'present';
                } else {
                    $attendance->status = 'present';
                }
                $attendance->notes = 'Koreksi Absensi Disetujui: ' . $attendanceCorrection->reason;
                $attendance->save();
            }
        });

        return response()->json([
            'message' => 'Koreksi absensi berhasil ' . ($request->status === 'approved' ? 'disetujui' : 'ditolak') . '.',
            'data' => $attendanceCorrection->load('employee', 'approver')
        ]);
    }

    /**
     * Setujui banyak koreksi absensi sekaligus (Bulk Approve).
     */
    public function bulkApprove(Request $request)
    {
        $user = $request->user();
        if (!$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr', 'dept-head', 'manager'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:attendance_corrections,id',
            'status' => 'required|in:approved,rejected',
        ]);

        $status = $request->status;
        $updatedCount = 0;

        DB::transaction(function () use ($request, $status, $user, &$updatedCount) {
            $corrections = AttendanceCorrection::whereIn('id', $request->ids)->where('status', 'pending')->get();
            foreach ($corrections as $corr) {
                $corr->update([
                    'status' => $status,
                    'approved_by' => $user->id,
                ]);

                if ($status === 'approved') {
                    $att = Attendance::firstOrNew([
                        'employee_id' => $corr->employee_id,
                        'date' => $corr->date,
                    ]);
                    if ($corr->time_in) $att->time_in = $corr->time_in;
                    if ($corr->time_out) $att->time_out = $corr->time_out;
                    $att->type = 'manual';
                    $timeInStr = $att->time_in ? substr($att->time_in, 0, 8) : null;
                    if ($timeInStr) {
                        $att->status = ($timeInStr > self::MAX_ONTIME_TOLERANCE) ? 'late' : 'present';
                    } else {
                        $att->status = 'present';
                    }
                    $att->notes = 'Koreksi Absensi Disetujui: ' . $corr->reason;
                    $att->save();
                }
                $updatedCount++;
            }
        });

        return response()->json([
            'message' => "Sebanyak {$updatedCount} koreksi absensi berhasil " . ($status === 'approved' ? 'disetujui' : 'ditolak') . "."
        ]);
    }
}
