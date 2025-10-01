<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentImportController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\TutorController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\Api\ExternalStudentController;

// Health check - publiczny endpoint
Route::get('/health', function () {
    return response()->json(['status' => 'healthy', 'version' => '1.0.0']);
});

// Authentication routes (publiczne - bez middleware auth)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1') // 10 attempts per minute (production ready)
        ->name('api.auth.login');

    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:5,1') // 5 attempts per minute (production ready)
        ->name('api.auth.register');

    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:3,1') // 3 attempts per minute (production ready)
        ->name('api.auth.forgot-password');

    Route::post('/reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:5,1') // 5 attempts per minute (production ready)
        ->name('api.auth.reset-password');

    // POPRAWIONE - weryfikacja emaila jako POST (dla frontend)
    Route::post('/verify-email', [AuthController::class, 'verifyEmail'])->name('api.auth.verify-email');

    // DODANE - weryfikacja emaila jako GET (dla linków w emailu)
    Route::get('/verify-email', [AuthController::class, 'verifyEmailFromLink'])->name('api.auth.verify-email-link');
});

Route::post('/auth/resend-verification-public', [AuthController::class, 'resendVerificationPublic'])
    ->middleware('throttle:2,1') // 2 attempts per minute (production ready)
    ->name('api.auth.resend-verification-public');

