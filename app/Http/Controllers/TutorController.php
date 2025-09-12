<?php
// app/Http/Controllers/TutorController.php

namespace App\Http\Controllers;

use App\Services\TutorService;
use App\Http\Requests\CreateTutorRequest;
use App\Http\Requests\UpdateTutorRequest;
use App\Models\User;
use App\Mail\TutorAccountCreated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

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
        
        // Auto-verify users created by admin 
        $data['email_verified_at'] = now();
        
        // Create tutor
        $tutor = $this->tutorService->createTutor($data);

        // Send welcome email with password reset link
        try {
            $resetToken = $tutor->generatePasswordResetToken();
            $resetUrl = config('app.url') . '/reset-password?' . http_build_query([
                'token' => $resetToken,
                'email' => $tutor->email
            ]);
            
            Mail::to($tutor->email)->send(new TutorAccountCreated($tutor, $resetUrl));
            
        } catch (\Exception $e) {
            // Log the error but don't fail the creation
            \Log::error('Failed to send tutor welcome email', [
                'tutor_id' => $tutor->id,
                'email' => $tutor->email,
                'error' => $e->getMessage()
            ]);
        }

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
        // Always log for debugging

        // Validate the request with custom date validation
        $request->validate([
            'slots' => 'required|array',
            'slots.*.date' => [
                'required',
                'date_format:Y-m-d',
                function ($attribute, $value, $fail) use ($request) {
                    // Get the index from attribute (e.g., "slots.0.date" -> 0)
                    preg_match('/slots\.(\d+)\.date/', $attribute, $matches);
                    $index = isset($matches[1]) ? intval($matches[1]) : null;
                    
                    // Check if this slot is being marked as unavailable
                    $isAvailable = $index !== null && isset($request->slots[$index]) 
                        ? $request->slots[$index]['is_available'] ?? true 
                        : true;
                    
                    $slotDate = Carbon::createFromFormat('Y-m-d', $value, 'Europe/Warsaw')->startOfDay();
                    $today = Carbon::now('Europe/Warsaw')->startOfDay();
                    
                    // Only validate future dates for slots being marked as available
                    // Allow past dates when marking slots as unavailable (for cleanup)
                    if ($isAvailable && $slotDate->lt($today)) {
                        $fail("The {$attribute} field must be a date after or equal to today when setting availability.");
                    }
                }
            ],
            'slots.*.start_hour' => 'required|integer|min:8|max:21',
            'slots.*.end_hour' => 'required|integer|min:9|max:22|gt:slots.*.start_hour',
            'slots.*.is_available' => 'required|boolean'
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
        
        return response()->json($tutor);
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
            'birth_date' => 'nullable|date|before:today',
            'city' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:2000',
            'education' => 'nullable|string|max:1000',
            'years_experience' => 'nullable|integer|min:0|max:50',
            'hourly_rate' => 'nullable|numeric|min:0',
            'is_accepting_students' => 'boolean',
            'languages' => 'nullable|array',
            'languages.*' => 'string|in:english,german,french,spanish,italian,portuguese,russian,chinese,japanese,polish',
            'specializations' => 'nullable|array',
            'specializations.*' => 'string|in:business,conversation,exam,grammar,pronunciation,academic,travel,kids',
            'certifications' => 'nullable|array',
            'certifications.*' => 'string|max:255',
            'password' => 'nullable|string|min:8|confirmed',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        try {
            // Handle file upload if present
            if ($request->hasFile('profile_picture')) {
                $validated['profile_picture'] = $request->file('profile_picture');
            }
            
            $tutor = $this->tutorService->updateTutor($user->id, $validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Profil został zaktualizowany',
                'data' => $tutor
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
     * Get dashboard statistics for tutor
     */
    public function getDashboardStats(Request $request): JsonResponse
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
            
            $stats = $this->tutorService->getDashboardStats($tutorId);
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Wystąpił błąd podczas pobierania statystyk',
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
    
    /**
     * Get students for a specific tutor (admin endpoint)
     */
    public function getTutorStudents(Request $request, $tutorId)
    {
        try {
            // Check if user is admin
            if (auth()->user()->role !== 'admin' && auth()->user()->role !== 'moderator') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Use the same logic as getStudents but for specific tutor
            $query = request()->query('search', '');
            $statusFilter = request()->query('status', 'all');
            $languageFilter = request()->query('language', '');
            
            $students = $this->tutorService->getStudentsForTutor($tutorId, $query, $statusFilter, $languageFilter);
            $stats = $this->tutorService->getStudentStats($tutorId);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'students' => $students,
                    'stats' => $stats
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Wystąpił błąd podczas pobierania studentów lektora',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Withdraw availability slot (only if no lessons booked)
     */
    public function withdrawAvailabilitySlot(int $id): JsonResponse
    {
        try {
            $tutorId = auth()->id();
            
            $result = $this->tutorService->withdrawAvailabilitySlot($tutorId, $id);
            
            return response()->json([
                'success' => true,
                'message' => 'Dostępność została wycofana'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Pobierz prostą listę lektorów (do filtrów raportów)
     */
    public function getSimpleList(): JsonResponse
    {
        try {
            $tutors = User::where('role', 'tutor')
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(function ($tutor) {
                    return [
                        'id' => $tutor->id,
                        'name' => $tutor->name
                    ];
                });

            return response()->json([
                'success' => true,
                'tutors' => $tutors
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching tutors list: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas pobierania listy lektorów'
            ], 500);
        }
    }
}