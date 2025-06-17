<?php
// routes/web.php

use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// Handle redirects with flash messages for SPA
Route::get('/login', function () {
    $message = session('success') ?? session('error') ?? session('info');
    $type = session()->has('success') ? 'success' : (session()->has('error') ? 'error' : 'info');

    if ($message) {
        return redirect('/#/login?' . http_build_query([
            'message' => $message,
            'type' => $type
        ]));
    }

    return view('app');
})->name('login');

// SPA Route - catch all routes and serve the main app
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*')->name('spa');