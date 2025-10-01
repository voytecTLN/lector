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

// Schedule tutor availability alert on 1st day of each month at 09:00
Schedule::command('tutors:availability-alert')->monthlyOn(1, '09:00');

// Schedule daily logout of all users at 4:00 AM
Schedule::command('users:logout-all')->dailyAt('04:00');