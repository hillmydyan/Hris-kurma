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
            'employee_id' => 'required|string|unique:employees,employee_id',
            'first_name' => 'required|string',
            'last_name' => 'nullable|string',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'nullable|string',
            'join_date' => 'required|date',
            'create_user' => 'boolean',
            'role' => 'nullable|string',
            'department_id' => 'required|exists:departments,id',
            'job_position_id' => 'required|exists:job_positions,id'
        ]);

        DB::beginTransaction();
        try {
            $userId = null;
            if (!empty($validated['create_user'])) {
                $user = User::create([
                    'name' => $validated['first_name'] . ' ' . ($validated['last_name'] ?? ''),
                    'email' => $validated['email'],
                    'password' => Hash::make('password123'), // Default password
                ]);
                if (!empty($validated['role'])) {
                    $user->assignRole($validated['role']);
                }
                $userId = $user->id;
            }

            $employee = Employee::create(array_merge($validated, ['user_id' => $userId]));
            
            // Create default assignment
            $employee->assignments()->create([
                'department_id' => $validated['department_id'],
                'job_position_id' => $validated['job_position_id'],
                'work_location_id' => 1, // Default to first location for now
                'start_date' => $validated['join_date'],
                'is_primary' => true,
            ]);
            
            DB::commit();
            return response()->json($employee->load(['user', 'currentAssignment.department', 'currentAssignment.jobPosition']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
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

    public function export()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\EmployeesExport, 'employees.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:5120',
        ]);

        \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\EmployeesImport, $request->file('file'));

        return response()->json(['message' => 'Employees imported successfully']);
    }
}
