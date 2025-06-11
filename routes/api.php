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
    Route::post('/login', [AuthController::class, 'login'])->name('api.auth.login');
    Route::post('/register', [AuthController::class, 'register'])->name('api.auth.register');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('api.auth.forgot-password');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('api.auth.reset-password');

    // POPRAWIONE - weryfikacja emaila jako POST (dla frontend)
    Route::post('/verify-email', [AuthController::class, 'verifyEmail'])->name('api.auth.verify-email');

    // DODANE - weryfikacja emaila jako GET (dla linków w emailu)
    Route::get('/verify-email', [AuthController::class, 'verifyEmailFromLink'])->name('api.auth.verify-email-link');
});

// Protected routes (wymagają autentykacji Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Auth user routes - dla wszystkich zalogowanych użytkowników
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('api.auth.me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.auth.logout');
        Route::post('/change-password', [AuthController::class, 'changePassword'])->name('api.auth.change-password');
        Route::post('/resend-verification', [AuthController::class, 'resendVerification'])->name('api.auth.resend-verification');
    });

    // Student routes (tylko zweryfikowani użytkownicy)
    Route::middleware('verified')->group(function () {

        // Student management (admin/moderator)
        Route::middleware('role:admin,moderator')->group(function () {
            Route::apiResource('students', StudentController::class);
            Route::put('students/{id}/learning-goals', [StudentController::class, 'updateLearningGoals']);
            Route::get('students/search', [StudentController::class, 'search']);
            Route::post('students/bulk-status', [StudentController::class, 'bulkUpdateStatus']);
            Route::get('students/stats', [StudentController::class, 'getStats']);
        });

        // Student self-management (student accessing own data)
        Route::middleware('role:student')->group(function () {
            Route::get('student/profile', function(\Illuminate\Http\Request $request) {
                $user = $request->user();
                $user->load('studentProfile');
                return response()->json(['success' => true, 'data' => $user]);
            });
            Route::put('student/profile', [StudentController::class, 'updateOwnProfile']);
        });
    });

    // Admin dashboard stats
    Route::middleware('role:admin')->group(function () {
        Route::prefix('admin')->group(function () {
            Route::get('/dashboard-stats', function () {
                // TODO: Implement real stats
                return response()->json([
                    'success' => true,
                    'data' => [
                        'users_count' => \App\Models\User::count(),
                        'active_lessons' => 0, // TODO: Implement lessons
                        'total_revenue' => 0, // TODO: Implement revenue
                        'pending_approvals' => 0 // TODO: Implement approvals
                    ]
                ]);
            });
        });
    });

    // Moderator dashboard stats
    Route::middleware('role:moderator,admin')->group(function () {
        Route::prefix('moderator')->group(function () {
            Route::get('/dashboard-stats', function () {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'pending_reviews' => 0,
                        'reported_content' => 0,
                        'resolved_reports' => 0,
                        'active_users' => \App\Models\User::where('status', 'active')->count()
                    ]
                ]);
            });
        });
    });

    // Tutor dashboard stats
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

    // Student dashboard stats
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

// CSRF Cookie endpoint for SPA authentication
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
})->middleware('web');