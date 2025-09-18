<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;
use App\Models\Lesson;
use App\Models\User;

class DailyVideoService
{
    private Client $client;
    private string $apiKey;
    private string $domain;

    public function __construct()
    {
        $this->apiKey = config('services.daily.api_key'); 
        $this->domain = config('services.daily.domain');
        
        if (empty($this->apiKey)) {
            Log::error('Daily.co API key is not configured. Please set DAILY_API_KEY in .env file');
            throw new \Exception('Daily.co API key is not configured');
        }
        
        if (empty($this->domain)) {
            Log::error('Daily.co domain is not configured. Please set DAILY_DOMAIN in .env file');
            throw new \Exception('Daily.co domain is not configured');
        }
        
        $this->client = new Client([
            'base_uri' => 'https://api.daily.co/v1/',
            'headers' => [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ],
            'timeout' => 30,
        ]);
    }

    /**
     * Tworzy nowy pokój dla lekcji
     * 
     * @param Lesson $lesson
     * @return array
     */
    public function createRoom(Lesson $lesson): array
    {
        try {
            $roomName = $this->generateRoomName($lesson);
            
            
            $requestData = [
                'name' => $roomName,
                'privacy' => 'private',
                'properties' => [
                    'enable_prejoin_ui' => config('services.daily.enable_prejoin', true),
                    'enable_chat' => config('services.daily.enable_chat', true),
                    'enable_recording' => config('services.daily.enable_recording', false),
                    'max_participants' => config('services.daily.max_participants', 2),
                    'exp' => time() + (config('services.daily.meeting_duration', 120) * 60),
                    'enable_screenshare' => config('services.daily.enable_screen_share', true),
                    'enable_knocking' => config('services.daily.enable_knocking', false),
                    'start_video_off' => config('services.daily.start_video_off', false),
                    'start_audio_off' => config('services.daily.start_audio_off', false),
                    'lang' => 'pl',
                ],
            ];
            
            
            $response = $this->client->post('rooms', [
                'json' => $requestData,
            ]);

            $responseBody = $response->getBody()->getContents();
            $roomData = json_decode($responseBody, true);
            
            // Log successful room creation
            \Illuminate\Support\Facades\Log::channel('meetings')->info('Room created successfully', [
                'lesson_id' => $lesson->id,
                'room_name' => $roomData['name'],
                'room_url' => $roomData['url'],
                'student_id' => $lesson->student_id,
                'tutor_id' => $lesson->tutor_id,
                'lesson_date' => $lesson->lesson_date->format('Y-m-d'),
                'lesson_time' => $lesson->start_time,
                'created_at' => $roomData['created_at']
            ]);
            
            return [
                'success' => true,
                'room_name' => $roomData['name'],
                'room_url' => $roomData['url'],
                'privacy' => $roomData['privacy'],
                'created_at' => $roomData['created_at'],
            ];
        } catch (GuzzleException $e) {
            $responseBody = null;
            if ($e->hasResponse()) {
                $responseBody = $e->getResponse()->getBody()->getContents();
            }
            
            Log::error('Daily.co room creation failed', [
                'lesson_id' => $lesson->id,
                'error' => $e->getMessage(),
                'response_body' => $responseBody,
                'status_code' => $e->hasResponse() ? $e->getResponse()->getStatusCode() : null
            ]);
            
            // Also log to meetings channel
            \Illuminate\Support\Facades\Log::channel('meetings')->error('Room creation failed', [
                'lesson_id' => $lesson->id,
                'error' => $e->getMessage(),
                'student_id' => $lesson->student_id,
                'tutor_id' => $lesson->tutor_id,
                'lesson_date' => $lesson->lesson_date->format('Y-m-d'),
                'lesson_time' => $lesson->start_time
            ]);
            
            return [
                'success' => false,
                'error' => 'Nie udało się utworzyć pokoju spotkania',
                'details' => $e->getMessage()
            ];
        }
    }

    /**
     * Generuje token dostępu dla użytkownika
     * 
     * @param User $user
     * @param string $roomName
     * @param bool $isModerator
     * @return string|null
     */
    public function generateMeetingToken(User $user, string $roomName, bool $isModerator = false): ?string
    {
        try {
            $response = $this->client->post('meeting-tokens', [
                'json' => [
                    'properties' => [
                        'room_name' => $roomName,
                        'user_name' => $user->name,
                        'user_id' => (string) $user->id,
                        'enable_screenshare' => $isModerator,
                        'enable_recording' => $isModerator && config('services.daily.enable_recording', false),
                        'is_owner' => $isModerator,
                        'exp' => time() + (config('services.daily.meeting_duration', 120) * 60),
                        'start_cloud_recording' => false,
                        'start_video_off' => !$isModerator && config('services.daily.start_video_off', false),
                        'start_audio_off' => !$isModerator && config('services.daily.start_audio_off', false),
                    ],
                ],
            ]);

            $tokenData = json_decode($response->getBody()->getContents(), true);
            
            // Log token generation
            \Illuminate\Support\Facades\Log::channel('meetings')->info('Meeting token generated', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_role' => $user->role,
                'room_name' => $roomName,
                'is_moderator' => $isModerator
            ]);
            
            return $tokenData['token'] ?? null;
        } catch (GuzzleException $e) {
            Log::error('Daily.co token generation failed', [
                'user_id' => $user->id,
                'room_name' => $roomName,
                'error' => $e->getMessage(),
            ]);
            
            // Also log to meetings channel
            \Illuminate\Support\Facades\Log::channel('meetings')->error('Token generation failed', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_role' => $user->role,
                'room_name' => $roomName,
                'error' => $e->getMessage()
            ]);
            
