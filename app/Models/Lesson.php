<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'tutor_id',
        'package_assignment_id',
        'tutor_availability_slot_id',
        'lesson_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'status',
        'status_reason',
        'status_updated_by',
        'status_updated_at',
        'cancelled_by',
        'cancelled_at',
        'cancellation_reason',
        'language',
        'lesson_type',
        'topic',
        'notes',
        'price',
        'is_paid',
        'student_rating',
        'student_feedback',
        'feedback_submitted_at',
        // Daily.co fields
        'meeting_room_name',
        'meeting_room_url',
        'meeting_token',
        'meeting_started_at',
        'meeting_ended_at',
        'recording_url'
    ];

    protected $casts = [
        'lesson_date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'cancelled_at' => 'datetime',
        'feedback_submitted_at' => 'datetime',
        'status_updated_at' => 'datetime',
        'meeting_started_at' => 'datetime',
        'meeting_ended_at' => 'datetime',
        'is_paid' => 'boolean',
        'price' => 'decimal:2',
        'duration_minutes' => 'integer',
        'student_rating' => 'integer'
    ];

    // Status constants
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_NO_SHOW_STUDENT = 'no_show_student';
    const STATUS_NO_SHOW_TUTOR = 'no_show_tutor';
    const STATUS_TECHNICAL_ISSUES = 'technical_issues';

    const STATUSES = [
        self::STATUS_SCHEDULED,
        self::STATUS_IN_PROGRESS,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
        self::STATUS_NO_SHOW_STUDENT,
        self::STATUS_NO_SHOW_TUTOR,
        self::STATUS_TECHNICAL_ISSUES
    ];

    // Lesson type constants
    const TYPE_INDIVIDUAL = 'individual';
    const TYPE_GROUP = 'group';
    const TYPE_INTENSIVE = 'intensive';
    const TYPE_CONVERSATION = 'conversation';

    const LESSON_TYPES = [
        self::TYPE_INDIVIDUAL => 'Lekcja indywidualna',
        self::TYPE_GROUP => 'Lekcja grupowa',
        self::TYPE_INTENSIVE => 'Kurs intensywny',
        self::TYPE_CONVERSATION => 'Klub konwersacyjny'
    ];

    // Relationships
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function packageAssignment(): BelongsTo
    {
        return $this->belongsTo(PackageAssignment::class);
    }

    public function availabilitySlot(): BelongsTo
    {
        return $this->belongsTo(TutorAvailabilitySlot::class, 'tutor_availability_slot_id');
    }
    
    public function statusUpdatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'status_updated_by');
    }

    public function meetingSessions(): HasMany
    {
        return $this->hasMany(MeetingSession::class);
    }

    // Scopes
    public function scopeScheduled($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }


    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForTutor($query, $tutorId)
    {
        return $query->where('tutor_id', $tutorId);
    }

    // Helper methods
    public function canBeCancelled(): bool
    {
        if ($this->status !== self::STATUS_SCHEDULED) {
            return false;
        }

        $lessonDateTime = Carbon::parse($this->lesson_date->format('Y-m-d') . ' ' . $this->start_time->format('H:i:s'));
        $hoursUntilLesson = now()->diffInHours($lessonDateTime, false);

        return $hoursUntilLesson >= 12;
    }

    public function cancel(string $cancelledBy, string $reason = null): bool
    {
        if (!$this->canBeCancelled()) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_by' => $cancelledBy,
            'cancelled_at' => now(),
            'cancellation_reason' => $reason
        ]);

        // Release the availability slot(s)
        if ($this->availabilitySlot) {
            // Dla slotów godzinowych
            if ($this->duration_minutes === 60) {
                $this->availabilitySlot->releaseHours(1);
            } else {
                // Dla dłuższych lekcji, zwolnij wszystkie sloty
                $lessonStartHour = (int) date('H', strtotime($this->start_time));
                $lessonEndHour = (int) ceil((strtotime($this->start_time) + ($this->duration_minutes * 60)) / 3600);
                
                for ($hour = $lessonStartHour; $hour < $lessonEndHour; $hour++) {
                    $slot = TutorAvailabilitySlot::where('tutor_id', $this->tutor_id)
                        ->where('date', $this->lesson_date->format('Y-m-d'))
                        ->where('start_hour', $hour)
                        ->where('end_hour', $hour + 1)
                        ->first();
                        
                    if ($slot) {
                        $slot->releaseHours(1);
                    }
                }
            }
        }

        // Return hour to package if applicable
        if ($this->packageAssignment) {
            $this->packageAssignment->increment('hours_remaining');
        }

        return true;
    }

    public function complete(): void
    {
        $this->update(['status' => self::STATUS_COMPLETED]);
        
        // Update tutor statistics
        if ($this->tutor->tutorProfile) {
            $this->tutor->tutorProfile->incrementLessons();
        }
    }

    public function markAsNoShow(): void
    {
        $this->update(['status' => self::STATUS_NO_SHOW]);
    }

    public function submitFeedback(int $rating, string $feedback = null): void
    {
        $this->update([
            'student_rating' => $rating,
            'student_feedback' => $feedback,
            'feedback_submitted_at' => now()
        ]);

        // Update tutor average rating
        if ($this->tutor->tutorProfile) {
            $avgRating = $this->tutor->tutorProfile->user->lessons()
                ->whereNotNull('student_rating')
                ->avg('student_rating');
            
            $this->tutor->tutorProfile->updateRating($avgRating, 
                $this->tutor->tutorProfile->user->lessons()
                    ->whereNotNull('student_rating')
                    ->count()
            );
        }
    }

    public function getFormattedDateTime(): string
    {
        return $this->lesson_date->format('d.m.Y') . ' ' . 
               Carbon::parse($this->start_time)->format('H:i') . '-' . 
               Carbon::parse($this->end_time)->format('H:i');
    }

    public function getLessonTypeName(): string
    {
        return self::LESSON_TYPES[$this->lesson_type] ?? $this->lesson_type;
    }

    public function isUpcoming(): bool
    {
        $lessonDateTime = Carbon::parse($this->lesson_date->format('Y-m-d') . ' ' . $this->start_time->format('H:i:s'));
        return $lessonDateTime->isFuture() && $this->status === self::STATUS_SCHEDULED;
    }

    public function isPast(): bool
    {
        $lessonDateTime = Carbon::parse($this->lesson_date->format('Y-m-d') . ' ' . $this->end_time->format('H:i:s'));
        return $lessonDateTime->isPast();
    }

    public function isToday(): bool
    {
        return $this->lesson_date->isToday();
    }

    // Daily.co helper methods
    public function hasMeetingRoom(): bool
    {
        return !empty($this->meeting_room_name) && !empty($this->meeting_room_url);
    }

    public function isMeetingActive(): bool
    {
        return $this->hasMeetingRoom() && 
               $this->meeting_started_at && 
               !$this->meeting_ended_at;
    }

    public function canStartMeeting(): bool
    {
        if ($this->status !== self::STATUS_SCHEDULED) {
            return false;
        }

        $lessonDateTime = Carbon::parse($this->lesson_date->format('Y-m-d') . ' ' . $this->start_time->format('H:i:s'));
        $minutesUntilLesson = now()->diffInMinutes($lessonDateTime, false);

        // Lektor może rozpocząć 15 minut wcześniej
        // TODO: Dla testów zmieniono na 60 minut
        return $minutesUntilLesson <= 60 && $minutesUntilLesson >= -120;
    }

    public function canJoinMeeting(): bool
    {
        if (!$this->hasMeetingRoom() || $this->status === self::STATUS_CANCELLED) {
            return false;
        }

        $lessonDateTime = Carbon::parse($this->lesson_date->format('Y-m-d') . ' ' . $this->start_time->format('H:i:s'));
        $minutesUntilLesson = now()->diffInMinutes($lessonDateTime, false);

        // Student może dołączyć 10 minut wcześniej
        // TODO: Dla testów zmieniono na 60 minut
        return $minutesUntilLesson <= 60 && $minutesUntilLesson >= -120;
    }

    public function getActiveMeetingParticipants()
    {
        return $this->meetingSessions()
            ->whereNull('left_at')
            ->with('participant')
            ->get();
    }
}
