<?php
// app/Http/Middleware/VerifiedMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifiedMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wymagane uwierzytelnienie'
                ], 401);
            }
            return redirect()->route('login');
        }

        // POPRAWIONA KONTROLA WERYFIKACJI - sprawdzamy oba pola
        if (!$user->is_verified || !$user->email_verified_at) {
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

        return $next($request);
    }
}