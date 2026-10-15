<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BroadcastNotification;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $user->id)
            ->orderByDesc('created_at');

        if ($request->filled('unread_only') && ($request->unread_only === 'true' || $request->unread_only === '1')) {
            $query->whereNull('read_at');
        }

        $notifications = $query->paginate(20);

        // Format items
        $formatted = collect($notifications->items())->map(function ($item) {
            $data = json_decode($item->data, true) ?: [];
            return [
                'id' => $item->id,
                'title' => $data['title'] ?? 'Pemberitahuan Sistem',
                'message' => $data['message'] ?? '',
                'category' => $data['category'] ?? 'info',
                'sender_name' => $data['sender_name'] ?? 'HR Management',
                'broadcast_id' => $data['broadcast_id'] ?? null,
                'read_at' => $item->read_at,
                'is_unread' => is_null($item->read_at),
                'created_at' => $item->created_at,
                'time_ago' => Carbon::parse($item->created_at)->diffForHumans(),
            ];
        });

        $unreadCount = DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'data' => $formatted,
            'unread_count' => $unreadCount,
            'current_page' => $notifications->currentPage(),
            'last_page' => $notifications->lastPage(),
            'total' => $notifications->total(),
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();

        $updated = DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $user->id)
            ->update(['read_at' => Carbon::now()]);

        return response()->json([
            'message' => 'Notifikasi ditandai telah dibaca.',
            'success' => (bool)$updated,
        ]);
    }

    /**
     * Mark all notifications as read for current user.
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => Carbon::now()]);

        return response()->json([
            'message' => 'Semua notifikasi berhasil ditandai telah dibaca.',
        ]);
    }

    /**
     * Delete a notification for current user.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $user->id)
            ->delete();

        return response()->json([
            'message' => 'Notifikasi berhasil dihapus.',
        ]);
    }

    /**
     * Get list of broadcast notifications (HR / Admin).
     */
    public function broadcasts(Request $request)
    {
        $user = $request->user();
        if (!$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr'])) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $broadcasts = BroadcastNotification::with(['sender', 'department'])
            ->latest()
            ->paginate(15);

        return response()->json($broadcasts);
    }

    /**
     * Create and send broadcast notification to target users (HR / Admin).
     */
    public function storeBroadcast(Request $request)
    {
        $user = $request->user();
        if (!$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr'])) {
            return response()->json(['error' => 'Akses ditolak. Hanya HR atau Admin yang dapat membuat broadcast notifikasi.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'category' => 'required|in:announcement,info,reminder,urgent',
            'target_type' => 'required|in:all,department,specific',
            'target_department_id' => 'nullable|required_if:target_type,department|exists:departments,id',
            'target_employee_ids' => 'nullable|required_if:target_type,specific|array',
            'target_employee_ids.*' => 'exists:employees,id',
        ]);

        // Cari daftar user target penerima
        if ($validated['target_type'] === 'all') {
            $recipients = User::all();
        } elseif ($validated['target_type'] === 'department') {
            $deptId = $validated['target_department_id'];
            $recipients = User::whereHas('employee.currentAssignment', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            })->get();
        } else {
            // specific
            $empIds = $validated['target_employee_ids'] ?? [];
            $recipients = User::whereHas('employee', function ($q) use ($empIds) {
                $q->whereIn('id', $empIds);
            })->get();
        }

        if ($recipients->isEmpty()) {
            return response()->json([
                'message' => 'Tidak ada karyawan / user yang sesuai dengan kriteria target penerima.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Simpan riwayat broadcast
            $broadcast = BroadcastNotification::create([
                'sender_id' => $user->id,
                'title' => $validated['title'],
                'message' => $validated['message'],
                'category' => $validated['category'],
                'target_type' => $validated['target_type'],
                'target_department_id' => $validated['target_department_id'] ?? null,
                'target_employee_ids' => $validated['target_employee_ids'] ?? null,
                'recipients_count' => $recipients->count(),
            ]);

            // Buat row notifikasi untuk masing-masing user penerima
            $now = Carbon::now();
            $notificationRows = [];

            foreach ($recipients as $recipient) {
                $notificationRows[] = [
                    'id' => (string) Str::uuid(),
                    'type' => 'App\Notifications\BroadcastNotification',
                    'notifiable_type' => User::class,
                    'notifiable_id' => $recipient->id,
                    'data' => json_encode([
                        'title' => $validated['title'],
                        'message' => $validated['message'],
                        'category' => $validated['category'],
                        'sender_name' => $user->name,
                        'sender_id' => $user->id,
                        'broadcast_id' => $broadcast->id,
                    ]),
                    'read_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Chunk insert jika user banyak
            foreach (array_chunk($notificationRows, 100) as $chunk) {
                DB::table('notifications')->insert($chunk);
            }

            DB::commit();

            return response()->json([
                'message' => "Notifikasi berhasil disiarkan kepada {$recipients->count()} karyawan.",
                'broadcast' => $broadcast->load(['sender', 'department']),
                'recipients_count' => $recipients->count(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Gagal mengirim notifikasi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete broadcast and its recipient notifications (HR / Admin).
     */
    public function destroyBroadcast(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->hasAnyRole(['super-admin', 'owner', 'direksi', 'hr-manager', 'hr'])) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $broadcast = BroadcastNotification::findOrFail($id);

        // Hapus notifikasi terkait
        DB::table('notifications')
            ->where('data', 'like', '%"broadcast_id":' . $broadcast->id . '%')
            ->delete();

        $broadcast->delete();

        return response()->json([
            'message' => 'Broadcast notifikasi berhasil ditarik dan dihapus.',
        ]);
    }
}
