<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Schedule lesson status checks every 8 minutes
Schedule::command('lessons:check-status')->cron('*/8 * * * *');

// Schedule meeting room notifications every minute
Schedule::command('lessons:send-meeting-room-notifications')->everyMinute();