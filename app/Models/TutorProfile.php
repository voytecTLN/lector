<?php
// app/Models/TutorProfile.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TutorProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'languages',
        'specializations',
        'hourly_rate',
        'description',
        'weekly_availability'
    ];

    protected $casts = [
        'languages' => 'array',
        'specializations' => 'array',
        'weekly_availability' => 'array',
        'hourly_rate' => 'decimal:2'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}