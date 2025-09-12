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

// Database maintenance routes should be in artisan commands, not web routes
// Use: php artisan make:command FixLessonConstraints

// Download routes (before SPA catch-all)
Route::middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('/download/material/{id}', [\App\Http\Controllers\DownloadController::class, 'material'])
        ->name('download.material');
});

// Serve avatars - temporary fix for production storage link issues
Route::get('/storage/avatars/{filename}', function ($filename) {
    $path = storage_path('app/public/avatars/' . $filename);
    
    if (!file_exists($path)) {
        abort(404);
    }
    
    // Security check - only allow image files
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    
    if (!in_array($extension, $allowedExtensions)) {
        abort(403);
    }
    
    // Set appropriate content type
    $contentTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp'
    ];
    
    return response()->file($path, [
        'Content-Type' => $contentTypes[$extension] ?? 'image/jpeg'
    ]);
})->where('filename', '.*');

// SPA entry routes with optional flash messages
Route::get('/', $spa('/'))->name('home');
Route::get('/login', $spa('/login'))->name('login');
Route::get('/register', $spa('/register'))->name('register');
Route::get('/forgot-password', $spa('/forgot-password'))->name('password.request');
Route::get('/reset-password', $spa('/reset-password'))->name('password.reset');
Route::get('/verify-email', $spa('/verify-email'))->name('verification.notice');
Route::get('/logout', $spa('/logout'))->name('logout');
Route::get('/unauthorized', $spa('/unauthorized'))->name('unauthorized');
Route::get('/contact', $spa('/contact'))->name('contact');

// SPA Route - catch all routes and serve the main app
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*')->name('spa');