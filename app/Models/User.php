<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'birth_date',
        'city',
        'country',
        'status',
        'avatar',
        'last_login_at',
        'last_login_ip',
        'email_verified_at',
        'verification_token_hash',
        'verification_token_expires_at',
        'password_reset_token',
        'password_reset_expires_at'
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'password_reset_token',
        'verification_token_hash',
        'verification_token_expires_at'
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'birth_date' => 'date:Y-m-d',
        'last_login_at' => 'datetime',
        'password_reset_expires_at' => 'datetime',
        'verification_token_expires_at' => 'datetime',
        'two_factor_recovery_codes' => 'array'
    ];

    // Role constants
    public const ROLE_ADMIN = 'admin';
    public const ROLE_MODERATOR = 'moderator';
    public const ROLE_TUTOR = 'tutor';
    public const ROLE_STUDENT = 'student';

    public const ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_MODERATOR,
        self::ROLE_TUTOR,
        self::ROLE_STUDENT
    ];

    // Status constants
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_BLOCKED = 'blocked';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_BLOCKED
    ];

    // Relationships
    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function tutorProfile(): HasOne
    {
        return $this->hasOne(TutorProfile::class);
    }

    public function availabilitySlots(): HasMany
    {
        return $this->hasMany(TutorAvailabilitySlot::class, 'tutor_id');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'student_id');
    }
    
    public function studentLessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'student_id');
    }
    
    public function tutorLessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'tutor_id');
    }

    /**
     * Get package assignments for this student
     */
    public function packageAssignments(): HasMany
    {
        return $this->hasMany(PackageAssignment::class, 'student_id');
    }

    /**
     * Get active package assignments for this student
     */
    public function activePackageAssignments(): HasMany
    {
        return $this->hasMany(PackageAssignment::class, 'student_id')
                    ->where('is_active', true)
                    ->where('expires_at', '>', now())
                    ->where('hours_remaining', '>', 0);
    }

    /**
     * Get availability logs for this tutor
     */
    public function availabilityLogs(): HasMany
    {
        return $this->hasMany(TutorAvailabilityLog::class, 'tutor_id');
    }

    // Role checking methods
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isModerator(): bool
    {
        return $this->role === self::ROLE_MODERATOR;
    }

    public function isTutor(): bool
    {
        return $this->role === self::ROLE_TUTOR;
    }

    public function isStudent(): bool
    {
        return $this->role === self::ROLE_STUDENT;
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role, $roles);
    }

    // Permission methods
    public function canManageUsers(): bool
    {
        return $this->isAdmin() || $this->isModerator();
    }

    public function canManageContent(): bool
    {
        return $this->isAdmin() || $this->isModerator();
    }

    public function canTeach(): bool
    {
        return $this->isTutor() || $this->isAdmin();
    }

    public function canLearn(): bool
    {
        return $this->isStudent() || $this->isAdmin();
    }

    // Status checking methods
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isBlocked(): bool
    {
        return $this->status === self::STATUS_BLOCKED;
    }

    // POPRAWIONA METODA - używamy tylko email_verified_at zgodnie z Laravel
    public function isVerified(): bool
    {
        return $this->hasVerifiedEmail();
    }

    // Accessors
    public function getBirthDateAttribute($value)
    {
        // Return birth_date as plain Y-m-d string without timezone conversion
        if ($value) {
            return \Carbon\Carbon::parse($value)->format('Y-m-d');
        }
        return $value;
    }

    // Utility methods
    public function getFullNameAttribute(): string
    {
        return $this->name;
    }

    public function getInitialsAttribute(): string
    {
        $names = explode(' ', $this->name);
        return strtoupper(substr($names[0], 0, 1) . (isset($names[1]) ? substr($names[1], 0, 1) : ''));
    }

    public function getAvatarUrlAttribute(): string
    {
        if ($this->avatar) {
            return asset('storage/avatars/' . $this->avatar);
        }

        // Generate avatar based on initials
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=e91e63&background=f8fafc';
    }

    // POPRAWIONA METODA - generuje, hashuje i zapisuje token z czasem wygaśnięcia
    public function generateVerificationToken(): string
    {
        // Generuj bezpieczny token
        $token = bin2hex(random_bytes(32));

        // Zapisz hash tokenu i czas wygaśnięcia
        $this->update([
            'verification_token_hash' => hash('sha256', $token),
            'verification_token_expires_at' => Carbon::now()->addHours(24) // Token ważny 24h
        ]);

        // Zwróć plain token (będzie w emailu)
        return $token;
    }

    // Sprawdza czy token weryfikacyjny jest ważny
    public function isVerificationTokenValid(string $token): bool
    {
        // Sprawdź czy token istnieje i nie wygasł
        if (!$this->verification_token_hash || !$this->verification_token_expires_at) {
            return false;
        }

        // Sprawdź czy token nie wygasł
        if ($this->verification_token_expires_at->isPast()) {
            return false;
        }

        // Sprawdź czy hash się zgadza
        return hash_equals($this->verification_token_hash, hash('sha256', $token));
    }

    // Authentication helper methods
    public function generatePasswordResetToken(): string
    {
        $token = bin2hex(random_bytes(32));

        $this->update([
            'password_reset_token' => $token,
            'password_reset_expires_at' => Carbon::now()->addHours(24)
        ]);

        return $token;
    }

    public function markAsVerified(): void
    {
        $this->update([
            'email_verified_at' => Carbon::now(),
            'verification_token_hash' => null,
            'verification_token_expires_at' => null
        ]);
    }

    public function updateLoginInfo(string $ip): void
    {
        $this->update([
            'last_login_at' => Carbon::now(),
            'last_login_ip' => $ip
        ]);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeVerified($query)
    {
        return $query->whereNotNull('email_verified_at');;
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    public function scopeStudents($query)
    {
        return $query->where('role', self::ROLE_STUDENT);
    }

    public function scopeTutors($query)
    {
        return $query->where('role', self::ROLE_TUTOR);
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', self::ROLE_ADMIN);
    }
    
    // Many-to-many relationships through lessons
    
    /**
     * Get students for this tutor (based on lessons)
     */
    public function students()
    {
        return $this->hasManyThrough(
            User::class,
            Lesson::class,
            'tutor_id',     // Foreign key on lessons table
            'id',           // Foreign key on users table
            'id',           // Local key on users table
            'student_id'    // Local key on lessons table
        )->distinct();
    }
    
    /**
     * Get tutors for this student (based on lessons)
     */
    public function tutors()
    {
        return $this->hasManyThrough(
            User::class,
            Lesson::class,
            'student_id',   // Foreign key on lessons table
            'id',           // Foreign key on users table  
            'id',           // Local key on users table
            'tutor_id'      // Local key on lessons table
        )->distinct();
    }
}