<?php

namespace App\Console\Commands;

use App\Models\Lesson;
use App\Services\LessonStatusService;
use Illuminate\Console\Command;
use Carbon\Carbon;

class CheckLessonStatus extends Command
{
    protected $signature = 'lessons:check-status';
    protected $description = 'Check lessons that should have started but are still scheduled and mark them appropriately';

    private LessonStatusService $lessonStatusService;

    public function __construct(LessonStatusService $lessonStatusService)
    {
        parent::__construct();
        $this->lessonStatusService = $lessonStatusService;
    }

    public function handle()
    {
        $this->info('Checking lesson statuses...');

        // 1. Get lessons that should have started but are still scheduled
        $lessons = Lesson::where('status', Lesson::STATUS_SCHEDULED)
            ->where('lesson_date', '<=', now()->toDateString())
            ->whereTime('start_time', '<=', now()->subMinutes(15)->toTimeString())
            ->get();

        $processed = 0;
        
        foreach ($lessons as $lesson) {
            try {
                $this->lessonStatusService->handleNoShowScenarios($lesson);
                $processed++;
                $this->line("Processed not started lesson ID: {$lesson->id}");
            } catch (\Exception $e) {
                $this->error("Failed to process lesson ID {$lesson->id}: " . $e->getMessage());
            }
        }

        $this->info("Processed {$processed} not started lessons.");

        // 2. Check for empty rooms (lessons in progress but empty for 10+ minutes)
        $this->info('Checking for empty rooms...');
        
        $emptyRoomResults = $this->lessonStatusService->checkEmptyRooms(10);
        
        $this->info("Checked {$emptyRoomResults['processed']} active lessons.");
        $this->info("Auto-completed {$emptyRoomResults['completed']} empty room lessons.");
        
        if (!empty($emptyRoomResults['errors'])) {
            $this->warn("Encountered " . count($emptyRoomResults['errors']) . " errors during empty room processing.");
        }

        // 3. Check for lesson timeouts (lessons running more than 80 minutes)
        $this->info('Checking for lesson timeouts...');
        
        $timeoutResults = $this->lessonStatusService->checkLessonTimeouts();
        
        $this->info("Checked {$timeoutResults['processed']} long-running lessons.");
        $this->info("Auto-completed {$timeoutResults['completed']} timed-out lessons.");
        
        if (!empty($timeoutResults['errors'])) {
            $this->warn("Encountered " . count($timeoutResults['errors']) . " errors during timeout processing.");
        }
        
        return Command::SUCCESS;
    }
}