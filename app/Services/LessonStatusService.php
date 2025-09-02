<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

class LessonStatusService
{
    // Available lesson statuses
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_NO_SHOW_STUDENT = 'no_show_student';
    const STATUS_NO_SHOW_TUTOR = 'no_show_tutor';
    const STATUS_TECHNICAL_ISSUES = 'technical_issues';

    const ALLOWED_STATUSES = [
        self::STATUS_SCHEDULED,
        self::STATUS_IN_PROGRESS,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
        self::STATUS_NO_SHOW_STUDENT,
        self::STATUS_NO_SHOW_TUTOR,
        self::STATUS_TECHNICAL_ISSUES,
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
            $lesson = Lesson::findOrFail($lessonId);
            $user = Auth::user();

            // Check permissions
            $this->validateStatusChangePermission($user, $lesson, $status);

            // Store previous status for history
            $previousStatus = $lesson->status;

            // Update lesson status
            $lesson->status = $status;
            $lesson->status_reason = $reason;
            $lesson->status_updated_by = $user->id;
            $lesson->status_updated_at = now();
            $lesson->save();

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
    private function validateStatusChangePermission(User $user, Lesson $lesson, string $newStatus): void
    {
        // Admin can change any status
        if ($user->role === 'admin') {
            return;
        }

        // Tutor permissions
        if ($user->role === 'tutor' && $lesson->tutor_id === $user->id) {
            $allowedStatuses = [
                self::STATUS_IN_PROGRESS,
                self::STATUS_COMPLETED,
                self::STATUS_NO_SHOW_STUDENT,
                self::STATUS_TECHNICAL_ISSUES,
                self::STATUS_CANCELLED
            ];

            if (!in_array($newStatus, $allowedStatuses)) {
                throw new Exception("Tutors cannot set status to: {$newStatus}");
            }
            return;
        }

        // Student can only cancel their own lessons (with restrictions)
        if ($user->role === 'student' && $lesson->student_id === $user->id) {
            if ($newStatus === self::STATUS_CANCELLED) {
                // Check if cancellation is allowed (e.g., 24h before)
                $hoursUntilLesson = now()->diffInHours($lesson->lesson_date, false);
                if ($hoursUntilLesson < 24) {
                    throw new Exception("Lessons must be cancelled at least 24 hours in advance");
                }
                return;
            }
        }

        throw new Exception("You don't have permission to change this lesson's status");
    }

    /**
     * Handle side effects of status changes
     */
    private function handleStatusSideEffects(Lesson $lesson, string $previousStatus, string $newStatus): void
    {
        // Refund hours if tutor no-show
        if ($newStatus === self::STATUS_NO_SHOW_TUTOR && $lesson->packageAssignment) {
            $packageAssignment = $lesson->packageAssignment;
            $packageAssignment->hours_remaining += $lesson->duration_minutes / 60;
            $packageAssignment->save();

            // Log the refund
            \Log::info("Refunded {$lesson->duration_minutes} minutes to student {$lesson->student_id} due to tutor no-show");
        }

        // Mark lesson as started (requires migration to add started_at column)
        // TODO: Uncomment after running migration to add started_at and ended_at columns
        /*
        if ($newStatus === self::STATUS_IN_PROGRESS && $previousStatus === self::STATUS_SCHEDULED) {
            $lesson->started_at = now();
            $lesson->save();
        }
        */

        // Mark lesson as ended (requires migration to add ended_at column)
        // TODO: Uncomment after running migration to add started_at and ended_at columns
        /*
        if (in_array($newStatus, [self::STATUS_COMPLETED, self::STATUS_NO_SHOW_STUDENT, self::STATUS_NO_SHOW_TUTOR])) {
            if (!$lesson->ended_at) {
                $lesson->ended_at = now();
                $lesson->save();
            }
        }
        */
    }

    /**
     * Get status change history for a lesson
     */
    public function getStatusHistory(int $lessonId): array
    {
        // For now, return current status info
        // In future, implement a separate status_history table
        $lesson = Lesson::with(['statusUpdatedBy', 'tutor', 'student', 'cancelledBy'])->findOrFail($lessonId);

        $history = [];

        // Add current status if it was updated by a user
        if ($lesson->status_updated_by && $lesson->status_updated_at) {
            $history[] = [
                'status' => $lesson->status,
                'reason' => $lesson->status_reason ?: $this->getDefaultReasonForStatus($lesson->status),
                'changed_by' => $lesson->statusUpdatedBy->name,
                'changed_at' => $lesson->status_updated_at->toIso8601String(),
            ];
        }
        
        // Add cancelled status if lesson was cancelled
        if ($lesson->status === 'cancelled' && $lesson->cancelled_at) {
            // Only add if not already added above
            if (empty($history) || $history[count($history) - 1]['status'] !== 'cancelled') {
                $cancelledBy = 'System';
                if ($lesson->cancelled_by && $lesson->cancelledBy) {
                    $cancelledBy = $lesson->cancelledBy->name;
                }
                
                $history[] = [
                    'status' => 'cancelled',
                    'reason' => $lesson->cancellation_reason ?: 'Lekcja została anulowana',
                    'changed_by' => $cancelledBy,
                    'changed_at' => $lesson->cancelled_at->toIso8601String(),
                ];
            }
        }
        
        // If status is not scheduled and we have no history, add current status
        if (empty($history) && $lesson->status !== 'scheduled') {
            // Generate simulated history based on current status
            $statusReasons = [
                'completed' => 'Lekcja została zakończona',
                'in_progress' => 'Lekcja została rozpoczęta',
                'cancelled' => 'Lekcja została anulowana',
                'no_show_student' => 'Student nie pojawił się na lekcji',
                'no_show_tutor' => 'Lektor nie pojawił się na lekcji',
                'technical_issues' => 'Wystąpiły problemy techniczne'
            ];
            
            $history[] = [
                'status' => $lesson->status,
                'reason' => $statusReasons[$lesson->status] ?? 'Status zmieniony',
                'changed_by' => 'System',
                'changed_at' => $lesson->updated_at->toIso8601String(),
            ];
        }

        // Always add initial creation status
        $history[] = [
            'status' => 'scheduled',
            'reason' => 'Lekcja została zaplanowana',
            'changed_by' => 'System',
            'changed_at' => $lesson->created_at->toIso8601String(),
        ];

        // Return in chronological order (oldest first)
        return array_reverse($history);
    }
    
    /**
     * Get default reason for status
     */
    private function getDefaultReasonForStatus(string $status): string
    {
        return match($status) {
            self::STATUS_SCHEDULED => 'Lekcja zaplanowana',
            self::STATUS_IN_PROGRESS => 'Lekcja rozpoczęta',
            self::STATUS_COMPLETED => 'Lekcja zakończona',
            self::STATUS_CANCELLED => 'Lekcja anulowana',
            self::STATUS_NO_SHOW_STUDENT => 'Student nieobecny',
            self::STATUS_NO_SHOW_TUTOR => 'Lektor nieobecny',
            self::STATUS_TECHNICAL_ISSUES => 'Problemy techniczne',
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
        $shouldHaveStarted = now()->greaterThan($lesson->lesson_date);
        $notStarted = $lesson->status === self::STATUS_SCHEDULED;

        if ($shouldHaveStarted && $notStarted) {
            // Auto-mark as no-show after grace period (e.g., 15 minutes)
            $gracePeriodPassed = now()->diffInMinutes($lesson->lesson_date) > 15;

            if ($gracePeriodPassed) {
                // Determine who didn't show up based on system logs or other criteria
                // For now, mark as technical issues if unclear
                $this->updateLessonStatus(
                    $lesson->id,
                    self::STATUS_TECHNICAL_ISSUES,
                    'Automatically marked - lesson did not start'
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
            self::STATUS_SCHEDULED => 'Zaplanowana',
            self::STATUS_IN_PROGRESS => 'W trakcie',
            self::STATUS_COMPLETED => 'Zakończona',
            self::STATUS_CANCELLED => 'Anulowana',
            self::STATUS_NO_SHOW_STUDENT => 'Student nieobecny',
            self::STATUS_NO_SHOW_TUTOR => 'Lektor nieobecny',
            self::STATUS_TECHNICAL_ISSUES => 'Problemy techniczne',
        ];
    }

    /**
     * Get status badge classes for UI
     */
    public static function getStatusBadgeClass(string $status): string
    {
        return match($status) {
            self::STATUS_SCHEDULED => 'bg-primary',
            self::STATUS_IN_PROGRESS => 'bg-info',
            self::STATUS_COMPLETED => 'bg-success',
            self::STATUS_CANCELLED => 'bg-danger',
            self::STATUS_NO_SHOW_STUDENT => 'bg-warning',
            self::STATUS_NO_SHOW_TUTOR => 'bg-warning',
            self::STATUS_TECHNICAL_ISSUES => 'bg-secondary',
            default => 'bg-secondary'
        };
    }
}