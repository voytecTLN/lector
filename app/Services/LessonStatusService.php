<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\LessonStatusHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

class LessonStatusService
{
    // Use constants from Lesson model
    const ALLOWED_STATUSES = [
        Lesson::STATUS_SCHEDULED,
        Lesson::STATUS_IN_PROGRESS,
        Lesson::STATUS_COMPLETED,
        Lesson::STATUS_CANCELLED,
        Lesson::STATUS_NO_SHOW_STUDENT,
        Lesson::STATUS_NO_SHOW_TUTOR,
        Lesson::STATUS_TECHNICAL_ISSUES,
        Lesson::STATUS_NOT_STARTED,
    ];

    /**
     * Update lesson status with validation
     */
    public function updateLessonStatus(int $lessonId, string $status, ?string $reason = null): Lesson
    {
        if (!in_array($status, self::ALLOWED_STATUSES)) {
            throw new Exception("Invalid status: {$status}");
        }

        DB::beginTransaction();
        try {
            $lesson = Lesson::with('packageAssignment')->findOrFail($lessonId);
            $user = Auth::user();

            // Check permissions
            $this->validateStatusChangePermission($user, $lesson, $status, $reason);

            // Store previous status for history
            $previousStatus = $lesson->status;
            
            // For cancellations, check if it's a free cancellation BEFORE changing status
            $isFreeCancel = false;
            if ($status === Lesson::STATUS_CANCELLED && $previousStatus === Lesson::STATUS_SCHEDULED) {
                $isFreeCancel = $lesson->isCancellationFree();
            }

            // Update lesson status
            $lesson->status = $status;
            $lesson->status_reason = $reason;
            $lesson->status_updated_by = $user ? $user->id : null;
            $lesson->status_updated_at = now();
            $lesson->save();

            // Record status change in history
            $this->recordStatusChange($lesson, $previousStatus, $status, $reason, $user);

            // Handle special status scenarios (pass the pre-calculated free cancel flag)
            $this->handleStatusSideEffects($lesson, $previousStatus, $status, $isFreeCancel);

            DB::commit();
            return $lesson->fresh(['student', 'tutor', 'packageAssignment']);

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update lesson status from system (no authentication required)
     */
    public function updateLessonStatusSystem(int $lessonId, string $status, ?string $reason = null): Lesson
    {
        if (!in_array($status, self::ALLOWED_STATUSES)) {
            throw new Exception("Invalid status: {$status}");
        }

        DB::beginTransaction();
        try {
            $lesson = Lesson::findOrFail($lessonId);
            
            // Store previous status for history
            $previousStatus = $lesson->status;
            
            // Update lesson status
            $lesson->status = $status;
            $lesson->status_reason = $reason;
            $lesson->status_updated_by = null; // System update
            $lesson->status_updated_at = now();
            $lesson->save();

            // Record status change in history
            $this->recordStatusChange($lesson, $previousStatus, $status, $reason, null, 'system');
            
            // Handle special status scenarios
            $this->handleStatusSideEffects($lesson, $previousStatus, $status);
            
            DB::commit();
            return $lesson->fresh(['student', 'tutor', 'packageAssignment']);
            
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Validate if user can change lesson status
     */
    private function validateStatusChangePermission(User $user, Lesson $lesson, string $newStatus, ?string $reason = null): void
    {
        // Admin can change any status
        if ($user->role === 'admin') {
            return;
        }

        // Tutor permissions
        if ($user->role === 'tutor' && $lesson->tutor_id === $user->id) {
            $allowedStatuses = [
                Lesson::STATUS_IN_PROGRESS,
                Lesson::STATUS_COMPLETED,
                Lesson::STATUS_NO_SHOW_STUDENT,
                Lesson::STATUS_TECHNICAL_ISSUES,
                Lesson::STATUS_CANCELLED
            ];

            if (!in_array($newStatus, $allowedStatuses)) {
                throw new Exception("Tutors cannot set status to: {$newStatus}");
            }

            // Special validation for tutor cancellation
            if ($newStatus === Lesson::STATUS_CANCELLED) {
                // Tutors can only cancel scheduled lessons
                if ($lesson->status !== Lesson::STATUS_SCHEDULED) {
                    throw new Exception("Tutors can only cancel scheduled lessons");
                }
                
                // Check if lesson hasn't started yet
                $lessonDateTime = $lesson->getLessonDateTime();
                if (now()->greaterThan($lessonDateTime)) {
                    throw new Exception("Cannot cancel lesson that has already started");
                }
                
                // Reason is required for tutor cancellations
                if (empty($reason)) {
                    \Log::info('Tutor cancellation - Empty reason received', [
                        'reason' => $reason,
                        'reason_type' => gettype($reason),
                        'lesson_id' => $lesson->id,
                        'user_id' => $user->id
                    ]);
                    throw new Exception("Tutors must provide a reason for cancellation");
                }
            }
            
            return;
        }

        // Student can only cancel their own lessons
        if ($user->role === 'student' && $lesson->student_id === $user->id) {
            if ($newStatus === Lesson::STATUS_CANCELLED) {
                // Students can only cancel scheduled lessons
                if ($lesson->status !== Lesson::STATUS_SCHEDULED) {
                    throw new Exception("Students can only cancel scheduled lessons");
                }
                
                // Check if lesson hasn't started yet
                $lessonDateTime = $lesson->getLessonDateTime();
                if (now()->greaterThan($lessonDateTime)) {
                    throw new Exception("Cannot cancel lesson that has already started");
                }
                
                return;
            }
        }

        throw new Exception("You don't have permission to change this lesson's status");
    }

    /**
     * Handle side effects of status changes
     */
    private function handleStatusSideEffects(Lesson $lesson, string $previousStatus, string $newStatus, bool $isFreeCancel = false): void
    {
        // Handle lesson cancellation
        if ($newStatus === Lesson::STATUS_CANCELLED) {
            $this->handleLessonCancellation($lesson, $isFreeCancel);
        }

        // Refund hours if tutor no-show
        if ($newStatus === Lesson::STATUS_NO_SHOW_TUTOR && $lesson->packageAssignment) {
            $packageAssignment = $lesson->packageAssignment;
            $packageAssignment->hours_remaining += $lesson->duration_minutes / 60;
            $packageAssignment->save();

            // Log the refund
            $lesson->save();
        }

        // Mark lesson as ended (requires migration to add ended_at column)
        // TODO: Uncomment after running migration to add started_at and ended_at columns
        /*
        if (in_array($newStatus, [Lesson::STATUS_COMPLETED, Lesson::STATUS_NO_SHOW_STUDENT, Lesson::STATUS_NO_SHOW_TUTOR])) {
            if (!$lesson->ended_at) {
                $lesson->ended_at = now();
                $lesson->save();
            }
        }
        */
    }

    /**
     * Handle lesson cancellation with proper hour management
     */
    private function handleLessonCancellation(Lesson $lesson, bool $isFreeCancel = false): void
    {
        $lesson->update([
            'cancelled_at' => now(),
            'cancelled_by' => Auth::user() ? Auth::user()->role : 'admin'
        ]);

        // Release availability slots
        if ($lesson->availabilitySlot) {
            if ($lesson->duration_minutes === 60) {
                $lesson->availabilitySlot->releaseHours(1);
            } else {
                // For longer lessons, release all slots
                $lessonStartHour = (int) date('H', strtotime($lesson->start_time));
                $lessonEndHour = (int) ceil((strtotime($lesson->start_time) + ($lesson->duration_minutes * 60)) / 3600);
                
                for ($hour = $lessonStartHour; $hour < $lessonEndHour; $hour++) {
                    $slot = \App\Models\TutorAvailabilitySlot::where('tutor_id', $lesson->tutor_id)
                        ->where('date', $lesson->lesson_date->format('Y-m-d'))
                        ->where('start_hour', $hour)
                        ->where('end_hour', $hour + 1)
                        ->first();
                        
                    if ($slot) {
                        $slot->releaseHours(1);
                    }
                }
            }
        }

        // Handle package hour refund based on cancellation timing and who cancelled
        if ($lesson->packageAssignment) {
            $cancelledByUser = Auth::user();
            
            // If tutor cancels - always return hour to student
            if ($cancelledByUser && $cancelledByUser->role === 'tutor') {
                $lesson->packageAssignment->increment('hours_remaining');
            }
            // If student cancels - use the pre-calculated timing check
            elseif ($cancelledByUser && $cancelledByUser->role === 'student') {
                \Log::info('Student cancellation check', [
                    'lesson_id' => $lesson->id,
                    'lesson_datetime' => $lesson->getLessonDateTime()->toString(),
                    'now' => now()->toString(),
                    'hours_until' => now()->diffInHours($lesson->getLessonDateTime(), false),
                    'is_free_cancel' => $isFreeCancel,
                    'package_id' => $lesson->packageAssignment ? $lesson->packageAssignment->id : null
                ]);
                
                if ($isFreeCancel) {
                    // Free cancellation - return hour to package
                    $lesson->packageAssignment->increment('hours_remaining');
                    \Log::info('Hour returned to package', [
                        'lesson_id' => $lesson->id,
                        'package_id' => $lesson->packageAssignment->id
                    ]);
                } else {
                    \Log::info('Hour NOT returned - cancellation less than 12h before lesson', [
                        'lesson_id' => $lesson->id,
                        'package_id' => $lesson->packageAssignment ? $lesson->packageAssignment->id : null
                    ]);
                }
                // If not free cancellation (< 12h) - hour is NOT returned (student loses it)
            }
            // Admin cancellations - always return hour
            elseif ($cancelledByUser && in_array($cancelledByUser->role, ['admin', 'moderator'])) {
                $lesson->packageAssignment->increment('hours_remaining');
            }
        }
    }

    /**
     * Record status change in history
     */
    private function recordStatusChange(Lesson $lesson, string $previousStatus, string $newStatus, ?string $reason, ?User $user, ?string $systemRole = null): void
    {
        // Don't record if status didn't actually change
        if ($previousStatus === $newStatus) {
            return;
        }

        LessonStatusHistory::create([
            'lesson_id' => $lesson->id,
            'status' => $newStatus,
            'previous_status' => $previousStatus,
            'reason' => $reason ?: $this->getDefaultReasonForStatus($newStatus),
            'changed_by_role' => $systemRole ?: ($user ? $user->role : 'system'),
            'changed_by_user_id' => $user ? $user->id : null,
        ]);
    }

    /**
     * Get status change history for a lesson
     */
    public function getStatusHistory(int $lessonId): array
    {
        $lesson = Lesson::findOrFail($lessonId);

        // Get status history from dedicated table
        $historyRecords = LessonStatusHistory::where('lesson_id', $lessonId)
            ->with('changedByUser')
            ->orderBy('created_at')
            ->get();

        $history = [];

        // Always check if the first record is the initial status
        // If not, add it from the lesson creation time
        $hasInitialStatus = $historyRecords->first() &&
                           $historyRecords->first()->previous_status === null &&
                           $historyRecords->first()->status === 'scheduled';

        if (!$hasInitialStatus) {
            // Add initial creation status from lesson creation
            $history[] = [
                'status' => 'scheduled',
                'reason' => 'Lekcja została zaplanowana',
                'changed_by' => 'System',
                'changed_at' => $lesson->created_at->toIso8601String(),
            ];
        }

        // Convert history records to array format
        foreach ($historyRecords as $record) {
            $changedBy = 'System';
            if ($record->changedByUser) {
                $changedBy = $record->changedByUser->name;
            } elseif ($record->changed_by_role) {
                $changedBy = ucfirst($record->changed_by_role);
            }

            $history[] = [
                'status' => $record->status,
                'reason' => $record->reason,
                'changed_by' => $changedBy,
                'changed_at' => $record->created_at->toIso8601String(),
            ];
        }

        return $history;
    }
    
    /**
     * Get default reason for status
     */
    private function getDefaultReasonForStatus(string $status): string
    {
        return match($status) {
            Lesson::STATUS_SCHEDULED => 'Lekcja zaplanowana',
            Lesson::STATUS_IN_PROGRESS => 'Lekcja rozpoczęta',
            Lesson::STATUS_COMPLETED => 'Lekcja zakończona',
            Lesson::STATUS_CANCELLED => 'Lekcja anulowana',
            Lesson::STATUS_NO_SHOW_STUDENT => 'Student nieobecny',
            Lesson::STATUS_NO_SHOW_TUTOR => 'Lektor nieobecny',
            Lesson::STATUS_TECHNICAL_ISSUES => 'Problemy techniczne',
            Lesson::STATUS_NOT_STARTED => 'Lekcja się nie rozpoczęła',
            default => 'Status zmieniony'
        };
    }

    /**
     * Handle no-show scenarios automatically
     */
    public function handleNoShowScenarios(Lesson $lesson): void
    {
        // This can be called by a scheduled job
        // Check if lesson should have started but didn't
        $lessonDateTime = $lesson->getLessonDateTime();
        $shouldHaveStarted = now()->greaterThan($lessonDateTime);
        $notStarted = $lesson->status === Lesson::STATUS_SCHEDULED;

        if ($shouldHaveStarted && $notStarted) {
            // Auto-mark as not started after grace period (e.g., 15 minutes)
            $gracePeriodPassed = abs(now()->diffInMinutes($lessonDateTime)) > 15;

            if ($gracePeriodPassed) {
                // Mark as not started - admin can later determine specific reason
                $this->updateLessonStatusSystem(
                    $lesson->id,
                    Lesson::STATUS_NOT_STARTED,
                    'Automatycznie oznaczone - lekcja się nie rozpoczęła po okresie oczekiwania'
                );
            }
        }
    }

    /**
     * Get status display labels
     */
    public static function getStatusLabels(): array
    {
        return [
            Lesson::STATUS_SCHEDULED => 'Zaplanowana',
            Lesson::STATUS_IN_PROGRESS => 'W trakcie',
            Lesson::STATUS_COMPLETED => 'Zakończona',
            Lesson::STATUS_CANCELLED => 'Anulowana',
            Lesson::STATUS_NO_SHOW_STUDENT => 'Student nieobecny',
            Lesson::STATUS_NO_SHOW_TUTOR => 'Lektor nieobecny',
            Lesson::STATUS_TECHNICAL_ISSUES => 'Problemy techniczne',
            Lesson::STATUS_NOT_STARTED => 'Nie rozpoczęta',
        ];
    }

    /**
     * Get status badge classes for UI
     */
    public static function getStatusBadgeClass(string $status): string
    {
        return match($status) {
            Lesson::STATUS_SCHEDULED => 'bg-primary',
            Lesson::STATUS_IN_PROGRESS => 'bg-info',
            Lesson::STATUS_COMPLETED => 'bg-success',
            Lesson::STATUS_CANCELLED => 'bg-danger',
            Lesson::STATUS_NO_SHOW_STUDENT => 'bg-warning',
            Lesson::STATUS_NO_SHOW_TUTOR => 'bg-warning',
            Lesson::STATUS_TECHNICAL_ISSUES => 'bg-secondary',
            Lesson::STATUS_NOT_STARTED => 'bg-dark',
            default => 'bg-secondary'
        };
    }

    /**
     * Check multiple lessons for status updates - for bulk processing
     */
    public function checkMultipleLessons(): array
    {
        $lessons = Lesson::where('status', Lesson::STATUS_SCHEDULED)
            ->where('lesson_date', '<=', now()->toDateString())
            ->whereTime('start_time', '<=', now()->subMinutes(15)->toTimeString())
            ->get();

        $results = [
            'processed' => 0,
            'errors' => []
        ];

        foreach ($lessons as $lesson) {
            try {
                $this->handleNoShowScenarios($lesson);
                $results['processed']++;
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'lesson_id' => $lesson->id,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    /**
     * Handle empty room scenarios - auto-complete lessons with empty rooms
     * Only for lessons that were actually started (have meeting room created)
     */
    public function handleEmptyRoomScenarios(Lesson $lesson, int $emptyMinutes = 10): void
    {
        // Only process lessons that are in progress and have meeting rooms
        // Skip lessons marked as 'not_started' - they shouldn't be auto-completed
        if ($lesson->status !== Lesson::STATUS_IN_PROGRESS || !$lesson->hasMeetingRoom()) {
            return;
        }

        // Inject DailyVideoService - we'll need to refactor this for better dependency injection
        $dailyService = app(\App\Services\DailyVideoService::class);
        
        // Check if room has been empty for specified time
        if ($dailyService->hasRoomBeenEmpty($lesson->meeting_room_name, $emptyMinutes)) {
            // Auto-complete the lesson
            $this->updateLessonStatusSystem(
                $lesson->id,
                Lesson::STATUS_COMPLETED,
                "Automatycznie zakończone - pokój był pusty przez {$emptyMinutes} minut"
            );
            
            // Clean up the room
            $dailyService->deleteRoom($lesson->meeting_room_name);
            
            // Update lesson record
            $lesson->update(['meeting_ended_at' => now()]);
        }
    }

    /**
     * Check multiple lessons for empty rooms - for bulk processing
     */
    public function checkEmptyRooms(int $emptyMinutes = 10): array
    {
        $lessons = Lesson::where('status', Lesson::STATUS_IN_PROGRESS)
            ->whereNotNull('meeting_room_name')
            ->whereNotNull('meeting_started_at')
            ->get();

        $results = [
            'processed' => 0,
            'completed' => 0,
            'errors' => []
        ];

        foreach ($lessons as $lesson) {
            try {
                $this->handleEmptyRoomScenarios($lesson, $emptyMinutes);
                $results['processed']++;
                
                // Check if lesson was completed
                $lesson->refresh();
                if ($lesson->status === Lesson::STATUS_COMPLETED) {
                    $results['completed']++;
                }
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'lesson_id' => $lesson->id,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    /**
     * Handle lessons that exceeded maximum duration - auto-complete after 80 minutes
     * Only for lessons that were actually started (have meeting room created and started)
     */
    public function handleLessonTimeouts(): void
    {
        // Get lessons that are in progress and started more than 80 minutes ago
        // Only process lessons that actually have meeting rooms (were started by tutor)
        $lessons = Lesson::where('status', Lesson::STATUS_IN_PROGRESS)
            ->whereNotNull('meeting_started_at')
            ->whereNotNull('meeting_room_name')
            ->where('meeting_started_at', '<=', now()->subMinutes(80))
            ->get();

        foreach ($lessons as $lesson) {
            try {
                // Log timeout detection
                \Illuminate\Support\Facades\Log::channel('meetings')->warning('Meeting timeout detected - auto-completing lesson', [
                    'lesson_id' => $lesson->id,
                    'room_name' => $lesson->meeting_room_name,
                    'student_id' => $lesson->student_id,
                    'tutor_id' => $lesson->tutor_id,
                    'meeting_started_at' => $lesson->meeting_started_at?->toIso8601String(),
                    'timeout_minutes' => 80,
                    'actual_duration_minutes' => $lesson->meeting_started_at?->diffInMinutes(now()),
                    'lesson_date' => $lesson->lesson_date->format('Y-m-d'),
                    'lesson_time' => $lesson->start_time
                ]);

                // Auto-complete the lesson
                $this->updateLessonStatusSystem(
                    $lesson->id,
                    Lesson::STATUS_COMPLETED,
                    'Automatycznie zakończone - przekroczono maksymalny czas spotkania (80 minut)'
                );

                // Clean up the room if it exists
                if ($lesson->hasMeetingRoom()) {
                    $dailyService = app(\App\Services\DailyVideoService::class);
                    $dailyService->deleteRoom($lesson->meeting_room_name);
                }

                // Update lesson record
                $lesson->update(['meeting_ended_at' => now()]);

                // End all active sessions
                $activeSessions = $lesson->meetingSessions()->whereNull('left_at')->get();
                foreach ($activeSessions as $session) {
                    $session->endSession();
                    
                    // Log forced session end
                    \Illuminate\Support\Facades\Log::channel('meetings')->info('Session ended due to timeout', [
                        'lesson_id' => $lesson->id,
                        'user_id' => $session->participant_id,
                        'session_id' => $session->id,
                        'joined_at' => $session->joined_at->toIso8601String(),
                        'left_at' => $session->left_at->toIso8601String(),
                        'duration_minutes' => $session->joined_at->diffInMinutes($session->left_at),
                        'reason' => 'timeout_80min'
                    ]);
                }

            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to handle lesson timeout', [
                    'lesson_id' => $lesson->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Check multiple lessons for timeouts and empty rooms - for bulk processing
     */
    public function checkLessonTimeouts(): array
    {
        $lessons = Lesson::where('status', Lesson::STATUS_IN_PROGRESS)
            ->whereNotNull('meeting_started_at')
            ->whereNotNull('meeting_room_name')
            ->where('meeting_started_at', '<=', now()->subMinutes(80))
            ->get();

        $results = [
            'processed' => 0,
            'completed' => 0,
            'errors' => []
        ];

        foreach ($lessons as $lesson) {
            try {
                // Auto-complete the lesson
                $this->updateLessonStatusSystem(
                    $lesson->id,
                    Lesson::STATUS_COMPLETED,
                    'Automatycznie zakończone - przekroczono maksymalny czas spotkania (80 minut)'
                );

                // Clean up the room if it exists
                if ($lesson->hasMeetingRoom()) {
                    $dailyService = app(\App\Services\DailyVideoService::class);
                    $dailyService->deleteRoom($lesson->meeting_room_name);
                }

                // Update lesson record
                $lesson->update(['meeting_ended_at' => now()]);

                // End all active sessions
                $activeSessions = $lesson->meetingSessions()->whereNull('left_at')->get();
                foreach ($activeSessions as $session) {
                    $session->endSession();
                }

                $results['processed']++;
                $results['completed']++;
                
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'lesson_id' => $lesson->id,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }
}