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

class User extends Authenticatable
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
        'is_verified',
        'last_login_at',
        'last_login_ip'
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'password_reset_token',
        'verification_token'
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'birth_date' => 'date',
        'last_login_at' => 'datetime',
        'password_reset_expires_at' => 'datetime',
        'is_verified' => 'boolean',
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

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class);
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

    public function isVerified(): bool
    {
        return $this->is_verified;
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

    public function generateVerificationToken(): string
    {
        $token = bin2hex(random_bytes(32));

        $this->update([
            'verification_token' => $token
        ]);

        return $token;
    }

    public function markAsVerified(): void
    {
        $this->update([
            'is_verified' => true,
            'verification_token' => null,
            'email_verified_at' => Carbon::now()
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
        return $query->where('is_verified', true);
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
}
