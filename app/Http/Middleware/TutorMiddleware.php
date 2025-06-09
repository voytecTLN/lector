<?php
// app/Http/Middleware/TutorMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TutorMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->canTeach()) {
            return response()->json([
                'success' => false,
                'message' => 'Wymagane uprawnienia lektora'
            ], 403);
        }

        return $next($request);
    }
}
