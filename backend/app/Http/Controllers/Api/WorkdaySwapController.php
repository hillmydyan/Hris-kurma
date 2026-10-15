<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkdaySwap;
use App\Models\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;

class WorkdaySwapController extends Controller
{
    /**
     * Get list of workday swaps.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isHrOrAdmin = $user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr']);

        $query = WorkdaySwap::with([
            'employee.currentAssignment.department',
            'employee.currentAssignment.jobPosition',
            'approver'
        ]);

        if (!$isHrOrAdmin) {
            $employee = $user->employee;
            if (!$employee) {
                return response()->json([]);
            }
            $query->where('employee_id', $employee->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('month')) {
            $month = $request->query('month'); // YYYY-MM
            $query->where(function ($q) use ($month) {
                $q->where('original_date', 'like', "{$month}%")
                  ->orWhere('replacement_date', 'like', "{$month}%");
            });
        }

        $swaps = $query->latest()->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'employee_id' => $s->employee_id,
                'employee_code' => $s->employee?->employee_id,
                'employee_name' => $s->employee?->full_name,
                'department' => $s->employee?->currentAssignment?->department?->name ?? 'Umum',
                'job_position' => $s->employee?->currentAssignment?->jobPosition?->name ?? 'Staff',
                'original_date' => $s->original_date,
                'original_day' => Carbon::parse($s->original_date)->translatedFormat('l'),
                'replacement_date' => $s->replacement_date,
                'replacement_day' => Carbon::parse($s->replacement_date)->translatedFormat('l'),
                'reason' => $s->reason,
                'status' => $s->status,
                'approved_by_name' => $s->approver?->name,
                'rejection_reason' => $s->rejection_reason,
                'created_at' => $s->created_at?->format('Y-m-d H:i'),
            ];
        });

        return response()->json($swaps);
    }

    /**
     * Submit a workday swap request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'original_date' => 'required|date',
            'replacement_date' => 'required|date|different:original_date',
            'reason' => 'required|string|max:500',
            'employee_id' => 'nullable|exists:employees,id', // Optional for HR creating on behalf
        ]);

        $user = $request->user();
        $isHrOrAdmin = $user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr']);

        $employeeId = $validated['employee_id'] ?? null;
        if (!$employeeId) {
            $employee = $user->employee;
            if (!$employee) {
                return response()->json(['error' => 'Profil karyawan tidak ditemukan untuk akun Anda.'], 403);
            }
            $employeeId = $employee->id;
        }

        // Check for existing pending request on the same original date
        $exists = WorkdaySwap::where('employee_id', $employeeId)
            ->where('original_date', $validated['original_date'])
            ->where('status', 'pending')
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Anda sudah memiliki permohonan ganti hari yang berstatus Menunggu untuk tanggal tersebut.'], 422);
        }

        $swap = WorkdaySwap::create([
            'employee_id' => $employeeId,
            'original_date' => $validated['original_date'],
            'replacement_date' => $validated['replacement_date'],
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Pengajuan ganti hari kerja berhasil dikirim dan menunggu persetujuan HR.',
            'data' => $swap->load('employee')
        ], 201);
    }

    /**
     * Approve or reject a workday swap request (HR / Admin only).
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        if (!$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr'])) {
            return response()->json(['error' => 'Hanya HR atau Manajemen yang berhak menyetujui pengajuan ganti hari.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $swap = WorkdaySwap::findOrFail($id);

        $swap->update([
            'status' => $validated['status'],
            'approved_by' => $user->id,
            'rejection_reason' => $validated['status'] === 'rejected' ? ($validated['rejection_reason'] ?? 'Ditolak oleh HR') : null,
        ]);

        $statusText = $validated['status'] === 'approved' ? 'disetujui' : 'ditolak';

        return response()->json([
            'message' => "Pengajuan ganti hari kerja berhasil {$statusText}.",
            'data' => $swap->load('employee', 'approver')
        ]);
    }

    /**
     * Bulk approve or reject workday swaps.
     */
    public function bulkApprove(Request $request)
    {
        $user = $request->user();
        if (!$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:workday_swaps,id',
            'status' => 'required|in:approved,rejected',
        ]);

        $status = $request->status;
        $updatedCount = WorkdaySwap::whereIn('id', $request->ids)
            ->where('status', 'pending')
            ->update([
                'status' => $status,
                'approved_by' => $user->id,
            ]);

        return response()->json([
            'message' => "Sebanyak {$updatedCount} pengajuan ganti hari berhasil " . ($status === 'approved' ? 'disetujui' : 'ditolak') . "."
        ]);
    }

    /**
     * Cancel or delete a workday swap request.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $swap = WorkdaySwap::findOrFail($id);

        $isHrOrAdmin = $user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr']);
        $isOwner = $user->employee && $user->employee->id === $swap->employee_id;

        if (!$isHrOrAdmin && (!$isOwner || $swap->status !== 'pending')) {
            return response()->json(['error' => 'Anda hanya dapat membatalkan pengajuan ganti hari milik Anda yang masih berstatus pending.'], 403);
        }

        $swap->delete();

        return response()->json(['message' => 'Pengajuan ganti hari berhasil dibatalkan.']);
    }
}
