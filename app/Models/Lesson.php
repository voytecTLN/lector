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
        'recording_url',
        'room_creation_notification_sent'
    ];

    protected $casts = [
        'lesson_date' => 'date',
        'start_time' => 'string',
        'end_time' => 'string',
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

    /**
     * Helper method to create full lesson datetime
     */
    public function getLessonDateTime(): Carbon
    {
        return Carbon::parse($this->lesson_date->format('Y-m-d') . ' ' . $this->start_time);
    }
    
    /**
     * Helper method to create lesson end datetime
     */
    public function getLessonEndDateTime(): Carbon
    {
        return Carbon::parse($this->lesson_date->format('Y-m-d') . ' ' . $this->end_time);
    }

    // Status constants
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_NO_SHOW_STUDENT = 'no_show_student';
    const STATUS_NO_SHOW_TUTOR = 'no_show_tutor';
    const STATUS_TECHNICAL_ISSUES = 'technical_issues';
    const STATUS_NOT_STARTED = 'not_started';

    const STATUSES = [
        self::STATUS_SCHEDULED,
        self::STATUS_IN_PROGRESS,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
        self::STATUS_NO_SHOW_STUDENT,
        self::STATUS_NO_SHOW_TUTOR,
        self::STATUS_TECHNICAL_ISSUES,
        self::STATUS_NOT_STARTED
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
    
    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
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

        // Check if lesson hasn't started yet
        return now()->lessThanOrEqualTo($this->getLessonDateTime());
    }

    public function isCancellationFree(): bool
    {
        if ($this->status !== self::STATUS_SCHEDULED) {
            \Log::info('isCancellationFree: Not scheduled', ['status' => $this->status]);
            return false;
        }

        $lessonDateTime = $this->getLessonDateTime();
        $now = now();
        
        // If lesson is in the past, it's not a free cancellation
        if ($lessonDateTime->isPast()) {
            \Log::info('isCancellationFree: Lesson is in the past');
            return false;
        }
        
        // Calculate hours until lesson (will be positive for future lessons)
        $hoursUntilLesson = $now->diffInHours($lessonDateTime, false);
        
        \Log::info('isCancellationFree check', [
            'lesson_id' => $this->id,
            'lesson_datetime' => $lessonDateTime->toString(),
            'now' => $now->toString(),
            'hours_until' => $hoursUntilLesson,
            'is_free' => $hoursUntilLesson >= 12
        ]);
        
        // Free cancellation if 12 or more hours before lesson
        return $hoursUntilLesson >= 12;
    }

    public function cancel(string $cancelledBy, string $reason = null): bool
    {
        if (!$this->canBeCancelled()) {
            return false;
        }

        $isFreeCancel = $this->isCancellationFree();

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

        // Return hour to package only if it's a free cancellation (12+ hours before)
        if ($this->packageAssignment && $isFreeCancel) {
            $this->packageAssignment->increment('hours_remaining');
        }
        // If it's less than 12 hours - hour is NOT returned (student loses the hour)

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
            
            // Only update if we have a valid average rating
            if ($avgRating !== null) {
                $this->tutor->tutorProfile->updateRating((float) $avgRating, 
                    $this->tutor->tutorProfile->user->lessons()
                        ->whereNotNull('student_rating')
                        ->count()
                );
            }
        }
    }

    public function getFormattedDateTime(): string
    {
        return $this->lesson_date->format('d.m.Y') . ' ' . 
               substr($this->start_time, 0, 5) . '-' . 
               substr($this->end_time, 0, 5);
    }

    public function getLessonTypeName(): string
    {
        return self::LESSON_TYPES[$this->lesson_type] ?? $this->lesson_type;
    }

    public function isUpcoming(): bool
    {
        return $this->getLessonDateTime()->isFuture() && $this->status === self::STATUS_SCHEDULED;
    }

    public function isPast(): bool
    {
        return $this->getLessonEndDateTime()->isPast();
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

        $lessonDateTime = $this->getLessonDateTime();
        $minutesUntilLesson = now()->diffInMinutes($lessonDateTime, false);

        // Lektor może rozpocząć 11 minut wcześniej
        return $minutesUntilLesson <= 11 && $minutesUntilLesson >= -80;
    }

    public function canJoinMeeting(): bool
    {
        if (!$this->hasMeetingRoom() || $this->status === self::STATUS_CANCELLED) {
            return false;
        }

        $lessonDateTime = $this->getLessonDateTime();
        $minutesUntilLesson = now()->diffInMinutes($lessonDateTime, false);

        // Student może dołączyć 10 minut wcześniej
        return $minutesUntilLesson <= 10 && $minutesUntilLesson >= -80;
    }

    public function getActiveMeetingParticipants()
    {
        return $this->meetingSessions()
            ->whereNull('left_at')
            ->with('participant')
            ->get();
    }
}
