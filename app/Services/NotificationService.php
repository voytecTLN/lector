<?php
// app/Services/NotificationService.php - Poprawiony z lepszym logowaniem

namespace App\Services;

use App\Models\User;
use App\Models\Lesson;
use App\Notifications\Auth\EmailVerificationNotification;
use App\Notifications\Auth\WelcomeNotification;
use App\Notifications\Auth\PasswordResetNotification;
use App\Notifications\Lessons\LessonBookingConfirmation;
use App\Notifications\Lessons\LessonCancellationNotice;
use App\Notifications\Lessons\LessonRoomAvailable;
use App\Notifications\Lessons\TutorCanCreateRoom;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send welcome email after registration
     */
    public function sendWelcomeEmail(User $user, ?string $password = null): void
    {
        try {
            // Send welcome email if notifications are enabled
            if (config('mail.enable_notifications', true)) {
                $user->notify(new WelcomeNotification($password));
            }
        } catch (\Exception $e) {
            Log::error("Failed to send welcome email to {$user->email}: " . $e->getMessage());
        }
    }

    public function sendEmailVerification(User $user, string $token): void
    {
        try {
            // Weryfikuj czy token został zapisany w bazie
            $user->refresh(); // Odśwież model z bazy danych
            
            if (config('mail.enable_notifications', true)) {
                $user->notify(new EmailVerificationNotification($token));
            }
        } catch (\Exception $e) {
            Log::error("Failed to send email verification to {$user->email}: " . $e->getMessage());
        }
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(User $user, string $token): void
    {
        try {
            // Check if email notifications are enabled
            if (config('mail.enable_notifications', true)) {
                $user->notify(new PasswordResetNotification($token));
            }
        } catch (\Exception $e) {
            Log::error("Failed to send password reset email to {$user->email}: " . $e->getMessage());
        }
    }

    /**
     * Send login notification (for security)
     */
    public function sendLoginNotification(User $user, string $ip, string $userAgent): void
    {
        try {

            // TODO: Implement login notification email if needed
            // Currently not a critical requirement

        } catch (\Exception $e) {
            Log::error("Failed to send login notification to {$user->email}: " . $e->getMessage());
        }
    }

    /**
     * Send lesson booking confirmation to both student and tutor
     */
    public function sendLessonBookingConfirmation(Lesson $lesson): void
    {
        try {

            if (config('mail.enable_notifications', true)) {
                // Send to student
                $lesson->student->notify(new LessonBookingConfirmation($lesson, 'student'));
                
                // Send to tutor
                $lesson->tutor->notify(new LessonBookingConfirmation($lesson, 'tutor'));
            }

        } catch (\Exception $e) {
            Log::error("Failed to send booking confirmations for lesson {$lesson->id}: " . $e->getMessage());
        }
    }

    /**
     * Send lesson cancellation notice
     */
    public function sendLessonCancellationNotice(Lesson $lesson, ?User $cancelledBy = null, ?string $reason = null): void
    {
        try {
            if (config('mail.enable_notifications', true)) {
                // Determine who to notify based on who cancelled
                if ($cancelledBy && $cancelledBy->id === $lesson->student_id) {
                    // Student cancelled - notify tutor
                    $lesson->tutor->notify(new LessonCancellationNotice($lesson, 'tutor', $cancelledBy, $reason));
                } elseif ($cancelledBy && $cancelledBy->id === $lesson->tutor_id) {
                    // Tutor cancelled - notify student
                    $lesson->student->notify(new LessonCancellationNotice($lesson, 'student', $cancelledBy, $reason));
                } else {
                    // Admin or system cancelled - notify both
                    $lesson->student->notify(new LessonCancellationNotice($lesson, 'student', $cancelledBy, $reason));
                    $lesson->tutor->notify(new LessonCancellationNotice($lesson, 'tutor', $cancelledBy, $reason));
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to send cancellation notices for lesson {$lesson->id}: " . $e->getMessage());
        }
    }

    /**
     * Send notification that lesson room is available
     */
    public function sendLessonRoomAvailable(Lesson $lesson, string $meetingUrl): void
    {
        try {
            if (config('mail.enable_notifications', true)) {
                $lesson->student->notify(new LessonRoomAvailable($lesson, $meetingUrl));
            }
        } catch (\Exception $e) {
            Log::error("Failed to send room available notification for lesson {$lesson->id}: " . $e->getMessage());
        }
    }

    /**
     * Send notification to tutor that they can create meeting room
     */
    public function sendTutorCanCreateRoom(Lesson $lesson): void
    {
        try {
            if (config('mail.enable_notifications', true)) {
                $dashboardUrl = config('app.url') . '/#/tutor/dashboard?section=nadchodzace';
                $lesson->tutor->notify(new TutorCanCreateRoom($lesson, $dashboardUrl));
            }
        } catch (\Exception $e) {
            Log::error("Failed to send tutor can create room notification for lesson {$lesson->id}: " . $e->getMessage());
        }
    }
}