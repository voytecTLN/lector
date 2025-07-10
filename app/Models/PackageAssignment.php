<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class PackageAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'package_id',
        'assigned_at',
        'expires_at',
        'hours_remaining',
        'is_active',
        'notes'
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'expires_at' => 'datetime',
        'hours_remaining' => 'integer',
        'is_active' => 'boolean'
    ];

    protected $appends = [
        'status',
        'days_remaining'
    ];

    /**
     * Get the student for this assignment
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Get the package for this assignment
     */
    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    /**
     * Scope for active assignments
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for expired assignments
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<', now());
    }

    /**
     * Scope for valid (not expired) assignments
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>=', now());
    }

    /**
     * Check if assignment is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at < now();
    }

    /**
     * Check if assignment has remaining hours
     */
    public function hasRemainingHours(): bool
    {
        return $this->hours_remaining > 0;
    }

    /**
     * Get days remaining until expiration
     */
    public function getDaysRemainingAttribute(): int
    {
        if ($this->isExpired()) {
            return 0;
        }
        
        return now()->diffInDays($this->expires_at);
    }

    /**
     * Get status string
     */
    public function getStatusAttribute(): string
    {
        if (!$this->is_active) {
            return 'inactive';
        }
        
        if ($this->isExpired()) {
            return 'expired';
        }
        
        if (!$this->hasRemainingHours()) {
            return 'exhausted';
        }
        
        return 'active';
    }

    /**
     * Calculate and set expiration date based on package validity
     */
    public static function createForStudent(User $student, Package $package, ?string $notes = null): self
    {
        $assignedAt = now();
        $expiresAt = $assignedAt->copy()->addDays($package->validity_days);

        return self::create([
            'student_id' => $student->id,
            'package_id' => $package->id,
            'assigned_at' => $assignedAt,
            'expires_at' => $expiresAt,
            'hours_remaining' => $package->hours_count,
            'is_active' => true,
            'notes' => $notes
        ]);
    }
}
