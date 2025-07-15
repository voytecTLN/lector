<?php
// app/Services/TutorService.php

namespace App\Services;

use App\Models\User;
use App\Models\TutorProfile;
use App\Models\TutorAvailabilitySlot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
                // Count existing slots for this week
                $existingSlots = TutorAvailabilitySlot::getTutorWeeklyHours($tutorId, $weekStart);
                $newSlots = $weekSlots->count() * TutorAvailabilitySlot::HOURS_PER_SLOT;
                
                if (($existingSlots + $newSlots) > $weeklyLimit) {
                    throw new Exception("Przekroczono tygodniowy limit godzin ({$weeklyLimit}h) dla tygodnia od {$weekStart}");
                }
            }

            // Process each slot
            $createdSlots = [];
            foreach ($slots as $slotData) {
                // Check if slot already exists
                $existingSlot = TutorAvailabilitySlot::where('tutor_id', $tutorId)
                    ->where('date', $slotData['date'])
                    ->first();

                if ($existingSlot) {
                    // Update existing slot
                    $existingSlot->update([
                        'time_slot' => $slotData['time_slot'],
                        'is_available' => true
                    ]);
                    $createdSlots[] = $existingSlot;
                } else {
                    // Create new slot
                    $slot = TutorAvailabilitySlot::create([
                        'tutor_id' => $tutorId,
                        'date' => $slotData['date'],
                        'time_slot' => $slotData['time_slot'],
                        'is_available' => true,
                        'hours_booked' => 0
                    ]);
                    $createdSlots[] = $slot;
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
}