<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Task;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole('HR') || $user->hasRole('Admin')) {
            $tasks = Task::with('employee')->latest()->get();
            return response()->json($tasks);
        }

        $employee = $user->employee;
        if (!$employee) return response()->json([], 403);

        $tasks = $employee->tasks()->latest()->get();
        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $employee = $request->user()->employee;
        if (!$employee) return response()->json(['error' => 'Not an employee'], 403);

        $task = Task::create([
            'employee_id' => $employee->id,
            'title' => $request->title,
            'description' => $request->description,
            'due_date' => $request->due_date,
            'status' => 'todo',
        ]);

        return response()->json(['message' => 'Task created', 'data' => $task], 201);
    }

    public function update(Request $request, Task $task)
    {
        $request->validate([
            'status' => 'required|in:todo,in_progress,done',
        ]);

        $task->update([
            'status' => $request->status,
        ]);

        return response()->json(['message' => 'Task updated', 'data' => $task]);
    }

    public function destroy(Task $task)
    {
        $task->delete();
        return response()->json(['message' => 'Task deleted']);
    }
}
