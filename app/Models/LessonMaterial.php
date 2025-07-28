<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LessonMaterial extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'lesson_id',
        'student_id',
        'tutor_id',
        'file_path',
        'original_name',
        'file_size',
        'mime_type',
        'is_active',
        'version',
        'uploaded_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'file_size' => 'integer',
        'version' => 'integer',
        'uploaded_at' => 'datetime',
    ];

    /**
     * Get the lesson that owns the material
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Get the student that can access the material
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Get the tutor that uploaded the material
     */
    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    /**
     * Get the full storage path
     */
    public function getFullPathAttribute(): string
    {
        return storage_path('app/' . $this->file_path);
    }

    /**
     * Get human readable file size
     */
    public function getHumanFileSizeAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check if file is an image
     */
    public function getIsImageAttribute(): bool
    {
        return in_array($this->mime_type, [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
        ]);
    }

    /**
     * Check if file is a document
     */
    public function getIsDocumentAttribute(): bool
    {
        return in_array($this->mime_type, [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
        ]);
    }

    /**
     * Get file extension from original name
     */
    public function getExtensionAttribute(): string
    {
        return pathinfo($this->original_name, PATHINFO_EXTENSION);
    }

    /**
     * Scope to get active materials
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get materials for a specific student
     */
    public function scopeForStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    /**
     * Scope to get materials by tutor
     */
    public function scopeByTutor($query, int $tutorId)
    {
        return $query->where('tutor_id', $tutorId);
    }

    /**
     * Get latest version of materials with same original name for a student
     */
    public function scopeLatestVersions($query)
    {
        return $query->whereIn('id', function ($subQuery) {
            $subQuery->selectRaw('MAX(id)')
                ->from('lesson_materials')
                ->whereColumn('student_id', 'lesson_materials.student_id')
                ->whereColumn('original_name', 'lesson_materials.original_name')
                ->groupBy('student_id', 'original_name');
        });
    }
}