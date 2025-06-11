<?php
// app/Services/AuthService.php

namespace App\Services;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Exception;

class AuthService
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    /**
     * Authenticate user and return user data with token
     */
    public function login(array $credentials, string $ip): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw new Exception('Nieprawidłowy email lub hasło');
        }

        if (!$user->isActive()) {
            throw new Exception('Konto jest nieaktywne lub zablokowane');
        }

        // Update login information
        $user->updateLoginInfo($ip);

        // Create token
        $token = $user->createToken('auth_token', $this->getTokenAbilities($user))->plainTextToken;

        // Load relationships
        $user->load(['studentProfile', 'tutorProfile']);

        return [
            'user' => $user,
            'token' => $token
        ];
    }

    /**
     * POPRAWIONA METODA - Register new user z właściwym generowaniem tokenu
     */
    public function register(array $userData, string $ip): array
    {
        DB::beginTransaction();

        try {
            // Create user
            $user = User::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
                'role' => $userData['role'],
                'phone' => $userData['phone'] ?? null,
                'city' => $userData['city'] ?? null,
                'country' => 'Polska',
                'status' => User::STATUS_ACTIVE,
                'is_verified' => false,
                'last_login_ip' => $ip
            ]);

            // Create role-specific profile
            $this->createRoleProfile($user, $userData);

            // WAŻNE: Wygeneruj i zapisz token weryfikacyjny
            $verificationToken = $user->generateVerificationToken();

            // Wyślij email weryfikacyjny
            $this->notificationService->sendEmailVerification($user, $verificationToken);

            // Create authentication token
            $token = $user->createToken('auth_token', $this->getTokenAbilities($user))->plainTextToken;

            DB::commit();

            return [
                'user' => $user->load(['studentProfile', 'tutorProfile']),
                'token' => $token
            ];

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Logout user by revoking tokens
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    /**
     * Logout from all devices by revoking all tokens
     */
    public function logoutFromAllDevices(User $user): void
    {
        $user->tokens()->delete();
    }

    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail(string $email): void
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            throw new Exception('Nie znaleziono konta z tym adresem email');
        }

        if (!$user->isActive()) {
            throw new Exception('Konto jest nieaktywne');
        }

        $token = $user->generatePasswordResetToken();
        $this->notificationService->sendPasswordResetEmail($user, $token);
    }

    /**
     * Reset password using token
     */
    public function resetPassword(array $data): void
    {
        $user = User::where('password_reset_token', $data['token'])->first();

        if (!$user) {
            throw new Exception('Nieprawidłowy token resetowania hasła');
        }

        if ($user->password_reset_expires_at < Carbon::now()) {
            throw new Exception('Token resetowania hasła wygasł');
        }

        $user->update([
            'password' => Hash::make($data['password']),
            'password_reset_token' => null,
            'password_reset_expires_at' => null
        ]);

        // Revoke all existing tokens for security
        $user->tokens()->delete();
    }

    /**
     * POPRAWIONA METODA - Verify email address z tokenem
     */
    public function verifyEmail(string $token): void
    {
        $user = User::where('verification_token', $token)->first();

        if (!$user) {
            throw new Exception('Nieprawidłowy token weryfikacyjny');
        }

        if ($user->isVerified()) {
            // Już zweryfikowany - usuń token i kontynuuj
            $user->update(['verification_token' => null]);
            return;
        }

        // Oznacz jako zweryfikowany
        $user->markAsVerified();

        // Wyślij email powitalny
        $this->notificationService->sendWelcomeEmail($user);
    }

    /**
     * POPRAWIONA METODA - Resend email verification z nowym tokenem
     */
    public function resendVerificationEmail(User $user): void
    {
        if ($user->isVerified()) {
            throw new Exception('Email jest już zweryfikowany');
        }

        // Wygeneruj NOWY token weryfikacyjny
        $token = $user->generateVerificationToken();

        // Wyślij email z nowym tokenem
        $this->notificationService->sendEmailVerification($user, $token);
    }

    /**
     * Create role-specific profile
     */
    private function createRoleProfile(User $user, array $userData): void
    {
        switch ($user->role) {
            case User::ROLE_STUDENT:
                $user->studentProfile()->create([
                    'learning_languages' => [],
                    'current_levels' => [],
                    'learning_goals' => [],
                    'preferred_schedule' => []
                ]);
                break;

            case User::ROLE_TUTOR:
                $user->tutorProfile()->create([
                    'languages' => [],
                    'specializations' => [],
                    'hourly_rate' => 0,
                    'description' => null,
                    'weekly_availability' => [],
                    'is_verified' => false,
                    'verification_status' => 'pending',
                    'is_accepting_students' => false
                ]);
                break;
        }
    }

    /**
     * Get token abilities based on user role
     */
    private function getTokenAbilities(User $user): array
    {
        $abilities = ['basic'];

        switch ($user->role) {
            case User::ROLE_ADMIN:
                $abilities = array_merge($abilities, [
                    'admin:*',
                    'users:*',
                    'lessons:*',
                    'content:*'
                ]);
                break;

            case User::ROLE_MODERATOR:
                $abilities = array_merge($abilities, [
                    'users:read',
                    'users:update',
                    'content:*'
                ]);
                break;

            case User::ROLE_TUTOR:
                $abilities = array_merge($abilities, [
                    'lessons:create',
                    'lessons:read',
                    'lessons:update',
                    'profile:update',
                    'students:read'
                ]);
                break;

            case User::ROLE_STUDENT:
                $abilities = array_merge($abilities, [
                    'lessons:read',
                    'lessons:book',
                    'profile:update',
                    'tutors:read'
                ]);
                break;
        }

        return $abilities;
    }
}