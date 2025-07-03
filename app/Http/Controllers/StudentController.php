<?php
// app/Http/Controllers/StudentController.php

namespace App\Http\Controllers;

use App\Http\Requests\CreateStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Services\StudentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(
        private StudentService $studentService
    ) {}

    /**
     * Display a listing of students with package placeholders
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'city', 'learning_language', 'search', 'per_page', 'page']);
        $result = $this->studentService->getStudents($filters);

        // MVP: Dodaj placeholder dla pakietów godzin
        $studentsWithPackages = collect($result['data'])->map(function ($student) {
            // TODO: Implement when packages module is ready
            $student->hour_package = $this->generatePackagePlaceholder($student->id);
            return $student;
        });

        return response()->json([
            'success' => true,
            'data' => $studentsWithPackages,
            'meta' => [
                'total' => $result['total'],
                'per_page' => $result['per_page'] ?? 15,
                'current_page' => $result['current_page'] ?? 1,
                'filters_applied' => $result['filters_applied']
            ]
        ]);
    }

    /**
     * Store a newly created student
     */
    public function store(CreateStudentRequest $request): JsonResponse
    {
        try {
            $student = $this->studentService->createStudent($request->validated());

            // MVP: Dodaj placeholder dla pakietu
            $student->hour_package = $this->generatePackagePlaceholder($student->id);

            return response()->json([
                'success' => true,
                'data' => $student,
                'message' => 'Student został utworzony pomyślnie'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas tworzenia studenta',
                'error' => config('app.debug') ? $e->getMessage() : 'Wystąpił błąd'
            ], 500);
        }
    }

    /**
     * Display the specified student with full details
     */
    public function show(int $id): JsonResponse
    {
        try {
            $student = $this->studentService->getStudentById($id);

            // MVP: Dodaj placeholdery dla szczegółów
            $student->hour_package = $this->generatePackagePlaceholder($id);
            $student->upcoming_lessons = []; // TODO: Implement when lessons module is ready
            $student->stats = [
                'total_lessons' => 0,
                'total_hours' => 0,
                'completed_lessons' => 0,
                'cancelled_lessons' => 0
            ];

            return response()->json([
                'success' => true,
                'data' => $student
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Student nie został znaleziony'
            ], 404);
        }
    }

    /**
     * Update the specified student
     */
    public function update(UpdateStudentRequest $request, int $id): JsonResponse
    {
        try {
            $student = $this->studentService->updateStudent($id, $request->validated());

            // MVP: Dodaj placeholder dla pakietu
            $student->hour_package = $this->generatePackagePlaceholder($id);

            return response()->json([
                'success' => true,
                'data' => $student,
                'message' => 'Profil studenta został zaktualizowany'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas aktualizacji',
                'error' => config('app.debug') ? $e->getMessage() : 'Wystąpił błąd'
            ], 500);
        }
    }

    /**
     * Soft delete (deactivate) the specified student
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->studentService->deactivateStudent($id);

            return response()->json([
                'success' => true,
                'message' => 'Student został dezaktywowany'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas dezaktywacji'
            ], 500);
        }
    }

    /**
     * Update learning goals for a student
     */
    public function updateLearningGoals(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'goals' => 'required|array',
            'goals.*' => 'string|in:conversation,business,exam,travel,academic'
        ]);

        try {
            $student = $this->studentService->updateLearningGoals($id, $data['goals']);

            return response()->json([
                'success' => true,
                'data' => $student,
                'message' => 'Cele nauki zostały zaktualizowane',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas aktualizacji celów nauki',
            ], 500);
        }
    }

    /**
     * Search students by name or email
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json([
                'success' => true,
                'data' => [],
                'message' => 'Wpisz co najmniej 2 znaki'
            ]);
        }

        $students = $this->studentService->searchStudents($query);

        // MVP: Dodaj placeholdery
        $studentsWithPackages = $students->map(function ($student) {
            $student->hour_package = $this->generatePackagePlaceholder($student->id);
            return $student;
        });

        return response()->json([
            'success' => true,
            'data' => $studentsWithPackages,
        ]);
    }

    /**
     * Bulk update student status
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'integer|exists:users,id',
            'status' => 'required|in:active,inactive,blocked',
        ]);

        try {
            $this->studentService->bulkUpdateStatus($data['student_ids'], $data['status']);

            return response()->json([
                'success' => true,
                'message' => sprintf(
                    'Status został zaktualizowany dla %d studentów',
                    count($data['student_ids'])
                ),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas aktualizacji statusu',
                'error' => config('app.debug') ? $e->getMessage() : 'Wystąpił błąd'
            ], 500);
        }
    }

    /**
     * Get student statistics
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = $this->studentService->getStudentStats();

            // MVP: Dodaj placeholder statystyki pakietów
            $stats['packages'] = [
                'active' => rand(50, 100),
                'expiring_soon' => rand(5, 15),
                'expired' => rand(10, 30),
                'total_hours' => rand(500, 1500),
                'used_hours' => rand(200, 800)
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania statystyk',
            ], 500);
        }
    }

    /**
     * Generate package placeholder data for MVP
     * TODO: Remove when real package system is implemented
     */
    private function generatePackagePlaceholder(int $studentId): array
    {
        // Generate consistent but varied data based on student ID
        $seed = $studentId % 10;
        $totalHours = [10, 20, 30, 40, 50][$seed % 5];
        $usedHours = rand(0, $totalHours);
        $remainingHours = $totalHours - $usedHours;

        // Calculate status based on remaining hours
        $percentage = ($remainingHours / $totalHours) * 100;
        $status = match(true) {
            $percentage > 50 => 'active',
            $percentage > 20 => 'warning',
            default => 'critical'
        };

        return [
            'id' => null, // Placeholder
            'total_hours' => $totalHours,
            'used_hours' => $usedHours,
            'remaining_hours' => $remainingHours,
            'expires_at' => now()->addMonths(rand(1, 6))->format('Y-m-d'),
            'status' => $status,
            'percentage' => round($percentage),
            'display' => "{$remainingHours}/{$totalHours}h",
            'is_placeholder' => true // Flag for frontend
        ];
    }
}