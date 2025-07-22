<?php

namespace App\Http\Controllers;

use App\Services\LessonService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class LessonController extends Controller
{
    public function __construct(
        private LessonService $lessonService
    ) {}

    /**
     * Book a lesson
     */
    public function bookLesson(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tutor_id' => 'required|integer|exists:users,id',
            'lesson_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'duration_minutes' => 'required|integer|min:30|max:120',
            'language' => 'nullable|string|max:50',
            'lesson_type' => 'nullable|string|in:individual,group,intensive,conversation',
            'topic' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000'
        ]);

        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'student') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Calculate end time
            $startTime = \Carbon\Carbon::parse($validated['start_time']);
            $endTime = $startTime->copy()->addMinutes($validated['duration_minutes']);
            
            $validated['student_id'] = $user->id;
            $validated['end_time'] = $endTime->format('H:i');

            $lesson = $this->lessonService->bookLesson($validated);

            return response()->json([
                'success' => true,
                'message' => 'Lekcja została zarezerwowana pomyślnie',
                'data' => [
                    'lesson' => $lesson->load(['tutor', 'tutor.tutorProfile'])
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get available time slots for a tutor
     */
    public function getAvailableSlots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tutor_id' => 'required|integer|exists:users,id',
            'date' => 'required|date|after_or_equal:today'
        ]);

        try {
            $slots = $this->lessonService->getAvailableTimeSlots(
                $validated['tutor_id'],
                $validated['date']
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'slots' => $slots
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Cancel a lesson
     */
    public function cancelLesson(Request $request, int $lessonId): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500'
        ]);

        try {
            $user = Auth::user();
            $lesson = \App\Models\Lesson::findOrFail($lessonId);

            // Check if user can cancel this lesson
            if ($user->role === 'student' && $lesson->student_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            if ($user->role === 'tutor' && $lesson->tutor_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $success = $this->lessonService->cancelLesson(
                $lessonId,
                $user->role,
                $validated['reason'] ?? null
            );

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Lekcja została anulowana pomyślnie'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Nie można anulować lekcji'
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get lessons for authenticated user
     */
    public function getUserLessons(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'nullable|string|in:upcoming,past,scheduled,completed,cancelled,all'
        ]);

        try {
            $user = Auth::user();
            $type = $validated['type'] ?? 'all';

            if ($user->role === 'student') {
                $lessons = $this->lessonService->getStudentLessons($user->id, $type);
            } elseif ($user->role === 'tutor') {
                $lessons = $this->lessonService->getTutorLessons($user->id, $type);
            } else {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'lessons' => $lessons
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get today's lessons
     */
    public function getTodayLessons(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $lessons = $this->lessonService->getTodayLessons($user->id, $user->role);

            return response()->json([
                'success' => true,
                'data' => [
                    'lessons' => $lessons
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get upcoming lessons
     */
    public function getUpcomingLessons(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'limit' => 'nullable|integer|min:1|max:20'
        ]);

        try {
            $user = Auth::user();
            $limit = $validated['limit'] ?? 5;
            
            $lessons = $this->lessonService->getUpcomingLessons($user->id, $user->role, $limit);

            return response()->json([
                'success' => true,
                'data' => [
                    'lessons' => $lessons
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Submit lesson feedback
     */
    public function submitFeedback(Request $request, int $lessonId): JsonResponse
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'feedback' => 'nullable|string|max:1000'
        ]);

        try {
            $user = Auth::user();
            $lesson = \App\Models\Lesson::findOrFail($lessonId);

            // Only students can submit feedback
            if ($user->role !== 'student' || $lesson->student_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $lesson = $this->lessonService->submitFeedback(
                $lessonId,
                $validated['rating'],
                $validated['feedback'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Ocena została dodana pomyślnie',
                'data' => [
                    'lesson' => $lesson
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get single lesson details
     */
    public function show(int $lessonId): JsonResponse
    {
        try {
            $user = Auth::user();
            $lesson = \App\Models\Lesson::with([
                'tutor',
                'tutor.tutorProfile',
                'student',
                'packageAssignment',
                'packageAssignment.package'
            ])->findOrFail($lessonId);
            
            // Check if user can view this lesson
            if ($user->role === 'student' && $lesson->student_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            if ($user->role === 'tutor' && $lesson->tutor_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            // Admins can view all lessons
            if ($user->role === 'admin') {
                // Admin has access to all lessons
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'lesson' => $lesson
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Mark lesson as completed (tutor only)
     */
    public function completeLesson(Request $request, int $lessonId): JsonResponse
    {
        try {
            $user = Auth::user();
            $lesson = \App\Models\Lesson::findOrFail($lessonId);

            // Only tutors can mark lessons as completed
            if ($user->role !== 'tutor' || $lesson->tutor_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $lesson = $this->lessonService->completeLesson($lessonId);

            return response()->json([
                'success' => true,
                'message' => 'Lekcja została oznaczona jako zakończona',
                'data' => [
                    'lesson' => $lesson
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Mark lesson as no-show (tutor only)
     */
    public function markAsNoShow(Request $request, int $lessonId): JsonResponse
    {
        try {
            $user = Auth::user();
            $lesson = \App\Models\Lesson::findOrFail($lessonId);

            // Only tutors can mark lessons as no-show
            if ($user->role !== 'tutor' || $lesson->tutor_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $lesson = $this->lessonService->markAsNoShow($lessonId);

            return response()->json([
                'success' => true,
                'message' => 'Lekcja została oznaczona jako nieobecność',
                'data' => [
                    'lesson' => $lesson
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get all lessons (admin only)
     */
    public function getAllLessons(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $query = \App\Models\Lesson::with(['student', 'tutor', 'tutor.tutorProfile']);

            // Apply filters
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            if ($request->has('tutor_id')) {
                $query->where('tutor_id', $request->tutor_id);
            }

            if ($request->has('student_id')) {
                $query->where('student_id', $request->student_id);
            }

            if ($request->has('date_from')) {
                $query->where('lesson_date', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('lesson_date', '<=', $request->date_to);
            }

            $lessons = $query->orderBy('lesson_date', 'desc')
                            ->orderBy('start_time', 'desc')
                            ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'lessons' => $lessons
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Cancel lesson as admin
     */
    public function adminCancelLesson(Request $request, int $lessonId): JsonResponse
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $validated = $request->validate([
                'reason' => 'nullable|string|max:500'
            ]);

            $success = $this->lessonService->cancelLesson(
                $lessonId,
                'admin',
                $validated['reason'] ?? 'Anulowane przez administratora'
            );

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Lekcja została anulowana pomyślnie'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Nie można anulować lekcji'
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get lesson statistics (admin only)
     */
    public function getStats(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $stats = $this->lessonService->getLessonStats();

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
