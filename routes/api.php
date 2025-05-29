<?php
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'healthy', 'version' => '1.0.0']);
});

// TODO: Add API v1 routes with authentication
// TODO: Add admin/tutor/student/lesson endpoints
