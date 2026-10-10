<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\PayrollPeriod;

class PayrollPeriodController extends Controller
{
    public function index()
    {
        return response()->json(PayrollPeriod::latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);
        
        $data['status'] = 'draft';
        $period = PayrollPeriod::create($data);
        return response()->json($period, 201);
    }
}