            return null;
        }
    }

    /**
     * Pobiera informacje o pokoju
     * 
     * @param string $roomName
     * @return array|null
     */
    public function getRoomInfo(string $roomName): ?array
    {
        try {
            $response = $this->client->get("rooms/{$roomName}");
            
            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            Log::error('Daily.co get room info failed', [
                'room_name' => $roomName,
                'error' => $e->getMessage(),
            ]);
            
            return null;
        }
    }

    /**
     * Usuwa pokój po zakończeniu lekcji
     * 
     * @param string $roomName
     * @return bool
     */
    public function deleteRoom(string $roomName): bool
    {
        try {
            $this->client->delete("rooms/{$roomName}");
            
            // Log successful room deletion
            \Illuminate\Support\Facades\Log::channel('meetings')->info('Room deleted successfully', [
                'room_name' => $roomName
            ]);
            
            return true;
        } catch (GuzzleException $e) {
            Log::error('Daily.co room deletion failed', [
                'room_name' => $roomName,
                'error' => $e->getMessage(),
            ]);
            
            // Also log to meetings channel
            \Illuminate\Support\Facades\Log::channel('meetings')->error('Room deletion failed', [
                'room_name' => $roomName,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }

    /**
     * Aktualizuje właściwości pokoju
     * 
     * @param string $roomName
     * @param array $properties
     * @return bool
     */
    public function updateRoomProperties(string $roomName, array $properties): bool
    {
        try {
            $this->client->post("rooms/{$roomName}", [
                'json' => [
                    'properties' => $properties,
                ],
            ]);
            
            return true;
        } catch (GuzzleException $e) {
            Log::error('Daily.co room update failed', [
                'room_name' => $roomName,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Pobiera aktywnych uczestników spotkania
     * 
     * @param string $roomName
     * @return array
     */
    public function getParticipants(string $roomName): array
    {
        try {
            $response = $this->client->get('presence', [
                'query' => [
                    'room' => $roomName,
                ],
            ]);
            
            $data = json_decode($response->getBody()->getContents(), true);
            
            return $data['data'] ?? [];
        } catch (GuzzleException $e) {
            Log::error('Daily.co get participants failed', [
                'room_name' => $roomName,
                'error' => $e->getMessage(),
            ]);
            
            return [];
        }
    }

    /**
     * Generuje unikalną nazwę pokoju dla lekcji
     * 
     * @param Lesson $lesson
     * @return string
     */
    private function generateRoomName(Lesson $lesson): string
    {
        return sprintf(
            'lesson-%d-%s-%s',
            $lesson->id,
            $lesson->lesson_date->format('Ymd'),
            substr(md5($lesson->id . $lesson->created_at), 0, 8)
        );
    }

    /**
     * Sprawdza czy pokój jest aktywny
     * 
     * @param string $roomName
     * @return bool
     */
    public function isRoomActive(string $roomName): bool
    {
        $roomInfo = $this->getRoomInfo($roomName);
        
        if (!$roomInfo) {
            return false;
        }
        
        // Sprawdź czy pokój nie wygasł
        $expiry = $roomInfo['config']['exp'] ?? 0;
        
        return $expiry > time();
    }

    /**
     * Sprawdza czy pokój jest pusty (brak aktywnych uczestników)
     * 
     * @param string $roomName
     * @return bool
     */
    public function isRoomEmpty(string $roomName): bool
    {
        $participants = $this->getParticipants($roomName);
        return empty($participants);
    }

    /**
     * Sprawdza czy pokój był pusty przez określony czas
     * 
     * @param string $roomName
     * @param int $emptyMinutes - ile minut pokój powinien być pusty
     * @return bool
     */
    public function hasRoomBeenEmpty(string $roomName, int $emptyMinutes = 10): bool
    {
        // Sprawdź obecny stan pokoju
        if (!$this->isRoomEmpty($roomName)) {
            return false;
        }
        
        // Znajdź lekcję dla tego pokoju
        $lesson = \App\Models\Lesson::where('meeting_room_name', $roomName)->first();
        if (!$lesson) {
            return false;
        }
        
        // Sprawdź czy wszyscy uczestnicy opuścili pokój więcej niż X minut temu
        $lastActiveSession = $lesson->meetingSessions()
            ->whereNotNull('left_at')
            ->orderBy('left_at', 'desc')
            ->first();
            
        if (!$lastActiveSession) {
            // Jeśli nie ma żadnych sesji z left_at, sprawdź czy są aktywne sesje
            $activeSessions = $lesson->meetingSessions()
                ->whereNull('left_at')
                ->count();
                
            return $activeSessions === 0;
        }
        
        // Sprawdź czy ostatnia osoba opuściła pokój więcej niż X minut temu
        return $lastActiveSession->left_at->diffInMinutes(now()) >= $emptyMinutes;
    }

    /**
     * Pobiera URL do nagrania (jeśli dostępne)
     * 
     * @param string $roomName
     * @return string|null
     */
    public function getRecordingUrl(string $roomName): ?string
    {
        try {
            $response = $this->client->get('recordings', [
                'query' => [
                    'room_name' => $roomName,
                ],
            ]);
            
            $data = json_decode($response->getBody()->getContents(), true);
            $recordings = $data['data'] ?? [];
            
            // Zwróć URL najnowszego nagrania
            if (!empty($recordings)) {
                return $recordings[0]['download_url'] ?? null;
            }
            
            return null;
        } catch (GuzzleException $e) {
            Log::error('Daily.co get recording failed', [
                'room_name' => $roomName,
                'error' => $e->getMessage(),
            ]);
            
            return null;
        }
    }
}