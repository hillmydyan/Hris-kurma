<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DailyReport;
use App\Models\DailyReportEntry;
use App\Models\DailyReportReview;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DailyReportController extends Controller
{
    /**
     * List daily reports based on permissions:
     * - Admin/HR: all reports with filter
     * - Dept Manager: team reports in their department
     * - Staff: their own reports
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = DailyReport::with([
            'employee.currentAssignment.department',
            'employee.currentAssignment.jobPosition',
            'entries',
            'reviewer'
        ])->latest('report_date');

        if ($user->can('daily_report.view_all') || $user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr'])) {
            // Full access across all departments
            if ($request->filled('only_my_team') && ($request->only_my_team === 'true' || $request->only_my_team === '1')) {
                $invitedEmployeeIds = \App\Models\ManagerTeamMember::where('manager_user_id', $user->id)
                    ->pluck('employee_id')
                    ->toArray();
                $query->whereIn('employee_id', $invitedEmployeeIds);
            }
            if ($request->filled('department_id')) {
                $query->where('department_id', $request->department_id);
            }
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('date')) {
                $query->where('report_date', $request->date);
            }
            if ($request->filled('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }
            if ($request->filled('has_notes')) {
                if ($request->has_notes === 'true' || $request->has_notes === '1') {
                    $query->whereNotNull('overall_feedback')->where('overall_feedback', '!=', '');
                } else if ($request->has_notes === 'false' || $request->has_notes === '0') {
                    $query->where(function($q) {
                        $q->whereNull('overall_feedback')->orWhere('overall_feedback', '');
                    });
                }
            }

            return response()->json($query->paginate(20));
        }

        if ($user->can('daily_report.view_team') || $user->hasAnyRole(['dept-head', 'manager'])) {
            // Department head / Manager: Pantau HANYA anggota tim yang di-invite saja
            $invitedEmployeeIds = \App\Models\ManagerTeamMember::where('manager_user_id', $user->id)
                ->pluck('employee_id')
                ->toArray();

            // Filter ketat hanya karyawan yang di-invite ke tim
            $query->whereIn('employee_id', $invitedEmployeeIds);

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('date')) {
                $query->where('report_date', $request->date);
            }
            if ($request->filled('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }
            if ($request->filled('has_notes')) {
                if ($request->has_notes === 'true' || $request->has_notes === '1') {
                    $query->whereNotNull('overall_feedback')->where('overall_feedback', '!=', '');
                } else if ($request->has_notes === 'false' || $request->has_notes === '0') {
                    $query->where(function($q) {
                        $q->whereNull('overall_feedback')->orWhere('overall_feedback', '');
                    });
                }
            }

            return response()->json($query->paginate(20));
        }

        // Staff own reports
        $employee = $user->employee;
        if (!$employee) {
            return response()->json(['error' => 'Profil karyawan tidak ditemukan.'], 403);
        }

        $reports = DailyReport::where('employee_id', $employee->id)
            ->with(['entries', 'reviews.reviewer'])
            ->latest('report_date')
            ->paginate(15);

        return response()->json($reports);
    }

    /**
     * Get or initialize today's daily report for the logged in employee.
     */
    public function getToday(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['error' => 'Profil karyawan tidak ditemukan.'], 403);
        }

        $date = $request->input('date', Carbon::today()->toDateString());
        $assignment = $employee->currentAssignment;

        $report = DailyReport::where('employee_id', $employee->id)
            ->where('report_date', $date)
            ->with(['entries', 'reviews.reviewer'])
            ->first();

        if (!$report) {
            // Return empty skeleton with default structure
            return response()->json([
                'id' => null,
                'employee_id' => $employee->id,
                'report_date' => $date,
                'department_id' => $assignment?->department_id,
                'department_name' => $assignment?->department?->name,
                'job_position_name' => $assignment?->jobPosition?->name,
                'status' => 'draft',
                'entries' => [
                    [
                        'row_order' => 1,
                        'time_start' => '08:00',
                        'time_end' => '10:00',
                        'activity' => '',
                        'output_result' => '',
                        'status' => 'done',
                        'notes' => '',
                    ]
                ],
                'reviews' => [],
            ]);
        }

        return response()->json($report);
    }

    /**
     * Save draft or autosave daily report entries.
     * Karyawan dapat mengisi atau memperbarui aktivitas kapan saja tanpa diblokir penguncian.
     */
    public function saveDraft(Request $request)
    {
        $request->validate([
            'report_date' => 'required|date',
            'entries' => 'required|array',
            'entries.*.activity' => 'nullable|string',
            'summary_notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['error' => 'Profil karyawan tidak ditemukan.'], 403);
        }

        $assignment = $employee->currentAssignment;

        DB::beginTransaction();
        try {
            $report = DailyReport::firstOrNew([
                'employee_id' => $employee->id,
                'report_date' => $request->report_date,
            ]);

            if (!$report->exists) {
                $report->department_id = $assignment?->department_id;
                $report->job_position_id = $assignment?->job_position_id;
            }

            // Tidak perlu kirim laporan terpisah, cukup simpan langsung berstatus submitted
            $report->status = 'submitted';
            if (!$report->submitted_at) {
                $report->submitted_at = Carbon::now();
            }

            $report->summary_notes = $request->summary_notes;
            $report->save();

            // Replace entries
            $report->entries()->delete();

            $order = 1;
            foreach ($request->entries as $entry) {
                if (empty(trim($entry['activity'] ?? '')) && empty(trim($entry['output_result'] ?? ''))) {
                    continue; // skip completely empty rows
                }

                DailyReportEntry::create([
                    'daily_report_id' => $report->id,
                    'row_order' => $order++,
                    'time_start' => !empty($entry['time_start']) ? $entry['time_start'] : null,
                    'time_end' => !empty($entry['time_end']) ? $entry['time_end'] : null,
                    'activity' => $entry['activity'] ?? '',
                    'output_result' => $entry['output_result'] ?? null,
                    'status' => in_array($entry['status'] ?? '', ['done', 'in_progress', 'pending', 'blocked']) ? $entry['status'] : 'done',
                    'notes' => $entry['notes'] ?? null,
                    'custom_attributes' => $entry['custom_attributes'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Daily Report berhasil disimpan.',
                'report' => $report->load(['entries', 'reviews.reviewer']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Gagal menyimpan draft: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Submit daily report.
     * Menandai laporan telah selesai diisi / diserahkan.
     */
    public function submit(Request $request, $id)
    {
        $user = $request->user();
        $employee = $user->employee;

        $report = DailyReport::where('id', $id)
            ->where('employee_id', $employee?->id)
            ->firstOrFail();

        if ($report->entries()->count() === 0) {
            return response()->json([
                'error' => 'Daily Report harus memiliki minimal 1 baris aktivitas sebelum diserahkan.'
            ], 422);
        }

        $report->status = 'submitted';
        $report->submitted_at = Carbon::now();
        $report->save();

        return response()->json([
            'message' => 'Daily Report berhasil disimpan dan diserahkan.',
            'report' => $report->load(['entries', 'reviews.reviewer']),
        ]);
    }

    /**
     * Show single daily report with reviews.
     */
    public function show($id)
    {
        $report = DailyReport::with([
            'employee.currentAssignment.department',
            'employee.currentAssignment.jobPosition',
            'entries',
            'reviews.reviewer',
            'reviewer'
        ])->findOrFail($id);

        return response()->json($report);
    }

    /**
     * Supervisor or Admin provides notes/feedback on daily report.
     * Tidak memerlukan persetujuan/approval (tidak ada tolak/setujui);
     * Atasan memberikan catatan arahan, apresiasi, atau masukan kerja.
     */
    public function review(Request $request, $id)
    {
        $request->validate([
            'comments' => 'nullable|string',
            'action' => 'nullable|string|in:commented,approved,revision_requested',
        ]);

        $report = DailyReport::findOrFail($id);
        $user = $request->user();

        DB::beginTransaction();
        try {
            $action = $request->action ?: 'commented';
            $report->reviewed_by = $user->id;
            $report->reviewed_at = Carbon::now();
            $report->overall_feedback = $request->comments;
            if ($report->status !== 'submitted') {
                $report->status = 'submitted';
            }
            $report->save();

            DailyReportReview::create([
                'daily_report_id' => $report->id,
                'reviewer_id' => $user->id,
                'action' => $action,
                'comments' => $request->comments ?? '',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Catatan dan masukan atasan berhasil disimpan.',
                'report' => $report->load(['entries', 'reviews.reviewer']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Gagal menyimpan catatan: ' . $e->getMessage()], 500);
        }
    }
}
