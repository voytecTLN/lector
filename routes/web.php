<?php
// routes/web.php

use Illuminate\Support\Facades\Route;

// Helper closure to serve SPA routes and pass flash messages
$spa = function (string $hashPath) {
    return function () use ($hashPath) {
        $message = session('success') ?? session('error') ?? session('info');

        if ($message) {
            $type = session()->has('success') ? 'success' :
                   (session()->has('error') ? 'error' : 'info');

            $query = array_merge(request()->query(), [
                'message' => $message,
                'type' => $type
            ]);

            // Clear flash messages
            session()->forget(['success', 'error', 'info']);

            return redirect('/#' . ltrim($hashPath, '/') . '?' . http_build_query($query));
        }

        return view('app');
    };
};

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// SPA entry routes with optional flash messages
Route::get('/', $spa('/'))->name('home');
Route::get('/login', $spa('/login'))->name('login');
Route::get('/register', $spa('/register'))->name('register');
Route::get('/forgot-password', $spa('/forgot-password'))->name('password.request');
Route::get('/reset-password', $spa('/reset-password'))->name('password.reset');
Route::get('/verify-email', $spa('/verify-email'))->name('verification.notice');
Route::get('/unauthorized', $spa('/unauthorized'))->name('unauthorized');

// SPA Route - catch all routes and serve the main app
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*')->name('spa');