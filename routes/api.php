<?php
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'healthy', 'version' => '1.0.0']);
});

Route::apiResource('students', StudentController::class);
Route::put('students/{id}/learning-goals', [StudentController::class, 'updateLearningGoals']);
Route::get('students/search', [StudentController::class, 'search']);
Route::post('students/bulk-status', [StudentController::class, 'bulkUpdateStatus']);

// TODO: Add API v1 routes with authentication
// TODO: Add admin/tutor/student/lesson endpoints
