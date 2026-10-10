<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobPosition;
use Illuminate\Http\Request;

class JobPositionController extends Controller
{
    public function index()
    {
        return response()->json(JobPosition::orderBy('level', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:job_positions,code',
            'name' => 'required|string',
            'level' => 'integer',
        ]);

        $jobPosition = JobPosition::create($validated);
        return response()->json($jobPosition, 201);
    }

    public function show(string $id)
    {
        $jobPosition = JobPosition::findOrFail($id);
        return response()->json($jobPosition);
    }

    public function update(Request $request, string $id)
    {
        $jobPosition = JobPosition::findOrFail($id);
        $validated = $request->validate([
            'code' => 'sometimes|string|unique:job_positions,code,' . $jobPosition->id,
            'name' => 'sometimes|string',
            'level' => 'integer',
        ]);

        $jobPosition->update($validated);
        return response()->json($jobPosition);
    }

    public function destroy(string $id)
    {
        $jobPosition = JobPosition::findOrFail($id);
        $jobPosition->delete();
        return response()->json(null, 204);
    }
}
