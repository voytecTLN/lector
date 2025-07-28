<?php

namespace App\Http\Controllers;

use App\Models\LessonMaterial;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DownloadController extends Controller
{
    public function material($id)
    {
        // Check if user is logged in using session
        if (!Auth::check()) {
            return redirect('/login');
        }
        
        $material = LessonMaterial::findOrFail($id);
        $userId = Auth::id();
        
        // Check if user has access (is the student or tutor)
        if ($material->student_id !== $userId && $material->tutor_id !== $userId) {
            // Check if user is admin
            if (Auth::user()->role !== 'admin') {
                abort(403, 'Unauthorized access to material');
            }
        }
        
        // Check if file exists
        if (!Storage::exists($material->file_path)) {
            abort(404, 'File not found');
        }
        
        return Storage::download(
            $material->file_path,
            $material->original_name,
            [
                'Content-Type' => $material->mime_type,
                'Content-Disposition' => 'attachment; filename="' . $material->original_name . '"'
            ]
        );
    }
}