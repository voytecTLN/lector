<?php
// routes/web.php - Poprawione trasy web

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Homepage - publiczny
Route::get('/', function () {
    return view('welcome');
})->name('home');

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// Authentication pages (tylko dla gości)
Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return view('auth.login');
    })->name('login');

    Route::get('/register', function () {
        return view('auth.register');
    })->name('register');

    Route::get('/forgot-password', function () {
        return view('auth.forgot-password');
    })->name('password.request');

    Route::get('/reset-password', function () {
        return view('auth.reset-password');
    })->name('password.reset');
});

// Dashboard routes (wymagają autentykacji i weryfikacji email)
Route::middleware(['auth:sanctum', 'verified'])->group(function () {

    // Admin dashboard
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', function () {
            return view('dashboards.admin');
        })->name('admin.dashboard');

        Route::get('/admin/users', function () {
            return view('admin.users');
        })->name('admin.users');

        Route::get('/admin/settings', function () {
            return view('admin.settings');
        })->name('admin.settings');
    });

    // Moderator dashboard
    Route::middleware('role:moderator,admin')->group(function () {
        Route::get('/moderator/dashboard', function () {
            return view('dashboards.moderator');
        })->name('moderator.dashboard');

        Route::get('/moderator/content', function () {
            return view('moderator.content');
        })->name('moderator.content');
    });

    // Tutor dashboard
    Route::middleware('role:tutor,admin')->group(function () {
        Route::get('/tutor/dashboard', function () {
            return view('dashboards.tutor');
        })->name('tutor.dashboard');

        Route::get('/tutor/lessons', function () {
            return view('tutor.lessons');
        })->name('tutor.lessons');

        Route::get('/tutor/schedule', function () {
            return view('tutor.schedule');
        })->name('tutor.schedule');

        Route::get('/tutor/profile', function () {
            return view('tutor.profile');
        })->name('tutor.profile');
    });

    // Student dashboard
    Route::middleware('role:student,admin')->group(function () {
        Route::get('/student/dashboard', function () {
            return view('dashboards.student');
        })->name('student.dashboard');

        Route::get('/student/lessons', function () {
            return view('student.lessons');
        })->name('student.lessons');

        Route::get('/student/tutors', function () {
            return view('student.tutors');
        })->name('student.tutors');

        Route::get('/student/progress', function () {
            return view('student.progress');
        })->name('student.progress');
    });

    // Profile routes (wszyscy zalogowani użytkownicy)
    Route::get('/profile', function () {
        return view('profile.edit');
    })->name('profile.edit');

    Route::get('/profile/settings', function () {
        return view('profile.settings');
    })->name('profile.settings');
});

// Email verification
Route::get('/email/verify', function () {
    return view('auth.verify-email');
})->middleware('auth')->name('verification.notice');
Route::get('/email/verify/{token}', [AuthController::class, 'verifyEmail'])->name('verification.verify');

// Unauthorized access
Route::get('/unauthorized', function () {
    return view('errors.unauthorized');
})->name('unauthorized');

// Public pages
Route::get('/about', function () {
    return view('pages.about');
})->name('about');

Route::get('/contact', function () {
    return view('pages.contact');
})->name('contact');

Route::get('/privacy-policy', function () {
    return view('pages.privacy-policy');
})->name('privacy');

Route::get('/terms', function () {
    return view('pages.terms');
})->name('terms');

Route::get('/help', function () {
    return view('pages.help');
})->name('help');

Route::get('/faq', function () {
    return view('pages.faq');
})->name('faq');