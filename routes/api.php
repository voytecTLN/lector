<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StudentController;

Route::get('/health', function () {
    return response()->json(['status' => 'healthy', 'version' => '1.0.0']);
});

Route::apiResource('students', StudentController::class);
Route::put('students/{id}/learning-goals', [StudentController::class, 'updateLearningGoals']);
Route::get('students/search', [StudentController::class, 'search']);
Route::post('students/bulk-status', [StudentController::class, 'bulkUpdateStatus']);

// TODO: Add API v1 routes with authentication
// TODO: Add admin/tutor/student/lesson endpoints

// <?php
// // routes/api.php - Add authentication routes
//
// use Illuminate\Support\Facades\Route;
// use App\Http\Controllers\AuthController;
// use App\Http\Controllers\StudentController;
//
// // Health check
// Route::get('/health', function () {
//     return response()->json(['status' => 'healthy', 'version' => '1.0.0']);
// });
//
// // Authentication routes (public)
// Route::prefix('auth')->group(function () {
//     Route::post('/login', [AuthController::class, 'login']);
//     Route::post('/register', [AuthController::class, 'register']);
//     Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
//     Route::post('/reset-password', [AuthController::class, 'resetPassword']);
//     Route::get('/verify-email', [AuthController::class, 'verifyEmail']);
// });
//
// // Protected routes (require authentication)
// Route::middleware('auth:sanctum')->group(function () {
//     // Auth user routes
//     Route::prefix('auth')->group(function () {
//         Route::get('/me', [AuthController::class, 'me']);
//         Route::post('/logout', [AuthController::class, 'logout']);
//         Route::post('/change-password', [AuthController::class, 'changePassword']);
//         Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
//     });
//
//     // Student routes (verified users only)
//     Route::middleware('verified')->group(function () {
//         Route::apiResource('students', StudentController::class);
//         Route::put('students/{id}/learning-goals', [StudentController::class, 'updateLearningGoals']);
//         Route::get('students/search', [StudentController::class, 'search']);
//     });
//
//     // Admin/Moderator routes
//     Route::middleware('role:admin,moderator')->group(function () {
//         Route::post('students/bulk-status', [StudentController::class, 'bulkUpdateStatus']);
//         Route::get('students/stats', [StudentController::class, 'getStats']);
//     });
//
//     // Admin only routes
//     Route::middleware('role:admin')->group(function () {
//         // System administration routes will be added here
//     });
//
//     // Tutor routes
//     Route::middleware('role:tutor,admin')->group(function () {
//         // Tutor-specific routes will be added here
//     });
//
//     // Student routes
//     Route::middleware('role:student,admin')->group(function () {
//         // Student-specific routes will be added here
//     });
// });
//
// // Update app/Http/Kernel.php to register new middleware
//
// namespace App\Http;
//
// use Illuminate\Foundation\Http\Kernel as HttpKernel;
//
// class Kernel extends HttpKernel
// {
//     protected $middleware = [
//         \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
//         \Illuminate\Foundation\Http\Middleware\TrimStrings::class,
//         \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
//     ];
//
//     protected $middlewareGroups = [
//         'web' => [
//             \Illuminate\Cookie\Middleware\EncryptCookies::class,
//             \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
//             \Illuminate\Session\Middleware\StartSession::class,
//             \Illuminate\View\Middleware\ShareErrorsFromSession::class,
//             \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
//             \Illuminate\Routing\Middleware\SubstituteBindings::class,
//         ],
//         'api' => [
//             \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
//             'throttle:api',
//             \Illuminate\Routing\Middleware\SubstituteBindings::class,
//         ],
//     ];
//
//     protected $routeMiddleware = [
//         'role' => \App\Http\Middleware\RoleMiddleware::class,
//         'verified' => \App\Http\Middleware\VerifiedMiddleware::class,
//         'admin' => \App\Http\Middleware\AdminMiddleware::class,
//         'tutor' => \App\Http\Middleware\TutorMiddleware::class,
//         'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
//     ];
// }
//
// // routes/web.php - Add web authentication routes
//
// use Illuminate\Support\Facades\Route;
//
// // Homepage
// Route::get('/', function () {
//     return view('welcome');
// })->name('home');
//
// // Health check
// Route::get('/health', function () {
//     return response()->json(['status' => 'ok', 'timestamp' => now()]);
// });
//
// // Authentication pages
// Route::middleware('guest')->group(function () {
//     Route::get('/login', function () {
//         return view('auth.login');
//     })->name('login');
//
//     Route::get('/register', function () {
//         return view('auth.register');
//     })->name('register');
//
//     Route::get('/forgot-password', function () {
//         return view('auth.forgot-password');
//     })->name('password.request');
//
//     Route::get('/reset-password', function () {
//         return view('auth.reset-password');
//     })->name('password.reset');
// });
//
// // Dashboard routes (require authentication)
// Route::middleware(['auth:sanctum', 'verified'])->group(function () {
//     // Admin dashboard
//     Route::middleware('role:admin')->group(function () {
//         Route::get('/admin/dashboard', function () {
//             return view('admin.dashboard');
//         })->name('admin.dashboard');
//
//         Route::get('/admin/users', function () {
//             return view('admin.users');
//         })->name('admin.users');
//     });
//
//     // Moderator dashboard
//     Route::middleware('role:moderator,admin')->group(function () {
//         Route::get('/moderator/dashboard', function () {
//             return view('moderator.dashboard');
//         })->name('moderator.dashboard');
//     });
//
//     // Tutor dashboard
//     Route::middleware('role:tutor,admin')->group(function () {
//         Route::get('/tutor/dashboard', function () {
//             return view('tutor.dashboard');
//         })->name('tutor.dashboard');
//
//         Route::get('/tutor/lessons', function () {
//             return view('tutor.lessons');
//         })->name('tutor.lessons');
//     });
//
//     // Student dashboard
//     Route::middleware('role:student,admin')->group(function () {
//         Route::get('/student/dashboard', function () {
//             return view('student.dashboard');
//         })->name('student.dashboard');
//
//         Route::get('/student/lessons', function () {
//             return view('student.lessons');
//         })->name('student.lessons');
//     });
//
//     // Profile routes (all authenticated users)
//     Route::get('/profile', function () {
//         return view('profile.edit');
//     })->name('profile.edit');
// });
//
// // Email verification
// Route::get('/email/verify/{token}', function () {
//     return view('auth.verify-email');
// })->name('verification.verify');
//
// // Public pages
// Route::get('/about', function () {
//     return view('about');
// })->name('about');
//
// Route::get('/contact', function () {
//     return view('contact');
// })->name('contact');
//
// Route::get('/privacy-policy', function () {
//     return view('privacy-policy');
// })->name('privacy');
//
// Route::get('/terms', function () {
//     return view('terms');
// })->name('terms');