<?php

namespace App\Services;

use App\Models\AdminAuditLog;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminAuditService
{
    /**
     * Get recent admin activity
     */
    public function getRecentActivity(int $limit = 50): array
    {
        $logs = AdminAuditLog::with('adminUser')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $logs->map(function ($log) {
            return [
                'id' => $log->id,
                'admin_name' => $log->adminUser->name ?? 'Unknown',
                'admin_email' => $log->adminUser->email ?? '',
                'action' => $log->action,
                'model_type' => class_basename($log->model_type),
                'model_name' => $log->model_name,
                'description' => $log->readable_description,
                'changed_fields' => $log->changed_fields,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                'created_at_human' => $log->created_at->diffForHumans(),
            ];
        })->toArray();
    }

    /**
     * Get paginated activity logs with filters
     */
    public function getActivityLogs(array $filters = [], int $perPage = 25): array
    {
        $query = AdminAuditLog::with('adminUser');

        // Filter by admin user
        if (!empty($filters['admin_id'])) {
            $query->where('admin_user_id', $filters['admin_id']);
        }

        // Filter by action
        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        // Filter by model type
        if (!empty($filters['model_type'])) {
            $query->where('model_type', 'like', "%{$filters['model_type']}%");
        }

        // Filter by date range
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        // Search in description
        if (!empty($filters['search'])) {
            $query->where('description', 'like', "%{$filters['search']}%");
        }

        $paginated = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Transform the data to match frontend expectations
        $transformedData = collect($paginated->items())->map(function ($log) {
            return [
                'id' => $log->id,
                'admin_name' => $log->adminUser->name ?? 'Unknown',
                'admin_email' => $log->adminUser->email ?? '',
                'action' => $log->action,
                'model_type' => class_basename($log->model_type),
                'model_name' => $log->model_name,
                'description' => $log->readable_description,
                'changed_fields' => $log->changed_fields,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                'created_at_human' => $log->created_at->diffForHumans(),
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
     * Get activity summary stats
     */
    public function getActivityStats(): array
    {
        $stats = [
            'today_total' => AdminAuditLog::whereDate('created_at', today())->count(),
            'week_total' => AdminAuditLog::where('created_at', '>=', now()->subWeek())->count(),
            'month_total' => AdminAuditLog::where('created_at', '>=', now()->subMonth())->count(),
        ];

        // Actions breakdown for today
        $todayActions = AdminAuditLog::whereDate('created_at', today())
            ->selectRaw('action, count(*) as count')
            ->groupBy('action')
            ->pluck('count', 'action')
            ->toArray();

        $stats['today_actions'] = [
            'create' => $todayActions['create'] ?? 0,
            'update' => $todayActions['update'] ?? 0,
            'delete' => $todayActions['delete'] ?? 0,
        ];

        // Most active admins this week
        $activeAdmins = AdminAuditLog::with('adminUser')
            ->where('created_at', '>=', now()->subWeek())
            ->selectRaw('admin_user_id, count(*) as actions_count')
            ->groupBy('admin_user_id')
            ->orderBy('actions_count', 'desc')
            ->limit(5)
            ->get();

        $stats['active_admins'] = $activeAdmins->map(function ($log) {
            return [
                'name' => $log->adminUser->name ?? 'Unknown',
                'actions_count' => $log->actions_count
            ];
        })->toArray();

        return $stats;
    }

    /**
     * Get model-specific activity
     */
    public function getModelActivity(string $modelType, int $modelId): array
    {
        return AdminAuditLog::with('adminUser')
            ->where('model_type', $modelType)
            ->where('model_id', $modelId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'admin_name' => $log->adminUser->name ?? 'Unknown',
                    'action' => $log->action,
                    'description' => $log->description,
                    'changed_fields' => $log->changed_fields,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                    'created_at_human' => $log->created_at->diffForHumans(),
                ];
            })
            ->toArray();
    }
}