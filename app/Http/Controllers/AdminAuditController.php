<?php

namespace App\Http\Controllers;

use App\Services\AdminAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuditController extends Controller
{
    public function __construct(
        private AdminAuditService $auditService
    ) {}

    /**
     * Get recent activity for dashboard
     */
    public function getRecentActivity(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 20);
            $activity = $this->auditService->getRecentActivity($limit);

            return response()->json([
                'success' => true,
                'data' => $activity
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania aktywności',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get paginated activity logs with filters
     */
    public function getActivityLogs(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'admin_id', 'action', 'model_type', 
                'date_from', 'date_to', 'search'
            ]);
            
            $perPage = $request->get('per_page', 25);
            $logs = $this->auditService->getActivityLogs($filters, $perPage);

            return response()->json([
                'success' => true,
                'data' => $logs['data'],
                'pagination' => [
                    'current_page' => $logs['current_page'],
                    'last_page' => $logs['last_page'],
                    'per_page' => $logs['per_page'],
                    'total' => $logs['total'],
                    'from' => $logs['from'],
                    'to' => $logs['to']
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania logów',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get activity statistics
     */
    public function getActivityStats(Request $request): JsonResponse
    {
        try {
            $stats = $this->auditService->getActivityStats();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania statystyk',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get activity for specific model
     */
    public function getModelActivity(Request $request, string $modelType, int $modelId): JsonResponse
    {
        try {
            $activity = $this->auditService->getModelActivity($modelType, $modelId);

            return response()->json([
                'success' => true,
                'data' => $activity
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania historii modelu',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}