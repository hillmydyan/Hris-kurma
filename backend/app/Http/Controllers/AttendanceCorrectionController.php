<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\AttendanceCorrection;
use App\Models\Attendance;
use Illuminate\Support\Facades\DB;

class AttendanceCorrectionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole('HR') || $user->hasRole('Admin')) {
            $corrections = AttendanceCorrection::with('employee')->latest()->get();
            return response()->json($corrections);
        }

        $employee = $user->employee;
        if (!$employee) return response()->json([], 403);

        $corrections = $employee->attendanceCorrections()->latest()->get();
        return response()->json($corrections);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'time_in' => 'nullable|date_format:H:i',
            'time_out' => 'nullable|date_format:H:i',
            'reason' => 'required|string',
        ]);

        $employee = $request->user()->employee;
        if (!$employee) return response()->json(['error' => 'Not an employee'], 403);

        $correction = AttendanceCorrection::create([
            'employee_id' => $employee->id,
            'date' => $request->date,
            'time_in' => $request->time_in,
            'time_out' => $request->time_out,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Correction request submitted', 'data' => $correction], 201);
    }

    public function update(Request $request, AttendanceCorrection $attendanceCorrection)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $user = $request->user();
        if (!$user->hasRole('HR') && !$user->hasRole('Admin')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

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
                if (!$attendance->status || $attendance->status === 'absent') {
                    $attendance->status = ($attendance->time_in > '09:00:00') ? 'late' : 'present';
                }
                $attendance->save();
            }
        });

        return response()->json(['message' => 'Correction updated', 'data' => $attendanceCorrection]);
    }
}
