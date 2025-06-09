<?php
// app/Http/Middleware/AdminMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Models\User;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->canManageUsers()) {
            return response()->json([
                'success' => false,
                'message' => 'Wymagane uprawnienia administratora'
            ], 403);
        }

        return $next($request);
    }
}