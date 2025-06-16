<?php
// app/Http/Middleware/RoleMiddleware.php - Poprawiony (główne middleware do ról)

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
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

        if (!$user->isActive()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Konto jest nieaktywne'
                ], 403);
            }
            return redirect()->route('login')->with('error', 'Konto zostało zablokowane');
        }

        if (!$user->hasAnyRole($roles)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Brak uprawnień do tej akcji'
                ], 403);
            }
            return redirect()->route('unauthorized');
        }

        return $next($request);
    }
}
