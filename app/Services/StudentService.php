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
                'status' => $data['status'] ?? User::STATUS_ACTIVE,
                'email_verified_at' => $data['email_verified_at'] ?? null
            ]);

            // 2. Create student profile
            $user->studentProfile()->create([
                'learning_languages' => $data['learning_languages'] ?? [],
                'current_levels' => $data['current_levels'] ?? [],
                'learning_goals' => $data['learning_goals'] ?? [],
                'preferred_schedule' => $data['preferred_schedule'] ?? []
            ]);

            // 3. Assign package if provided
            if (!empty($data['package_id'])) {
                \Log::info('📦 StudentService: Assigning package to student', [
                    'user_id' => $user->id,
                    'package_id' => $data['package_id'],
                    'package_id_type' => gettype($data['package_id'])
                ]);
                
                $packageService = app(\App\Services\PackageService::class);
                $result = $packageService->assignPackageToStudent($user->id, $data['package_id']);
                
                \Log::info('📦 StudentService: Package assignment result', [
                    'result' => $result,
                    'user_id' => $user->id,
                    'package_id' => $data['package_id']
                ]);
            } else {
                \Log::info('📦 StudentService: No package assignment', [
                    'package_id_value' => $data['package_id'] ?? 'not_set',
                    'package_id_empty' => empty($data['package_id']),
                    'all_data_keys' => array_keys($data)
                ]);
            }

            // 4. Send welcome email (skip for imports)
            $isImport = $data['is_import'] ?? false;
            if (!$isImport) {
                $this->notificationService->sendWelcomeEmail($user);
            }

            DB::commit();
            return $user->load(['studentProfile', 'packageAssignments.package']);

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

            // 3. Handle package assignment if provided
            if (isset($data['package_id'])) {
                if (!empty($data['package_id'])) {
                    $packageService = app(\App\Services\PackageService::class);
                    $packageService->assignPackageToStudent($user->id, $data['package_id']);
                }
                // Note: If package_id is empty, we don't remove existing packages
                // That would need to be a separate action
            }

            DB::commit();
            return $user->fresh(['studentProfile', 'packageAssignments.package']);

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getStudentById(int $studentId): User
    {
        return User::with([
                'studentProfile', 
                'activePackageAssignments.package',
                'packageAssignments' => function ($query) {
                    $query->with('package')->orderBy('assigned_at', 'desc');
                },
                'studentLessons' => function ($query) {
                    $query->with(['tutor', 'packageAssignment.package'])
                        ->orderBy('lesson_date', 'desc')
                        ->orderBy('start_time', 'desc');
                }
            ])
            ->where('role', 'student')
            ->findOrFail($studentId);
    }

    public function getStudents(array $filters = []): array
    {
        $query = User::with(['studentProfile', 'activePackageAssignments.package'])
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
        $user = User::with('studentProfile')->findOrFail($studentId);
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
        return User::where('role', 'student')
            ->with('studentProfile')
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
        User::where('role', 'student')
            ->whereIn('id', $ids)
            ->update(['status' => $status]);
    }

    /**
     * Get simple statistics for students
     */
    public function getStudentStats(): array
    {
        $total = User::where('role', 'student')->count();
        $active = User::where('role', 'student')->where('status', User::STATUS_ACTIVE)->count();
        $newThisMonth = User::where('role', 'student')
            ->where('created_at', '>=', now()->subMonth())
            ->count();

        // Optimized: Get all learning languages in one query
        $allLanguages = StudentProfile::pluck('learning_languages')->flatten()->toArray();
        $byLanguage = array_count_values($allLanguages);

        return [
            'total' => $total,
            'active' => $active,
            'new_this_month' => $newThisMonth,
            'by_language' => $byLanguage,
        ];
    }
}
