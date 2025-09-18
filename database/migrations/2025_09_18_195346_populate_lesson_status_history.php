<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Lesson;
use App\Models\LessonStatusHistory;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Populate status history for existing lessons
        $lessons = Lesson::all();

        foreach ($lessons as $lesson) {
            // Create initial "scheduled" status entry
            LessonStatusHistory::create([
                'lesson_id' => $lesson->id,
                'status' => 'scheduled',
                'previous_status' => null,
                'reason' => 'Lekcja została zaplanowana',
                'changed_by_role' => 'system',
                'changed_by_user_id' => null,
                'created_at' => $lesson->created_at,
                'updated_at' => $lesson->created_at,
            ]);

            // If lesson status is not scheduled, create current status entry
            if ($lesson->status !== 'scheduled') {
                $reason = $this->getReasonForStatus($lesson);
                $changedBy = $this->getChangedByInfo($lesson);

                LessonStatusHistory::create([
                    'lesson_id' => $lesson->id,
                    'status' => $lesson->status,
                    'previous_status' => 'scheduled',
                    'reason' => $reason,
                    'changed_by_role' => $changedBy['role'],
                    'changed_by_user_id' => $changedBy['user_id'],
                    'created_at' => $lesson->status_updated_at ?: $lesson->updated_at,
                    'updated_at' => $lesson->status_updated_at ?: $lesson->updated_at,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Clear all status history (will be recreated if migration is run again)
        LessonStatusHistory::truncate();
    }

    /**
     * Get appropriate reason for lesson status
     */
    private function getReasonForStatus(Lesson $lesson): string
    {
        if ($lesson->status === 'cancelled') {
            return $lesson->cancellation_reason ?: 'Lekcja została anulowana';
        }

        if ($lesson->status_reason) {
            return $lesson->status_reason;
        }

        return match($lesson->status) {
            'completed' => 'Lekcja została zakończona',
            'in_progress' => 'Lekcja została rozpoczęta',
            'no_show_student' => 'Student nie pojawił się na lekcji',
            'no_show_tutor' => 'Lektor nie pojawił się na lekcji',
            'technical_issues' => 'Wystąpiły problemy techniczne',
            'not_started' => 'Lekcja się nie rozpoczęła',
            default => 'Status zmieniony'
        };
    }

    /**
     * Get who changed the status
     */
    private function getChangedByInfo(Lesson $lesson): array
    {
        // For cancelled lessons, check cancelled_by first
        if ($lesson->status === 'cancelled' && $lesson->cancelled_by) {
            return [
                'role' => $lesson->cancelled_by === 'admin' ? 'admin' : 'system',
                'user_id' => null // We don't have the exact user ID for old cancellations
            ];
        }

        // For other statuses, use status_updated_by
        if ($lesson->status_updated_by) {
            $user = \App\Models\User::find($lesson->status_updated_by);
            return [
                'role' => $user ? $user->role : 'system',
                'user_id' => $lesson->status_updated_by
            ];
        }

        return [
            'role' => 'system',
            'user_id' => null
        ];
    }
};