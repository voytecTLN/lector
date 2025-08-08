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
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send welcome email after registration
     */
    public function sendWelcomeEmail(User $user, string $password = null): void
    {
        try {
            Log::info("Sending welcome email to: {$user->email}");

            // Check if email notifications are enabled
            if (config('mail.enable_notifications', true)) {
                $user->notify(new WelcomeNotification($password));
                Log::info("Welcome email queued for: {$user->email}");
            } else {
                Log::info("Email notifications disabled. Skipping welcome email for: {$user->email}");
            }

        } catch (\Exception $e) {
            Log::error("Failed to send welcome email to {$user->email}: " . $e->getMessage());
        }
    }

    public function sendEmailVerification(User $user, string $token): void
    {
        try {
            // WAŻNE: Loguj szczegóły dla debugowania
            Log::info("Sending email verification", [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'token' => $token,
                'token_length' => strlen($token),
                'user_verification_token' => $user->verification_token
            ]);

            // Weryfikuj czy token został zapisany w bazie
            $user->refresh(); // Odśwież model z bazy danych
            if ($user->verification_token !== $token) {
                Log::error("Token mismatch!", [
                    'expected' => $token,
                    'actual' => $user->verification_token,
                    'user_id' => $user->id
                ]);
            } else {
                Log::info("Token correctly saved in database for user: {$user->email}");
            }

            // Check if email notifications are enabled
            if (config('mail.enable_notifications', true)) {
                $user->notify(new EmailVerificationNotification());
                Log::info("Verification email queued for: {$user->email}");
            } else {
                // TYMCZASOWO: Wyświetl informacje w logach do testowania
                $verificationUrl = url("/api/auth/verify-email?token={$token}");
                Log::info("=== EMAIL VERIFICATION INFO (Email disabled) ===");
                Log::info("User: {$user->name} ({$user->email})");
                Log::info("Verification URL: {$verificationUrl}");
                Log::info("Token: {$token}");
                Log::info("=== END EMAIL INFO ===");
            }

        } catch (\Exception $e) {
            Log::error("Failed to send verification email to {$user->email}: " . $e->getMessage());
        }
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(User $user, string $token): void
    {
        try {
            Log::info("Password reset email details", [
                'user_email' => $user->email,
                'token' => $token
            ]);

            // Check if email notifications are enabled
            if (config('mail.enable_notifications', true)) {
                $user->notify(new PasswordResetNotification($token));
                Log::info("Password reset email queued for: {$user->email}");
            } else {
                $resetUrl = url("/reset-password?token={$token}");
                Log::info("Email notifications disabled. Reset URL: {$resetUrl}");
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
            Log::info("Login notification details", [
                'user_email' => $user->email,
                'ip' => $ip,
                'user_agent' => $userAgent
            ]);

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
            Log::info("Sending lesson booking confirmations", [
                'lesson_id' => $lesson->id,
                'student_email' => $lesson->student->email,
                'tutor_email' => $lesson->tutor->email
            ]);

            if (config('mail.enable_notifications', true)) {
                // Send to student
                $lesson->student->notify(new LessonBookingConfirmation($lesson, 'student'));
                Log::info("Booking confirmation queued for student: {$lesson->student->email}");

                // Send to tutor
                $lesson->tutor->notify(new LessonBookingConfirmation($lesson, 'tutor'));
                Log::info("Booking confirmation queued for tutor: {$lesson->tutor->email}");
            } else {
                Log::info("Email notifications disabled. Skipping booking confirmations.");
            }

        } catch (\Exception $e) {
            Log::error("Failed to send booking confirmations for lesson {$lesson->id}: " . $e->getMessage());
        }
    }

    /**
     * Send lesson cancellation notice
     */
    public function sendLessonCancellationNotice(Lesson $lesson, User $cancelledBy = null, string $reason = null): void
    {
        try {
            Log::info("Sending lesson cancellation notices", [
                'lesson_id' => $lesson->id,
                'cancelled_by' => $cancelledBy?->id,
                'reason' => $reason
            ]);

            if (config('mail.enable_notifications', true)) {
                // Determine who to notify based on who cancelled
                if ($cancelledBy && $cancelledBy->id === $lesson->student_id) {
                    // Student cancelled - notify tutor
                    $lesson->tutor->notify(new LessonCancellationNotice($lesson, 'tutor', $cancelledBy, $reason));
                    Log::info("Cancellation notice queued for tutor: {$lesson->tutor->email}");
                } elseif ($cancelledBy && $cancelledBy->id === $lesson->tutor_id) {
                    // Tutor cancelled - notify student
                    $lesson->student->notify(new LessonCancellationNotice($lesson, 'student', $cancelledBy, $reason));
                    Log::info("Cancellation notice queued for student: {$lesson->student->email}");
                } else {
                    // Admin or system cancelled - notify both
                    $lesson->student->notify(new LessonCancellationNotice($lesson, 'student', $cancelledBy, $reason));
                    $lesson->tutor->notify(new LessonCancellationNotice($lesson, 'tutor', $cancelledBy, $reason));
                    Log::info("Cancellation notices queued for both parties");
                }
            } else {
                Log::info("Email notifications disabled. Skipping cancellation notices.");
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
            Log::info("Sending lesson room available notification", [
                'lesson_id' => $lesson->id,
                'student_email' => $lesson->student->email,
                'meeting_url' => $meetingUrl
            ]);

            if (config('mail.enable_notifications', true)) {
                $lesson->student->notify(new LessonRoomAvailable($lesson, $meetingUrl));
                Log::info("Room available notification queued for student: {$lesson->student->email}");
            } else {
                Log::info("Email notifications disabled. Meeting URL: {$meetingUrl}");
            }

        } catch (\Exception $e) {
            Log::error("Failed to send room available notification for lesson {$lesson->id}: " . $e->getMessage());
        }
    }
}