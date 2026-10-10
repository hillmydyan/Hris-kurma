<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Kpi;

class KpiController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole('HR') || $user->hasRole('Admin')) {
            $kpis = Kpi::with('employee')->latest()->get();
            return response()->json($kpis);
        }

        $employee = $user->employee;
        if (!$employee) return response()->json([], 403);

        $kpis = $employee->kpis()->latest()->get();
        return response()->json($kpis);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|string',
            'score' => 'required|integer|min:0|max:100',
            'feedback' => 'nullable|string',
        ]);

        $kpi = Kpi::updateOrCreate(
            ['employee_id' => $request->employee_id, 'month' => $request->month],
            ['score' => $request->score, 'feedback' => $request->feedback]
        );

        return response()->json(['message' => 'KPI updated', 'data' => $kpi], 200);
    }
}
