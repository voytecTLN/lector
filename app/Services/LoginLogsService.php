<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class LoginLogsService
{
    /**
     * Get paginated login logs with filters
     */
    public function getLoginLogs(array $filters = [], int $perPage = 25): array
    {
        $query = User::query()->select([
            'id', 'name', 'email', 'role', 'status', 
            'last_login_at', 'last_login_ip', 'created_at'
        ]);

        // Filter by role
        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        // Filter by status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by date range (last login)
        if (!empty($filters['date_from'])) {
            $query->whereDate('last_login_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('last_login_at', '<=', $filters['date_to']);
        }

        // Search in name or email
        if (!empty($filters['search'])) {
            $query->where(function($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('email', 'like', "%{$filters['search']}%");
            });
        }

        // Filter users who have logged in at least once
        if (!empty($filters['logged_in_only'])) {
            $query->whereNotNull('last_login_at');
        }

        $paginated = $query->orderBy('last_login_at', 'desc')
                          ->orderBy('created_at', 'desc')
                          ->paginate($perPage);

        // Transform the data to match frontend expectations
        $transformedData = collect($paginated->items())->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_display' => $this->getRoleDisplay($user->role),
                'status' => $user->status,
                'status_display' => $this->getStatusDisplay($user->status),
                'last_login_at' => $user->last_login_at ? $user->last_login_at->format('Y-m-d H:i:s') : null,
                'last_login_at_human' => $user->last_login_at ? $user->last_login_at->diffForHumans() : 'Nigdy',
                'last_login_ip' => $user->last_login_ip,
                'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                'created_at_human' => $user->created_at->diffForHumans(),
                'days_since_login' => $user->last_login_at ? (int) ceil($user->last_login_at->diffInDays(now(), false)) : null,
            ];
        })->toArray();

        return [
            'data' => $transformedData,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
            'from' => $paginated->firstItem(),
            'to' => $paginated->lastItem()
        ];
    }

    /**
     * Get login statistics
     */
    public function getLoginStats(): array
    {
        $stats = [
            'total_users' => User::count(),
            'active_users' => User::where('status', 'active')->count(),
            'never_logged_in' => User::whereNull('last_login_at')->count(),
        ];

        // Recent logins (last 24h, 7 days, 30 days)
        $stats['logged_in_24h'] = User::where('last_login_at', '>=', now()->subHours(24))->count();
        $stats['logged_in_7days'] = User::where('last_login_at', '>=', now()->subDays(7))->count();
        $stats['logged_in_30days'] = User::where('last_login_at', '>=', now()->subDays(30))->count();

        // By role breakdown
        $roleStats = User::selectRaw('role, count(*) as count, 
                                     sum(case when last_login_at >= ? then 1 else 0 end) as active_7days',
                                     [now()->subDays(7)])
                        ->groupBy('role')
                        ->get();

        $stats['by_role'] = $roleStats->mapWithKeys(function ($item) {
            return [
                $item->role => [
                    'total' => $item->count,
                    'active_7days' => $item->active_7days,
                    'role_display' => $this->getRoleDisplay($item->role)
                ]
            ];
        })->toArray();

        return $stats;
    }

    /**
     * Get recent login activity
     */
    public function getRecentActivity(int $limit = 50): array
    {
        $users = User::select([
            'id', 'name', 'email', 'role', 'last_login_at', 'last_login_ip'
        ])
        ->whereNotNull('last_login_at')
        ->orderBy('last_login_at', 'desc')
        ->limit($limit)
        ->get();

        return $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_display' => $this->getRoleDisplay($user->role),
                'last_login_at' => $user->last_login_at->format('Y-m-d H:i:s'),
                'last_login_at_human' => $user->last_login_at->diffForHumans(),
                'last_login_ip' => $user->last_login_ip,
            ];
        })->toArray();
    }

    /**
     * Get display name for role
     */
    private function getRoleDisplay(string $role): string
    {
        return match($role) {
            'admin' => 'Administrator',
            'moderator' => 'Moderator',
            'tutor' => 'Lektor',
            'student' => 'Student',
            default => ucfirst($role)
        };
    }

    /**
     * Get display name for status
     */
    private function getStatusDisplay(string $status): string
    {
        return match($status) {
            'active' => 'Aktywny',
            'inactive' => 'Nieaktywny',
            'suspended' => 'Zawieszony',
            'banned' => 'Zablokowany',
            default => ucfirst($status)
        };
    }
}