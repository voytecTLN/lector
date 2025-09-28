<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Lesson;
use App\Models\LessonStatusHistory;
use Illuminate\Support\Facades\DB;

class BackfillLessonStatusHistory extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'lessons:backfill-status-history {--dry-run : Show what would be done without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill missing initial status history entries for existing lessons';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');

        $this->info($isDryRun ? 'Running in DRY RUN mode...' : 'Starting backfill process...');

        // Get all lessons
        $lessons = Lesson::orderBy('created_at')->get();
        $processedCount = 0;
        $addedCount = 0;

        $this->withProgressBar($lessons, function ($lesson) use ($isDryRun, &$processedCount, &$addedCount) {
            $processedCount++;

            // Check if lesson has any status history
            $hasHistory = LessonStatusHistory::where('lesson_id', $lesson->id)->exists();

            // Check if lesson has initial scheduled status in history
            $hasInitialStatus = LessonStatusHistory::where('lesson_id', $lesson->id)
                ->whereNull('previous_status')
                ->where('status', 'scheduled')
                ->exists();

            // If no history at all, or no initial status, add missing entries
            if (!$hasHistory || !$hasInitialStatus) {
                if (!$isDryRun) {
                    DB::beginTransaction();
                    try {
                        // Always add initial scheduled status if missing
                        if (!$hasInitialStatus) {
                            LessonStatusHistory::create([
                                'lesson_id' => $lesson->id,
                                'status' => 'scheduled',
                                'previous_status' => null,
                                'reason' => 'Lekcja została zaplanowana (uzupełnione retroaktywnie)',
                                'changed_by_role' => 'system',
                                'changed_by_user_id' => null,
                                'created_at' => $lesson->created_at,
                                'updated_at' => $lesson->created_at,
                            ]);
                        }

                        // If lesson has meeting room info and status is completed/in_progress,
                        // add missing "in_progress" status
                        if ($lesson->meeting_started_at &&
                            in_array($lesson->status, ['completed', 'in_progress']) &&
                            !LessonStatusHistory::where('lesson_id', $lesson->id)->where('status', 'in_progress')->exists()) {

                            LessonStatusHistory::create([
                                'lesson_id' => $lesson->id,
                                'status' => 'in_progress',
                                'previous_status' => 'scheduled',
                                'reason' => 'Lektor rozpoczął spotkanie (uzupełnione retroaktywnie)',
                                'changed_by_role' => 'system',
                                'changed_by_user_id' => null,
                                'created_at' => $lesson->meeting_started_at,
                                'updated_at' => $lesson->meeting_started_at,
                            ]);
                        }

                        // If lesson has current status different from scheduled and in_progress,
                        // add final status entry
                        if ($lesson->status !== 'scheduled' && $lesson->status !== 'in_progress' &&
                            !LessonStatusHistory::where('lesson_id', $lesson->id)->where('status', $lesson->status)->exists()) {

                            $previousStatus = $lesson->meeting_started_at ? 'in_progress' : 'scheduled';
                            $statusReason = $this->getReasonForStatus($lesson->status);

                            LessonStatusHistory::create([
                                'lesson_id' => $lesson->id,
                                'status' => $lesson->status,
                                'previous_status' => $previousStatus,
                                'reason' => $statusReason . ' (uzupełnione retroaktywnie)',
                                'changed_by_role' => 'system',
                                'changed_by_user_id' => null,
                                'created_at' => $lesson->status_updated_at ?? $lesson->meeting_ended_at ?? $lesson->updated_at,
                                'updated_at' => $lesson->status_updated_at ?? $lesson->meeting_ended_at ?? $lesson->updated_at,
                            ]);
                        }

                        DB::commit();
                        $addedCount++;
                    } catch (\Exception $e) {
                        DB::rollBack();
                        $this->error("\nError processing lesson {$lesson->id}: " . $e->getMessage());
                    }
                } else {
                    $addedCount++;
                }
            }
        });

        $this->newLine(2);
        $this->info("Process completed!");
        $this->info("Lessons processed: {$processedCount}");
        $this->info("History entries " . ($isDryRun ? "would be added" : "added") . ": {$addedCount}");

        return Command::SUCCESS;
    }

    /**
     * Get default reason for status
     */
    private function getReasonForStatus(string $status): string
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
}