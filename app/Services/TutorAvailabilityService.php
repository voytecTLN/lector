<?php

namespace App\Services;

use App\Models\User;
use App\Models\TutorAvailabilityLog;
use App\Mail\TutorAvailabilityAlert;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class TutorAvailabilityService
{
    /**
     * Check tutor availability for a specific month and optionally send alerts
     */
    public function checkTutorAvailability(string $monthString, bool $sendEmail = true): array
    {
        try {
            // Parse month
            $checkMonth = Carbon::createFromFormat('Y-m', $monthString)->startOfMonth();
            $monthEnd = $checkMonth->copy()->endOfMonth();

            // Get all active verified tutors
            $tutors = User::where('role', User::ROLE_TUTOR)
                ->where('status', User::STATUS_ACTIVE)
                ->whereHas('tutorProfile', function ($query) {
                    $query->where('is_verified', true);
                })
                ->with('tutorProfile')
                ->get();

            if ($tutors->isEmpty()) {
                return [
                    'success' => true,
                    'tutorCount' => 0,
                    'message' => 'No active verified tutors found.',
                    'tutors' => []
                ];
            }

            // Calculate availability hours for each tutor
            $lowAvailabilityTutors = [];

            foreach ($tutors as $tutor) {
                $availabilityHours = $this->calculateTutorAvailabilityHours($tutor->id, $checkMonth, $monthEnd);

                if ($availabilityHours < 20) {
                    $lowAvailabilityTutors[] = [
                        'tutor' => $tutor,
                        'hours' => $availabilityHours
                    ];
                }
            }

            $result = [
                'success' => true,
                'tutorCount' => count($lowAvailabilityTutors),
                'message' => count($lowAvailabilityTutors) === 0
                    ? 'All tutors have sufficient availability (20+ hours)'
                    : "Found " . count($lowAvailabilityTutors) . " tutors with insufficient availability",
                'tutors' => $lowAvailabilityTutors,
                'checkMonth' => $checkMonth,
                'totalTutors' => $tutors->count()
            ];

            // Send email if requested (always for testing, regardless of issues)
            if ($sendEmail) {
                if (count($lowAvailabilityTutors) > 0) {
                    $this->sendAvailabilityAlert($lowAvailabilityTutors, $checkMonth);
                    $result['emailSent'] = true;
                } else {
                    // For testing purposes, send a "no issues" email
                    $this->sendNoIssuesAlert($checkMonth);
                    $result['emailSent'] = true;
                    $result['emailType'] = 'no_issues';
                }
            } else {
                $result['emailSent'] = false;
            }

            return $result;

        } catch (\Exception $e) {
            Log::error('TutorAvailabilityService error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Calculate tutor availability hours for a specific month
     */
    private function calculateTutorAvailabilityHours(int $tutorId, Carbon $monthStart, Carbon $monthEnd): int
    {
        // Get availability logs for the month
        $logs = TutorAvailabilityLog::where('tutor_id', $tutorId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->get();

        $totalHours = 0;

        foreach ($logs as $log) {
            $slots = $log->getSlotDetails();

            foreach ($slots as $slot) {
                if (isset($slot['is_net_change']) && $slot['is_net_change']) {
                    // For updated actions, use the net change direction
                    $hours = $slot['positive'] ? $slot['hours'] : -$slot['hours'];
                } else {
                    // For added/deleted actions
                    $hours = $log->action === 'added' ? $slot['hours'] : -$slot['hours'];
                }
                $totalHours += $hours;
            }
        }

        return max(0, $totalHours); // Ensure non-negative
    }

    /**
     * Send availability alert email
     */
    private function sendAvailabilityAlert(array $lowAvailabilityTutors, Carbon $checkMonth): void
    {
        $adminEmail = env('ADMIN_ALERT_EMAIL');

        if (!$adminEmail) {
            Log::warning('Admin alert email not configured - ADMIN_ALERT_EMAIL not set');
            return;
        }

        try {
            Log::info("Attempting to send availability alert to {$adminEmail} for " . count($lowAvailabilityTutors) . " tutors");
            Mail::to($adminEmail)->send(new TutorAvailabilityAlert($lowAvailabilityTutors, $checkMonth));
            Log::info("Availability alert sent successfully to {$adminEmail}");
        } catch (\Exception $e) {
            Log::error('Failed to send availability alert email: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Send "no issues" alert for testing
     */
    private function sendNoIssuesAlert(Carbon $checkMonth): void
    {
        $adminEmail = env('ADMIN_ALERT_EMAIL');

        if (!$adminEmail) {
            Log::warning('Admin alert email not configured - ADMIN_ALERT_EMAIL not set');
            return;
        }

        try {
            Log::info("Sending 'no issues' test email to {$adminEmail}");

            // Send with empty array to trigger "no issues" email
            Mail::to($adminEmail)->send(new TutorAvailabilityAlert([], $checkMonth));
            Log::info("No issues alert sent successfully to {$adminEmail}");
        } catch (\Exception $e) {
            Log::error('Failed to send no issues alert email: ' . $e->getMessage());
            throw $e;
        }
    }
}