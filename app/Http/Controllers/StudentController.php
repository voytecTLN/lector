<?php
// app/Http/Controllers/StudentController.php

namespace App\Http\Controllers;

use App\Http\Requests\CreateStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Services\StudentService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends BaseController
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

        return response()->json([
            'success' => true,
            'data' => $result['data'],
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
            $data = $request->validated();
            
            \Log::info('📝 StudentController: Creating student with data', [
                'data_keys' => array_keys($data),
                'has_package_id' => isset($data['package_id']),
                'package_id_value' => $data['package_id'] ?? 'not_set',
                'package_id_type' => isset($data['package_id']) ? gettype($data['package_id']) : 'not_set'
            ]);
            
            // Auto-verify users created by admin (like import)
            $data['email_verified_at'] = now();
            $data['is_import'] = true; // Skip welcome email
            
            $student = $this->studentService->createStudent($data);
            return $this->successResponse($student, 'Student został utworzony pomyślnie', 201);
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'tworzenia studenta');
        }
    }

    /**
     * Display the specified student with full details
     */
    public function show($id): JsonResponse
    {
        try {
            $student = $this->studentService->getStudentById($id);
            return $this->successResponse($student);
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'pobierania danych studenta');
        }
    }

    /**
     * Update the specified student
     */
    public function update(UpdateStudentRequest $request, int $id): JsonResponse
    {
        try {
            $student = $this->studentService->updateStudent($id, $request->validated());
            return $this->successResponse($student, 'Profil studenta został zaktualizowany');
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'aktualizacji profilu studenta');
        }
    }

    /**
     * Soft delete (deactivate) the specified student
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->studentService->deactivateStudent($id);
            return $this->successResponse(null, 'Student został dezaktywowany');
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'dezaktywacji studenta');
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
            return $this->successResponse($student, 'Cele nauki zostały zaktualizowane');
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'aktualizacji celów nauki');
        }
    }

    /**
     * Search students by name or email
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return $this->successResponse([], 'Wpisz co najmniej 2 znaki');
        }

        try {
            $students = $this->studentService->searchStudents($query);
            return $this->successResponse($students);
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'wyszukiwania studentów');
        }
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
            
            $message = sprintf(
                'Status został zaktualizowany dla %d studentów',
                count($data['student_ids'])
            );
            
            return $this->successResponse(null, $message);
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'aktualizacji statusu studentów');
        }
    }

    /**
     * Get student statistics
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = $this->studentService->getStudentStats();
            return $this->successResponse($stats);
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'pobierania statystyk studentów');
        }
    }

    /**
     * Get own profile for authenticated student
     */
    public function getOwnProfile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user || $user->role !== 'student') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $student = $this->studentService->getStudentById($user->id);
            return $this->successResponse($student, 'Profile loaded successfully');
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'pobierania profilu studenta');
        }
    }

    /**
     * Update own profile for authenticated student
     */
    public function updateOwnProfile(UpdateStudentRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (app()->environment(['local', 'testing'])) {
                \Log::info('StudentController::updateOwnProfile - Debug info:', [
                    'user_id' => $user?->id,
                    'user_role' => $user?->role,
                    'request_data' => $request->validated(),
                    'has_file' => $request->hasFile('profile_picture'),
                    'file_valid' => $request->hasFile('profile_picture') ? $request->file('profile_picture')->isValid() : false,
                    'all_files' => $request->allFiles()
                ]);
            }
            
            if (!$user || $user->role !== 'student') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $updatedStudent = $this->studentService->updateStudent($user->id, $request->validated());
            
            if (app()->environment(['local', 'testing'])) {
                \Log::info('StudentController::updateOwnProfile - Profile updated successfully', [
                    'user_id' => $user->id
                ]);
            }
            
            return $this->successResponse($updatedStudent, 'Profile updated successfully');
        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'aktualizacji profilu studenta');
        }
    }

    /**
     * Pobierz prostą listę studentów (do filtrów raportów)
     */
    public function getSimpleList(): JsonResponse
    {
        try {
            $students = User::where('role', 'student')
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(function ($student) {
                    return [
                        'id' => $student->id,
                        'name' => $student->name
                    ];
                });

            return response()->json([
                'success' => true,
                'students' => $students
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching students list: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania listy studentów'
            ], 500);
        }
    }

}