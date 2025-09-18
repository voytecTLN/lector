<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\StudentAccountCreated;
use App\Models\User;
use App\Models\StudentProfile;
use App\Services\StudentService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class ExternalStudentController extends Controller
{
    public function __construct(
        private StudentService $studentService
    ) {
        // Rate limiting dla API - bardziej restrykcyjne
        $this->middleware('throttle:10,1')->only('store');
    }

    /**
     * Utwórz nowego studenta z zewnętrznej platformy
     */
    public function store(Request $request): JsonResponse
    {
        // Loguj wszystkie requesty do osobnego pliku
        Log::channel('api')->info('🔗 External API Request - Create Student', [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()->toISOString(),
            'request_data' => $request->except(['password']), // Bez hasła w logach
        ]);

        try {
            // Walidacja danych wejściowych
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'phone' => 'nullable|string|max:20',
                'birth_date' => 'nullable|date|before:today',
                'city' => 'nullable|string|max:100',
                'country' => 'nullable|string|max:100',
                'learning_languages' => 'nullable|array',
                'learning_languages.*' => 'string|in:english,german,spanish,french,italian,portuguese,russian,chinese',
                'learning_goals' => 'nullable|array',
                'learning_goals.*' => 'string|in:business,conversation,exam,travel,academic,grammar,pronunciation',
                'current_levels' => 'nullable|array',
                'preferred_schedule' => 'nullable|array',
                'accept_terms' => 'required|boolean|accepted', // Musi być true
            ], [
                'name.required' => 'Imię i nazwisko jest wymagane',
                'email.required' => 'Adres email jest wymagany',
                'email.email' => 'Podaj prawidłowy adres email',
                'email.unique' => 'Użytkownik z tym adresem email już istnieje',
                'accept_terms.required' => 'Akceptacja regulaminu jest wymagana',
                'accept_terms.accepted' => 'Musisz zaakceptować regulamin',
            ]);

            if ($validator->fails()) {
                Log::channel('api')->warning('❌ External API Validation Failed', [
                    'errors' => $validator->errors(),
                    'email' => $request->input('email'),
                    'ip' => $request->ip(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Błędne dane wejściowe',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Utwórz studenta z źródłem 'api'
            $userData = [
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'password' => Hash::make(str()->random(32)), // Losowe hasło, zostanie zmienione przez email
                'role' => User::ROLE_STUDENT,
                'phone' => $request->input('phone'),
                'birth_date' => $request->input('birth_date'),
                'city' => $request->input('city'),
                'country' => $request->input('country'),
                'status' => User::STATUS_ACTIVE,
                'account_source' => User::SOURCE_API,
                // Automatycznie zaakceptowany regulamin (został zaakceptowany w źródłowej platformie)
                'terms_accepted' => true,
                'terms_accepted_at' => Carbon::now(),
            ];

            $user = User::create($userData);

            // Utwórz profil studenta jeśli podano dane
            if ($request->has(['learning_languages', 'learning_goals', 'current_levels', 'preferred_schedule'])) {
                StudentProfile::create([
                    'user_id' => $user->id,
                    'learning_languages' => $request->input('learning_languages', []),
                    'current_levels' => json_encode($request->input('current_levels', [])),
                    'learning_goals' => $request->input('learning_goals', []),
                    'preferred_schedule' => json_encode($request->input('preferred_schedule', []))
                ]);
            }

            // Wygeneruj token do ustawienia hasła
            $resetToken = $user->generatePasswordResetToken();

            // Wyślij email z linkiem do ustawienia hasła
            try {
                Mail::to($user->email)->send(new StudentAccountCreated($user, $resetToken));
                
                Log::channel('api')->info('✅ Student created successfully via API', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'source' => 'api',
                    'email_sent' => true,
                ]);
            } catch (\Exception $emailError) {
                Log::channel('api')->error('📧 Failed to send email after student creation', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $emailError->getMessage(),
                ]);
                
                // Student został utworzony, ale email się nie wysłał - nie przerywamy
            }

            return response()->json([
                'success' => true,
                'message' => 'Student został utworzony pomyślnie',
                'data' => [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::channel('api')->error('💥 External API Error - Student Creation Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'email' => $request->input('email'),
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Wystąpił błąd podczas tworzenia konta studenta'
            ], 500);
        }
    }
}
