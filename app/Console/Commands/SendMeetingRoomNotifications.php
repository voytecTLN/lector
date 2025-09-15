<?php

namespace App\Console\Commands;

use App\Models\Lesson;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendMeetingRoomNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'lessons:send-meeting-room-notifications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications to tutors when they can create meeting rooms (10 minutes before lesson)';

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for lessons that can start meeting rooms...');
        
        // Find lessons that:
        // 1. Are scheduled
        // 2. Start exactly in 10 minutes (with 1-minute tolerance)
        // 3. Haven't received the notification yet
        $now = Carbon::now();
        $targetTime = $now->copy()->addMinutes(10);
        
        // Create a time range (9-11 minutes from now) to handle timing precision
        $timeRangeStart = $now->copy()->addMinutes(9);
        $timeRangeEnd = $now->copy()->addMinutes(11);
        
        $lessons = Lesson::with(['tutor', 'student'])
            ->where('status', Lesson::STATUS_SCHEDULED)
            ->where('lesson_date', $targetTime->toDateString())
            ->whereTime('start_time', '>=', $timeRangeStart->toTimeString())
            ->whereTime('start_time', '<=', $timeRangeEnd->toTimeString())
            // Add a flag to prevent duplicate notifications
            ->where('room_creation_notification_sent', false)
            ->get();

        if ($lessons->isEmpty()) {
            $this->info('No lessons found that need meeting room notifications.');
            return 0;
        }

        $this->info("Found {$lessons->count()} lessons that need meeting room notifications.");

        $successCount = 0;
        $errorCount = 0;

        foreach ($lessons as $lesson) {
            try {
                $lessonDateTime = Carbon::parse($lesson->lesson_date->format('Y-m-d') . ' ' . $lesson->start_time);
                $minutesUntilLesson = $now->diffInMinutes($lessonDateTime, false);

                $this->line("Processing lesson ID: {$lesson->id} (in {$minutesUntilLesson} minutes)");
                $this->line("  Tutor: {$lesson->tutor->name}");
                $this->line("  Student: {$lesson->student->name}");
                $this->line("  Time: {$lesson->lesson_date->format('d.m.Y')} at {$lesson->start_time}");

                // Send notification to tutor
                $this->notificationService->sendTutorCanCreateRoom($lesson);
                
                // Mark as notified to prevent duplicates
                $lesson->update(['room_creation_notification_sent' => true]);
                
                $this->info("  ✓ Notification sent successfully");
                $successCount++;

            } catch (\Exception $e) {
                $this->error("  ✗ Failed to send notification for lesson {$lesson->id}: {$e->getMessage()}");
                Log::error("Failed to send meeting room notification", [
                    'lesson_id' => $lesson->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $errorCount++;
            }
        }

        $this->info("\nSummary:");
        $this->info("  ✓ Successful notifications: {$successCount}");
        if ($errorCount > 0) {
            $this->error("  ✗ Failed notifications: {$errorCount}");
        }

        return $errorCount > 0 ? 1 : 0;
    }
}
