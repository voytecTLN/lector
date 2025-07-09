<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\PasswordResetRequest;
use App\Http\Requests\NewPasswordRequest;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Events\Verified;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService
    ) {}

    /**
     * Handle user login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        // Rate limiting
        $key = Str::lower($request->input('email')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => "Zbyt wiele prób logowania. Spróbuj ponownie za {$seconds} sekund."
            ]);
        }

        try {
            $result = $this->authService->login($credentials, $request->ip());

            RateLimiter::clear($key);

            return response()->json([
                'success' => true,
                'message' => 'Zalogowano pomyślnie',
                'data' => [
                    'user' => $result['user'],
                    'token' => $result['token'],
                    'permissions' => $this->getUserPermissions($result['user'])
                ]
            ]);

        } catch (\Exception $e) {
            RateLimiter::hit($key, 300); // 5 minutes penalty

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 401);
        }
    }

    /**
     * Handle user registration
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $userData = $request->validated();
            $result = $this->authService->register($userData, $request->ip());

            return response()->json([
                'success' => true,
                'message' => 'Konto zostało utworzone. Sprawdź email w celu weryfikacji.',
                'data' => [
                    'user' => $result['user'],
                    'token' => $result['token'],
                    'permissions' => $this->getUserPermissions($result['user']),
                    'requires_verification' => !$result['user']->hasVerifiedEmail()
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => method_exists($e, 'errors') ? $e->errors() : null
            ], 400);
        }
    }

    /**
     * Handle user logout
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if ($user) {
                // Usuń tylko aktualny token
                $request->user()->currentAccessToken()->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Wylogowano pomyślnie'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas wylogowywania'
            ], 500);
        }
    }

    /**
     * Get current user information
     */
    public function me(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Użytkownik nie jest zalogowany'
                ], 401);
            }

            // Załaduj powiązane profile
            $user->load(['studentProfile', 'tutorProfile']);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user,
                    'permissions' => $this->getUserPermissions($user)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania danych użytkownika'
            ], 500);
        }
    }

    /**
     * Send password reset email
     */
    public function forgotPassword(PasswordResetRequest $request): JsonResponse
    {
        $email = $request->validated()['email'];

        // Rate limiting for password reset
        $key = 'password-reset:' . $email;

        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => "Zbyt wiele prób resetowania hasła. Spróbuj ponownie za {$seconds} sekund."
            ], 429);
        }

        try {
            $this->authService->sendPasswordResetEmail($email);

            RateLimiter::hit($key, 3600); // 1 hour

            return response()->json([
                'success' => true,
                'message' => 'Link do resetowania hasła został wysłany na podany adres email.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Reset password with token
     */
    public function resetPassword(NewPasswordRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $this->authService->resetPassword($data);

            return response()->json([
                'success' => true,
                'message' => 'Hasło zostało zmienione pomyślnie.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Verify email address with token (POST endpoint for frontend)
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string'
        ]);

        $token = $request->input('token');

        try {
            // Znajdź użytkownika po hashu tokenu
            $tokenHash = hash('sha256', $token);
            $user = User::where('verification_token_hash', $tokenHash)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nieprawidłowy token weryfikacyjny.'
                ], 400);
            }

            // Sprawdź czy token jest ważny
            if (!$user->isVerificationTokenValid($token)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token weryfikacyjny wygasł. Poproś o nowy.'
                ], 400);
            }

            if ($user->hasVerifiedEmail()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Email jest już zweryfikowany.'
                ]);
            }

            // Oznacz jako zweryfikowany
            $user->markAsVerified();

            // Wywołaj event weryfikacji
            event(new Verified($user));

            return response()->json([
                'success' => true,
                'message' => 'Email został zweryfikowany pomyślnie.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas weryfikacji emaila.'
            ], 500);
        }
    }

    /**
     * Verify email address from link (GET endpoint for email links)
     */
    public function verifyEmailFromLink(Request $request)
    {
        $token = $request->query('token');

        if (!$token) {
            return redirect('/#/login?error=' . urlencode('Brak tokenu weryfikacyjnego') . '&type=error');
        }

        try {
            // Znajdź użytkownika po hashu tokenu
            $tokenHash = hash('sha256', $token);
            $user = User::where('verification_token_hash', $tokenHash)->first();

            if (!$user) {
                return redirect('/#/login?error=' . urlencode('Nieprawidłowy token weryfikacyjny') . '&type=error');
            }

            // Sprawdź czy token jest ważny
            if (!$user->isVerificationTokenValid($token)) {
                return redirect('/#/login?error=' . urlencode('Token weryfikacyjny wygasł. Zaloguj się i poproś o nowy.') . '&type=warning');
            }

            if ($user->hasVerifiedEmail()) {
                return redirect('/#/login?message=' . urlencode('Email jest już zweryfikowany. Możesz się zalogować.') . '&type=info');
            }

            // Oznacz jako zweryfikowany
            $user->markAsVerified();

            // Wywołaj event weryfikacji
            event(new Verified($user));

            // Przekieruj na stronę logowania z komunikatem sukcesu
            return redirect('/#/login?message=' . urlencode('Email został zweryfikowany pomyślnie! Możesz się teraz zalogować.') . '&type=success');

        } catch (\Exception $e) {
            \Log::error('Email verification error: ' . $e->getMessage());
            return redirect('/#/login?error=' . urlencode('Błąd podczas weryfikacji emaila') . '&type=error');
        }
    }

    public function resendVerificationPublic(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email'
        ]);

        $email = $request->input('email');

        // Rate limiting per email
        $key = 'resend-verification-public:' . $email;
        if (RateLimiter::tooManyAttempts($key, 2)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = ceil($seconds / 60);

            return response()->json([
                'success' => false,
                'message' => "Zbyt wiele prób. Możesz wysłać email ponownie za {$minutes} minut."
            ], 429);
        }

        try {
            $user = User::where('email', $email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nie znaleziono użytkownika z tym adresem email.'
                ], 404);
            }

            if ($user->hasVerifiedEmail()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email jest już zweryfikowany.'
                ], 400);
            }

            $this->authService->resendVerificationEmail($user);
            RateLimiter::hit($key, 3600); // 60 minut

            return response()->json([
                'success' => true,
                'message' => 'Email weryfikacyjny został wysłany ponownie.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas wysyłania emaila.'
            ], 500);
        }
    }

    /**
     * Resend email verification
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Użytkownik nie jest zalogowany.'
            ], 401);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Email jest już zweryfikowany.'
            ], 400);
        }

        // rate limiting - restrykcyjne
        $key = 'resend-verification:' . $user->id;
        $maxAttempts = 2;
        $decayMinutes = 60;

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = ceil($seconds / 60);

            return response()->json([
                'success' => false,
                'message' => "Zbyt wiele prób. Możesz wysłać email ponownie za {$minutes} minut."
            ], 429);
        }

        try {
            $this->authService->resendVerificationEmail($user);
            RateLimiter::hit($key, $decayMinutes * 60); // 60 minut

            return response()->json([
                'success' => true,
                'message' => 'Email weryfikacyjny został wysłany ponownie. Sprawdź swoją skrzynkę pocztową.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas wysyłania emaila weryfikacyjnego.'
            ], 500);
        }
    }

    /**
     * Change password for authenticated user
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Użytkownik nie jest zalogowany.'
            ], 401);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Aktualne hasło jest nieprawidłowe.'
            ], 400);
        }

        try {
            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            // Usuń wszystkie inne tokeny dla bezpieczeństwa
            $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Hasło zostało zmienione pomyślnie.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas zmiany hasła.'
            ], 500);
        }
    }

    /**
     * Get user permissions based on role
     */
    private function getUserPermissions(User $user): array
    {
        $permissions = [];

        switch ($user->role) {
            case User::ROLE_ADMIN:
                $permissions = [
                    'manage_users',
                    'manage_content',
                    'manage_lessons',
                    'view_analytics',
                    'system_settings',
                    'can_teach',
                    'can_learn'
                ];
                break;

            case User::ROLE_MODERATOR:
                $permissions = [
                    'manage_users',
                    'manage_content',
                    'view_analytics'
                ];
                break;

            case User::ROLE_TUTOR:
                $permissions = [
                    'can_teach',
                    'manage_own_lessons',
                    'view_own_analytics'
                ];
                break;

            case User::ROLE_STUDENT:
                $permissions = [
                    'can_learn',
                    'book_lessons',
                    'view_own_progress'
                ];
                break;
        }

        return $permissions;
    }
}