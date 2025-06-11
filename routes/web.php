<?php
// routes/web.php - SPA Fallback Routes

use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// API routes are in api.php - this file only handles SPA fallback

// SPA Fallback - wszystkie routes które nie są API mają wrócić do SPA
Route::fallback(function () {
    return view('spa');
});

// Optional: Specific routes for better SEO/direct access
Route::get('/', function () {
    return view('spa');
})->name('home');

Route::get('/login', function () {
    return view('spa');
})->name('login');

Route::get('/register', function () {
    return view('spa');
})->name('register');

Route::get('/dashboard', function () {
    return view('spa');
})->name('dashboard');

Route::get('/admin/{any?}', function () {
    return view('spa');
})->where('any', '.*');

Route::get('/student/{any?}', function () {
    return view('spa');
})->where('any', '.*');

Route::get('/tutor/{any?}', function () {
    return view('spa');
})->where('any', '.*');

Route::get('/moderator/{any?}', function () {
    return view('spa');
})->where('any', '.*');