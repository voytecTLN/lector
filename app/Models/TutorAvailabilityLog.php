<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TutorAvailabilityLog extends Model
{
    protected $fillable = [
        'tutor_id',
        'action',
        'date',
        'day_of_week',
        'old_slots',
        'new_slots',
        'description',
        'ip_address',
        'user_agent',
        'changed_by'
    ];

    protected $casts = [
        'old_slots' => 'array',
        'new_slots' => 'array',
        'date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relacja do lektora którego dotyczy log
     */
    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    /**
     * Relacja do użytkownika który dokonał zmiany
     */
    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    /**
     * Pobierz czytelny opis akcji
     */
    public function getReadableDescriptionAttribute(): string
    {
        $tutorName = $this->tutor->name ?? 'Lektor';
        $changedByName = $this->changedBy ? $this->changedBy->name : $tutorName;
        
        $dateInfo = '';
        if ($this->date) {
            $dateInfo = ' na dzień ' . $this->date->format('d.m.Y');
        } elseif ($this->day_of_week) {
            $days = [
                'monday' => 'poniedziałek',
                'tuesday' => 'wtorek',
                'wednesday' => 'środa',
                'thursday' => 'czwartek',
                'friday' => 'piątek',
                'saturday' => 'sobota',
                'sunday' => 'niedziela'
            ];
            $dateInfo = ' dla ' . ($days[$this->day_of_week] ?? $this->day_of_week);
        }

        switch ($this->action) {
            case 'added':
                return "{$changedByName} dodał dostępność{$dateInfo}";
            case 'updated':
                return "{$changedByName} zaktualizował dostępność{$dateInfo}";
            case 'deleted':
                return "{$changedByName} usunął dostępność{$dateInfo}";
            case 'bulk_update':
                return "{$changedByName} wykonał zbiorczą aktualizację dostępności";
            default:
                return "{$changedByName} wykonał akcję {$this->action}{$dateInfo}";
        }
    }

    /**
     * Pobierz różnice między slotami
     */
    public function getSlotChangesAttribute(): array
    {
        $changes = [];
        
        $oldSlots = $this->old_slots ?? [];
        $newSlots = $this->new_slots ?? [];
        
        // Znajdź usunięte sloty
        foreach ($oldSlots as $oldSlot) {
            $found = false;
            foreach ($newSlots as $newSlot) {
                if ($this->slotsAreEqual($oldSlot, $newSlot)) {
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $changes['removed'][] = $oldSlot;
            }
        }
        
        // Znajdź dodane sloty
        foreach ($newSlots as $newSlot) {
            $found = false;
            foreach ($oldSlots as $oldSlot) {
                if ($this->slotsAreEqual($oldSlot, $newSlot)) {
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $changes['added'][] = $newSlot;
            }
        }
        
        return $changes;
    }

    /**
     * Sprawdź czy dwa sloty są takie same
     */
    private function slotsAreEqual($slot1, $slot2): bool
    {
        if (is_array($slot1) && is_array($slot2)) {
            return ($slot1['start_time'] ?? '') === ($slot2['start_time'] ?? '') &&
                   ($slot1['end_time'] ?? '') === ($slot2['end_time'] ?? '');
        }
        return $slot1 === $slot2;
    }

    /**
     * Scope dla filtrowania po lektorze
     */
    public function scopeForTutor($query, $tutorId)
    {
        return $query->where('tutor_id', $tutorId);
    }

    /**
     * Scope dla filtrowania po akcji
     */
    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope dla filtrowania po dacie
     */
    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}