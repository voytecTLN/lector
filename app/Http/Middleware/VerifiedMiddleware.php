<?php
// app/Http/Middleware/VerifiedMiddleware.php - Poprawiony

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

        if (!$user->isVerified()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wymagana weryfikacja adresu email',
                    'requires_verification' => true
                ], 403);
            }
            return redirect()->route('verification.notice');
        }

        return $next($request);
    }
}