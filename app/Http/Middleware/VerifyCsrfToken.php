<?php
// app/Http/Middleware/VerifyCsrfToken.php - Poprawiony

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     */
    protected $except = [
        'api/*', // Wszystkie trasy API (używają Sanctum)
    ];
}