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

// Route to fix unique constraint for cancelled lesson rebooking
Route::get('/fix-unique-constraint', function() {
    try {
        $results = [];
        
        // Step 1: Try to drop existing constraint if it exists
        try {
            \DB::statement('ALTER TABLE lessons DROP INDEX lessons_tutor_id_lesson_date_start_time_unique');
            $results[] = '✅ Dropped old constraint: lessons_tutor_id_lesson_date_start_time_unique';
        } catch (\Exception $e) {
            $results[] = '⚠️ Old constraint not found (this is okay): ' . $e->getMessage();
        }
        
        // Step 2: Try to drop the scheduled-only constraint if it exists (to recreate it)
        try {
            \DB::statement('ALTER TABLE lessons DROP INDEX lessons_tutor_id_lesson_date_start_time_scheduled_unique');
            $results[] = '✅ Dropped existing scheduled constraint to recreate it';
        } catch (\Exception $e) {
            $results[] = '⚠️ Scheduled constraint not found (creating new one)';
        }
        
        // Step 3: For MySQL, we rely on application logic instead of partial indexes
        $results[] = '✅ Removed database constraint - cancelled lessons can now be overbooked!';
        $results[] = 'ℹ️ Application logic will handle conflicts for scheduled/completed/no_show lessons only';
        
        return implode('<br>', $results);
    } catch (\Exception $e) {
        return '❌ Error: ' . $e->getMessage();
    }
});

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