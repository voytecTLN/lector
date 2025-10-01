<?php

namespace App\Console\Commands;

use App\Mail\TutorAvailabilityAlert;
use App\Models\User;
use App\Models\TutorAvailabilityLog;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendTutorAvailabilityAlert extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'tutors:availability-alert
                          {--test : Send test email for current month}
                          {--month= : Specific month to check (YYYY-MM format)}';

    /**
     * The console command description.
     */
    protected $description = 'Send alert email about tutors with insufficient availability hours';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isTest = $this->option('test');
        $monthOption = $this->option('month');

        // Determine which month to check
        if ($monthOption) {
            try {
                $checkMonth = Carbon::createFromFormat('Y-m', $monthOption)->startOfMonth();
            } catch (\Exception $e) {
                $this->error('Invalid month format. Use YYYY-MM format (e.g., 2024-03)');
                return Command::FAILURE;
            }
        } else {
            // Check previous month (or current month if test)
            $checkMonth = $isTest ? Carbon::now()->startOfMonth() : Carbon::now()->subMonth()->startOfMonth();
        }

        $monthEnd = $checkMonth->copy()->endOfMonth();

        $this->info("Checking tutor availability for: {$checkMonth->format('F Y')}");

        // Get all active verified tutors
        $tutors = User::where('role', User::ROLE_TUTOR)
            ->where('status', User::STATUS_ACTIVE)
            ->whereHas('tutorProfile', function ($query) {
                $query->where('is_verified', true);
            })
            ->with('tutorProfile')
            ->get();

        if ($tutors->isEmpty()) {
            $this->info('No active verified tutors found.');
            return Command::SUCCESS;
        }

        $this->info("Found {$tutors->count()} active verified tutors");

        // Calculate availability hours for each tutor
        $lowAvailabilityTutors = [];

        foreach ($tutors as $tutor) {
            $availabilityHours = $this->calculateTutorAvailabilityHours($tutor->id, $checkMonth, $monthEnd);

            $this->line("Tutor: {$tutor->name} - {$availabilityHours} hours");

            if ($availabilityHours < 20) {
                $lowAvailabilityTutors[] = [
                    'tutor' => $tutor,
                    'hours' => $availabilityHours
                ];
            }
        }

        if (empty($lowAvailabilityTutors)) {
            $this->info('All tutors have sufficient availability (20+ hours)');
            return Command::SUCCESS;
        }

        $this->warn("Found {" . count($lowAvailabilityTutors) . "} tutors with insufficient availability");

        // Send email alert
        $emailRecipient = config('app.admin_alert_email', config('mail.from.address'));

        if (!$emailRecipient) {
            $this->error('No admin alert email configured. Set ADMIN_ALERT_EMAIL in .env file.');
            return Command::FAILURE;
        }

        try {
            Mail::to($emailRecipient)->send(new TutorAvailabilityAlert($lowAvailabilityTutors, $checkMonth));

            $this->info("Alert email sent successfully to: {$emailRecipient}");
            $this->info("Subject: Alert: Lektorzy z niewystarczającą dostępnością - {$checkMonth->format('F Y')}");

        } catch (\Exception $e) {
            $this->error("Failed to send email: {$e->getMessage()}");
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * Calculate total availability hours for a tutor in given month
     * Based on tutor_availability_logs (added hours minus deleted hours)
     */
    private function calculateTutorAvailabilityHours(int $tutorId, Carbon $monthStart, Carbon $monthEnd): int
    {
        // Get all availability logs for the tutor in the specified month
        $logs = TutorAvailabilityLog::where('tutor_id', $tutorId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->orderBy('created_at')
            ->get();

        $totalHours = 0;

        foreach ($logs as $log) {
            $hoursAdded = 0;
            $hoursRemoved = 0;

            // Count hours from new_slots (added)
            if ($log->new_slots && $log->action === 'added') {
                $hoursAdded = $this->countHoursFromSlots($log->new_slots);
            }

            // Count hours from old_slots (removed/deleted)
            if ($log->old_slots && $log->action === 'deleted') {
                $hoursRemoved = $this->countHoursFromSlots($log->old_slots);
            }

            // For updated action, calculate net change
            if ($log->action === 'updated') {
                $oldHours = $log->old_slots ? $this->countHoursFromSlots($log->old_slots) : 0;
                $newHours = $log->new_slots ? $this->countHoursFromSlots($log->new_slots) : 0;
                $hoursAdded = max(0, $newHours - $oldHours);
                $hoursRemoved = max(0, $oldHours - $newHours);
            }

            $totalHours += $hoursAdded - $hoursRemoved;
        }

        // Ensure we don't return negative hours
        return max(0, $totalHours);
    }

    /**
     * Count hours from slots array
     * Slots can be in format like ["9:00-12:00", "14:00-17:00"] or hour ranges
     */
    private function countHoursFromSlots($slots): int
    {
        if (!is_array($slots)) {
            return 0;
        }

        $totalHours = 0;

        foreach ($slots as $slot) {
            if (is_string($slot) && strpos($slot, '-') !== false) {
                // Format like "9:00-12:00"
                [$start, $end] = explode('-', $slot);
                $startHour = (int) explode(':', $start)[0];
                $endHour = (int) explode(':', $end)[0];
                $totalHours += max(0, $endHour - $startHour);
            } elseif (is_numeric($slot)) {
                // Single hour slot
                $totalHours += 1;
            }
        }

        return $totalHours;
    }
}