<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasAdminAuditLog;

class Package extends Model
{
    use HasFactory, SoftDeletes, HasAdminAuditLog;

    protected $fillable = [
        'name',
        'is_active',
        'price',
        'hours_count',
        'validity_days',
        'description',
        'sort_order',
        'color'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'integer',
        'hours_count' => 'integer',
        'validity_days' => 'integer',
        'sort_order' => 'integer'
    ];

    protected $appends = [
        'formatted_price',
        'display_name'
    ];

    /**
     * Get package assignments for this package
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(PackageAssignment::class);
    }

    /**
     * Get active package assignments for this package
     */
    public function activeAssignments(): HasMany
    {
        return $this->hasMany(PackageAssignment::class)->where('is_active', true);
    }

    /**
     * Scope for active packages
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for ordered packages
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Get formatted price
     */
    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price / 100, 2, ',', ' ') . ' zł';
    }

    /**
     * Get display name with hours
     */
    public function getDisplayNameAttribute(): string
    {
        return "{$this->name} ({$this->hours_count}h)";
    }
}
