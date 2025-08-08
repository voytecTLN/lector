<?php

namespace App\Http\Controllers;

use App\Services\LoginLogsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoginLogsController extends Controller
{
    public function __construct(
        private LoginLogsService $loginLogsService
    ) {}

    /**
     * Get paginated login logs with filters
     */
    public function getLoginLogs(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'role', 'status', 'date_from', 'date_to', 'search', 'logged_in_only'
            ]);
            
            $perPage = $request->get('per_page', 25);
            $logs = $this->loginLogsService->getLoginLogs($filters, $perPage);

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
                'message' => 'Błąd podczas pobierania logów logowania',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get login statistics
     */
    public function getLoginStats(Request $request): JsonResponse
    {
        try {
            $stats = $this->loginLogsService->getLoginStats();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania statystyk logowania',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent login activity
     */
    public function getRecentActivity(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 20);
            $activity = $this->loginLogsService->getRecentActivity($limit);

            return response()->json([
                'success' => true,
                'data' => $activity
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania ostatnich logowań',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}