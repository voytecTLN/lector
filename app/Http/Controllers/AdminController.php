<?php
// app/Http/Controllers/AdminController.php

namespace App\Http\Controllers;

use App\Services\AdminService;
use App\Services\TutorAvailabilityService;
use App\Http\Requests\CreateAdminRequest;
use App\Http\Requests\UpdateAdminRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    public function __construct(
        private AdminService $adminService,
        private TutorAvailabilityService $tutorAvailabilityService
    ) {
        $this->middleware(['auth:sanctum', 'verified', 'role:admin']);
    }

    /**
     * Display a listing of administrators
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'city', 'search', 'per_page', 'page']);
        $admins = $this->adminService->getAdmins($filters);

        return response()->json($admins);
    }

    /**
     * Store a newly created administrator
     */
    public function store(CreateAdminRequest $request): JsonResponse
    {
        $admin = $this->adminService->createAdmin($request->validated());

        return response()->json($admin, 201);
    }

    /**
     * Display the specified administrator
     */
    public function show(int $id): JsonResponse
    {
        $admin = $this->adminService->getAdminById($id);

        return response()->json($admin);
    }

    /**
     * Update the specified administrator
     */
    public function update(UpdateAdminRequest $request, int $id): JsonResponse
    {
        $admin = $this->adminService->updateAdmin($id, $request->validated());

        return response()->json($admin);
    }

    /**
     * Remove the specified administrator
     */
    public function destroy(int $id): JsonResponse
    {
        $this->adminService->deleteAdmin($id);

        return response()->json(['message' => 'Administrator deleted successfully']);
    }

    /**
     * Deactivate the specified administrator
     */
    public function deactivate(int $id): JsonResponse
    {
        $admin = $this->adminService->deactivateAdmin($id);

        return response()->json($admin);
    }

    /**
     * Search administrators
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('search', '');
        
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $admins = $this->adminService->searchAdmins($query);

        return response()->json($admins);
    }

    /**
     * Bulk update administrator status
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:users,id',
            'status' => 'required|in:active,inactive,blocked'
        ]);

        $this->adminService->bulkUpdateStatus($request->ids, $request->status);

        return response()->json(['message' => 'Status updated successfully']);
    }

    /**
     * Get administrator statistics
     */
    public function stats(): JsonResponse
    {
        $stats = $this->adminService->getAdminStats();

        return response()->json($stats);
    }

    /**
     * Export administrators data
     */
    public function export(Request $request)
    {
        $request->validate([
            'format' => 'in:csv,xlsx',
            'status' => 'in:active,inactive,blocked',
        ]);

        $format = $request->get('format', 'csv');
        $filters = $request->only(['status', 'city', 'search']);

        // Get all admins without pagination for export
        $filters['per_page'] = null;
        $adminData = $this->adminService->getAdmins($filters);
        $admins = $adminData['data'];

        $filename = 'administrators_' . date('Y-m-d_H-i-s') . '.' . $format;

        if ($format === 'csv') {
            return $this->exportToCsv($admins, $filename);
        } else {
            return $this->exportToExcel($admins, $filename);
        }
    }

    /**
     * Export administrators to CSV
     */
    private function exportToCsv($admins, $filename)
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($admins) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Headers
            fputcsv($file, [
                'ID',
                'Imię i nazwisko',
                'Email',
                'Telefon',
                'Data urodzenia',
                'Miasto',
                'Status',
                'Utworzony',
                'Ostatnie logowanie',
                'Email zweryfikowany'
            ]);

            // Data
            foreach ($admins as $admin) {
                fputcsv($file, [
                    $admin->id,
                    $admin->name,
                    $admin->email,
                    $admin->phone ?? '',
                    $admin->birth_date ?? '',
                    $admin->city ?? '',
                    $this->getStatusLabel($admin->status),
                    $admin->created_at?->format('Y-m-d H:i:s') ?? '',
                    $admin->last_login_at?->format('Y-m-d H:i:s') ?? '',
                    $admin->email_verified_at ? 'Tak' : 'Nie'
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export administrators to Excel (placeholder - would need PhpSpreadsheet)
     */
    private function exportToExcel($admins, $filename)
    {
        // For now, fallback to CSV
        return $this->exportToCsv($admins, str_replace('.xlsx', '.csv', $filename));
    }

    /**
     * Get status label in Polish
     */
    private function getStatusLabel($status): string
    {
        return match($status) {
            'active' => 'Aktywny',
            'inactive' => 'Nieaktywny',
            'blocked' => 'Zablokowany',
            default => 'Nieznany'
        };
    }

    /**
     * Redirect to students page
     */
    public function redirectToStudents(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'redirect' => '/admin/dashboard?section=uczniowie'
        ]);
    }

    /**
     * Redirect to tutors page
     */
    public function redirectToTutors(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'redirect' => '/admin/dashboard?section=lektorzy'
        ]);
    }

    /**
     * Check availability alert for specific month
     */
    public function checkAvailabilityAlert(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|date_format:Y-m'
        ]);

        try {
            $month = $request->input('month');

            // Use service directly instead of Artisan command to avoid exec() issues
            $result = $this->tutorAvailabilityService->checkTutorAvailability($month, true);

            return response()->json([
                'success' => true,
                'message' => 'Sprawdzanie dostępności zakończone pomyślnie',
                'data' => [
                    'tutorCount' => $result['tutorCount'],
                    'month' => $month,
                    'totalTutors' => $result['totalTutors'],
                    'emailSent' => $result['emailSent'],
                    'message' => $result['message']
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to check availability alert: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Nie udało się sprawdzić dostępności lektorów: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate full availability report for all tutors
     */
    public function fullAvailabilityReport(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|date_format:Y-m'
        ]);

        try {
            $month = $request->input('month');

            // Use service to generate full report
            $result = $this->tutorAvailabilityService->generateFullAvailabilityReport($month);

            return response()->json([
                'success' => true,
                'message' => 'Raport dostępności został wygenerowany i wysłany',
                'data' => [
                    'totalTutors' => $result['totalTutors'],
                    'month' => $month,
                    'emailSent' => $result['emailSent']
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to generate full availability report: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Nie udało się wygenerować raportu dostępności: ' . $e->getMessage()
            ], 500);
        }
    }

}