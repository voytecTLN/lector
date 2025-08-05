<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class TutorAvailabilitySlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'tutor_id',
        'date',
        'start_hour',
        'end_hour',
        'is_available',
        'hours_booked'
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'start_hour' => 'integer',
        'end_hour' => 'integer',
        'is_available' => 'boolean',
        'hours_booked' => 'integer'
    ];

    // Hour constants
    public const MIN_HOUR = 8;   // 8:00
    public const MAX_HOUR = 22;  // 22:00 (last lesson can end at 22:00)
    
    // For backward compatibility during transition
    public const HOURS_PER_SLOT = 1; // Now each slot is 1 hour

    // Relationships
    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeForWeek($query, $weekStart)
    {
        $weekEnd = Carbon::parse($weekStart)->endOfWeek();
        return $query->whereBetween('date', [$weekStart, $weekEnd]);
    }

    public function scopeForTutor($query, $tutorId)
    {
        return $query->where('tutor_id', $tutorId);
    }

    // Helper methods
    public function getAvailableHours(): int
    {
        return $this->is_available && !$this->hours_booked ? 1 : 0;
    }

    public function hasAvailableHours(): bool
    {
        return $this->is_available && $this->hours_booked === 0;
    }

    public function getTimeSlotLabel(): string
    {
        return sprintf('%02d:00 - %02d:00', $this->start_hour, $this->end_hour);
    }

    public function getTimeSlotHours(): array
    {
        // For single hour slot, return just this hour
        return [$this->start_hour];
    }
    
    public function getDuration(): int
    {
        return $this->end_hour - $this->start_hour;
    }
    
    public function overlapsWithTime(string $startTime, string $endTime): bool
    {
        $requestedStart = (int) date('H', strtotime($startTime));
        $requestedEnd = (int) date('H', strtotime($endTime));
        
        return $this->start_hour < $requestedEnd && $this->end_hour > $requestedStart;
    }

    public function bookHours(int $hours = 1): bool
    {
        if (!$this->is_available || $this->hours_booked > 0) {
            return false;
        }

        $this->hours_booked = 1;
        // Note: We keep is_available = true so the slot shows as "taken" but still visible
        
        return $this->save();
    }

    public function releaseHours(int $hours = 1): bool
    {
        $this->hours_booked = 0;
        // Slot remains available for rebooking
        
        return $this->save();
    }
    
    public function isBooked(): bool
    {
        return $this->hours_booked > 0;
    }

    // Static helper to get slots for a week
    public static function getTutorWeeklySlots($tutorId, $weekStart)
    {
        return self::forTutor($tutorId)
            ->forWeek($weekStart)
            ->orderBy('date')
            ->get();
    }

    // Calculate total hours for a week
    public static function getTutorWeeklyHours($tutorId, $weekStart): int
    {
        $slots = self::getTutorWeeklySlots($tutorId, $weekStart);
        return $slots->sum(function($slot) {
            return $slot->end_hour - $slot->start_hour;
        });
    }
    
    // Get available hours for a specific date
    public static function getAvailableHoursForDate($tutorId, $date)
    {
        return self::where('tutor_id', $tutorId)
            ->where('date', $date)
            ->where('is_available', true)
            ->where('hours_booked', 0)
            ->orderBy('start_hour')
            ->get();
    }
}