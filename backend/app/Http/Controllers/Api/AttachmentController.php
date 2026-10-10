<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class AttachmentController extends Controller
{
    public function index()
    {
        // Implementation might depend on filtering
        return response()->json(Attachment::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'attachable_type' => 'required|string',
            'attachable_id' => 'required|integer',
        ]);

        $file = $request->file('file');
        $path = $file->store('attachments', 'local');

        $attachment = Attachment::create([
            'attachable_type' => $request->attachable_type,
            'attachable_id' => $request->attachable_id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => Auth::id(),
        ]);

        return response()->json($attachment, 201);
    }

    public function show(string $id)
    {
        $attachment = Attachment::findOrFail($id);
        
        if (!Storage::disk('local')->exists($attachment->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('local')->download($attachment->file_path, $attachment->file_name);
    }

    public function update(Request $request, string $id)
    {
        // Typically attachments are not updated, just deleted and re-uploaded
        return response()->json(['message' => 'Method not allowed'], 405);
    }

    public function destroy(string $id)
    {
        $attachment = Attachment::findOrFail($id);
        
        if (Storage::disk('local')->exists($attachment->file_path)) {
            Storage::disk('local')->delete($attachment->file_path);
        }
        
        $attachment->delete();
        return response()->json(null, 204);
    }
}
