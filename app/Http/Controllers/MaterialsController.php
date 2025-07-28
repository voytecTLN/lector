<?php

namespace App\Http\Controllers;

use App\Http\Requests\UploadMaterialRequest;
use App\Models\LessonMaterial;
use App\Services\MaterialsService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MaterialsController extends Controller
{
    private MaterialsService $materialsService;

    public function __construct(MaterialsService $materialsService)
    {
        $this->materialsService = $materialsService;
        
        // Apply rate limiting to upload
        $this->middleware('throttle:10,1')->only('upload');
    }

    /**
     * Get materials for a student
     */
    public function index(Request $request, int $studentId): JsonResponse
    {
        try {
            $tutorId = Auth::id();
            
            // Check if tutor has access to this student (through lessons)
            $hasAccess = \App\Models\Lesson::where('tutor_id', $tutorId)
                ->where('student_id', $studentId)
                ->exists();
            
            if (!$hasAccess) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            $materials = $this->materialsService->getMaterialsForStudent($tutorId, $studentId);
            
            return response()->json([
                'success' => true,
                'materials' => $materials
            ]);
            
        } catch (Exception $e) {
            Log::error('Error fetching materials', [
                'error' => $e->getMessage(),
                'student_id' => $studentId
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch materials'
            ], 500);
        }
    }

    /**
     * Upload material for a student
     */
    public function upload(UploadMaterialRequest $request): JsonResponse
    {
        try {
            $tutorId = Auth::id();
            $studentId = $request->input('student_id');
            $lessonId = $request->input('lesson_id');
            
            // Check if tutor has access to this student (through lessons)
            $hasAccess = \App\Models\Lesson::where('tutor_id', $tutorId)
                ->where('student_id', $studentId)
                ->exists();
            
            if (!$hasAccess) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            $file = $request->file('file');
            
            $material = $this->materialsService->uploadMaterial(
                $tutorId,
                $studentId,
                $file,
                $lessonId
            );
            
            return response()->json([
                'success' => true,
                'material' => $material,
                'message' => 'File uploaded successfully'
            ]);
            
        } catch (Exception $e) {
            Log::error('Error uploading material', [
                'error' => $e->getMessage(),
                'student_id' => $request->input('student_id')
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Download material
     */
    public function download($material): StreamedResponse|JsonResponse
    {
        try {
            $userId = Auth::id();
            Log::info('Download request', ['material_id' => $material, 'user_id' => $userId]);
            
            $material = $this->materialsService->downloadMaterial($material, $userId);
            
            Log::info('Material found', ['file_path' => $material->file_path, 'original_name' => $material->original_name]);
            
            return Storage::download(
                $material->file_path,
                $material->original_name,
                [
                    'Content-Type' => $material->mime_type,
                    'Content-Disposition' => 'attachment; filename="' . $material->original_name . '"'
                ]
            );
            
        } catch (Exception $e) {
            Log::error('Error downloading material', [
                'error' => $e->getMessage(),
                'material_id' => $material
            ]);
            
            // For non-AJAX requests, redirect to login
            if (!request()->ajax() && !request()->wantsJson()) {
                return redirect('/login');
            }
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Delete material
     */
    public function destroy(int $materialId): JsonResponse
    {
        try {
            $tutorId = Auth::id();
            $this->materialsService->deleteMaterial($materialId, $tutorId);
            
            return response()->json([
                'success' => true,
                'message' => 'Material deleted successfully'
            ]);
            
        } catch (Exception $e) {
            Log::error('Error deleting material', [
                'error' => $e->getMessage(),
                'material_id' => $materialId
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete material'
            ], 400);
        }
    }

    /**
     * Get all versions of materials for a student
     */
    public function versions(Request $request, int $studentId): JsonResponse
    {
        try {
            $tutorId = Auth::id();
            
            // Check if tutor has access to this student (through lessons)
            $hasAccess = \App\Models\Lesson::where('tutor_id', $tutorId)
                ->where('student_id', $studentId)
                ->exists();
            
            if (!$hasAccess) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            $materials = $this->materialsService->getAllVersionsForStudent($tutorId, $studentId);
            
            return response()->json([
                'success' => true,
                'materials' => $materials
            ]);
            
        } catch (Exception $e) {
            Log::error('Error fetching material versions', [
                'error' => $e->getMessage(),
                'student_id' => $studentId
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch material versions'
            ], 500);
        }
    }

    /**
     * Get materials by lesson
     */
    public function byLesson(int $lessonId): JsonResponse
    {
        try {
            $userId = Auth::id();
            $materials = $this->materialsService->getMaterialsByLesson($lessonId, $userId);
            
            return response()->json([
                'success' => true,
                'materials' => $materials
            ]);
            
        } catch (Exception $e) {
            Log::error('Error fetching lesson materials', [
                'error' => $e->getMessage(),
                'lesson_id' => $lessonId
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 403);
        }
    }

    /**
     * Toggle material active status
     */
    public function toggleActive(int $materialId): JsonResponse
    {
        try {
            $tutorId = Auth::id();
            
            $material = LessonMaterial::where('id', $materialId)
                ->where('tutor_id', $tutorId)
                ->firstOrFail();
            
            $material->is_active = !$material->is_active;
            $material->save();
            
            return response()->json([
                'success' => true,
                'is_active' => $material->is_active,
                'message' => $material->is_active ? 'Material activated' : 'Material deactivated'
            ]);
            
        } catch (Exception $e) {
            Log::error('Error toggling material status', [
                'error' => $e->getMessage(),
                'material_id' => $materialId
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to update material status'
            ], 400);
        }
    }
    
    /**
     * Get materials for logged in student
     */
    public function getMyMaterials(): JsonResponse
    {
        try {
            $studentId = Auth::id();
            
            $materials = LessonMaterial::with(['tutor', 'lesson'])
                ->where('student_id', $studentId)
                ->where('is_active', true)
                ->orderBy('uploaded_at', 'desc')
                ->get()
                ->map(function ($material) {
                    return [
                        'id' => $material->id,
                        'lesson_id' => $material->lesson_id,
                        'student_id' => $material->student_id,
                        'tutor_id' => $material->tutor_id,
                        'file_path' => $material->file_path,
                        'original_name' => $material->original_name,
                        'file_size' => $material->file_size,
                        'mime_type' => $material->mime_type,
                        'is_active' => $material->is_active,
                        'version' => $material->version,
                        'uploaded_at' => $material->uploaded_at,
                        'created_at' => $material->created_at,
                        'updated_at' => $material->updated_at,
                        'is_image' => $material->is_image,
                        'tutor' => $material->tutor ? [
                            'id' => $material->tutor->id,
                            'name' => $material->tutor->name,
                        ] : null,
                        'lesson' => $material->lesson ? [
                            'id' => $material->lesson->id,
                            'lesson_date' => $material->lesson->lesson_date,
                            'topic' => $material->lesson->topic,
                        ] : null,
                    ];
                });
            
            return response()->json([
                'success' => true,
                'materials' => $materials
            ]);
            
        } catch (Exception $e) {
            Log::error('Error fetching student materials', [
                'error' => $e->getMessage(),
                'student_id' => Auth::id()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch materials'
            ], 500);
        }
    }
}