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
            
            // Update availability slot
            $hoursToBook = ceil($data['duration_minutes'] / 60);
            $availabilitySlot->increment('hours_booked', $hoursToBook);
            
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
        $availabilitySlot = TutorAvailabilitySlot::where('tutor_id', $tutorId)
            ->where('date', $date)
            ->where('is_available', true)
            ->first();
            
        if (!$availabilitySlot) {
            return [];
        }
        
        // Get booked lessons for this date
        $bookedLessons = Lesson::where('tutor_id', $tutorId)
            ->where('lesson_date', $date)
            ->where('status', Lesson::STATUS_SCHEDULED)
            ->orderBy('start_time')
            ->get();
        
        // Generate available slots based on time_slot type
        $slots = [];
        if ($availabilitySlot->time_slot === 'morning') {
            $slots = $this->generateTimeSlots('08:00', '16:00');
        } elseif ($availabilitySlot->time_slot === 'afternoon') {
            $slots = $this->generateTimeSlots('14:00', '22:00');
        }
        
        // Remove booked slots
        foreach ($bookedLessons as $lesson) {
            $startTime = Carbon::parse($lesson->start_time)->format('H:i');
            $slots = array_filter($slots, function($slot) use ($startTime) {
                return $slot['start_time'] !== $startTime;
            });
        }
        
        return array_values($slots);
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
        $availabilitySlot = TutorAvailabilitySlot::where('tutor_id', $tutorId)
            ->where('date', $date)
            ->where('is_available', true)
            ->first();
            
        if (!$availabilitySlot) {
            throw new \Exception('Lektor nie jest dostępny w wybranym dniu');
        }
        
        // Check if there are enough hours available
        $hoursNeeded = ceil($durationMinutes / 60);
        $maxHours = 8; // 8 hours per slot
        
        if ($availabilitySlot->hours_booked + $hoursNeeded > $maxHours) {
            throw new \Exception('Lektor nie ma wystarczająco dostępnych godzin w wybranym dniu');
        }
        
        return $availabilitySlot;
    }
    
    private function checkForConflicts(int $tutorId, string $date, string $startTime, string $endTime): void
    {
        $conflicts = Lesson::where('tutor_id', $tutorId)
            ->where('lesson_date', $date)
            ->where('status', Lesson::STATUS_SCHEDULED)
            ->where(function($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('end_time', [$startTime, $endTime])
                    ->orWhere(function($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<=', $startTime)
                          ->where('end_time', '>=', $endTime);
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