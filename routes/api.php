<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;

// Health check - publiczny endpoint
Route::get('/health', function () {
    return response()->json(['status' => 'healthy', 'version' => '1.0.0']);
});

// Authentication routes (publiczne - bez middleware auth)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::get('/verify-email', [AuthController::class, 'verifyEmail']);
});

// Protected routes (wymagają autentykacji)
Route::middleware('auth:sanctum')->group(function () {
    // Auth user routes - dla wszystkich zalogowanych użytkowników
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
    });

    // Student routes (tylko zweryfikowani użytkownicy)
    Route::middleware('verified')->group(function () {
        Route::apiResource('students', StudentController::class);
        Route::put('students/{id}/learning-goals', [StudentController::class, 'updateLearningGoals']);
        Route::get('students/search', [StudentController::class, 'search']);
    });

    // Admin/Moderator routes
    Route::middleware('role:admin,moderator')->group(function () {
        Route::post('students/bulk-status', [StudentController::class, 'bulkUpdateStatus']);
        Route::get('students/stats', [StudentController::class, 'getStats']);
    });

    // Admin only routes
    Route::middleware('role:admin')->group(function () {
        // System administration routes będą dodane tutaj
        Route::prefix('admin')->group(function () {
            Route::get('/dashboard-stats', function () {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'users_count' => 0,
                        'active_lessons' => 0,
                        'total_revenue' => 0,
                        'pending_approvals' => 0
                    ]
                ]);
            });
        });
    });

    // Tutor routes
    Route::middleware('role:tutor,admin')->group(function () {
        Route::prefix('tutor')->group(function () {
            Route::get('/dashboard-stats', function () {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'upcoming_lessons' => 0,
                        'completed_lessons' => 0,
                        'total_earnings' => 0,
                        'student_count' => 0
                    ]
                ]);
            });
        });
    });

    // Student routes
    Route::middleware('role:student,admin')->group(function () {
        Route::prefix('student')->group(function () {
            Route::get('/dashboard-stats', function () {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'upcoming_lessons' => 0,
                        'completed_lessons' => 0,
                        'learning_progress' => 0,
                        'favorite_tutors' => 0
                    ]
                ]);
            });
        });
    });
});