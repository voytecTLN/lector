<?php
// app/Services/NotificationService.php - Poprawiony z lepszym logowaniem

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send welcome email after registration
     */
    public function sendWelcomeEmail(User $user): void
    {
        try {
            Log::info("Sending welcome email to: {$user->email}");

            // TODO: Implement proper email sending
            // Mail::to($user)->send(new WelcomeEmail($user));

        } catch (\Exception $e) {
            Log::error("Failed to send welcome email to {$user->email}: " . $e->getMessage());
        }
    }

    /**
     * POPRAWIONA METODA - Send email verification z logowaniem tokenu
     */
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

            $verificationUrl = url("/api/auth/verify-email?token={$token}");

            Log::info("Email verification details", [
                'user_email' => $user->email,
                'verification_url' => $verificationUrl,
                'token' => $token
            ]);

            // TODO: Implement proper email sending
            // Mail::to($user)->send(new EmailVerification($user, $verificationUrl));

            // TYMCZASOWO: Wyświetl informacje w logach do testowania
            Log::info("=== EMAIL VERIFICATION INFO ===");
            Log::info("User: {$user->name} ({$user->email})");
            Log::info("Verification URL: {$verificationUrl}");
            Log::info("Token: {$token}");
            Log::info("=== END EMAIL INFO ===");

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
            $resetUrl = url("/reset-password?token={$token}");

            Log::info("Password reset email details", [
                'user_email' => $user->email,
                'reset_url' => $resetUrl,
                'token' => $token
            ]);

            // TODO: Implement proper email sending
            // Mail::to($user)->send(new PasswordResetEmail($user, $resetUrl));

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

            // TODO: Implement login notification email
            // Mail::to($user)->send(new LoginNotification($user, $ip, $userAgent));

        } catch (\Exception $e) {
            Log::error("Failed to send login notification to {$user->email}: " . $e->getMessage());
        }
    }
}