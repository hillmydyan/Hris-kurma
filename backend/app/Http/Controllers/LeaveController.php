<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Leave;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isManagement = $user->can('leave.view_all') || $user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr', 'dept-head', 'manager']);

        if ($isManagement) {
            $leaves = Leave::with([
                'employee.currentAssignment.department',
                'employee.currentAssignment.jobPosition',
                'approver'
            ])->latest()->get();
            return response()->json($leaves);
        }

        $employee = $user->employee;
        if (!$employee) return response()->json([]);

        $leaves = $employee->leaves()->with('approver')->latest()->get();
        return response()->json($leaves);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'nullable|exists:employees,id',
            'type' => 'required|in:sick,event,family,urgent,other,annual,unpaid,maternity',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
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

        $leave = Leave::create([
            'employee_id' => $employeeId,
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Permintaan perizinan kerja berhasil diajukan.',
            'data' => $leave->load('employee')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $user = $request->user();
        if (!$user->can('leave.approve_hr') && !$user->can('leave.approve_manager') && !$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr', 'dept-head', 'manager'])) {
            return response()->json(['error' => 'Anda tidak memiliki wewenang untuk menyetujui permohonan izin/cuti.'], 403);
        }

        $leave = Leave::findOrFail($id);

        DB::transaction(function () use ($request, $leave, $user) {
            $leave->update([
                'status' => $request->status,
                'approved_by' => $user->id,
            ]);

            // Jika disetujui, otomatis tandai presensi pada rentang tanggal tersebut
            if ($request->status === 'approved') {
                $start = Carbon::parse($leave->start_date);
                $end = Carbon::parse($leave->end_date);
                $cur = $start->copy();

                while ($cur->lte($end)) {
                    // Hindari mengisi hari Minggu (libur)
                    if ($cur->dayOfWeek !== Carbon::SUNDAY) {
                        $att = Attendance::firstOrNew([
                            'employee_id' => $leave->employee_id,
                            'date' => $cur->toDateString(),
                        ]);
                        $att->status = 'leave';
                        $att->type = 'manual';
                        $att->notes = ($leave->type === 'sick' ? 'Izin Sakit' : 'Izin Kerja') . ' Disetujui: ' . $leave->reason;
                        $att->save();
                    }
                    $cur->addDay();
                }
            }
        });

        return response()->json([
            'message' => 'Permohonan izin berhasil ' . ($request->status === 'approved' ? 'disetujui' : 'ditolak') . '.',
            'data' => $leave->load('employee', 'approver')
        ]);
    }

    /**
     * Setujui banyak izin kerja sekaligus (Bulk Approve).
     */
    public function bulkApprove(Request $request)
    {
        $user = $request->user();
        if (!$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr', 'dept-head', 'manager'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:leaves,id',
            'status' => 'required|in:approved,rejected',
        ]);

        $status = $request->status;
        $updatedCount = 0;

        DB::transaction(function () use ($request, $status, $user, &$updatedCount) {
            $leaves = Leave::whereIn('id', $request->ids)->where('status', 'pending')->get();
            foreach ($leaves as $leave) {
                $leave->update([
                    'status' => $status,
                    'approved_by' => $user->id,
                ]);

                if ($status === 'approved') {
                    $start = Carbon::parse($leave->start_date);
                    $end = Carbon::parse($leave->end_date);
                    $cur = $start->copy();

                    while ($cur->lte($end)) {
                        if ($cur->dayOfWeek !== Carbon::SUNDAY) {
                            $att = Attendance::firstOrNew([
                                'employee_id' => $leave->employee_id,
                                'date' => $cur->toDateString(),
                            ]);
                            $att->status = 'leave';
                            $att->type = 'manual';
                            $att->notes = ($leave->type === 'sick' ? 'Izin Sakit' : 'Izin Kerja') . ' Disetujui: ' . $leave->reason;
                            $att->save();
                        }
                        $cur->addDay();
                    }
                }
                $updatedCount++;
            }
        });

        return response()->json([
            'message' => "Sebanyak {$updatedCount} permohonan izin berhasil " . ($status === 'approved' ? 'disetujui' : 'ditolak') . "."
        ]);
    }
}
