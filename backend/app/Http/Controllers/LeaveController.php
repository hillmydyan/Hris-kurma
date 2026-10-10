<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Leave;
use Illuminate\Support\Facades\DB;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole('HR') || $user->hasRole('Admin')) {
            $leaves = Leave::with('employee')->latest()->get();
            return response()->json($leaves);
        }

        $employee = $user->employee;
        if (!$employee) return response()->json([], 403);

        $leaves = $employee->leaves()->latest()->get();
        return response()->json($leaves);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:annual,sick,unpaid,maternity,other',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
        ]);

        $employee = $request->user()->employee;
        if (!$employee) return response()->json(['error' => 'Not an employee'], 403);

        $leave = Leave::create([
            'employee_id' => $employee->id,
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Leave request submitted', 'data' => $leave], 201);
    }

    public function update(Request $request, Leave $leave)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $user = $request->user();
        if (!$user->hasRole('HR') && !$user->hasRole('Admin')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $leave->update([
            'status' => $request->status,
            'approved_by' => $user->id,
        ]);

        return response()->json(['message' => 'Leave updated', 'data' => $leave]);
    }
}
