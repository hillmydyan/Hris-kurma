<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkLocation;
use Illuminate\Http\Request;

class WorkLocationController extends Controller
{
    public function index()
    {
        return response()->json(WorkLocation::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:work_locations,code',
            'name' => 'required|string',
            'address' => 'nullable|string',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
            'radius_meters' => 'integer',
            'timezone' => 'string'
        ]);

        $workLocation = WorkLocation::create($validated);
        return response()->json($workLocation, 201);
    }

    public function show(string $id)
    {
        $workLocation = WorkLocation::findOrFail($id);
        return response()->json($workLocation);
    }

    public function update(Request $request, string $id)
    {
        $workLocation = WorkLocation::findOrFail($id);
        $validated = $request->validate([
            'code' => 'sometimes|string|unique:work_locations,code,' . $workLocation->id,
            'name' => 'sometimes|string',
            'address' => 'nullable|string',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
            'radius_meters' => 'integer',
            'timezone' => 'string'
        ]);

        $workLocation->update($validated);
        return response()->json($workLocation);
    }

    public function destroy(string $id)
    {
        $workLocation = WorkLocation::findOrFail($id);
        $workLocation->delete();
        return response()->json(null, 204);
    }
}
