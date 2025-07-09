<?php
// app/Services/StudentService.php

namespace App\Services;

use App\Models\User;
use App\Models\StudentProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Exception;

class StudentService
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function createStudent(array $data): User
    {
        DB::beginTransaction();

        try {
            // 1. Create user account
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password'] ?? Str::random(12)),
                'role' => 'student',
                'phone' => $data['phone'] ?? null,
                'birth_date' => $data['birth_date'] ?? null,
                'city' => $data['city'] ?? null,
                'country' => $data['country'] ?? 'Polska',
                'status' => $data['status'] ?? 'active'
            ]);

            // 2. Create student profile
            $user->studentProfile()->create([
                'learning_languages' => $data['learning_languages'] ?? [],
                'current_levels' => $data['current_levels'] ?? [],
                'learning_goals' => $data['learning_goals'] ?? [],
                'preferred_schedule' => $data['preferred_schedule'] ?? []
            ]);

            // 3. Send welcome email
            $this->notificationService->sendWelcomeEmail($user);

            DB::commit();
            return $user->load('studentProfile');

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function updateStudent(int $studentId, array $data): User
    {
        DB::beginTransaction();

        try {
            $user = User::with('studentProfile')->findOrFail($studentId);

            // 1. Update user data
            $user->update([
                'name' => $data['name'] ?? $user->name,
                'email' => $data['email'] ?? $user->email,
                'phone' => $data['phone'] ?? $user->phone,
                'birth_date' => $data['birth_date'] ?? $user->birth_date,
                'city' => $data['city'] ?? $user->city,
                'country' => $data['country'] ?? $user->country,
                'status' => $data['status'] ?? $user->status,
            ]);

            // 2. Update student profile
            if ($user->studentProfile) {
                $user->studentProfile->update([
                    'learning_languages' => $data['learning_languages'] ?? $user->studentProfile->learning_languages,
                    'current_levels' => $data['current_levels'] ?? $user->studentProfile->current_levels,
                    'learning_goals' => $data['learning_goals'] ?? $user->studentProfile->learning_goals,
                    'preferred_schedule' => $data['preferred_schedule'] ?? $user->studentProfile->preferred_schedule,
                ]);
            }

            DB::commit();
            return $user->fresh('studentProfile');

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getStudentById(int $studentId): User
    {
//         return User::with(['studentProfile', 'lessons'])
        return User::with(['studentProfile'])
            ->where('role', 'student')
            ->findOrFail($studentId);
    }

    public function getStudents(array $filters = []): array
    {
        $query = User::with('studentProfile')
            ->where('role', 'student');

        // Apply filters
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['city'])) {
            $query->where('city', 'like', '%' . $filters['city'] . '%');
        }

        if (!empty($filters['learning_language'])) {
            $query->whereHas('studentProfile', function ($q) use ($filters) {
                $q->whereJsonContains('learning_languages', $filters['learning_language']);
            });
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'like', '%' . $filters['search'] . '%');
            });
        }

        $paginator = $query->paginate($filters['per_page'] ?? 15);

        return [
            'data' => $paginator->items(),
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'has_more_pages' => $paginator->hasMorePages(),
            'filters_applied' => array_filter($filters)
        ];
    }

    public function deactivateStudent(int $studentId): User
    {
        $user = User::findOrFail($studentId);
        $user->update(['status' => 'inactive']);

        // Cancel active lessons
        //$user->lessons()->where('status', 'scheduled')->update(['status' => 'cancelled']);

        return $user;
    }

    public function updateLearningGoals(int $studentId, array $goals): User
    {
        $user = User::with('studentProfile')->findOrFail($studentId);

        $user->studentProfile->update([
            'learning_goals' => $goals,
            'updated_at' => now()
        ]);

        return $user->fresh('studentProfile');
    }

    /**
     * Search students by name or email
     */
    public function searchStudents(string $query)
    {
        return User::students()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                    ->orWhere('email', 'like', '%' . $query . '%');
            })
            ->limit(10)
            ->get();
    }

    /**
     * Bulk update student status
     */
    public function bulkUpdateStatus(array $ids, string $status): void
    {
        User::students()
            ->whereIn('id', $ids)
            ->update(['status' => $status]);
    }

    /**
     * Get simple statistics for students
     */
    public function getStudentStats(): array
    {
        $total = User::students()->count();
        $active = User::students()->where('status', User::STATUS_ACTIVE)->count();
        $newThisMonth = User::students()
            ->where('created_at', '>=', now()->subMonth())
            ->count();

        $byLanguage = [];
        foreach (StudentProfile::all('learning_languages') as $profile) {
            foreach ($profile->learning_languages as $lang) {
                $byLanguage[$lang] = ($byLanguage[$lang] ?? 0) + 1;
            }
        }

        return [
            'total' => $total,
            'active' => $active,
            'new_this_month' => $newThisMonth,
            'by_language' => $byLanguage,
        ];
    }
}
