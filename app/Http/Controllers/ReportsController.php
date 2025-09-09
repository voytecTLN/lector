<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Reports\TutorAvailabilityReportService;
use App\Services\Reports\TutorLessonsReportService;
use App\Services\Reports\StudentActivityReportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ReportsController extends Controller
{
    protected TutorAvailabilityReportService $availabilityReportService;
    protected TutorLessonsReportService $lessonsReportService;
    protected StudentActivityReportService $studentReportService;

    public function __construct(
        TutorAvailabilityReportService $availabilityReportService,
        TutorLessonsReportService $lessonsReportService,
        StudentActivityReportService $studentReportService
    ) {
        $this->availabilityReportService = $availabilityReportService;
        $this->lessonsReportService = $lessonsReportService;
        $this->studentReportService = $studentReportService;

        $this->middleware('auth:sanctum');
        $this->middleware('role:admin,moderator');
    }

    /**
     * Raport dostępności lektorów
     */
    public function tutorAvailability(Request $request): JsonResponse
    {
        try {
            $filters = $this->validateFilters($request);
            
            $data = $this->availabilityReportService->generateReport($filters);

            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Error generating tutor availability report: ' . $e->getMessage());
            return response()->json([
                'error' => 'Błąd podczas generowania raportu dostępności'
            ], 500);
        }
    }

    /**
     * Raport lekcji lektorów
     */
    public function tutorLessons(Request $request): JsonResponse
    {
        try {
            $filters = $this->validateFilters($request);
            
            $data = $this->lessonsReportService->generateReport($filters);

            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Error generating tutor lessons report: ' . $e->getMessage());
            return response()->json([
                'error' => 'Błąd podczas generowania raportu lekcji'
            ], 500);
        }
    }

    /**
     * Raport aktywności studentów
     */
    public function studentActivity(Request $request): JsonResponse
    {
        try {
            $filters = $this->validateFilters($request);
            
            $data = $this->studentReportService->generateReport($filters);

            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Error generating student activity report: ' . $e->getMessage());
            return response()->json([
                'error' => 'Błąd podczas generowania raportu aktywności studentów'
            ], 500);
        }
    }

    /**
     * Eksport raportu do CSV
     */
    public function exportReport(Request $request, string $reportType)
    {
        try {
            $filters = $this->validateFilters($request);
            
            $data = match($reportType) {
                'tutor-availability' => $this->availabilityReportService->generateReport($filters),
                'tutor-lessons' => $this->lessonsReportService->generateReport($filters),
                'student-activity' => $this->studentReportService->generateReport($filters),
                default => throw new \InvalidArgumentException('Invalid report type')
            };

            return $this->generateCSV($data, $reportType);
        } catch (\Exception $e) {
            Log::error('Error exporting report: ' . $e->getMessage());
            return response()->json([
                'error' => 'Błąd podczas eksportowania raportu'
            ], 500);
        }
    }

    /**
     * Walidacja filtrów
     */
    private function validateFilters(Request $request): array
    {
        $validated = $request->validate([
            'dateFrom' => 'nullable|date',
            'dateTo' => 'nullable|date|after_or_equal:dateFrom',
            'tutorId' => 'nullable|exists:users,id',
            'studentId' => 'nullable|exists:users,id',
            'action' => 'nullable|string|in:added,updated,deleted,bulk_update',
            'status' => 'nullable|string',
            'format' => 'nullable|string|in:json,csv,pdf'
        ]);

        // Ustaw domyślne daty jeśli nie podano
        if (empty($validated['dateFrom'])) {
            $validated['dateFrom'] = Carbon::now()->subMonth()->format('Y-m-d');
        }
        if (empty($validated['dateTo'])) {
            $validated['dateTo'] = Carbon::now()->format('Y-m-d');
        }

        return $validated;
    }

    /**
     * Generowanie CSV
     */
    private function generateCSV($data, string $reportType)
    {
        $filename = $reportType . '_' . date('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($data, $reportType) {
            $file = fopen('php://output', 'w');
            
            // BOM dla UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Nagłówki CSV w zależności od typu raportu
            switch($reportType) {
                case 'tutor-availability':
                    fputcsv($file, ['Lektor', 'Dodane', 'Usunięte', 'Zmodyfikowane', 'Ostatnia aktywność']);
                    foreach ($data['tutors'] as $tutor) {
                        fputcsv($file, [
                            $tutor['tutorName'],
                            $tutor['added'],
                            $tutor['removed'],
                            $tutor['modified'],
                            $tutor['lastActivity']
                        ]);
                    }
                    break;
                    
                case 'tutor-lessons':
                    fputcsv($file, ['Lektor', 'Zaplanowane', 'Zakończone', 'Anulowane', 'W toku', 'Skuteczność %']);
                    foreach ($data['tutors'] as $tutor) {
                        fputcsv($file, [
                            $tutor['tutorName'],
                            $tutor['scheduled'],
                            $tutor['completed'],
                            $tutor['cancelled'],
                            $tutor['inProgress'],
                            $tutor['completionRate'] . '%'
                        ]);
                    }
                    break;
                    
                case 'student-activity':
                    fputcsv($file, ['Student', 'Zarezerwowane', 'Ukończone', 'Anulowane', 'Ostatnia aktywność', 'Data rejestracji']);
                    foreach ($data['students'] as $student) {
                        fputcsv($file, [
                            $student['studentName'],
                            $student['lessonsBooked'],
                            $student['lessonsCompleted'],
                            $student['lessonsCancelled'],
                            $student['lastActivity'],
                            $student['registeredAt']
                        ]);
                    }
                    break;
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}