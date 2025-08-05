<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\User;
use App\Models\TutorAvailabilitySlot;
use App\Models\PackageAssignment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;

class LessonService
{
    /**
     * Book a lesson for a student
     */
    public function bookLesson(array $data): Lesson
    {
        return DB::transaction(function () use ($data) {
            $student = User::findOrFail($data['student_id']);
            $tutor = User::findOrFail($data['tutor_id']);
            
            // Validate student has active package with remaining hours
            $packageAssignment = $this->getActivePackageAssignment($student->id);
            if (!$packageAssignment || $packageAssignment->hours_remaining <= 0) {
                throw new \Exception('Student nie ma aktywnego pakietu lub nie ma pozostałych godzin');
            }
            
            // Validate tutor availability
            $availabilitySlot = $this->validateTutorAvailability(
                $tutor->id,
                $data['lesson_date'],
                $data['start_time'],
                $data['duration_minutes']
            );
            
            // Check for conflicts
            $this->checkForConflicts($tutor->id, $data['lesson_date'], $data['start_time'], $data['end_time']);
            
            // Create lesson
            $lesson = Lesson::create([
                'student_id' => $student->id,
                'tutor_id' => $tutor->id,
                'package_assignment_id' => $packageAssignment->id,
                'tutor_availability_slot_id' => $availabilitySlot->id,
                'lesson_date' => $data['lesson_date'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'duration_minutes' => $data['duration_minutes'],
                'language' => $data['language'] ?? null,
                'lesson_type' => $data['lesson_type'] ?? Lesson::TYPE_INDIVIDUAL,
                'topic' => $data['topic'] ?? null,
                'notes' => $data['notes'] ?? null,
                'price' => $tutor->tutorProfile->hourly_rate ?? 0,
                'status' => Lesson::STATUS_SCHEDULED
            ]);
            
            // Update availability slot(s)
            $hoursToBook = ceil($data['duration_minutes'] / 60);
            
            // Dla lekcji 60-minutowych, zaznacz slot jako zajęty
            if ($data['duration_minutes'] === 60) {
                $availabilitySlot->bookHours(1);
            } else {
                // Dla dłuższych lekcji, zaznacz wszystkie potrzebne sloty
                $lessonStartHour = (int) date('H', strtotime($data['start_time']));
                $lessonEndHour = (int) ceil((strtotime($data['start_time']) + ($data['duration_minutes'] * 60)) / 3600);
                
                for ($hour = $lessonStartHour; $hour < $lessonEndHour; $hour++) {
                    $slot = TutorAvailabilitySlot::where('tutor_id', $tutor->id)
                        ->where('date', $data['lesson_date'])
                        ->where('start_hour', $hour)
                        ->where('end_hour', $hour + 1)
                        ->first();
                        
                    if ($slot) {
                        $slot->bookHours(1);
                    }
                }
            }
            
            // Deduct hours from package
            $packageAssignment->decrement('hours_remaining', 1);
            
            return $lesson;
        });
    }
    
    /**
     * Get available time slots for a tutor on a specific date
     */
    public function getAvailableTimeSlots(int $tutorId, string $date): array
    {
        // Pobierz wszystkie dostępne sloty godzinowe dla tego dnia
        $availabilitySlots = TutorAvailabilitySlot::where('tutor_id', $tutorId)
            ->where('date', $date)
            ->where('is_available', true)
            ->where('hours_booked', 0) // Tylko wolne sloty
            ->orderBy('start_hour')
            ->get();
            
        if ($availabilitySlots->isEmpty()) {
            return [];
        }
        
        // Get booked lessons for this date (dla dodatkowej weryfikacji)
        $bookedLessons = Lesson::where('tutor_id', $tutorId)
            ->where('lesson_date', $date)
            ->whereIn('status', [Lesson::STATUS_SCHEDULED, Lesson::STATUS_IN_PROGRESS])
            ->orderBy('start_time')
            ->get();
        
        // Konwertuj sloty na format odpowiedzi
        $slots = [];
        foreach ($availabilitySlots as $slot) {
            $startTime = sprintf('%02d:00', $slot->start_hour);
            $endTime = sprintf('%02d:00', $slot->end_hour);
            
            // Dodatkowa weryfikacja z istniejącymi lekcjami
            $isBooked = false;
            foreach ($bookedLessons as $lesson) {
                $lessonStartHour = (int) date('H', strtotime($lesson->start_time));
                $lessonEndHour = (int) date('H', strtotime($lesson->end_time));
                
                if ($slot->start_hour < $lessonEndHour && $slot->end_hour > $lessonStartHour) {
                    $isBooked = true;
                    break;
                }
            }
            
            if (!$isBooked) {
                $slots[] = [
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'display' => $startTime . ' - ' . $endTime
                ];
            }
        }
        
        return $slots;
    }
    
    /**
     * Cancel a lesson
     */
    public function cancelLesson(int $lessonId, string $cancelledBy, string $reason = null): bool
    {
        $lesson = Lesson::findOrFail($lessonId);
        
        if (!$lesson->canBeCancelled()) {
            throw new \Exception('Lekcja nie może zostać anulowana (mniej niż 12 godzin przed rozpoczęciem)');
        }
        
        return $lesson->cancel($cancelledBy, $reason);
    }
    
    /**
     * Get lessons for a student
     */
    public function getStudentLessons(int $studentId, string $type = 'all'): Collection
    {
        $query = Lesson::with(['tutor', 'tutor.tutorProfile'])
            ->forStudent($studentId);
            
        return match($type) {
            'upcoming' => $query->upcoming()->get(),
            'past' => $query->past()->get(),
            'scheduled' => $query->scheduled()->get(),
            'completed' => $query->completed()->get(),
            'cancelled' => $query->cancelled()->get(),
            default => $query->orderBy('lesson_date', 'desc')
                            ->orderBy('start_time', 'desc')
                            ->get()
        };
    }
    
    /**
     * Get lessons for a tutor
     */
    public function getTutorLessons(int $tutorId, string $type = 'all'): Collection
    {
        $query = Lesson::with(['student', 'packageAssignment'])
            ->forTutor($tutorId);
            
        return match($type) {
            'upcoming' => $query->upcoming()->get(),
            'past' => $query->past()->get(),
            'scheduled' => $query->scheduled()->get(),
            'completed' => $query->completed()->get(),
            'cancelled' => $query->cancelled()->get(),
            default => $query->orderBy('lesson_date', 'desc')
                            ->orderBy('start_time', 'desc')
                            ->get()
        };
    }
    
    /**
     * Get today's lessons for a user
     */
    public function getTodayLessons(int $userId, string $role): Collection
    {
        $query = Lesson::with(['student', 'tutor', 'tutor.tutorProfile'])
            ->where('lesson_date', now()->toDateString())
            ->scheduled();
            
        if ($role === 'student') {
            $query->forStudent($userId);
        } elseif ($role === 'tutor') {
            $query->forTutor($userId);
        }
        
        return $query->orderBy('start_time')->get();
    }
    
    /**
     * Get upcoming lessons for a user
     */
    public function getUpcomingLessons(int $userId, string $role, int $limit = 5): Collection
    {
        $query = Lesson::with(['student', 'tutor', 'tutor.tutorProfile'])
            ->upcoming()
            ->limit($limit);
            
        if ($role === 'student') {
            $query->forStudent($userId);
        } elseif ($role === 'tutor') {
            $query->forTutor($userId);
        }
        
        return $query->get();
    }
    
    /**
     * Submit lesson feedback
     */
    public function submitFeedback(int $lessonId, int $rating, string $feedback = null): Lesson
    {
        $lesson = Lesson::findOrFail($lessonId);
        
        if ($lesson->status !== Lesson::STATUS_COMPLETED) {
            throw new \Exception('Można wystawić ocenę tylko po zakończonej lekcji');
        }
        
        $lesson->submitFeedback($rating, $feedback);
        
        return $lesson;
    }
    
    /**
     * Mark lesson as completed
     */
    public function completeLesson(int $lessonId): Lesson
    {
        $lesson = Lesson::findOrFail($lessonId);
        
        if ($lesson->status !== Lesson::STATUS_SCHEDULED) {
            throw new \Exception('Tylko zaplanowane lekcje mogą być oznaczone jako zakończone');
        }
        
        $lesson->complete();
        
        return $lesson;
    }
    
    /**
     * Mark lesson as no-show
     */
    public function markAsNoShow(int $lessonId): Lesson
    {
        $lesson = Lesson::findOrFail($lessonId);
        
        if ($lesson->status !== Lesson::STATUS_SCHEDULED) {
            throw new \Exception('Tylko zaplanowane lekcje mogą być oznaczone jako nieobecność');
        }
        
        $lesson->markAsNoShow();
        
        return $lesson;
    }
    
    /**
     * Get lesson statistics
     */
    public function getLessonStats(): array
    {
        return [
            'total_lessons' => Lesson::count(),
            'scheduled_lessons' => Lesson::scheduled()->count(),
            'completed_lessons' => Lesson::completed()->count(),
            'cancelled_lessons' => Lesson::cancelled()->count(),
            'lessons_today' => Lesson::where('lesson_date', now()->toDateString())->count(),
            'lessons_this_week' => Lesson::whereBetween('lesson_date', [
                now()->startOfWeek()->toDateString(),
                now()->endOfWeek()->toDateString()
            ])->count(),
            'lessons_this_month' => Lesson::whereMonth('lesson_date', now()->month)
                ->whereYear('lesson_date', now()->year)
                ->count()
        ];
    }
    
    // Private helper methods
    
    private function getActivePackageAssignment(int $studentId): ?PackageAssignment
    {
        return PackageAssignment::where('student_id', $studentId)
            ->where('is_active', true)
            ->where('hours_remaining', '>', 0)
            ->where('expires_at', '>', now())
            ->first();
    }
    
    private function validateTutorAvailability(int $tutorId, string $date, string $startTime, int $durationMinutes): TutorAvailabilitySlot
    {
        // Konwertuj czas na godziny
        $lessonStartHour = (int) date('H', strtotime($startTime));
        $lessonEndHour = (int) ceil((strtotime($startTime) + ($durationMinutes * 60)) / 3600);
        
        // Dla lekcji 60-minutowych, szukamy dokładnie pasującego slotu
        if ($durationMinutes === 60) {
            $availabilitySlot = TutorAvailabilitySlot::where('tutor_id', $tutorId)
                ->where('date', $date)
                ->where('start_hour', $lessonStartHour)
                ->where('end_hour', $lessonEndHour)
                ->where('is_available', true)
                ->where('hours_booked', 0) // Slot musi być wolny
                ->first();
                
            if (!$availabilitySlot) {
                throw new \Exception('Lektor nie jest dostępny w wybranym terminie');
            }
        } else {
            // Dla dłuższych lekcji, sprawdź czy wszystkie potrzebne sloty są dostępne
            $requiredSlots = [];
            for ($hour = $lessonStartHour; $hour < $lessonEndHour; $hour++) {
                $slot = TutorAvailabilitySlot::where('tutor_id', $tutorId)
                    ->where('date', $date)
                    ->where('start_hour', $hour)
                    ->where('end_hour', $hour + 1)
                    ->where('is_available', true)
                    ->where('hours_booked', 0)
                    ->first();
                    
                if (!$slot) {
                    throw new \Exception('Lektor nie jest dostępny przez cały czas trwania lekcji');
                }
                
                $requiredSlots[] = $slot;
            }
            
            // Zwróć pierwszy slot (dla kompatybilności)
            $availabilitySlot = $requiredSlots[0];
        }
        
        return $availabilitySlot;
    }
    
    private function checkForConflicts(int $tutorId, string $date, string $startTime, string $endTime): void
    {
        // First check exact match (due to unique constraint) with lock for update to prevent race conditions
        $exactMatch = Lesson::where('tutor_id', $tutorId)
            ->where('lesson_date', $date)
            ->where('start_time', $startTime)
            ->where('status', Lesson::STATUS_SCHEDULED)
            ->lockForUpdate()
            ->exists();
            
        if ($exactMatch) {
            throw new \Exception('Ten slot czasowy jest już zajęty');
        }
        
        
        // Then check for overlapping time ranges (excluding adjacent times)
        $conflicts = Lesson::where('tutor_id', $tutorId)
            ->where('lesson_date', $date)
            ->where('status', Lesson::STATUS_SCHEDULED)
            ->where(function($query) use ($startTime, $endTime) {
                $query
                    // New lesson starts during existing lesson (excluding exact end time)
                    ->where(function($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<', $startTime)
                          ->where('end_time', '>', $startTime);
                    })
                    // New lesson ends during existing lesson (excluding exact start time)
                    ->orWhere(function($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<', $endTime)
                          ->where('end_time', '>', $endTime);
                    })
                    // New lesson completely contains existing lesson
                    ->orWhere(function($q) use ($startTime, $endTime) {
                        $q->where('start_time', '>=', $startTime)
                          ->where('end_time', '<=', $endTime);
                    });
            })
            ->exists();
            
        if ($conflicts) {
            throw new \Exception('Lektor ma już zaplanowaną lekcję w wybranym terminie');
        }
    }
    
    private function generateTimeSlots(string $startTime, string $endTime): array
    {
        $slots = [];
        $current = Carbon::parse($startTime);
        $end = Carbon::parse($endTime);
        
        while ($current->lt($end)) {
            $slotEnd = $current->copy()->addHour();
            if ($slotEnd->lte($end)) {
                $slots[] = [
                    'start_time' => $current->format('H:i'),
                    'end_time' => $slotEnd->format('H:i'),
                    'display' => $current->format('H:i') . ' - ' . $slotEnd->format('H:i')
                ];
            }
            $current->addHour();
        }
        
        return $slots;
    }
}