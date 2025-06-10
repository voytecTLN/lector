<?php
// app/Http/Middleware/VerifiedMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

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

        // POPRAWIONA KONTROLA WERYFIKACJI
        if (!$user->hasVerifiedEmail()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wymagana weryfikacja adresu email. Sprawdź swoją skrzynkę pocztową.',
                    'requires_verification' => true,
                    'email' => $user->email
                ], 403);
            }
            return redirect()->route('verification.notice');
        }

        return $next($request);
    }
}