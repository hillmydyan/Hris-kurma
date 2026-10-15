<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\EmployeeDocument;

class EmployeeController extends Controller
{
    public function index()
    {
        return response()->json(Employee::with(['user', 'currentAssignment.department', 'currentAssignment.jobPosition'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|string|unique:employees,employee_id',
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'email' => 'required|email|unique:employees,email|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'nik' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female',
            'employment_type' => 'nullable|string',
            'weekend_pattern' => 'nullable|string|in:saturday_fixed,sunday_fixed,rotating',
            'basic_salary' => 'nullable|numeric|min:0',
            'allowances' => 'nullable|numeric|min:0',
            'bank_name' => 'nullable|string|max:50',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_holder' => 'nullable|string|max:100',
            'join_date' => 'required|date',
            'create_user' => 'nullable|boolean',
            'role' => 'nullable|string',
            'department_id' => 'required|exists:departments,id',
            'job_position_id' => 'required|exists:job_positions,id'
        ]);

        if (empty($validated['employee_id'])) {
            $nextId = (Employee::max('id') ?? 0) + 1;
            $validated['employee_id'] = 'EMP-' . str_pad((string)$nextId, 3, '0', STR_PAD_LEFT);
        }

        $validated['basic_salary'] = $validated['basic_salary'] ?? 0;
        $validated['allowances'] = 0; // Tunjangan ditiadakan, diganti Uang Makan Rp 11.000/hari
        $validated['status'] = $validated['status'] ?? 'active';
        $validated['employment_type'] = $validated['employment_type'] ?? 'permanent';
        $validated['bank_name'] = $validated['bank_name'] ?? 'BCA';

        DB::beginTransaction();
        try {
            $fullName = trim($validated['first_name'] . ' ' . ($validated['last_name'] ?? ''));
            $validated['bank_account_holder'] = $validated['bank_account_holder'] ?: $fullName;

            $userId = null;
            // Always create linked User account so employee can log in
            $user = User::create([
                'name' => $fullName,
                'email' => $validated['email'],
                'password' => Hash::make('password123'),
                'is_active' => true,
            ]);

            $assignedRole = !empty($validated['role']) ? $validated['role'] : 'employee';
            $user->assignRole($assignedRole);
            $userId = $user->id;

            $employee = Employee::create(array_merge($validated, ['user_id' => $userId]));
            
            // Dynamic work location fallback
            $defaultLocation = \App\Models\WorkLocation::first();
            $locationId = $defaultLocation ? $defaultLocation->id : 1;

            // Create primary assignment
            $employee->assignments()->create([
                'department_id' => $validated['department_id'],
                'job_position_id' => $validated['job_position_id'],
                'work_location_id' => $locationId,
                'start_date' => $validated['join_date'],
                'is_primary' => true,
            ]);
            
            DB::commit();
            return response()->json($employee->load(['user', 'currentAssignment.department', 'currentAssignment.jobPosition']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Gagal menambahkan karyawan: ' . $e->getMessage()], 500);
        }
    }

    public function show(string $id)
    {
        $employee = Employee::with([
            'user', 
            'currentAssignment.department', 
            'currentAssignment.jobPosition',
            'assignments.department',
            'assignments.jobPosition',
            'documents'
        ])->findOrFail($id);
        return response()->json($employee);
    }

    public function update(Request $request, string $id)
    {
        $employee = Employee::with('user', 'currentAssignment')->findOrFail($id);
        $validated = $request->validate([
            'employee_id' => 'sometimes|string|unique:employees,employee_id,' . $employee->id,
            'first_name' => 'sometimes|string',
            'last_name' => 'nullable|string',
            'email' => 'sometimes|email|unique:employees,email,' . $employee->id,
            'phone' => 'nullable|string',
            'nik' => 'nullable|string',
            'address' => 'nullable|string',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string',
            'employment_type' => 'nullable|string',
            'weekend_pattern' => 'nullable|string|in:saturday_fixed,sunday_fixed,rotating',
            'basic_salary' => 'nullable|numeric|min:0',
            'allowances' => 'nullable|numeric|min:0',
            'bank_name' => 'nullable|string',
            'bank_account_number' => 'nullable|string',
            'bank_account_holder' => 'nullable|string',
            'join_date' => 'sometimes|date',
            'resign_date' => 'nullable|date',
            'status' => 'sometimes|string|in:active,inactive',
            'role' => 'nullable|string',
            'department_id' => 'sometimes|exists:departments,id',
            'job_position_id' => 'sometimes|exists:job_positions,id',
        ]);

        DB::beginTransaction();
        try {
            $employee->update($validated);
            
            if (isset($validated['department_id']) || isset($validated['job_position_id'])) {
                $assignment = $employee->currentAssignment;
                if ($assignment) {
                    $assignment->update([
                        'department_id' => $validated['department_id'] ?? $assignment->department_id,
                        'job_position_id' => $validated['job_position_id'] ?? $assignment->job_position_id,
                    ]);
                } else {
                    $employee->assignments()->create([
                        'department_id' => $validated['department_id'],
                        'job_position_id' => $validated['job_position_id'],
                        'work_location_id' => 1,
                        'start_date' => now(),
                        'is_primary' => true,
                    ]);
                }
            }

            // Update user if exists
            if ($employee->user) {
                if (isset($validated['email'])) {
                    $employee->user->update(['email' => $validated['email']]);
                }
                // Only update user is_active if column exists, for now we will skip this or assume it doesn't cause errors
            }

            DB::commit();
            return response()->json($employee->load(['user', 'currentAssignment.department', 'currentAssignment.jobPosition']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id)
    {
        $employee = Employee::findOrFail($id);
        if ($employee->user) {
            $employee->user->delete();
        }
        $employee->delete();
        return response()->json(null, 204);
    }

    public function uploadDocument(Request $request, string $employeeId)
    {
        $employee = Employee::findOrFail($employeeId);
        
        $validated = $request->validate([
            'document_type' => 'required|string',
            'document_number' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('employee-documents', 'public');
            
            $document = $employee->documents()->create([
                'document_type' => $validated['document_type'],
                'document_number' => $validated['document_number'] ?? null,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'file_path' => $path,
            ]);

            return response()->json($document, 201);
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }

    public function deleteDocument(string $employeeId, string $documentId)
    {
        $employee = Employee::findOrFail($employeeId);
        $document = $employee->documents()->findOrFail($documentId);

        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();
        return response()->json(['message' => 'Document deleted']);
    }

    public function export(Request $request)
    {
        $format = strtolower($request->query('format', 'xlsx'));
        $fileName = 'Data_Karyawan_KurmaGroup_' . date('Y-m-d') . '.' . ($format === 'csv' ? 'csv' : 'xlsx');

        if ($format === 'csv') {
            return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\EmployeesExport, $fileName, \Maatwebsite\Excel\Excel::CSV);
        }

        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\EmployeesExport, $fileName);
    }

    public function template(Request $request)
    {
        $format = strtolower($request->query('format', 'xlsx'));
        $fileName = 'Template_Import_Karyawan.' . ($format === 'csv' ? 'csv' : 'xlsx');

        if ($format === 'csv') {
            return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\EmployeesTemplateExport, $fileName, \Maatwebsite\Excel\Excel::CSV);
        }

        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\EmployeesTemplateExport, $fileName);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:10240',
        ]);

        try {
            $import = new \App\Imports\EmployeesImport();
            \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));

            return response()->json([
                'message' => "Berhasil mengimpor {$import->getRowCount()} data karyawan!",
                'imported_count' => $import->getRowCount(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Gagal mengimpor file: ' . $e->getMessage()
            ], 422);
        }
    }
}
