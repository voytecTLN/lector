<?php
// routes/web.php

use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// SPA Route - catch all routes and serve the main app
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*')->name('spa');