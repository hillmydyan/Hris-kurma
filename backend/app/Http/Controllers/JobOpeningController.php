<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\JobOpening;

class JobOpeningController extends Controller
{
    public function index()
    {
        return response()->json(JobOpening::latest()->get());
    }
}
