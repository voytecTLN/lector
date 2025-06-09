<?php
// app/Models/StudentProfile.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'learning_languages',
        'current_levels',
        'learning_goals',
        'preferred_schedule'
    ];

    protected $casts = [
        'learning_languages' => 'array',
        'current_levels' => 'array',
        'learning_goals' => 'array',
        'preferred_schedule' => 'array'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}