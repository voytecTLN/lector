<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'participant_id',
        'room_name',
        'joined_at',
        'left_at',
        'duration_seconds',
        'connection_quality',
        'browser',
        'device_type'
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
        'duration_seconds' => 'integer'
    ];

    // Connection quality constants
    const QUALITY_POOR = 'poor';
    const QUALITY_FAIR = 'fair';
    const QUALITY_GOOD = 'good';
    const QUALITY_EXCELLENT = 'excellent';

    const CONNECTION_QUALITIES = [
        self::QUALITY_POOR,
        self::QUALITY_FAIR,
        self::QUALITY_GOOD,
        self::QUALITY_EXCELLENT
    ];

    // Device type constants
    const DEVICE_DESKTOP = 'desktop';
    const DEVICE_MOBILE = 'mobile';
    const DEVICE_TABLET = 'tablet';

    // Relationships
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_id');
    }

    // Helper methods
    public function calculateDuration(): void
    {
        if ($this->joined_at && $this->left_at) {
            $this->duration_seconds = $this->joined_at->diffInSeconds($this->left_at);
            $this->save();
        }
    }

    public function endSession(): void
    {
        $this->left_at = now();
        $this->calculateDuration();
        $this->save();
    }

    public function getDurationInMinutes(): float
    {
        return round($this->duration_seconds / 60, 2);
    }

    public function getFormattedDuration(): string
    {
        $hours = floor($this->duration_seconds / 3600);
        $minutes = floor(($this->duration_seconds % 3600) / 60);
        $seconds = $this->duration_seconds % 60;

        if ($hours > 0) {
            return sprintf('%dh %dm %ds', $hours, $minutes, $seconds);
        } elseif ($minutes > 0) {
            return sprintf('%dm %ds', $minutes, $seconds);
        } else {
            return sprintf('%ds', $seconds);
        }
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->whereNull('left_at');
    }

    public function scopeCompleted($query)
    {
        return $query->whereNotNull('left_at');
    }

    public function scopeForLesson($query, $lessonId)
    {
        return $query->where('lesson_id', $lessonId);
    }

    public function scopeForParticipant($query, $participantId)
    {
        return $query->where('participant_id', $participantId);
    }
}