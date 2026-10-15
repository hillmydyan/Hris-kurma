<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ManagerTeamMember;
use App\Models\Employee;
use Illuminate\Http\Request;

class ManagerTeamController extends Controller
{
    /**
     * Get team members invited by the logged in manager and available employees.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Anggota tim yang telah di-invite oleh manager ini
        $teamMembers = ManagerTeamMember::where('manager_user_id', $user->id)
            ->with([
                'employee.currentAssignment.department',
                'employee.currentAssignment.jobPosition',
                'employee.user'
            ])
            ->latest()
            ->get();

        $invitedEmployeeIds = $teamMembers->pluck('employee_id')->toArray();

        // Karyawan aktif yang bisa di-invite (kecuali yang sudah di-invite dan akun diri sendiri)
        $managerEmployeeId = $user->employee?->id;
        $availableEmployees = Employee::with([
                'currentAssignment.department',
                'currentAssignment.jobPosition'
            ])
            ->where('status', 'active')
            ->whereNotIn('id', array_merge($invitedEmployeeIds, $managerEmployeeId ? [$managerEmployeeId] : []))
            ->orderBy('first_name')
            ->get();

        return response()->json([
            'team_members' => $teamMembers,
            'available_employees' => $availableEmployees,
            'total_team_count' => count($teamMembers),
        ]);
    }

    /**
     * Invite/Add employee to manager's team.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'employee_id' => 'required_without:employee_ids|exists:employees,id',
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'exists:employees,id',
        ]);

        $employeeIds = $request->input('employee_ids', []);
        if ($request->filled('employee_id')) {
            $employeeIds[] = $request->employee_id;
        }

        $employeeIds = array_unique($employeeIds);
        $added = 0;

        foreach ($employeeIds as $empId) {
            $exists = ManagerTeamMember::where('manager_user_id', $user->id)
                ->where('employee_id', $empId)
                ->exists();

            if (!$exists) {
                ManagerTeamMember::create([
                    'manager_user_id' => $user->id,
                    'employee_id' => $empId,
                ]);
                $added++;
            }
        }

        return response()->json([
            'message' => "Berhasil mengundang {$added} anggota ke dalam tim pemantauan Anda.",
            'added_count' => $added,
        ]);
    }

    /**
     * Remove employee from manager's team.
     */
    public function destroy(Request $request, $employeeId)
    {
        $user = $request->user();

        $deleted = ManagerTeamMember::where('manager_user_id', $user->id)
            ->where('employee_id', $employeeId)
            ->delete();

        if ($deleted) {
            return response()->json([
                'message' => 'Anggota berhasil dikeluarkan dari tim pemantauan.',
            ]);
        }

        return response()->json([
            'message' => 'Anggota tidak ditemukan dalam tim Anda.',
        ], 404);
    }
}
