<?php

namespace App\Console\Commands;

use App\Services\TutorAvailabilityService;
use Carbon\Carbon;
use Illuminate\Console\Command;

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

    public function __construct(
        private TutorAvailabilityService $tutorAvailabilityService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isTest = $this->option('test');
        $monthOption = $this->option('month');

        // Determine which month to check
        if ($monthOption) {
            $monthString = $monthOption;
        } else {
            // Check previous month (or current month if test)
            $checkMonth = $isTest ? Carbon::now()->startOfMonth() : Carbon::now()->subMonth()->startOfMonth();
            $monthString = $checkMonth->format('Y-m');
        }

        $this->info("Checking tutor availability for: {$monthString}");

        try {
            // Use service instead of duplicating logic
            $result = $this->tutorAvailabilityService->checkTutorAvailability($monthString, true);

            $this->info("Found {$result['totalTutors']} active verified tutors");

            if ($result['tutorCount'] === 0) {
                $this->info('All tutors have sufficient availability (20+ hours)');
            } else {
                $this->warn("Found {$result['tutorCount']} tutors with insufficient availability");

                // Display tutor details
                foreach ($result['tutors'] as $tutorData) {
                    $this->line("Tutor: {$tutorData['tutor']->name} - {$tutorData['hours']} hours");
                }

                if ($result['emailSent']) {
                    $this->info("Alert email sent successfully");
                } else {
                    $this->warn("Email was not sent (email disabled or no admin email configured)");
                }
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Failed to check availability: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }

}