<?php
// app/Http/Middleware/VerifiedMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class VerifiedMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response | BinaryFileResponse
    {
        $user = $request->user();

        // Only log in development environments
        if (app()->environment(['local', 'testing'])) {
            \Log::info('VerifiedMiddleware - Debug info:', [
                'url' => $request->url(),
                'method' => $request->method(),
                'user_id' => $user?->id,
                'is_verified' => !!$user?->email_verified_at
            ]);
        }

        if (!$user) {
            if (app()->environment(['local', 'testing'])) {
                \Log::warning('VerifiedMiddleware - No user found');
            }
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wymagane uwierzytelnienie'
                ], 401);
            }
            return redirect()->route('login');
        }

        if (!$user->email_verified_at) {
            if (app()->environment(['local', 'testing'])) {
                \Log::warning('VerifiedMiddleware - User not verified', [
                    'user_id' => $user->id,
                    'verified_at' => $user->email_verified_at
                ]);
            }
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wymagana weryfikacja adresu email. Sprawdź swoją skrzynkę pocztową.',
                    'requires_verification' => true,
                    'email' => $user->email
                ], 403);
            }

            // Dla web requests - przekieruj na stronę weryfikacji
            return redirect()->to('/#/verify-email');
        }

        if (app()->environment(['local', 'testing'])) {
            \Log::info('VerifiedMiddleware - User verified, proceeding', [
                'user_id' => $user->id
            ]);
        }

        return $next($request);
    }
}