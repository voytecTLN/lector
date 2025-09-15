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
        // Check lesson statuses every 8 minutes
        $schedule->command('lessons:check-status')->cron('*/8 * * * *');

        // Send meeting room notifications every minute
        $schedule->command('lessons:send-meeting-room-notifications')->everyMinute();
    }

    protected function commands()
    {
        //
    }
}