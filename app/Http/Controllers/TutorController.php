<?php
// app/Http/Controllers/TutorController.php

namespace App\Http\Controllers;

use App\Services\TutorService;
use App\Http\Requests\CreateTutorRequest;
use App\Http\Requests\UpdateTutorRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TutorController extends Controller
{
    public function __construct(
        private TutorService $tutorService
    ) {
        // Temporarily disable all middleware to debug
        // Middleware will be handled by routes only
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
        $data = $request->validated();
        
        // Auto-verify users created by admin (like import)
        $data['email_verified_at'] = now();
        $data['is_import'] = true; // Skip welcome email
        
        $tutor = $this->tutorService->createTutor($data);

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
     * Get tutor availability slots
     */
    public function getAvailabilitySlots(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $tutorId = auth()->id();
        $slots = $this->tutorService->getAvailabilitySlots($tutorId, $request->start_date, $request->end_date);

        return response()->json(['slots' => $slots]);
    }

    /**
     * Get specific tutor's availability slots (for admin/moderator viewing)
     */
    public function getTutorAvailabilitySlots(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $slots = $this->tutorService->getAvailabilitySlots($id, $request->start_date, $request->end_date);

        return response()->json(['slots' => $slots]);
    }

    /**
     * Set tutor availability slots
     */
    public function setAvailabilitySlots(Request $request): JsonResponse
    {
        $request->validate([
            'slots' => 'required|array',
            'slots.*.date' => 'required|date|after_or_equal:today',
            'slots.*.time_slot' => 'required|in:morning,afternoon'
        ]);

        $tutorId = auth()->id();
        $result = $this->tutorService->setAvailabilitySlots($tutorId, $request->slots);

        return response()->json($result);
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

    /**
     * Get tutor's own profile (for self-management)
     */
    public function getOwnProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'tutor') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $tutor = $this->tutorService->getTutorById($user->id);
        
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $tutor
            ]
        ]);
    }

    /**
     * Update tutor's own profile (for self-management)
     */
    public function updateOwnProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'tutor') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'city' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:2000',
            'years_experience' => 'nullable|integer|min:0|max:50',
            'is_accepting_students' => 'boolean',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        try {
            $tutor = $this->tutorService->updateTutor($user->id, $validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Profil został zaktualizowany',
                'data' => [
                    'user' => $tutor
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Wystąpił błąd podczas aktualizacji profilu',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available tutors for students (with optional filters)
     */
    public function availableForStudents(Request $request): JsonResponse
    {
        \Log::info('availableForStudents method called', [
            'user_id' => $request->user()?->id,
            'user_role' => $request->user()?->role,
            'method' => 'availableForStudents'
        ]);
        
        $filters = $request->only(['language', 'specialization', 'min_experience', 'max_experience']);
        
        // Add filter to get only active tutors accepting students
        $filters['is_accepting_students'] = true;
        $filters['status'] = 'active';
        $filters['is_verified'] = true;
        
        $tutors = $this->tutorService->getAvailableTutors($filters);
        
        return response()->json([
            'success' => true,
            'data' => $tutors,
            'message' => 'Tutors loaded successfully'
        ]);
    }
    
    /**
     * Display public tutor profile (for students)
     */
    public function showPublic(int $id): JsonResponse
    {
        try {
            $tutor = $this->tutorService->getTutorById($id);
            
            // Only show active and verified tutors
            if ($tutor->status !== 'active' || !$tutor->tutorProfile || !$tutor->tutorProfile->is_verified) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lektor nie jest dostępny'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $tutor,
                'message' => 'Tutor profile loaded successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lektor nie został znaleziony'
            ], 404);
        }
    }
    
    /**
     * Get students who have had lessons with this tutor
     */
    public function getMyStudents(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            if ($user->role !== 'tutor' && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $tutorId = $user->role === 'admin' ? $request->get('tutor_id', $user->id) : $user->id;
            
            // Use the service to get students
            $result = $this->tutorService->getMyStudents($tutorId, $request->all());
            
            return response()->json([
                'success' => true,
                'data' => $result
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Wystąpił błąd podczas pobierania studentów',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get detailed information about a specific student for this tutor
     */
    public function getStudentDetails(Request $request, $studentId): JsonResponse
    {
        try {
            $user = auth()->user();
            if ($user->role !== 'tutor' && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $tutorId = $user->role === 'admin' ? $request->get('tutor_id', $user->id) : $user->id;
            
            // Use the service to get student details
            $student = $this->tutorService->getStudentDetails($tutorId, $studentId);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'student' => $student
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Wystąpił błąd podczas pobierania szczegółów studenta',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}