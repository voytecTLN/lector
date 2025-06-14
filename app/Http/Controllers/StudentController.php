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

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'city', 'learning_language', 'search', 'per_page', 'page']);
        $students = $this->studentService->getStudents($filters);

        return response()->json([
            'success' => true,
            'data' => $students['data'],
            'meta' => [
                'total' => $students['total'],
                'filters' => $students['filters_applied']
            ]
        ]);
    }

    public function store(CreateStudentRequest $request): JsonResponse
    {
        try {
            $student = $this->studentService->createStudent($request->validated());

            return response()->json([
                'success' => true,
                'data' => $student,
                'message' => 'Student został utworzony pomyślnie'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas tworzenia studenta',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $student = $this->studentService->getStudentById($id);

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

    public function update(UpdateStudentRequest $request, int $id): JsonResponse
    {
        try {
            $student = $this->studentService->updateStudent($id, $request->validated());

            return response()->json([
                'success' => true,
                'data' => $student,
                'message' => 'Profil studenta został zaktualizowany'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas aktualizacji',
                'error' => $e->getMessage()
            ], 500);
        }
    }

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

    public function updateLearningGoals(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'goals' => 'required|array',
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

    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q', '');

        $students = $this->studentService->searchStudents($query);

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }

    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'integer',
            'status' => 'required|in:active,inactive',
        ]);

        $this->studentService->bulkUpdateStatus($data['student_ids'], $data['status']);

        return response()->json([
            'success' => true,
            'message' => 'Status został zaktualizowany',
        ]);
    }

    public function getStats(): JsonResponse
    {
        $stats = $this->studentService->getStudentStats();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
