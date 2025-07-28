<?php
// app/Http/Middleware/RoleMiddleware.php - Poprawiony (główne middleware do ról)

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response | JsonResponse | StreamedResponse
    {
        $user = $request->user();

        // Only log in development environments
        if (app()->environment(['local', 'testing'])) {
            \Log::info('RoleMiddleware - Debug info:', [
                'url' => $request->url(),
                'method' => $request->method(),
                'required_roles' => $roles,
                'user_id' => $user?->id,
                'user_role' => $user?->role,
                'has_any_role' => $user?->hasAnyRole($roles)
            ]);
        }

        if (!$user) {
            if (app()->environment(['local', 'testing'])) {
                \Log::warning('RoleMiddleware - No user found');
            }
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Wymagane uwierzytelnienie'
                ], 401);
            }
            return redirect()->route('login');
        }

        if (!$user->isActive()) {
            if (app()->environment(['local', 'testing'])) {
                \Log::warning('RoleMiddleware - User not active', [
                    'user_id' => $user->id,
                    'user_status' => $user->status
                ]);
            }
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Konto jest nieaktywne'
                ], 403);
            }
            return redirect()->route('login')->with('error', 'Konto zostało zablokowane');
        }

        if (!$user->hasAnyRole($roles)) {
            if (app()->environment(['local', 'testing'])) {
                \Log::warning('RoleMiddleware - User does not have required role', [
                    'user_id' => $user->id,
                    'user_role' => $user->role,
                    'required_roles' => $roles
                ]);
            }
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Brak uprawnień do tej akcji'
                ], 403);
            }
            return redirect()->route('unauthorized');
        }

        if (app()->environment(['local', 'testing'])) {
            \Log::info('RoleMiddleware - Access granted', [
                'user_id' => $user->id,
                'user_role' => $user->role
            ]);
        }

        return $next($request);
    }
}
