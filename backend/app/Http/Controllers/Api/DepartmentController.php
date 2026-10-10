<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json(Department::with(['parent', 'manager'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:departments,code',
            'name' => 'required|string',
            'parent_id' => 'nullable|exists:departments,id',
            'manager_employee_id' => 'nullable|exists:employees,id',
        ]);

        $department = Department::create($validated);
        return response()->json($department, 201);
    }

    public function show(string $id)
    {
        $department = Department::with(['parent', 'manager'])->findOrFail($id);
        return response()->json($department);
    }

    public function update(Request $request, string $id)
    {
        $department = Department::findOrFail($id);
        $validated = $request->validate([
            'code' => 'sometimes|string|unique:departments,code,' . $department->id,
            'name' => 'sometimes|string',
            'parent_id' => 'nullable|exists:departments,id',
            'manager_employee_id' => 'nullable|exists:employees,id',
        ]);

        $department->update($validated);
        return response()->json($department);
    }

    public function destroy(string $id)
    {
        $department = Department::findOrFail($id);
        $department->delete();
        return response()->json(null, 204);
    }
}
