<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $query = Setting::query();
        if ($request->has('group')) {
            $query->where('group', $request->group);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'group' => 'required|string',
            'key' => 'required|string|unique:settings,key',
            'value' => 'nullable|string',
            'type' => 'required|string'
        ]);

        $setting = Setting::create($validated);
        return response()->json($setting, 201);
    }

    public function show(string $id)
    {
        $setting = Setting::findOrFail($id);
        return response()->json($setting);
    }

    public function update(Request $request, string $id)
    {
        $setting = Setting::findOrFail($id);
        $validated = $request->validate([
            'group' => 'sometimes|string',
            'key' => 'sometimes|string|unique:settings,key,' . $setting->id,
            'value' => 'nullable|string',
            'type' => 'sometimes|string'
        ]);

        $setting->update($validated);
        return response()->json($setting);
    }

    public function destroy(string $id)
    {
        $setting = Setting::findOrFail($id);
        $setting->delete();
        return response()->json(null, 204);
    }
}
