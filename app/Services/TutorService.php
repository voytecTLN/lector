<?php
// app/Services/TutorService.php

namespace App\Services;

use App\Models\User;
use App\Models\TutorProfile;
use App\Models\TutorAvailabilitySlot;
use App\Models\TutorAvailabilityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Exception;

class TutorService
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function createTutor(array $data): User
    {
        DB::beginTransaction();

        try {
            // 1. Create user account
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password'] ?? \Illuminate\Support\Str::random(12)),
                'role' => 'tutor',
                'phone' => $data['phone'] ?? null,
                'birth_date' => $data['birth_date'] ?? null,
                'city' => $data['city'] ?? null,
                'country' => $data['country'] ?? 'Polska',
                'status' => $data['status'] ?? User::STATUS_ACTIVE,
                'email_verified_at' => $data['email_verified_at'] ?? null
            ]);

            // 2. Create tutor profile
            $user->tutorProfile()->create([
                'languages' => $data['languages'] ?? [],
                'specializations' => $data['specializations'] ?? [],
                'description' => $data['description'] ?? null,
                'years_experience' => $data['years_experience'] ?? 0,
                'certifications' => $data['certifications'] ?? [],
                'education' => $data['education'] ?? [],
                'lesson_types' => $data['lesson_types'] ?? [],
                'weekly_availability' => $data['weekly_availability'] ?? [],
                'is_accepting_students' => $data['is_accepting_students'] ?? true,
                'max_students_per_week' => $data['max_students_per_week'] ?? null,
                'hourly_rate' => $data['hourly_rate'] ?? null,
                'weekly_contract_limit' => $data['weekly_contract_limit'] ?? 40,
                'verification_status' => TutorProfile::VERIFICATION_PENDING,
                'is_verified' => false
            ]);

            // 3. Send welcome email
            $isImport = $data['is_import'] ?? false;
            if (!$isImport) {
                $this->notificationService->sendWelcomeEmail($user);
            }

            DB::commit();
            return $user->load(['tutorProfile']);

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function updateTutor(int $tutorId, array $data): User
    {
        DB::beginTransaction();

        try {
            $user = User::with('tutorProfile')->findOrFail($tutorId);

            // 1. Update user data
            $userData = [
                'name' => $data['name'] ?? $user->name,
                'email' => $data['email'] ?? $user->email,
                'phone' => $data['phone'] ?? $user->phone,
                'birth_date' => $data['birth_date'] ?? $user->birth_date,
                'city' => $data['city'] ?? $user->city,
                'country' => $data['country'] ?? $user->country,
                'status' => $data['status'] ?? $user->status,
            ];

            // Handle password update
            if (!empty($data['password'])) {
                $userData['password'] = Hash::make($data['password']);
            }

            $user->update($userData);

            // 2. Update tutor profile
            if ($user->tutorProfile) {
                $user->tutorProfile->update([
                    'languages' => $data['languages'] ?? $user->tutorProfile->languages,
                    'specializations' => $data['specializations'] ?? $user->tutorProfile->specializations,
                    'description' => $data['description'] ?? $user->tutorProfile->description,
                    'years_experience' => $data['years_experience'] ?? $user->tutorProfile->years_experience,
                    'certifications' => $data['certifications'] ?? $user->tutorProfile->certifications,
                    'education' => $data['education'] ?? $user->tutorProfile->education,
                    'lesson_types' => $data['lesson_types'] ?? $user->tutorProfile->lesson_types,
                    'weekly_availability' => $data['weekly_availability'] ?? $user->tutorProfile->weekly_availability,
                    'is_accepting_students' => $data['is_accepting_students'] ?? $user->tutorProfile->is_accepting_students,
                    'max_students_per_week' => $data['max_students_per_week'] ?? $user->tutorProfile->max_students_per_week,
                    'hourly_rate' => $data['hourly_rate'] ?? $user->tutorProfile->hourly_rate,
                    'weekly_contract_limit' => $data['weekly_contract_limit'] ?? $user->tutorProfile->weekly_contract_limit,
                ]);
            }

            DB::commit();
            return $user->fresh(['tutorProfile']);

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getTutorById(int $tutorId): User
    {
        return User::with('tutorProfile')
            ->where('role', 'tutor')
            ->findOrFail($tutorId);
    }

    public function getTutors(array $filters = []): array
    {
        $query = User::with('tutorProfile')
            ->where('role', 'tutor');

        // Apply filters
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['city'])) {
            $query->where('city', 'like', '%' . $filters['city'] . '%');
        }

        if (!empty($filters['language'])) {
            $query->whereHas('tutorProfile', function ($q) use ($filters) {
                $q->whereJsonContains('languages', $filters['language']);
            });
        }

        if (!empty($filters['specialization'])) {
            $query->whereHas('tutorProfile', function ($q) use ($filters) {
                $q->whereJsonContains('specializations', $filters['specialization']);
            });
        }

        if (!empty($filters['verification_status'])) {
            $query->whereHas('tutorProfile', function ($q) use ($filters) {
                $q->where('verification_status', $filters['verification_status']);
            });
        }

        if (isset($filters['is_verified'])) {
            $query->whereHas('tutorProfile', function ($q) use ($filters) {
                $q->where('is_verified', $filters['is_verified']);
            });
        }

        if (isset($filters['is_accepting_students'])) {
            $query->whereHas('tutorProfile', function ($q) use ($filters) {
                $q->where('is_accepting_students', $filters['is_accepting_students']);
            });
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'like', '%' . $filters['search'] . '%');
            });
        }

        $query->orderBy('created_at', 'desc');

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

    public function deactivateTutor(int $tutorId): User
    {
        $user = User::with('tutorProfile')->findOrFail($tutorId);
        $user->update(['status' => 'inactive']);

        // Update tutor profile to not accept new students
        if ($user->tutorProfile) {
            $user->tutorProfile->update(['is_accepting_students' => false]);
        }

        return $user;
    }

    public function deleteTutor(int $tutorId): bool
    {
        $user = User::findOrFail($tutorId);
        return $user->delete();
    }

    /**
     * Search tutors by name or email
     */
    public function searchTutors(string $query)
    {
        return User::where('role', 'tutor')
            ->with('tutorProfile')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                    ->orWhere('email', 'like', '%' . $query . '%');
            })
            ->limit(10)
            ->get();
    }

    /**
     * Bulk update tutor status
     */
    public function bulkUpdateStatus(array $ids, string $status): void
    {
        User::where('role', 'tutor')
            ->whereIn('id', $ids)
            ->update(['status' => $status]);
    }

    /**
     * Verify tutor
     */
    public function verifyTutor(int $tutorId, bool $approved, string $notes = null): User
    {
        $user = User::with('tutorProfile')->findOrFail($tutorId);
        
        if (!$user->tutorProfile) {
            throw new Exception('Tutor profile not found');
        }

        if ($approved) {
            $user->tutorProfile->approve($notes);
        } else {
            $user->tutorProfile->reject($notes);
        }

        return $user->fresh('tutorProfile');
    }

    /**
     * Update tutor availability
     */
    public function updateAvailability(int $tutorId, array $availability): User
    {
        $user = User::with('tutorProfile')->findOrFail($tutorId);
        
        if (!$user->tutorProfile) {
            throw new Exception('Tutor profile not found');
        }

        $user->tutorProfile->update([
            'weekly_availability' => $availability,
            'is_accepting_students' => $availability ? true : $user->tutorProfile->is_accepting_students
        ]);

        return $user->fresh('tutorProfile');
    }

    /**
     * Get tutor statistics
     */
    public function getTutorStats(): array
    {
        $total = User::where('role', 'tutor')->count();
        $active = User::where('role', 'tutor')
            ->where('status', User::STATUS_ACTIVE)
            ->count();
        $verified = User::where('role', 'tutor')
            ->whereHas('tutorProfile', function ($q) {
                $q->where('is_verified', true);
            })
            ->count();
        $accepting = User::where('role', 'tutor')
            ->whereHas('tutorProfile', function ($q) {
                $q->where('is_accepting_students', true);
            })
            ->count();
        $newThisMonth = User::where('role', 'tutor')
            ->where('created_at', '>=', now()->subMonth())
            ->count();

        return [
            'total' => $total,
            'active' => $active,
            'verified' => $verified,
            'accepting_students' => $accepting,
            'new_this_month' => $newThisMonth,
        ];
    }

    /**
     * Get available tutors by criteria
     */
    public function getAvailableTutors(array $criteria = []): array
    {
        $query = User::where('role', 'tutor')
            ->where('status', User::STATUS_ACTIVE)
            ->whereHas('tutorProfile', function ($q) {
                $q->where('is_verified', true)
                  ->where('is_accepting_students', true);
            })
            ->with('tutorProfile');

        if (!empty($criteria['language'])) {
            $query->whereHas('tutorProfile', function ($q) use ($criteria) {
                $q->whereJsonContains('languages', $criteria['language']);
            });
        }

        if (!empty($criteria['specialization'])) {
            $query->whereHas('tutorProfile', function ($q) use ($criteria) {
                $q->whereJsonContains('specializations', $criteria['specialization']);
            });
        }

        if (!empty($criteria['min_experience'])) {
            $query->whereHas('tutorProfile', function ($q) use ($criteria) {
                $q->where('years_experience', '>=', $criteria['min_experience']);
            });
        }

        if (!empty($criteria['max_experience'])) {
            $query->whereHas('tutorProfile', function ($q) use ($criteria) {
                $q->where('years_experience', '<=', $criteria['max_experience']);
            });
        }

        return $query->get()->toArray();
    }

    /**
     * Get availability slots for a tutor
     */
    public function getAvailabilitySlots(int $tutorId, string $startDate, string $endDate): array
    {
        return TutorAvailabilitySlot::forTutor($tutorId)
            ->forDateRange($startDate, $endDate)
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    /**
     * Set availability slots for a tutor
     */
    public function setAvailabilitySlots(int $tutorId, array $slots): array
    {
        DB::beginTransaction();

        try {
            $tutor = User::with('tutorProfile')->findOrFail($tutorId);
            $weeklyLimit = $tutor->tutorProfile->weekly_contract_limit ?? 40;
            
            // Group slots by week to validate weekly limits
            $slotsByWeek = collect($slots)->groupBy(function ($slot) {
                return Carbon::parse($slot['date'])->startOfWeek()->format('Y-m-d');
            });

            foreach ($slotsByWeek as $weekStart => $weekSlots) {
                // Count existing hours for this week
                $existingHours = TutorAvailabilitySlot::getTutorWeeklyHours($tutorId, $weekStart);
                
                // Calculate new hours being added
                $newHours = $weekSlots->sum(function($slot) {
                    return ($slot['end_hour'] - $slot['start_hour']);
                });
                
                if (($existingHours + $newHours) > $weeklyLimit) {
                    throw new Exception("Przekroczono tygodniowy limit godzin ({$weeklyLimit}h) dla tygodnia od {$weekStart}");
                }
            }

            // Process each slot
            $createdSlots = [];
            foreach ($slots as $slotData) {
                // Check if slot already exists for this hour
                $existingSlot = TutorAvailabilitySlot::where('tutor_id', $tutorId)
                    ->where('date', $slotData['date'])
                    ->where('start_hour', $slotData['start_hour'])
                    ->first();

                if ($existingSlot) {
                    // Update existing slot
                    $existingSlot->update([
                        'end_hour' => $slotData['end_hour'],
                        'is_available' => $slotData['is_available'] ?? true
                    ]);
                    $createdSlots[] = $existingSlot;
                } else {
                    // Create new slot only if marking as available
                    if ($slotData['is_available'] ?? true) {
                        $slot = TutorAvailabilitySlot::create([
                            'tutor_id' => $tutorId,
                            'date' => $slotData['date'],
                            'start_hour' => $slotData['start_hour'],
                            'end_hour' => $slotData['end_hour'],
                            'is_available' => $slotData['is_available'] ?? true,
                            'hours_booked' => 0
                        ]);
                        $createdSlots[] = $slot;
                    }
                }
            }

            // Log availability changes
            if (!empty($createdSlots)) {
                foreach ($createdSlots as $slot) {
                    TutorAvailabilityLog::create([
                        'tutor_id' => $tutorId,
                        'action' => $slot->wasRecentlyCreated ? 'added' : 'updated',
                        'date' => $slot->date,
                        'day_of_week' => null,
                        'old_slots' => null,
                        'new_slots' => [[
                            'start_time' => str_pad($slot->start_hour, 2, '0', STR_PAD_LEFT) . ':00',
                            'end_time' => str_pad($slot->end_hour, 2, '0', STR_PAD_LEFT) . ':00'
                        ]],
                        'description' => $slot->wasRecentlyCreated 
                            ? "Dodano dostępność: {$slot->start_hour}:00 - {$slot->end_hour}:00"
                            : "Zaktualizowano dostępność: {$slot->start_hour}:00 - {$slot->end_hour}:00",
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                        'changed_by' => Auth::id()
                    ]);
                }
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Dostępność została zaktualizowana',
                'slots' => $createdSlots
            ];

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Remove availability slot
     */
    public function removeAvailabilitySlot(int $tutorId, int $slotId): bool
    {
        $slot = TutorAvailabilitySlot::where('tutor_id', $tutorId)
            ->where('id', $slotId)
            ->first();

        if (!$slot) {
            throw new Exception('Slot nie został znaleziony');
        }

        if ($slot->hours_booked > 0) {
            throw new Exception('Nie można usunąć slotu z zarezerwowanymi godzinami');
        }

        return $slot->delete();
    }
    
    /**
     * Get students for a tutor with proper relationships
     */
    /**
     * Get students for specific tutor (used by admin)
     */
    public function getStudentsForTutor(int $tutorId, string $query = '', string $statusFilter = 'all', string $languageFilter = ''): array
    {
        // Reuse the same logic as getMyStudents
        $filters = [];
        if ($query) {
            $filters['search'] = $query;
        }
        if ($statusFilter && $statusFilter !== 'all') {
            $filters['status'] = $statusFilter;
        }
        if ($languageFilter) {
            $filters['language'] = $languageFilter;
        }
        
        return $this->getMyStudents($tutorId, $filters);
    }
    
    /**
     * Get student statistics for specific tutor
     */
    public function getStudentStats(int $tutorId): array
    {
        $activeCount = User::where('role', 'student')
            ->where('status', 'active')
            ->whereHas('studentLessons', function ($query) use ($tutorId) {
                $query->where('tutor_id', $tutorId);
            })
            ->count();
            
        $inactiveCount = User::where('role', 'student')
            ->where('status', '!=', 'active')
            ->whereHas('studentLessons', function ($query) use ($tutorId) {
                $query->where('tutor_id', $tutorId);
            })
            ->count();
            
        $totalCount = $activeCount + $inactiveCount;
        
        return [
            'total' => $totalCount,
            'active' => $activeCount,
            'inactive' => $inactiveCount
        ];
    }

    public function getMyStudents(int $tutorId, array $filters = []): array
    {
        // Get students who have lessons with this tutor using proper relationships
        $studentsQuery = User::where('role', 'student')
            ->whereHas('studentLessons', function ($query) use ($tutorId) {
                $query->where('tutor_id', $tutorId);
            })
            ->with([
                'studentProfile',
                'packageAssignments.package',
                'studentLessons' => function ($query) use ($tutorId) {
                    $query->where('tutor_id', $tutorId);
                }
            ]);

        // Apply filters
        if (!empty($filters['status'])) {
            if ($filters['status'] === 'active') {
                $studentsQuery->where('status', 'active');
            } elseif ($filters['status'] === 'inactive') {
                $studentsQuery->where('status', '!=', 'active');
            }
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $studentsQuery->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['language'])) {
            $language = $filters['language'];
            $studentsQuery->whereHas('studentProfile', function ($query) use ($language) {
                $query->whereJsonContains('learning_languages', $language);
            });
        }

        $students = $studentsQuery->orderBy('name')->get();

        // Transform student data using relationships
        $transformedStudents = $students->map(function ($student) use ($tutorId) {
            $tutorLessons = $student->studentLessons;
            $totalLessons = $tutorLessons->count();
            $completedLessons = $tutorLessons->where('status', 'completed')->count();

            $lastLesson = $tutorLessons->where('status', 'completed')
                ->sortByDesc('lesson_date')
                ->first();

            $nextLesson = $tutorLessons->where('status', 'scheduled')
                ->sortBy('lesson_date')
                ->first();

            $activePackage = $student->packageAssignments
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->where('hours_remaining', '>', 0)
                ->first();

            return [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'phone' => $student->phone,
                'city' => $student->city,
                'status' => $student->status,
                'created_at' => $student->created_at,
                'last_lesson_date' => $lastLesson?->lesson_date,
                'next_lesson_date' => $nextLesson?->lesson_date,
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedLessons,
                'active_package' => $activePackage ? [
                    'id' => $activePackage->package->id,
                    'name' => $activePackage->package->name,
                    'hours_remaining' => $activePackage->hours_remaining,
                    'hours_total' => $activePackage->package->hours_count,
                    'expires_at' => $activePackage->expires_at,
                ] : null,
                'student_profile' => $student->studentProfile ? [
                    'learning_languages' => $student->studentProfile->learning_languages ?? [],
                    'learning_goals' => $student->studentProfile->learning_goals ?? [],
                    'current_levels' => $student->studentProfile->current_levels ?? [],
                ] : null,
            ];
        });

        // Calculate stats using relationships
        $stats = [
            'totalStudents' => $students->count(),
            'activeStudents' => $students->where('status', 'active')->count(),
            'lessonsThisWeek' => \App\Models\Lesson::where('tutor_id', $tutorId)
                ->whereBetween('lesson_date', [
                    now()->startOfWeek(),
                    now()->endOfWeek()
                ])
                ->where('status', '!=', 'cancelled')
                ->count(),
            'upcomingLessons' => \App\Models\Lesson::where('tutor_id', $tutorId)
                ->where('lesson_date', '>=', now())
                ->where('status', 'scheduled')
                ->count(),
        ];

        return [
            'students' => $transformedStudents,
            'stats' => $stats
        ];
    }

    /**
     * Get dashboard statistics for tutor
     */
    public function getDashboardStats(int $tutorId): array
    {
        // Get upcoming lessons count
        $upcomingLessons = \App\Models\Lesson::where('tutor_id', $tutorId)
            ->where(function($q) {
                $q->where('lesson_date', '>', now()->toDateString())
                  ->orWhere(function($q2) {
                      $q2->where('lesson_date', '=', now()->toDateString())
                         ->whereTime('start_time', '>', now()->toTimeString());
                  });
            })
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->count();

        // Get completed lessons count (all time)
        $completedLessons = \App\Models\Lesson::where('tutor_id', $tutorId)
            ->where('status', 'completed')
            ->count();

        // Get active students count (students who have lessons with this tutor)
        $activeStudents = \App\Models\User::where('role', 'student')
            ->where('status', 'active')
            ->whereHas('studentLessons', function ($query) use ($tutorId) {
                $query->where('tutor_id', $tutorId);
            })
            ->count();

        // Additional stats
        $thisWeekLessons = \App\Models\Lesson::where('tutor_id', $tutorId)
            ->whereBetween('lesson_date', [
                now()->startOfWeek()->toDateString(),
                now()->endOfWeek()->toDateString()
            ])
            ->where('status', '!=', 'cancelled')
            ->count();

        $thisMonthEarnings = \App\Models\Lesson::where('tutor_id', $tutorId)
            ->where('status', 'completed')
            ->whereYear('lesson_date', now()->year)
            ->whereMonth('lesson_date', now()->month)
            ->sum('price');

        return [
            'upcomingLessons' => $upcomingLessons,
            'completedLessons' => $completedLessons,
            'activeStudents' => $activeStudents,
            'thisWeekLessons' => $thisWeekLessons,
            'thisMonthEarnings' => round($thisMonthEarnings ?? 0, 2),
            'totalEarnings' => round(\App\Models\Lesson::where('tutor_id', $tutorId)
                ->where('status', 'completed')
                ->sum('price') ?? 0, 2)
        ];
    }

    /**
     * Get detailed student information for a tutor
     */
    public function getStudentDetails(int $tutorId, int $studentId): array
    {
        $student = User::where('role', 'student')
            ->where('id', $studentId)
            ->whereHas('studentLessons', function ($query) use ($tutorId) {
                $query->where('tutor_id', $tutorId);
            })
            ->with([
                'studentProfile',
                'packageAssignments.package',
                'studentLessons' => function ($query) use ($tutorId) {
                    $query->where('tutor_id', $tutorId);
                }
            ])
            ->first();

        if (!$student) {
            throw new Exception('Student nie został znaleziony lub nie ma lekcji z tym lektorem');
        }

        // Transform student data using relationships
        $tutorLessons = $student->studentLessons;
        $totalLessons = $tutorLessons->count();
        $completedLessons = $tutorLessons->where('status', 'completed')->count();

        $lastLesson = $tutorLessons->where('status', 'completed')
            ->sortByDesc('lesson_date')
            ->first();

        $nextLesson = $tutorLessons->where('status', 'scheduled')
            ->sortBy('lesson_date')
            ->first();

        $activePackage = $student->packageAssignments
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->where('hours_remaining', '>', 0)
            ->first();

        return [
            'id' => $student->id,
            'name' => $student->name,
            'email' => $student->email,
            'phone' => $student->phone,
            'city' => $student->city,
            'status' => $student->status,
            'created_at' => $student->created_at,
            'last_lesson_date' => $lastLesson?->lesson_date,
            'next_lesson_date' => $nextLesson?->lesson_date,
            'total_lessons' => $totalLessons,
            'completed_lessons' => $completedLessons,
            'active_package' => $activePackage ? [
                'id' => $activePackage->package->id,
                'name' => $activePackage->package->name,
                'hours_remaining' => $activePackage->hours_remaining,
                'hours_total' => $activePackage->package->hours_count,
                'expires_at' => $activePackage->expires_at,
            ] : null,
            'student_profile' => $student->studentProfile ? [
                'learning_languages' => $student->studentProfile->learning_languages ?? [],
                'learning_goals' => $student->studentProfile->learning_goals ?? [],
                'current_levels' => $student->studentProfile->current_levels ?? [],
            ] : null,
        ];
    }

    /**
     * Withdraw availability slot (only if no lessons booked)
     */
    public function withdrawAvailabilitySlot(int $tutorId, int $slotId): bool
    {
        DB::beginTransaction();

        try {
            // Find the slot and verify ownership
            $slot = TutorAvailabilitySlot::where('id', $slotId)
                ->where('tutor_id', $tutorId)
                ->first();

            if (!$slot) {
                throw new \Exception('Slot dostępności nie został znaleziony');
            }

            // Check if slot has any lessons booked
            if ($slot->hours_booked > 0) {
                throw new \Exception('Nie można wycofać dostępności - są zarezerwowane lekcje');
            }

            // Check if slot is not in the past - compare slot date + hour with current time
            $slotDateTime = Carbon::parse($slot->date)->setHour($slot->start_hour);
            if ($slotDateTime->isPast()) {
                throw new \Exception('Nie można wycofać dostępności z przeszłości');
            }

            // Log the removal before deleting
            TutorAvailabilityLog::create([
                'tutor_id' => $tutorId,
                'action' => 'deleted',
                'date' => $slot->date,
                'day_of_week' => null,
                'old_slots' => [[
                    'start_time' => str_pad($slot->start_hour, 2, '0', STR_PAD_LEFT) . ':00',
                    'end_time' => str_pad($slot->end_hour, 2, '0', STR_PAD_LEFT) . ':00'
                ]],
                'new_slots' => null,
                'description' => "Usunięto dostępność: {$slot->start_hour}:00 - {$slot->end_hour}:00",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'changed_by' => Auth::id()
            ]);

            // Remove the slot
            $slot->delete();

            DB::commit();
            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}