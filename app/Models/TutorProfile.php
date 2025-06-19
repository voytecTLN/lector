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
        'weekly_availability',
        'is_verified',
        'verified_at',
        'verification_status',
        'verification_notes',
        'years_experience',
        'certifications',
        'education',
        'average_rating',
        'total_lessons',
        'total_students',
        'is_accepting_students',
        'max_students_per_week',
        'lesson_types'
    ];

    protected $casts = [
        'languages' => 'array',
        'specializations' => 'array',
        'weekly_availability' => 'array',
        'certifications' => 'array',
        'education' => 'array',
        'lesson_types' => 'array',
        'hourly_rate' => 'decimal:2',
        'average_rating' => 'decimal:2',
        'is_accepting_students' => 'boolean',
        'years_experience' => 'integer',
        'total_lessons' => 'integer',
        'total_students' => 'integer',
        'max_students_per_week' => 'integer',
        'is_verified',
        'verified_at'
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Verification status constants
    public const VERIFICATION_PENDING = 'pending';
    public const VERIFICATION_APPROVED = 'approved';
    public const VERIFICATION_REJECTED = 'rejected';

    public const VERIFICATION_STATUSES = [
        self::VERIFICATION_PENDING,
        self::VERIFICATION_APPROVED,
        self::VERIFICATION_REJECTED
    ];

    // Language constants
    public const LANGUAGES = [
        'english' => 'Angielski',
        'german' => 'Niemiecki',
        'french' => 'Francuski',
        'spanish' => 'Hiszpański',
        'italian' => 'Włoski',
        'portuguese' => 'Portugalski',
        'russian' => 'Rosyjski',
        'chinese' => 'Chiński',
        'japanese' => 'Japoński'
    ];

    // Specialization constants
    public const SPECIALIZATIONS = [
        'business' => 'Język biznesowy',
        'conversation' => 'Konwersacje',
        'exam' => 'Przygotowanie do egzaminów',
        'grammar' => 'Gramatyka',
        'pronunciation' => 'Wymowa',
        'academic' => 'Język akademicki',
        'travel' => 'Język w podróży',
        'kids' => 'Zajęcia dla dzieci'
    ];

    // Lesson type constants
    public const LESSON_TYPES = [
        'individual' => 'Lekcje indywidualne',
        'group' => 'Lekcje grupowe',
        'intensive' => 'Kursy intensywne',
        'conversation' => 'Kluby konwersacyjne'
    ];

    // Scopes
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true)
                    ->where('verification_status', self::VERIFICATION_APPROVED);
    }

    public function scopeAcceptingStudents($query)
    {
        return $query->where('is_accepting_students', true);
    }

    public function scopeByLanguage($query, string $language)
    {
        return $query->whereJsonContains('languages', $language);
    }

    public function scopeBySpecialization($query, string $specialization)
    {
        return $query->whereJsonContains('specializations', $specialization);
    }

    public function scopeByPriceRange($query, float $minPrice = null, float $maxPrice = null)
    {
        if ($minPrice !== null) {
            $query->where('hourly_rate', '>=', $minPrice);
        }

        if ($maxPrice !== null) {
            $query->where('hourly_rate', '<=', $maxPrice);
        }

        return $query;
    }

    public function scopeByRating($query, float $minRating = null)
    {
        if ($minRating !== null) {
            $query->where('average_rating', '>=', $minRating);
        }

        return $query;
    }

    // Helper methods
    public function isVerified(): bool
    {
        return $this->is_verified && $this->verification_status === self::VERIFICATION_APPROVED;
    }

    public function isAcceptingStudents(): bool
    {
        return $this->is_accepting_students && $this->isVerified();
    }

    public function getLanguageNames(): array
    {
        return collect($this->languages)
            ->map(fn($lang) => self::LANGUAGES[$lang] ?? $lang)
            ->toArray();
    }

    public function getSpecializationNames(): array
    {
        return collect($this->specializations)
            ->map(fn($spec) => self::SPECIALIZATIONS[$spec] ?? $spec)
            ->toArray();
    }

    public function getLessonTypeNames(): array
    {
        return collect($this->lesson_types ?? [])
            ->map(fn($type) => self::LESSON_TYPES[$type] ?? $type)
            ->toArray();
    }

    public function getFormattedRate(): string
    {
        return number_format($this->hourly_rate, 0) . ' zł/h';
    }

    public function getFormattedRating(): string
    {
        return number_format($this->average_rating, 1) . '/5.0';
    }

    public function hasLanguage(string $language): bool
    {
        return in_array($language, $this->languages ?? []);
    }

    public function hasSpecialization(string $specialization): bool
    {
        return in_array($specialization, $this->specializations ?? []);
    }

    public function isAvailableOn(string $day): bool
    {
        $availability = $this->weekly_availability ?? [];
        return isset($availability[$day]) && !empty($availability[$day]);
    }

    public function getAvailabilityForDay(string $day): array
    {
        $availability = $this->weekly_availability ?? [];
        return $availability[$day] ?? [];
    }

    // Update statistics methods
    public function incrementLessons(): void
    {
        $this->increment('total_lessons');
    }

    public function updateRating(float $newRating, int $totalRatings): void
    {
        // Calculate new average rating
        $this->average_rating = round($newRating, 2);
        $this->save();
    }

    public function addStudent(): void
    {
        $this->increment('total_students');
    }

    // Verification methods
    public function approve(string $notes = null): void
    {
        $this->update([
            'is_verified' => true,
            'verification_status' => self::VERIFICATION_APPROVED,
            'verified_at' => now(),
            'verification_notes' => $notes
        ]);
    }

    public function reject(string $notes = null): void
    {
        $this->update([
            'is_verified' => false,
            'verification_status' => self::VERIFICATION_REJECTED,
            'verified_at' => null,
            'verification_notes' => $notes
        ]);
    }

    public function resetVerification(): void
    {
        $this->update([
            'is_verified' => false,
            'verification_status' => self::VERIFICATION_PENDING,
            'verified_at' => null,
            'verification_notes' => null
        ]);
    }
}