// Daily.co webhook endpoint (publiczny, weryfikowany przez signature)
Route::post('/webhooks/daily', [MeetingController::class, 'handleWebhook'])
    ->name('api.webhooks.daily');

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
            // Additional student endpoints (MUST be before apiResource)
            Route::prefix('students')->group(function () {
                Route::get('search', [StudentController::class, 'search'])
                    ->name('api.students.search');
                Route::get('stats', [StudentController::class, 'getStats'])
                    ->name('api.students.stats');
                Route::get('simple-list', [StudentController::class, 'getSimpleList'])
                    ->name('api.students.simple-list');
                Route::put('{id}/learning-goals', [StudentController::class, 'updateLearningGoals'])
                    ->name('api.students.learning-goals.update');
                Route::post('bulk-status', [StudentController::class, 'bulkUpdateStatus'])
                    ->name('api.students.bulk-status');
                
                // CSV Import routes
                Route::get('import/template', [StudentImportController::class, 'downloadTemplate'])
                    ->name('api.students.import.template');
                Route::post('import/preview', [StudentImportController::class, 'preview'])
                    ->name('api.students.import.preview');
                Route::post('import', [StudentImportController::class, 'import'])
                    ->name('api.students.import');
            });
            
            // Student CRUD (MUST be after specific routes)
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
                
            Route::get('/packages', [PackageController::class, 'myPackages'])
                ->name('api.student.packages');
                
            // Materials routes for students
            Route::get('/materials', [\App\Http\Controllers\MaterialsController::class, 'getMyMaterials'])
                ->name('api.student.materials');
            Route::get('/materials/{material}/download', [\App\Http\Controllers\MaterialsController::class, 'download'])
                ->name('api.student.materials.download');
                
            // Lesson booking routes for students
            Route::prefix('lessons')->group(function () {
                Route::post('/book', [LessonController::class, 'bookLesson'])
                    ->name('api.student.lessons.book');
                Route::get('/available-slots', [LessonController::class, 'getAvailableSlots'])
                    ->name('api.student.lessons.available-slots');
                Route::get('/my-lessons', [LessonController::class, 'getUserLessons'])
                    ->name('api.student.lessons.my-lessons');
                Route::get('/today', [LessonController::class, 'getTodayLessons'])
                    ->name('api.student.lessons.today');
                Route::get('/upcoming', [LessonController::class, 'getUpcomingLessons'])
                    ->name('api.student.lessons.upcoming');
                Route::put('/{lessonId}/cancel', [LessonController::class, 'cancelLesson'])
                    ->name('api.student.lessons.cancel');
                Route::post('/{lessonId}/feedback', [LessonController::class, 'submitFeedback'])
                    ->name('api.student.lessons.feedback');
                Route::get('/{lessonId}', [LessonController::class, 'show'])
                    ->name('api.student.lessons.show');
                
                // Daily.co Meeting endpoints
                Route::prefix('/{lesson}/meeting')->group(function () {
                    Route::get('/status', [MeetingController::class, 'getMeetingStatus'])
                        ->name('api.student.lessons.meeting.status');
                    Route::post('/join', [MeetingController::class, 'joinMeeting'])
                        ->name('api.student.lessons.meeting.join');
                });
            });
        });

        // Admin dashboard stats
        Route::middleware('role:admin')->group(function () {
            Route::prefix('admin')->group(function () {
                Route::get('/dashboard-stats', [DashboardController::class, 'adminStats']);
                
                // Admin tutor management endpoints
                Route::get('/tutors/{tutorId}/students', [TutorController::class, 'getTutorStudents'])
                    ->name('api.admin.tutors.students');

                // Admin redirects - move to AdminController for better maintainability
                Route::get('/students', [AdminController::class, 'redirectToStudents'])
                    ->name('api.admin.students.redirect');
                Route::get('/tutors', [AdminController::class, 'redirectToTutors'])
                    ->name('api.admin.tutors.redirect');

                // Check availability alert
                Route::post('/check-availability-alert', [AdminController::class, 'checkAvailabilityAlert'])
                    ->name('api.admin.check-availability-alert');

                // Full availability report
                Route::post('/full-availability-report', [AdminController::class, 'fullAvailabilityReport'])
                    ->name('api.admin.full-availability-report');
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

            // Removed duplicate student routes - they are already defined above in lines 69-80

            // Package management routes
            Route::prefix('packages')->group(function () {
                Route::get('/', [PackageController::class, 'index'])
                    ->name('api.packages.index');
                Route::get('/active', [PackageController::class, 'active'])
                    ->name('api.packages.active');
                Route::get('/stats', [PackageController::class, 'stats'])
                    ->name('api.packages.stats');
                Route::get('/{id}', [PackageController::class, 'show'])
                    ->name('api.packages.show');
                Route::post('/', [PackageController::class, 'store'])
                    ->name('api.packages.store');
                Route::put('/{id}', [PackageController::class, 'update'])
                    ->name('api.packages.update');
                Route::delete('/{id}', [PackageController::class, 'destroy'])
                    ->name('api.packages.destroy');
                Route::post('/assign', [PackageController::class, 'assign'])
                    ->name('api.packages.assign');
                Route::get('/student/{studentId}', [PackageController::class, 'studentPackages'])
                    ->name('api.packages.student');
                Route::post('/deactivate-expired', [PackageController::class, 'deactivateExpired'])
                    ->name('api.packages.deactivate-expired');
                Route::delete('/assignments/{assignmentId}', [PackageController::class, 'detachAssignment'])
                    ->name('api.packages.detach-assignment');
            });

            // Tutor management routes
            Route::prefix('tutors')->group(function () {
                Route::get('/', [TutorController::class, 'index'])
                    ->name('api.tutors.index');
                Route::get('/search', [TutorController::class, 'search'])
                    ->name('api.tutors.search');
                Route::get('/stats', [TutorController::class, 'stats'])
                    ->name('api.tutors.stats');
                Route::get('/simple-list', [TutorController::class, 'getSimpleList'])
                    ->name('api.tutors.simple-list');
                // Removed /available route - using availableForStudents instead
                Route::get('/export', [TutorController::class, 'export'])
                    ->name('api.tutors.export');
                Route::get('/{id}', [TutorController::class, 'show'])
                    ->name('api.tutors.show');
                Route::post('/', [TutorController::class, 'store'])
                    ->name('api.tutors.store');
                Route::put('/{id}', [TutorController::class, 'update'])
                    ->name('api.tutors.update');
                Route::delete('/{id}', [TutorController::class, 'destroy'])
                    ->name('api.tutors.destroy');
                Route::put('/{id}/deactivate', [TutorController::class, 'deactivate'])
                    ->name('api.tutors.deactivate');
                Route::put('/{id}/verify', [TutorController::class, 'verify'])
                    ->name('api.tutors.verify');
                Route::put('/{id}/availability', [TutorController::class, 'updateAvailability'])
                    ->name('api.tutors.availability');
                Route::get('/{id}/availability-slots', [TutorController::class, 'getTutorAvailabilitySlots'])
                    ->name('api.tutors.availability-slots');
                Route::post('/bulk-update-status', [TutorController::class, 'bulkUpdateStatus'])
                    ->name('api.tutors.bulk-update-status');
            });

        });

        // Admin only routes
        Route::middleware('role:admin')->group(function () {
            
            // Administrator management routes
            Route::prefix('admins')->group(function () {
                Route::get('/', [AdminController::class, 'index'])
                    ->name('api.admins.index');
                Route::get('/search', [AdminController::class, 'search'])
                    ->name('api.admins.search');
                Route::get('/stats', [AdminController::class, 'stats'])
                    ->name('api.admins.stats');
                Route::get('/export', [AdminController::class, 'export'])
                    ->name('api.admins.export');
                Route::get('/{id}', [AdminController::class, 'show'])
                    ->name('api.admins.show');
                Route::post('/', [AdminController::class, 'store'])
                    ->name('api.admins.store');
                Route::put('/{id}', [AdminController::class, 'update'])
                    ->name('api.admins.update');
                Route::delete('/{id}', [AdminController::class, 'destroy'])
                    ->name('api.admins.destroy');
                Route::put('/{id}/deactivate', [AdminController::class, 'deactivate'])
                    ->name('api.admins.deactivate');
                Route::post('/bulk-update-status', [AdminController::class, 'bulkUpdateStatus'])
                    ->name('api.admins.bulk-update-status');
            });
            
            // Lesson management routes for admins
            Route::prefix('lessons')->group(function () {
                Route::get('/', [LessonController::class, 'getAllLessons'])
                    ->name('api.admin.lessons.index');
                Route::get('/stats', [LessonController::class, 'getStats'])
                    ->name('api.admin.lessons.stats');
                Route::get('/status-options', [LessonController::class, 'getStatusOptions'])
                    ->name('api.admin.lessons.status-options');
                Route::get('/export', [LessonController::class, 'exportLessons'])
                    ->name('api.admin.lessons.export');
                Route::get('/{lessonId}', [LessonController::class, 'show'])
                    ->name('api.admin.lessons.show');
                Route::put('/{lessonId}/cancel', [LessonController::class, 'adminCancelLesson'])
                    ->name('api.admin.lessons.cancel');
                Route::put('/{lessonId}/status', [LessonController::class, 'updateStatus'])
                    ->name('api.admin.lessons.update-status');
                Route::get('/{lessonId}/status-history', [LessonController::class, 'getStatusHistory'])
                    ->name('api.admin.lessons.status-history');
            });

            // Admin audit log routes  
            Route::prefix('audit')->group(function () {
                Route::get('/recent', [\App\Http\Controllers\AdminAuditController::class, 'getRecentActivity'])
                    ->name('api.admin.audit.recent');
                Route::get('/logs', [\App\Http\Controllers\AdminAuditController::class, 'getActivityLogs'])
                    ->name('api.admin.audit.logs');
                Route::get('/stats', [\App\Http\Controllers\AdminAuditController::class, 'getActivityStats'])
                    ->name('api.admin.audit.stats');
                Route::get('/model/{modelType}/{modelId}', [\App\Http\Controllers\AdminAuditController::class, 'getModelActivity'])
                    ->name('api.admin.audit.model');
            });

            // Availability logs routes
            Route::prefix('availability-logs')->group(function () {
                Route::get('/', [\App\Http\Controllers\AvailabilityLogsController::class, 'index'])
                    ->name('api.admin.availability-logs.index');
                Route::get('/stats', [\App\Http\Controllers\AvailabilityLogsController::class, 'stats'])
                    ->name('api.admin.availability-logs.stats');
                Route::get('/export', [\App\Http\Controllers\AvailabilityLogsController::class, 'export'])
                    ->name('api.admin.availability-logs.export');
                Route::get('/tutor/{tutorId}', [\App\Http\Controllers\AvailabilityLogsController::class, 'tutorLogs'])
                    ->name('api.admin.availability-logs.tutor');
            });

            // Admin login logs routes
            Route::prefix('login-logs')->group(function () {
                Route::get('/recent', [\App\Http\Controllers\LoginLogsController::class, 'getRecentActivity'])
                    ->name('api.admin.login-logs.recent');
                Route::get('/logs', [\App\Http\Controllers\LoginLogsController::class, 'getLoginLogs'])
                    ->name('api.admin.login-logs.logs');
                Route::get('/stats', [\App\Http\Controllers\LoginLogsController::class, 'getLoginStats'])
                    ->name('api.admin.login-logs.stats');
            });

            // Reports endpoints (admin/moderator)
            Route::prefix('reports')->group(function () {
                // Raport dostępności lektorów
                Route::get('/tutor-availability', [ReportsController::class, 'tutorAvailability'])
                    ->name('api.reports.tutor-availability');
                
                // Raport lekcji lektorów
                Route::get('/tutor-lessons', [ReportsController::class, 'tutorLessons'])
                    ->name('api.reports.tutor-lessons');
                
                // Raport aktywności studentów
                Route::get('/student-activity', [ReportsController::class, 'studentActivity'])
                    ->name('api.reports.student-activity');
                
                // Eksport raportów
                Route::get('/{reportType}/export', [ReportsController::class, 'exportReport'])
                    ->name('api.reports.export');
            });
            

        });

        // Tutor dashboard stats and profile
        Route::middleware('role:tutor,admin')->group(function () {
            Route::prefix('tutor')->group(function () {
                Route::get('/dashboard-stats', [TutorController::class, 'getDashboardStats'])
                    ->name('api.tutor.dashboard-stats');
                
                Route::get('/profile', [TutorController::class, 'getOwnProfile'])
                    ->name('api.tutor.profile');
                
                Route::put('/profile', [TutorController::class, 'updateOwnProfile'])
                    ->name('api.tutor.profile.update');
                    
                Route::post('/profile', [TutorController::class, 'updateOwnProfile'])
                    ->name('api.tutor.profile.upload');
                    
                Route::get('/availability-slots', [TutorController::class, 'getAvailabilitySlots'])
                    ->name('api.tutor.availability-slots');
                    
                Route::post('/availability-slots', [TutorController::class, 'setAvailabilitySlots'])
                    ->name('api.tutor.availability-slots.set');
                    
                Route::delete('/availability-slots/{id}', [TutorController::class, 'withdrawAvailabilitySlot'])
                    ->name('api.tutor.availability-slots.withdraw');
                    
                // Lesson management routes for tutors
                Route::prefix('lessons')->group(function () {
                    Route::get('/my-lessons', [LessonController::class, 'getUserLessons'])
                        ->name('api.tutor.lessons.my-lessons');
                    Route::get('/today', [LessonController::class, 'getTodayLessons'])
                        ->name('api.tutor.lessons.today');
                    Route::get('/upcoming', [LessonController::class, 'getUpcomingLessons'])
                        ->name('api.tutor.lessons.upcoming');
                    Route::put('/{lessonId}/cancel', [LessonController::class, 'cancelLesson'])
                        ->name('api.tutor.lessons.cancel');
                    Route::put('/{lessonId}/complete', [LessonController::class, 'completeLesson'])
                        ->name('api.tutor.lessons.complete');
                    Route::put('/{lessonId}/no-show', [LessonController::class, 'markAsNoShow'])
                        ->name('api.tutor.lessons.no-show');
                    Route::put('/{lessonId}/status', [LessonController::class, 'updateStatus'])
                        ->name('api.tutor.lessons.update-status');
                    Route::get('/{lessonId}', [LessonController::class, 'show'])
                        ->name('api.tutor.lessons.show');
                    
                    // Daily.co Meeting endpoints for tutors
                    Route::prefix('/{lesson}/meeting')->group(function () {
                        Route::get('/status', [MeetingController::class, 'getMeetingStatus'])
                            ->name('api.tutor.lessons.meeting.status');
                        Route::post('/start', [MeetingController::class, 'startMeeting'])
                            ->name('api.tutor.lessons.meeting.start');
                        Route::post('/join', [MeetingController::class, 'joinMeeting'])
                            ->name('api.tutor.lessons.meeting.join');
                        Route::post('/end', [MeetingController::class, 'endMeeting'])
                            ->name('api.tutor.lessons.meeting.end');
                    });
                });
                
                // Student management routes for tutors
                Route::prefix('students')->group(function () {
                    Route::get('/', [TutorController::class, 'getMyStudents'])
                        ->name('api.tutor.students.index');
                    Route::get('/{studentId}', [TutorController::class, 'getStudentDetails'])
                        ->name('api.tutor.students.show');
                    
                    // Materials management routes
                    Route::get('/{studentId}/materials', [\App\Http\Controllers\MaterialsController::class, 'index'])
                        ->name('api.tutor.students.materials.index');
                    Route::get('/{studentId}/materials/versions', [\App\Http\Controllers\MaterialsController::class, 'versions'])
                        ->name('api.tutor.students.materials.versions');
                });
            });
            
            // Materials management routes (common for tutors)
            Route::prefix('materials')->group(function () {
                Route::post('/upload', [\App\Http\Controllers\MaterialsController::class, 'upload'])
                    ->name('api.materials.upload');
                Route::get('/{material}/download', [\App\Http\Controllers\MaterialsController::class, 'download'])
                    ->name('api.materials.download');
                Route::delete('/{materialId}', [\App\Http\Controllers\MaterialsController::class, 'destroy'])
                    ->name('api.materials.destroy');
                Route::put('/{materialId}/toggle-active', [\App\Http\Controllers\MaterialsController::class, 'toggleActive'])
                    ->name('api.materials.toggle-active');
                Route::get('/lesson/{lessonId}', [\App\Http\Controllers\MaterialsController::class, 'byLesson'])
                    ->name('api.materials.by-lesson');
            });
        });

    });
    
    // Publicly available endpoints for all authenticated users
    // Using different path to avoid conflict with admin tutors routes
    Route::get('/student/tutors-available', [TutorController::class, 'availableForStudents'])
        ->name('api.student.tutors-available');
        
    // Student can view tutor profiles  
    Route::get('/student/tutor/{id}', [TutorController::class, 'showPublic'])
        ->name('api.student.tutor-profile');
});

// Test route removed - use proper endpoint: /student/tutors-available

// Support/Issue Reporting (available to all authenticated users)
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::post('/support/issue', [\App\Http\Controllers\SupportController::class, 'submitIssue'])
        ->name('api.support.issue');
});


// External API endpoints - Zabezpieczone kluczem API
Route::prefix('external')->middleware(['api.key'])->group(function () {
    Route::post('/students', [\App\Http\Controllers\Api\ExternalStudentController::class, 'store'])
        ->name('api.external.students.create');
});

// CSRF Cookie endpoint for SPA authentication
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
})->middleware(['web', 'throttle:60,1']); // Max 60 requests per minute (production ready)