<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected $commands = [
        Commands\CheckLessonStatus::class,
        Commands\SendMeetingRoomNotifications::class,
    ];

    protected function schedule(Schedule $schedule)
    {
        // Note: In Laravel 11, scheduling is now done in routes/console.php
        // This method is kept for backwards compatibility but is not used
    }

    protected function commands()
    {
        //
    }
}