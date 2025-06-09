<?php

// app/Providers/AuthServiceProvider.php - Authorization Policies

namespace App\Providers;

use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // Define Gates for authorization
        Gate::define('manage-users', function (User $user) {
            return $user->canManageUsers();
        });

        Gate::define('manage-content', function (User $user) {
            return $user->canManageContent();
        });

        Gate::define('teach-lessons', function (User $user) {
            return $user->canTeach();
        });

        Gate::define('book-lessons', function (User $user) {
            return $user->canLearn();
        });

        Gate::define('view-admin-dashboard', function (User $user) {
            return $user->isAdmin();
        });

        Gate::define('view-moderator-dashboard', function (User $user) {
            return $user->isModerator() || $user->isAdmin();
        });

        Gate::define('view-tutor-dashboard', function (User $user) {
            return $user->isTutor() || $user->isAdmin();
        });

        Gate::define('view-student-dashboard', function (User $user) {
            return $user->isStudent() || $user->isAdmin();
        });

        // Resource-specific gates
        Gate::define('update-student', function (User $user, User $student) {
            return $user->canManageUsers() || $user->id === $student->id;
        });

        Gate::define('delete-student', function (User $user, User $student) {
            return $user->canManageUsers() && $user->id !== $student->id;
        });

        Gate::before(function (User $user, string $ability) {
            // Admins can do everything
            if ($user->isAdmin()) {
                return true;
            }

            // Blocked users can't do anything
            if ($user->isBlocked()) {
                return false;
            }
        });
    }
}