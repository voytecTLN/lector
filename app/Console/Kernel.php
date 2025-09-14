<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected $commands = [
        Commands\CheckLessonStatus::class,
    ];

    protected function schedule(Schedule $schedule)
    {
        // Check lesson statuses every 15 minutes
        $schedule->command('lessons:check-status')
                 ->everyFifteenMinutes()
                 ->withoutOverlapping()
                 ->runInBackground();
    }

    protected function commands()
    {
        //
    }
}