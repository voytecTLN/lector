<?php
// app/Http/Controllers/TutorController.php

namespace App\Http\Controllers;

use App\Services\TutorService;
use App\Http\Requests\CreateTutorRequest;
use App\Http\Requests\UpdateTutorRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TutorController extends Controller
{
    public function __construct(
        private TutorService $tutorService
    ) {
        $this->middleware(['auth:sanctum', 'verified', 'role:admin,moderator']);
    }

    /**
     * Display a listing of tutors
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'status', 
            'city', 
            'language', 
            'specialization', 
            'verification_status',
            'is_verified',
            'is_accepting_students',
            'search', 
            'per_page', 
            'page'
        ]);
        
        $tutors = $this->tutorService->getTutors($filters);

        return response()->json($tutors);
    }

    /**
     * Store a newly created tutor
     */
    public function store(CreateTutorRequest $request): JsonResponse
    {
        $tutor = $this->tutorService->createTutor($request->validated());

        return response()->json($tutor, 201);
    }

    /**
     * Display the specified tutor
     */
    public function show(int $id): JsonResponse
    {
        $tutor = $this->tutorService->getTutorById($id);

        return response()->json($tutor);
    }

    /**
     * Update the specified tutor
     */
    public function update(UpdateTutorRequest $request, int $id): JsonResponse
    {
        $tutor = $this->tutorService->updateTutor($id, $request->validated());

        return response()->json($tutor);
    }

    /**
     * Remove the specified tutor
     */
    public function destroy(int $id): JsonResponse
    {
        $this->tutorService->deleteTutor($id);

        return response()->json(['message' => 'Tutor deleted successfully']);
    }

    /**
     * Deactivate the specified tutor
     */
    public function deactivate(int $id): JsonResponse
    {
        $tutor = $this->tutorService->deactivateTutor($id);

        return response()->json($tutor);
    }

    /**
     * Search tutors
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('search', '');
        
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $tutors = $this->tutorService->searchTutors($query);

        return response()->json($tutors);
    }

    /**
     * Bulk update tutor status
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:users,id',
            'status' => 'required|in:active,inactive,blocked'
        ]);

        $this->tutorService->bulkUpdateStatus($request->ids, $request->status);

        return response()->json(['message' => 'Status updated successfully']);
    }

    /**
     * Verify tutor
     */
    public function verify(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'approved' => 'required|boolean',
            'notes' => 'nullable|string|max:1000'
        ]);

        $tutor = $this->tutorService->verifyTutor(
            $id, 
            $request->approved, 
            $request->notes
        );

        return response()->json($tutor);
    }

    /**
     * Update tutor availability
     */
    public function updateAvailability(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'availability' => 'required|array',
            'availability.monday' => 'nullable|array',
            'availability.tuesday' => 'nullable|array',
            'availability.wednesday' => 'nullable|array',
            'availability.thursday' => 'nullable|array',
            'availability.friday' => 'nullable|array',
            'availability.saturday' => 'nullable|array',
            'availability.sunday' => 'nullable|array',
        ]);

        $tutor = $this->tutorService->updateAvailability($id, $request->availability);

        return response()->json($tutor);
    }

    /**
     * Get tutor statistics
     */
    public function stats(): JsonResponse
    {
        $stats = $this->tutorService->getTutorStats();

        return response()->json($stats);
    }

    /**
     * Get available tutors
     */
    public function available(Request $request): JsonResponse
    {
        $criteria = $request->only(['language', 'specialization']);
        $tutors = $this->tutorService->getAvailableTutors($criteria);

        return response()->json($tutors);
    }

    /**
     * Export tutors data
     */
    public function export(Request $request)
    {
        $request->validate([
            'format' => 'in:csv,xlsx',
            'status' => 'in:active,inactive,blocked',
            'verification_status' => 'in:pending,approved,rejected',
        ]);

        $format = $request->get('format', 'csv');
        $filters = $request->only([
            'status', 
            'city', 
            'language', 
            'specialization', 
            'verification_status',
            'search'
        ]);

        // Get all tutors without pagination for export
        $filters['per_page'] = null;
        $tutorData = $this->tutorService->getTutors($filters);
        $tutors = $tutorData['data'];

        $filename = 'tutors_' . date('Y-m-d_H-i-s') . '.' . $format;

        if ($format === 'csv') {
            return $this->exportToCsv($tutors, $filename);
        } else {
            return $this->exportToExcel($tutors, $filename);
        }
    }

    /**
     * Export tutors to CSV
     */
    private function exportToCsv($tutors, $filename)
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($tutors) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Headers
            fputcsv($file, [
                'ID',
                'Imię i nazwisko',
                'Email',
                'Telefon',
                'Miasto',
                'Status',
                'Języki',
                'Specjalizacje',
                'Doświadczenie (lata)',
                'Zweryfikowany',
                'Przyjmuje studentów',
                'Utworzony',
                'Ostatnie logowanie'
            ]);

            // Data
            foreach ($tutors as $tutor) {
                $profile = $tutor->tutorProfile;
                
                fputcsv($file, [
                    $tutor->id,
                    $tutor->name,
                    $tutor->email,
                    $tutor->phone ?? '',
                    $tutor->city ?? '',
                    $this->getStatusLabel($tutor->status),
                    $profile ? implode(', ', $profile->getLanguageNames()) : '',
                    $profile ? implode(', ', $profile->getSpecializationNames()) : '',
                    $profile ? $profile->years_experience : 0,
                    $profile && $profile->isVerified() ? 'Tak' : 'Nie',
                    $profile && $profile->is_accepting_students ? 'Tak' : 'Nie',
                    $tutor->created_at?->format('Y-m-d H:i:s') ?? '',
                    $tutor->last_login_at?->format('Y-m-d H:i:s') ?? ''
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export tutors to Excel (placeholder - would need PhpSpreadsheet)
     */
    private function exportToExcel($tutors, $filename)
    {
        // For now, fallback to CSV
        return $this->exportToCsv($tutors, str_replace('.xlsx', '.csv', $filename));
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
}