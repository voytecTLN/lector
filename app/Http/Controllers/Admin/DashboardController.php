<?php
// app/Http/Controllers/Admin/DashboardController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get admin dashboard statistics
     */
    public function adminStats(): JsonResponse
    {
        try {
            // Rzeczywiste dane z bazy
            $stats = [
                // PODSTAWOWE DANE - już dostępne
                'users_count' => User::count(),
                'students' => User::where('role', 'student')->count(),
                'tutors' => User::where('role', 'tutor')->count(),
                'moderators' => User::where('role', 'moderator')->count(),
                'active_users' => User::where('status', 'active')->count(),
                'verified_users' => User::whereNotNull('email_verified_at')->count(),

                // STATYSTYKI CZASOWE - też można zrobić
                'new_users_this_month' => User::where('created_at', '>=', now()->startOfMonth())->count(),
                'new_users_today' => User::whereDate('created_at', today())->count(),
                'last_login_today' => User::whereDate('last_login_at', today())->count(),

                // DANE LEKTORÓW - jeśli tabela tutor_profiles istnieje
                'verified_tutors' => TutorProfile::where('is_verified', true)->count(),
                'pending_tutor_approvals' => TutorProfile::where('verification_status', 'pending')->count(),

                // PLACEHOLDERS - oznaczyć jako niedostępne
                'total_lessons' => null, // Will show "—" in frontend
                'total_revenue' => null,
                'active_lessons' => null,
                'lessons_this_month' => null,
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            \Log::error('Admin dashboard stats error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania statystyk',
                'data' => []
            ], 500);
        }
    }

    /**
     * Get student dashboard statistics
     */
    public function studentStats(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Prawdziwe dane studenta
            $stats = [
                // DANE UŻYTKOWNIKA - dostępne
                'user_name' => $user->name,
                'user_email' => $user->email,
                'member_since' => $user->created_at->format('Y-m-d'),
                'days_learning' => $user->created_at->diffInDays(now()),
                'is_verified' => !is_null($user->email_verified_at),
                'last_login' => $user->last_login_at?->format('Y-m-d H:i') ?? 'Nigdy',

                // PROFIL STUDENTA - jeśli istnieje
                'learning_languages' => $user->studentProfile?->learning_languages ?? [],
                'learning_goals' => $user->studentProfile?->learning_goals ?? [],
                'current_levels' => $user->studentProfile?->current_levels ?? [],

                // PLACEHOLDERS - do przyszłych modułów
                'completed_lessons' => null,
                'upcoming_lessons' => null,
                'total_hours' => null,
                'streak_days' => null,
                'average_rating' => null,
                'next_lesson' => null,
                'pending_homework' => null,
                'favorite_tutors' => null,
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            \Log::error('Student dashboard stats error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania danych',
                'data' => []
            ], 500);
        }
    }
}