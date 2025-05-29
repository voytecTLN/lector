<?php
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
})->name('home');

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// TODO: Add authentication routes
// TODO: Add admin/tutor/student dashboard routes
