<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\Admin\DashboardController;

// Health check - publiczny endpoint
Route::get('/health', function () {
    return response()->json(['status' => 'healthy', 'version' => '1.0.0']);
});

// Authentication routes (publiczne - bez middleware auth)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])
//         ->middleware('throttle:5,1') // 5 attempts per minute
        ->name('api.auth.login');

    Route::post('/register', [AuthController::class, 'register'])
//         ->middleware('throttle:3,10') // 3 attempts per 10 minutes
        ->name('api.auth.register');

    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
//         ->middleware('throttle:3,60') // 3 attempts per hour
        ->name('api.auth.forgot-password');

    Route::post('/reset-password', [AuthController::class, 'resetPassword'])
//         ->middleware('throttle:5,10') // 5 attempts per 10 minutes
        ->name('api.auth.reset-password');

    // POPRAWIONE - weryfikacja emaila jako POST (dla frontend)
    Route::post('/verify-email', [AuthController::class, 'verifyEmail'])->name('api.auth.verify-email');

    // DODANE - weryfikacja emaila jako GET (dla linków w emailu)
    Route::get('/verify-email', [AuthController::class, 'verifyEmailFromLink'])->name('api.auth.verify-email-link');
});

Route::post('/auth/resend-verification-public', [AuthController::class, 'resendVerificationPublic'])
    ->middleware('throttle:2,60') // 2 attempts per hour
    ->name('api.auth.resend-verification-public');

// Protected routes (wymagają autentykacji Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Auth user routes - dla wszystkich zalogowanych użytkowników (nawet niezweryfikowanych)
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('api.auth.me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.auth.logout');

        // WAŻNE: resend-verification NIE wymaga weryfikacji (bo to do tego służy!)
        Route::post('/resend-verification', [AuthController::class, 'resendVerification'])
            ->name('api.auth.resend-verification');
    });

    // Routes wymagające weryfikacji email
    Route::middleware('verified')->group(function () {

        // Change password - wymaga weryfikacji
        Route::post('/auth/change-password', [AuthController::class, 'changePassword'])
            ->name('api.auth.change-password');

        // Student management (admin/moderator)
        Route::middleware('role:admin,moderator')->group(function () {
            Route::get('students/search', [StudentController::class, 'search'])
                ->name('api.students.search');
            Route::put('students/{id}/learning-goals', [StudentController::class, 'updateLearningGoals'])
                ->name('api.students.learning-goals.update');
            Route::post('students/bulk-status', [StudentController::class, 'bulkUpdateStatus'])
                ->name('api.students.bulk-status');
            Route::get('students/stats', [StudentController::class, 'getStats'])
                ->name('api.students.stats');
            Route::apiResource('students', StudentController::class)
                ->names('api.students');
        });

        // Student self-management (student accessing own data)
        Route::middleware('role:student')->prefix('student')->group(function () {
            Route::get('/profile', [StudentController::class, 'getOwnProfile'])
                ->name('api.student.profile');

            Route::put('/profile', [StudentController::class, 'updateOwnProfile'])
                ->name('api.student.profile.update');

            Route::get('/dashboard-stats', [DashboardController::class, 'studentStats'])
                ->name('api.student.dashboard-stats');
        });

        // Admin dashboard stats
        Route::middleware('role:admin')->group(function () {
            Route::prefix('admin')->group(function () {
                Route::get('/dashboard-stats', [DashboardController::class, 'adminStats']);

                // NOWE - podstawowe zarządzanie (przekierowania)
                Route::get('/students', function() {
                    return response()->json([
                        'success' => true,
                        'message' => 'Przekierowywanie do zarządzania studentami...',
                        'redirect' => '/admin/students'
//                         'redirect' => 'admin/dashboard?section=uczniowie'
                    ]);
                });
                Route::get('/tutors', function() {
                    return response()->json([
                        'success' => true,
                        'message' => 'Moduł lektorów w przygotowaniu',
                        'available' => false
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

            // Student CRUD
            Route::apiResource('students', StudentController::class)
                ->names('api.students');

            // Additional student endpoints
            Route::prefix('students')->group(function () {
                Route::get('search', [StudentController::class, 'search'])
                    ->name('api.students.search');
                Route::get('stats', [StudentController::class, 'getStats'])
                    ->name('api.students.stats');
                Route::put('{id}/learning-goals', [StudentController::class, 'updateLearningGoals'])
                    ->name('api.students.learning-goals.update');
                Route::post('bulk-status', [StudentController::class, 'bulkUpdateStatus'])
                    ->name('api.students.bulk-status');
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
    });
});

// CSRF Cookie endpoint for SPA authentication
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
})->middleware(['web', 'throttle:10,1']); // Max 10 requests per minute