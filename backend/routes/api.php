<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

use App\Http\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login']);

use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\JobPositionController;
use App\Http\Controllers\Api\WorkLocationController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\AttachmentController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
        ]);
    });

    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('job-positions', JobPositionController::class);
    Route::apiResource('work-locations', WorkLocationController::class);
    Route::get('employees/export', [EmployeeController::class, 'export']);
    Route::post('employees/import', [EmployeeController::class, 'import']);
    Route::apiResource('employees', EmployeeController::class);
    Route::post('employees/{employee}/documents', [EmployeeController::class, 'uploadDocument']);
    Route::delete('employees/{employee}/documents/{document}', [EmployeeController::class, 'deleteDocument']);
    Route::apiResource('settings', SettingController::class);
    Route::apiResource('attachments', AttachmentController::class);
    
    Route::get('attendance/qr-code', [\App\Http\Controllers\AttendanceController::class, 'getQrCode']);
    Route::post('attendance/scan', [\App\Http\Controllers\AttendanceController::class, 'scanQrCode']);
    Route::get('attendance', [\App\Http\Controllers\AttendanceController::class, 'index']);
    
    Route::apiResource('attendance-corrections', \App\Http\Controllers\AttendanceCorrectionController::class)->only(['index', 'store', 'update']);
    Route::apiResource('leaves', \App\Http\Controllers\LeaveController::class)->only(['index', 'store', 'update']);
    Route::apiResource('tasks', \App\Http\Controllers\TaskController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('kpis', \App\Http\Controllers\KpiController::class)->only(['index', 'store']);
});
