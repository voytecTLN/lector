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
        'time_slot',
        'is_available',
        'hours_booked'
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'is_available' => 'boolean',
        'hours_booked' => 'integer'
    ];

    // Time slot constants
    public const TIME_SLOT_MORNING = 'morning';     // 8:00 - 16:00
    public const TIME_SLOT_AFTERNOON = 'afternoon'; // 14:00 - 22:00
    
    public const TIME_SLOTS = [
        self::TIME_SLOT_MORNING => '8:00 - 16:00',
        self::TIME_SLOT_AFTERNOON => '14:00 - 22:00'
    ];

    public const HOURS_PER_SLOT = 8;

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
        return self::HOURS_PER_SLOT - $this->hours_booked;
    }

    public function hasAvailableHours(): bool
    {
        return $this->is_available && $this->getAvailableHours() > 0;
    }

    public function getTimeSlotLabel(): string
    {
        return self::TIME_SLOTS[$this->time_slot] ?? '';
    }

    public function getTimeSlotHours(): array
    {
        if ($this->time_slot === self::TIME_SLOT_MORNING) {
            return range(8, 15); // 8:00 - 15:00 (last hour starts at 15:00)
        } else {
            return range(14, 21); // 14:00 - 21:00 (last hour starts at 21:00)
        }
    }

    public function bookHours(int $hours): bool
    {
        if ($this->getAvailableHours() < $hours) {
            return false;
        }

        $this->hours_booked += $hours;
        
        // Mark as unavailable if fully booked
        if ($this->hours_booked >= self::HOURS_PER_SLOT) {
            $this->is_available = false;
        }

        return $this->save();
    }

    public function releaseHours(int $hours): bool
    {
        $this->hours_booked = max(0, $this->hours_booked - $hours);
        
        // Mark as available if there are free hours
        if ($this->hours_booked < self::HOURS_PER_SLOT) {
            $this->is_available = true;
        }

        return $this->save();
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
        return $slots->count() * self::HOURS_PER_SLOT;
    }
}