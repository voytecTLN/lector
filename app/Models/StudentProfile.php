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
        'preferred_schedule',
        'bio'
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

    // Language constants - same as TutorProfile for consistency
    public const LANGUAGES = [
        'english' => 'Angielski',
        'german' => 'Niemiecki',
        'french' => 'Francuski',
        'spanish' => 'Hiszpański',
    ];

    // Learning goals constants
    public const LEARNING_GOALS = [
        'conversation' => 'Konwersacje',
        'exam' => 'Przygotowanie do egzaminów',
        'grammar' => 'Gramatyka',
        'listening' => 'Rozumienie ze słuchu',
        'writing' => 'Pisanie',
        'pronunciation' => 'Wymowa',
        'business' => 'Język biznesowy',
        'culture' => 'Kultura i zwyczaje',
        'travel' => 'Język w podróży'
    ];
}