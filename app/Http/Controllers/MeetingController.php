<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\MeetingSession;
use App\Services\DailyVideoService;
use App\Services\NotificationService;
use App\Services\LessonStatusService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MeetingController extends BaseController
{
    public function __construct(
        private DailyVideoService $dailyService,
        private NotificationService $notificationService,
        private LessonStatusService $lessonStatusService
    ) {}

    /**
     * Inicjalizuje pokój spotkania dla lekcji (tylko dla lektora)
     */
    public function startMeeting(Request $request, Lesson $lesson): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Auto-check for lessons that should have been marked as not started
            $this->lessonStatusService->handleNoShowScenarios($lesson);
            
            // Reload lesson in case status was updated
            $lesson->refresh();
            
            // Sprawdź uprawnienia - tylko lektor może rozpocząć spotkanie
            if ($user->id !== $lesson->tutor_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tylko lektor może rozpocząć spotkanie'
                ], 403);
            }

            // Sprawdź czy można rozpocząć spotkanie
            if (!$lesson->canStartMeeting()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Spotkanie można rozpocząć najwcześniej 10 minut przed planowaną godziną'
                ], 422);
            }

            // Sprawdź czy pokój już istnieje
            if ($lesson->hasMeetingRoom()) {
                // Sprawdź czy pokój jest nadal aktywny
                if ($this->dailyService->isRoomActive($lesson->meeting_room_name)) {
                    // Wygeneruj nowy token dla lektora
                    $token = $this->dailyService->generateMeetingToken($user, $lesson->meeting_room_name, true);
                    
                    return $this->successResponse([
                        'room_url' => $lesson->meeting_room_url,
                        'room_name' => $lesson->meeting_room_name,
                        'token' => $token,
                        'is_moderator' => true
                    ], 'Pokój spotkania jest już aktywny');
                }
            }

            DB::beginTransaction();
            try {
                // Utwórz nowy pokój
                $roomData = $this->dailyService->createRoom($lesson);
                
                if (!$roomData['success']) {
                    throw new \Exception($roomData['error'] ?? 'Nie udało się utworzyć pokoju');
                }

                // Zapisz dane pokoju w lekcji
                $lesson->update([
                    'meeting_room_name' => $roomData['room_name'],
                    'meeting_room_url' => $roomData['room_url'],
                    'meeting_started_at' => now(),
                    'status' => Lesson::STATUS_IN_PROGRESS
                ]);

                // Wygeneruj token dla lektora
                $token = $this->dailyService->generateMeetingToken($user, $roomData['room_name'], true);
                
                if (!$token) {
                    throw new \Exception('Nie udało się wygenerować tokenu dostępu');
                }

                // Zapisz token w lekcji
                $lesson->update(['meeting_token' => $token]);

                // Utwórz sesję dla lektora
                $session = MeetingSession::create([
                    'lesson_id' => $lesson->id,
                    'participant_id' => $user->id,
                    'room_name' => $roomData['room_name'],
                    'joined_at' => now(),
                    'browser' => $request->header('User-Agent'),
                    'device_type' => $this->detectDeviceType($request)
                ]);

                // Log tutor joining (room creation)
                \Illuminate\Support\Facades\Log::channel('meetings')->info('Tutor started meeting', [
                    'lesson_id' => $lesson->id,
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_role' => 'tutor',
                    'room_name' => $roomData['room_name'],
                    'session_id' => $session->id,
                    'device_type' => $session->device_type,
                    'browser' => $session->browser,
                    'joined_at' => $session->joined_at->toIso8601String()
                ]);

                DB::commit();

                // Send notification to student that room is available
                $lesson->load(['student', 'tutor']);
                $meetingUrl = config('app.url') . '/#/lesson/' . $lesson->id . '/meeting';
                $this->notificationService->sendLessonRoomAvailable($lesson, $meetingUrl);

                return $this->successResponse([
                    'room_url' => $roomData['room_url'],
                    'room_name' => $roomData['room_name'],
                    'token' => $token,
                    'is_moderator' => true,
                    'meeting_started_at' => $lesson->meeting_started_at
                ], 'Pokój spotkania został utworzony');

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            \Log::error('Meeting creation failed', [
                'lesson_id' => $lesson->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->handleServiceException($e, 'tworzenia pokoju spotkania');
        }
    }

    /**
     * Dołącz do spotkania (dla studenta i lektora)
     */
    public function joinMeeting(Request $request, Lesson $lesson): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Auto-check for lessons that should have been marked as not started
            $this->lessonStatusService->handleNoShowScenarios($lesson);
            
            // Reload lesson in case status was updated
            $lesson->refresh();
            
            // Sprawdź uprawnienia - tylko uczestnik lekcji może dołączyć
            if ($user->id !== $lesson->student_id && $user->id !== $lesson->tutor_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nie masz uprawnień do tej lekcji'
                ], 403);
            }

            // Sprawdź czy pokój istnieje
            if (!$lesson->hasMeetingRoom()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pokój spotkania nie został jeszcze utworzony'
                ], 422);
            }

            // Sprawdź czy student może już dołączyć
            if ($user->id === $lesson->student_id && !$lesson->canJoinMeeting()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Możesz dołączyć do spotkania najwcześniej 10 minut przed planowaną godziną'
                ], 422);
            }

            // Sprawdź czy pokój jest aktywny
            if (!$this->dailyService->isRoomActive($lesson->meeting_room_name)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pokój spotkania wygasł. Poproś lektora o utworzenie nowego pokoju.'
                ], 422);
            }

            // Wygeneruj token
            $isModerator = $user->id === $lesson->tutor_id;
            $token = $this->dailyService->generateMeetingToken($user, $lesson->meeting_room_name, $isModerator);
            
            if (!$token) {
                throw new \Exception('Nie udało się wygenerować tokenu dostępu');
            }

            // Sprawdź czy użytkownik nie ma już aktywnej sesji
            $existingSession = MeetingSession::where('lesson_id', $lesson->id)
                ->where('participant_id', $user->id)
                ->whereNull('left_at')
                ->first();

            if (!$existingSession) {
                // Utwórz nową sesję
                $session = MeetingSession::create([
                    'lesson_id' => $lesson->id,
                    'participant_id' => $user->id,
                    'room_name' => $lesson->meeting_room_name,
                    'joined_at' => now(),
                    'browser' => $request->header('User-Agent'),
                    'device_type' => $this->detectDeviceType($request)
                ]);

                // Log user joining meeting
                \Illuminate\Support\Facades\Log::channel('meetings')->info('User joined meeting', [
                    'lesson_id' => $lesson->id,
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_role' => $user->role,
                    'room_name' => $lesson->meeting_room_name,
                    'session_id' => $session->id,
                    'device_type' => $session->device_type,
                    'browser' => $session->browser,
                    'joined_at' => $session->joined_at->toIso8601String(),
                    'is_moderator' => $isModerator
                ]);
            } else {
                // Log existing session rejoin
                \Illuminate\Support\Facades\Log::channel('meetings')->info('User rejoined meeting (existing session)', [
                    'lesson_id' => $lesson->id,
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_role' => $user->role,
                    'room_name' => $lesson->meeting_room_name,
                    'session_id' => $existingSession->id,
                    'original_joined_at' => $existingSession->joined_at->toIso8601String(),
                    'is_moderator' => $isModerator
                ]);
            }

            return $this->successResponse([
                'room_url' => $lesson->meeting_room_url,
                'room_name' => $lesson->meeting_room_name,
                'token' => $token,
                'is_moderator' => $isModerator,
                'participant_name' => $user->name
            ], 'Token dostępu został wygenerowany');

        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'dołączania do spotkania');
        }
    }

    /**
     * Zakończ spotkanie (tylko dla lektora)
     */
    public function endMeeting(Request $request, Lesson $lesson): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Sprawdź uprawnienia - tylko lektor może zakończyć spotkanie
            if ($user->id !== $lesson->tutor_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tylko lektor może zakończyć spotkanie'
                ], 403);
            }

            // Sprawdź czy spotkanie jest aktywne
            if (!$lesson->isMeetingActive()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Spotkanie nie jest aktywne'
                ], 422);
            }

            DB::beginTransaction();
            try {
                // Zakończ wszystkie aktywne sesje
                $activeSessions = $lesson->meetingSessions()->whereNull('left_at')->get();
                foreach ($activeSessions as $session) {
                    $session->endSession();
                    
                    // Log user leaving meeting
                    \Illuminate\Support\Facades\Log::channel('meetings')->info('User left meeting (forced by tutor end)', [
                        'lesson_id' => $lesson->id,
                        'user_id' => $session->participant_id,
                        'user_name' => $session->participant->name,
                        'user_role' => $session->participant->role,
                        'room_name' => $lesson->meeting_room_name,
                        'session_id' => $session->id,
                        'joined_at' => $session->joined_at->toIso8601String(),
                        'left_at' => $session->left_at->toIso8601String(),
                        'duration_minutes' => $session->joined_at->diffInMinutes($session->left_at)
                    ]);
                }

                // Log meeting end
                \Illuminate\Support\Facades\Log::channel('meetings')->info('Meeting ended by tutor', [
                    'lesson_id' => $lesson->id,
                    'ended_by_user_id' => $user->id,
                    'ended_by_user_name' => $user->name,
                    'room_name' => $lesson->meeting_room_name,
                    'meeting_started_at' => $lesson->meeting_started_at->toIso8601String(),
                    'meeting_ended_at' => now()->toIso8601String(),
                    'total_duration_minutes' => $lesson->meeting_started_at->diffInMinutes(now()),
                    'participants_count' => $activeSessions->count()
                ]);

                // Zaktualizuj status lekcji
                $lesson->update([
                    'meeting_ended_at' => now(),
                    'status' => Lesson::STATUS_COMPLETED
                ]);

                // Spróbuj pobrać URL nagrania (jeśli włączone)
                if (config('services.daily.enable_recording')) {
                    $recordingUrl = $this->dailyService->getRecordingUrl($lesson->meeting_room_name);
                    if ($recordingUrl) {
                        $lesson->update(['recording_url' => $recordingUrl]);
                    }
                }

                // Usuń pokój z Daily.co
                $this->dailyService->deleteRoom($lesson->meeting_room_name);

                DB::commit();

                return $this->successResponse([
                    'meeting_ended_at' => $lesson->meeting_ended_at,
                    'duration_minutes' => $lesson->meeting_started_at->diffInMinutes($lesson->meeting_ended_at)
                ], 'Spotkanie zostało zakończone');

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->handleServiceException($e, 'kończenia spotkania');
        }
    }

    /**
     * Pobierz status spotkania
     */
    public function getMeetingStatus(Lesson $lesson): JsonResponse
    {
        
        try {
            $user = Auth::user();
            
            // Sprawdź uprawnienia
            if ($user->id !== $lesson->student_id && $user->id !== $lesson->tutor_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nie masz uprawnień do tej lekcji'
                ], 403);
            }

            $status = [
                'has_room' => $lesson->hasMeetingRoom(),
                'is_active' => $lesson->isMeetingActive(),
                'can_start' => false,
                'can_join' => false,
                'room_url' => $lesson->meeting_room_url,
                'meeting_started_at' => $lesson->meeting_started_at,
                'meeting_ended_at' => $lesson->meeting_ended_at,
                'active_participants' => []
            ];

            // Sprawdź uprawnienia do rozpoczęcia/dołączenia
            if ($user->id === $lesson->tutor_id) {
                $status['can_start'] = $lesson->canStartMeeting();
                $status['can_join'] = $lesson->hasMeetingRoom();
            } else {
                $status['can_join'] = $lesson->canJoinMeeting();
            }

            // Pobierz aktywnych uczestników
            if ($lesson->hasMeetingRoom() && $lesson->isMeetingActive()) {
                $participants = $lesson->getActiveMeetingParticipants();
                $status['active_participants'] = $participants->map(function ($session) {
                    return [
                        'id' => $session->participant_id,
                        'name' => $session->participant->name,
                        'role' => $session->participant_id === $session->lesson->tutor_id ? 'tutor' : 'student',
                        'joined_at' => $session->joined_at
                    ];
                });
            }

            
            return $this->successResponse($status);

        } catch (\Exception $e) {
            \Log::error('getMeetingStatus error', [
                'lesson_id' => $lesson->id,
                'error' => $e->getMessage()
            ]);
            return $this->handleServiceException($e, 'pobierania statusu spotkania');
        }
    }

    /**
     * Webhook endpoint dla Daily.co (opcjonalnie)
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        // Weryfikuj webhook signature (jeśli skonfigurowane)
        // TODO: Dodaj weryfikację podpisu webhooks

        $event = $request->input('event');
        $roomName = $request->input('room_name');
        $participantId = $request->input('participant_user_id');

        try {
            switch ($event) {
                case 'participant-joined':
                    // Obsługa dołączenia uczestnika
                    break;
                    
                case 'participant-left':
                    // Zaktualizuj sesję uczestnika
                    if ($participantId) {
                        $session = MeetingSession::where('room_name', $roomName)
                            ->where('participant_id', $participantId)
                            ->whereNull('left_at')
                            ->first();
                            
                        if ($session) {
                            $session->endSession();
                            
                            // Log participant leaving via webhook
                            \Illuminate\Support\Facades\Log::channel('meetings')->info('User left meeting (webhook)', [
                                'participant_id' => $participantId,
                                'room_name' => $roomName,
                                'session_id' => $session->id,
                                'joined_at' => $session->joined_at->toIso8601String(),
                                'left_at' => $session->left_at->toIso8601String(),
                                'duration_minutes' => $session->joined_at->diffInMinutes($session->left_at)
                            ]);
                        }
                    }
                    break;
                    
                case 'recording-ready':
                    // Zapisz URL nagrania
                    $recordingUrl = $request->input('recording_url');
                    $lesson = Lesson::where('meeting_room_name', $roomName)->first();
                    if ($lesson && $recordingUrl) {
                        $lesson->update(['recording_url' => $recordingUrl]);
                    }
                    break;
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Daily.co webhook error', [
                'error' => $e->getMessage(),
                'event' => $event
            ]);
            
            return response()->json(['success' => false], 500);
        }
    }

    /**
     * Detekcja typu urządzenia
     */
    private function detectDeviceType(Request $request): string
    {
        $userAgent = strtolower($request->header('User-Agent', ''));
        
        if (str_contains($userAgent, 'mobile') || str_contains($userAgent, 'android')) {
            return MeetingSession::DEVICE_MOBILE;
        } elseif (str_contains($userAgent, 'tablet') || str_contains($userAgent, 'ipad')) {
            return MeetingSession::DEVICE_TABLET;
        }
        
        return MeetingSession::DEVICE_DESKTOP;
    }
}