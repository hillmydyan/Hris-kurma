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
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkdaySwapController;
use App\Http\Controllers\Api\WeekendScheduleController;
use App\Http\Controllers\Api\DashboardController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('dashboard/overview', [DashboardController::class, 'overview']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        $user->load(['employee.currentAssignment.department', 'employee.currentAssignment.jobPosition', 'employee.currentAssignment.workLocation']);
        
        $weekendInfo = null;
        if ($user->employee) {
            $weekStart = \Carbon\Carbon::now()->startOfWeek()->toDateString();
            $sched = $user->employee->getWeekendScheduleForWeek($weekStart);
            $assigned = $sched['assigned_workday'];
            $pattern = $sched['pattern'];

            $weekendInfo = [
                'pattern' => $pattern,
                'assigned_workday' => $assigned,
                'off_workday' => $sched['off_workday'],
                'label' => $assigned === 'saturday' ? 'Masuk Sabtu' : 'Masuk Minggu',
                'subtitle' => ($sched['is_auto_rotating'] ?? false)
                    ? ($assigned === 'saturday' ? 'Minggu Libur (Pekan depan: Minggu)' : 'Sabtu Libur (Pekan depan: Sabtu)')
                    : ($assigned === 'saturday' ? 'Minggu Libur (Bebas Absen)' : 'Sabtu Libur (Bebas Absen)'),
                'is_rotating' => $pattern === 'rotating',
                'is_auto_rotating' => $sched['is_auto_rotating'] ?? false,
                'next_week_workday' => $sched['next_week_workday'] ?? null,
            ];
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'can_access_backend' => $user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr', 'dept-head', 'manager']),
            'employee' => $user->employee,
            'weekend_schedule' => $weekendInfo,
        ]);
    });

    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('job-positions', JobPositionController::class);
    Route::apiResource('work-locations', WorkLocationController::class);
    Route::get('employees/export', [EmployeeController::class, 'export']);
    Route::get('employees/template', [EmployeeController::class, 'template']);
    Route::post('employees/import', [EmployeeController::class, 'import']);
    Route::apiResource('employees', EmployeeController::class);
    Route::post('employees/{employee}/documents', [EmployeeController::class, 'uploadDocument']);
    Route::post('settings/bulk', [SettingController::class, 'updateBulk']);
    Route::apiResource('settings', SettingController::class);
    Route::get('audit-logs', [\App\Http\Controllers\Api\AuditLogController::class, 'index']);
    Route::apiResource('attachments', AttachmentController::class);
    
    Route::get('attendance/my-summary', [\App\Http\Controllers\AttendanceController::class, 'mySummary']);
    Route::get('attendance/qr-code', [\App\Http\Controllers\AttendanceController::class, 'getQrCode']);
    Route::get('attendance/static-qr', [\App\Http\Controllers\AttendanceController::class, 'getStaticQrCode']);
    Route::get('attendance/daily-qr', [\App\Http\Controllers\AttendanceController::class, 'getStaticQrCode']);
    Route::post('attendance/scan', [\App\Http\Controllers\AttendanceController::class, 'scanQrCode']);
    Route::get('attendance', [\App\Http\Controllers\AttendanceController::class, 'index']);
    
    Route::post('attendance-corrections/bulk', [\App\Http\Controllers\AttendanceCorrectionController::class, 'bulkApprove']);
    Route::apiResource('attendance-corrections', \App\Http\Controllers\AttendanceCorrectionController::class)->only(['index', 'store', 'update']);
    Route::post('leaves/bulk', [\App\Http\Controllers\LeaveController::class, 'bulkApprove']);
    Route::apiResource('leaves', \App\Http\Controllers\LeaveController::class)->only(['index', 'store', 'update']);
    
    // Daily Report Spreadsheet Endpoints
    Route::get('daily-reports/today', [\App\Http\Controllers\DailyReportController::class, 'getToday']);
    Route::post('daily-reports/draft', [\App\Http\Controllers\DailyReportController::class, 'saveDraft']);
    Route::post('daily-reports/{id}/submit', [\App\Http\Controllers\DailyReportController::class, 'submit']);
    Route::post('daily-reports/{id}/review', [\App\Http\Controllers\DailyReportController::class, 'review']);
    Route::get('daily-reports/{id}', [\App\Http\Controllers\DailyReportController::class, 'show']);
    Route::get('daily-reports', [\App\Http\Controllers\DailyReportController::class, 'index']);

    Route::apiResource('tasks', \App\Http\Controllers\TaskController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('payroll/summary', [\App\Http\Controllers\PayrollPeriodController::class, 'summary']);
    Route::post('payroll/adjust', [\App\Http\Controllers\PayrollPeriodController::class, 'adjust']);
    Route::delete('payroll/adjust/{employeeId}', [\App\Http\Controllers\PayrollPeriodController::class, 'resetAdjustment']);
    Route::post('payroll/publish-all', [\App\Http\Controllers\PayrollPeriodController::class, 'publishAll']);
    Route::post('payroll/publish-single', [\App\Http\Controllers\PayrollPeriodController::class, 'publishSingle']);
    Route::post('payroll/unpublish', [\App\Http\Controllers\PayrollPeriodController::class, 'unpublish']);
    Route::get('payroll/my-slips', [\App\Http\Controllers\PayrollPeriodController::class, 'mySlips']);
    Route::get('payroll/my-latest-slip', [\App\Http\Controllers\PayrollPeriodController::class, 'myLatestSlip']);
    Route::apiResource('payroll-periods', \App\Http\Controllers\PayrollPeriodController::class)->only(['index', 'store']);

    // User Management & Password Endpoints
    Route::post('user/change-password', [UserController::class, 'changePassword']);
    Route::get('users/roles', [UserController::class, 'getRoles']);
    Route::get('users/unlinked-employees', [UserController::class, 'getUnlinkedEmployees']);
    Route::post('users/{id}/reset-password', [UserController::class, 'resetPassword']);
    Route::post('users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
    Route::apiResource('users', UserController::class);

    // Weekend Schedule & Roster Endpoints
    Route::get('weekend-schedules', [WeekendScheduleController::class, 'index']);
    Route::post('weekend-schedules', [WeekendScheduleController::class, 'store']);
    Route::post('weekend-schedules/bulk', [WeekendScheduleController::class, 'bulkUpdate']);
    Route::post('employees/{id}/weekend-pattern', [WeekendScheduleController::class, 'updatePattern']);

    // Workday Swap (Pengajuan Ganti Hari) Endpoints
    Route::post('workday-swaps/bulk', [WorkdaySwapController::class, 'bulkApprove']);
    Route::apiResource('workday-swaps', WorkdaySwapController::class)->only(['index', 'store', 'update', 'destroy']);

    // Manager Team Management (Invite ke Tim Pemantauan Daily Report)
    Route::get('manager-team', [\App\Http\Controllers\Api\ManagerTeamController::class, 'index']);
    Route::post('manager-team/invite', [\App\Http\Controllers\Api\ManagerTeamController::class, 'store']);
    Route::delete('manager-team/{employee_id}', [\App\Http\Controllers\Api\ManagerTeamController::class, 'destroy']);

    // In-App Notifications & HR Broadcast Endpoints
    Route::get('notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::post('notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    Route::post('notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::delete('notifications/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
    Route::get('notifications/broadcasts', [\App\Http\Controllers\Api\NotificationController::class, 'broadcasts']);
    Route::post('notifications/broadcast', [\App\Http\Controllers\Api\NotificationController::class, 'storeBroadcast']);
    Route::delete('notifications/broadcasts/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroyBroadcast']);
});
