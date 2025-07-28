<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\LessonMaterial;
use App\Models\User;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MaterialsService
{
    private ClamAVService $clamAV;
    
    const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public function __construct(ClamAVService $clamAV)
    {
        $this->clamAV = $clamAV;
    }

    /**
     * Upload material for a student
     */
    public function uploadMaterial(
        int $tutorId,
        int $studentId, 
        UploadedFile $file,
        ?int $lessonId = null
    ): LessonMaterial {
        // Validate file
        $this->validateFile($file);
        
        // Generate unique file name
        $fileName = $this->generateFileName($file);
        
        // Build storage path
        $path = $this->buildStoragePath($tutorId, $studentId, $lessonId, $fileName);
        
        // Store temporarily for scanning
        $tempPath = $file->storeAs('temp', $fileName, 'local');
        $fullTempPath = storage_path('app/' . $tempPath);
        
        try {
            // Scan for viruses
            $scanResult = $this->clamAV->scanFile($fullTempPath);
            
            if (!$scanResult['clean']) {
                // Move to quarantine
                $quarantinePath = 'quarantine/' . date('Y-m-d') . '/' . $fileName;
                Storage::move($tempPath, $quarantinePath);
                
                Log::warning('Infected file quarantined', [
                    'file' => $file->getClientOriginalName(),
                    'tutor_id' => $tutorId,
                    'student_id' => $studentId,
                    'quarantine_path' => $quarantinePath,
                    'scan_message' => $scanResult['message']
                ]);
                
                throw new Exception('File contains malware: ' . $scanResult['message']);
            }
            
            // Move to final location
            Storage::move($tempPath, $path);
            
            // Check for previous versions
            $version = $this->getNextVersion($studentId, $file->getClientOriginalName());
            
            // Create database record
            $material = LessonMaterial::create([
                'lesson_id' => $lessonId,
                'student_id' => $studentId,
                'tutor_id' => $tutorId,
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'version' => $version,
                'is_active' => true,
            ]);
            
            // Deactivate previous versions
            if ($version > 1) {
                LessonMaterial::where('student_id', $studentId)
                    ->where('original_name', $file->getClientOriginalName())
                    ->where('id', '!=', $material->id)
                    ->update(['is_active' => false]);
            }
            
            return $material;
            
        } catch (Exception $e) {
            // Clean up temp file if exists
            if (Storage::exists($tempPath)) {
                Storage::delete($tempPath);
            }
            throw $e;
        }
    }

    /**
     * Get materials for a student
     */
    public function getMaterialsForStudent(int $tutorId, int $studentId): array
    {
        return LessonMaterial::with(['lesson', 'student'])
            ->byTutor($tutorId)
            ->forStudent($studentId)
            ->active()
            ->orderBy('uploaded_at', 'desc')
            ->get()
            ->groupBy('original_name')
            ->map(function ($versions) {
                return $versions->first();
            })
            ->values()
            ->toArray();
    }

    /**
     * Get all versions of materials for a student
     */
    public function getAllVersionsForStudent(int $tutorId, int $studentId): array
    {
        return LessonMaterial::with(['lesson', 'student'])
            ->byTutor($tutorId)
            ->forStudent($studentId)
            ->orderBy('original_name')
            ->orderBy('version', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Delete material
     */
    public function deleteMaterial(int $materialId, int $tutorId): bool
    {
        $material = LessonMaterial::where('id', $materialId)
            ->where('tutor_id', $tutorId)
            ->firstOrFail();
        
        // Delete file from storage
        if (Storage::exists($material->file_path)) {
            Storage::delete($material->file_path);
        }
        
        // Soft delete record
        return $material->delete();
    }

    /**
     * Download material
     */
    public function downloadMaterial(int $materialId, int $userId): ?LessonMaterial
    {
        $material = LessonMaterial::findOrFail($materialId);
        
        // Check access rights
        if ($material->tutor_id !== $userId && $material->student_id !== $userId) {
            throw new Exception('Unauthorized access to material');
        }
        
        // Check if file exists
        if (!Storage::exists($material->file_path)) {
            throw new Exception('File not found in storage');
        }
        
        return $material;
    }

    /**
     * Get materials by lesson
     */
    public function getMaterialsByLesson(int $lessonId, int $userId): array
    {
        $lesson = Lesson::findOrFail($lessonId);
        
        // Check if user is tutor or student of this lesson
        if ($lesson->tutor_id !== $userId && $lesson->student_id !== $userId) {
            throw new Exception('Unauthorized access to lesson materials');
        }
        
        return LessonMaterial::where('lesson_id', $lessonId)
            ->active()
            ->orderBy('uploaded_at', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Validate uploaded file
     */
    private function validateFile(UploadedFile $file): void
    {
        // Check file size
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new Exception('File size exceeds maximum allowed size of 10MB');
        }
        
        // Check mime type
        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES)) {
            throw new Exception('File type not allowed. Allowed types: JPG, JPEG, PNG, PDF, DOC, DOCX');
        }
        
        // Additional validation for images
        if (str_starts_with($mimeType, 'image/')) {
            $imageInfo = @getimagesize($file->getRealPath());
            if (!$imageInfo) {
                throw new Exception('Invalid image file');
            }
        }
    }

    /**
     * Generate unique file name
     */
    private function generateFileName(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $baseName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $timestamp = now()->format('Y-m-d_His');
        
        return "{$baseName}_{$timestamp}.{$extension}";
    }

    /**
     * Build storage path
     */
    private function buildStoragePath(int $tutorId, int $studentId, ?int $lessonId, string $fileName): string
    {
        $path = "materials/{$tutorId}/{$studentId}";
        
        if ($lessonId) {
            $path .= "/lesson_{$lessonId}";
        }
        
        return "{$path}/{$fileName}";
    }

    /**
     * Get next version number for file
     */
    private function getNextVersion(int $studentId, string $originalName): int
    {
        $lastVersion = LessonMaterial::where('student_id', $studentId)
            ->where('original_name', $originalName)
            ->max('version');
        
        return ($lastVersion ?? 0) + 1;
    }

    /**
     * Clean up old versions (keep last N versions)
     */
    public function cleanupOldVersions(int $studentId, string $originalName, int $keepVersions = 5): void
    {
        $materials = LessonMaterial::where('student_id', $studentId)
            ->where('original_name', $originalName)
            ->orderBy('version', 'desc')
            ->get();
        
        if ($materials->count() <= $keepVersions) {
            return;
        }
        
        $toDelete = $materials->slice($keepVersions);
        
        foreach ($toDelete as $material) {
            if (Storage::exists($material->file_path)) {
                Storage::delete($material->file_path);
            }
            $material->forceDelete();
        }
    }
}