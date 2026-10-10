<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Support\Facades\Cache;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole('HR') || $user->hasRole('Admin')) {
            $attendances = Attendance::with('employee')->latest('date')->get();
            return response()->json($attendances);
        }

        $employee = $user->employee;
        if (!$employee) return response()->json([], 403);

        $attendances = $employee->attendances()->latest('date')->get();
        return response()->json($attendances);
    }

    public function getQrCode()
    {
        $date = date('Y-m-d');
        // Cache QR code token for today, expires at midnight
        $token = Cache::remember("qr_token_{$date}", 86400, function () use ($date) {
            return md5('HRIS-SECRET-' . $date . '-' . rand(1000, 9999));
        });

        return response()->json(['token' => $token, 'date' => $date]);
    }

    public function scanQrCode(Request $request)
    {
        $request->validate(['token' => 'required|string']);
        
        $date = date('Y-m-d');
        $validToken = Cache::get("qr_token_{$date}");

        if (!$validToken || $request->token !== $validToken) {
            return response()->json(['error' => 'Invalid or expired QR Code'], 400);
        }

        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['error' => 'Not an employee'], 403);
        }

        $attendance = Attendance::firstOrNew([
            'employee_id' => $employee->id,
            'date' => $date,
        ]);

        $now = date('H:i:s');

        if (!$attendance->exists) {
            // Check-in
            $attendance->time_in = $now;
            $attendance->status = $now > '09:00:00' ? 'late' : 'present';
            $attendance->type = 'qr_scan';
            $message = 'Berhasil Check-In';
        } else {
            if ($attendance->time_out) {
                return response()->json(['error' => 'Anda sudah Check-Out hari ini'], 400);
            }
            // Check-out
            $attendance->time_out = $now;
            $message = 'Berhasil Check-Out';
        }

        $attendance->save();

        return response()->json([
            'message' => $message,
            'data' => $attendance
        ]);
    }
}
