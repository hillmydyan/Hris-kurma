<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of users with roles & employee association.
     */
    public function index(Request $request)
    {
        $query = User::with([
            'roles',
            'employee.currentAssignment.department',
            'employee.currentAssignment.jobPosition'
        ]);

        // Search by name, email, or employee_id
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('employee', function ($eq) use ($search) {
                      $eq->where('employee_id', 'like', "%{$search}%")
                         ->orWhere('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->role($request->query('role'));
        }

        // Filter by status (active / inactive)
        if ($request->filled('status')) {
            $isActive = $request->query('status') === 'active' ? 1 : 0;
            $query->where('is_active', $isActive);
        }

        $users = $query->latest('id')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'is_active' => (bool)$u->is_active,
                'roles' => $u->getRoleNames(),
                'primary_role' => $u->getRoleNames()->first() ?? 'employee',
                'created_at' => $u->created_at?->format('Y-m-d H:i:s'),
                'employee' => $u->employee ? [
                    'id' => $u->employee->id,
                    'employee_id' => $u->employee->employee_id,
                    'first_name' => $u->employee->first_name,
                    'last_name' => $u->employee->last_name,
                    'full_name' => $u->employee->full_name,
                    'department' => $u->employee->currentAssignment?->department?->name ?? '-',
                    'job_position' => $u->employee->currentAssignment?->jobPosition?->name ?? '-',
                ] : null,
            ];
        });

        return response()->json($users);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|exists:roles,name',
            'is_active' => 'nullable|boolean',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $user->assignRole($validated['role']);

            // Link employee if provided
            if (!empty($validated['employee_id'])) {
                $employee = Employee::find($validated['employee_id']);
                if ($employee) {
                    $employee->update(['user_id' => $user->id]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Pengguna berhasil ditambahkan!',
                'user' => $user->load('roles', 'employee')
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Gagal membuat pengguna: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified user.
     */
    public function show(string $id)
    {
        $user = User::with([
            'roles',
            'employee.currentAssignment.department',
            'employee.currentAssignment.jobPosition'
        ])->findOrFail($id);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_active' => (bool)$user->is_active,
            'roles' => $user->getRoleNames(),
            'employee' => $user->employee,
        ]);
    }

    /**
     * Update user details and roles.
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:150',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|string|exists:roles,name',
            'is_active' => 'sometimes|boolean',
            'password' => 'nullable|string|min:6',
        ]);

        DB::beginTransaction();
        try {
            $data = [];
            if (isset($validated['name'])) $data['name'] = $validated['name'];
            if (isset($validated['email'])) $data['email'] = $validated['email'];
            if (isset($validated['is_active'])) $data['is_active'] = $validated['is_active'];
            if (!empty($validated['password'])) {
                $data['password'] = Hash::make($validated['password']);
            }

            if (!empty($data)) {
                $user->update($data);
            }

            if (isset($validated['role'])) {
                $user->syncRoles([$validated['role']]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Data pengguna berhasil diperbarui!',
                'user' => $user->load('roles', 'employee')
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Gagal memperbarui pengguna: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Admin action to reset/change user's password.
     */
    public function resetPassword(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => "Kata sandi untuk pengguna '{$user->name}' berhasil diperbarui!"
        ]);
    }

    /**
     * Self-service change password for currently authenticated user.
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'error' => 'Kata sandi saat ini tidak cocok. Mohon periksa kembali kata sandi lama Anda.'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'message' => 'Kata sandi Anda berhasil diubah! Silakan gunakan kata sandi baru untuk login selanjutnya.'
        ]);
    }

    /**
     * Toggle active/inactive status.
     */
    public function toggleStatus(string $id)
    {
        $user = User::findOrFail($id);

        if (auth()->id() == $user->id) {
            return response()->json(['error' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.'], 400);
        }

        $user->update([
            'is_active' => !$user->is_active
        ]);

        $statusText = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return response()->json([
            'message' => "Akun {$user->name} berhasil {$statusText}.",
            'is_active' => (bool)$user->is_active
        ]);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);

        if (auth()->id() == $user->id) {
            return response()->json(['error' => 'Anda tidak dapat menghapus akun Anda sendiri.'], 400);
        }

        DB::beginTransaction();
        try {
            // Unlink any associated employee
            if ($user->employee) {
                $user->employee->update(['user_id' => null]);
            }

            // Revoke all tokens
            $user->tokens()->delete();

            $user->delete();
            DB::commit();

            return response()->json(['message' => 'Pengguna berhasil dihapus.']);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Gagal menghapus pengguna: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get list of available system roles for user assignment.
     */
    public function getRoles()
    {
        $roles = Role::all()->map(function ($r) {
            $labels = [
                'super-admin' => 'Super Admin (Full Akses)',
                'owner' => 'Owner / Pemilik Perusahaan',
                'direksi' => 'Direksi / Eksekutif',
                'hr-manager' => 'HR Manager / HR Admin',
                'dept-head' => 'Kepala Departemen / Manager',
                'finance-staff' => 'Staff Finance',
                'employee' => 'Karyawan / Staff Operasional',
            ];

            return [
                'id' => $r->id,
                'name' => $r->name,
                'label' => $labels[$r->name] ?? ucfirst($r->name),
            ];
        });

        return response()->json($roles);
    }

    /**
     * Get list of employees who do not have a linked user account.
     */
    public function getUnlinkedEmployees()
    {
        $employees = Employee::whereNull('user_id')->get(['id', 'employee_id', 'first_name', 'last_name', 'email']);
        return response()->json($employees);
    }
}
