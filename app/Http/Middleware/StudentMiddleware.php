<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StudentMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !in_array($request->user()->role, ['admin', 'student'])) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Student access required.'
                ], 403);
            }

            return redirect()->route('home')->with('error', 'Brak uprawnień studenta.');
        }

        return $next($request);
    }
}