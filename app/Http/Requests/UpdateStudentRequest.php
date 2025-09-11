<?php
// app/Http/Requests/UpdateStudentRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Admin/moderator może edytować każdego
        if ($this->user()->hasAnyRole(['admin', 'moderator'])) {
            return true;
        }

        // Student może edytować tylko siebie
        if ($this->user()->hasRole('student')) {
            // Dla route /student/profile nie ma parametru id, więc student może edytować swój profil
            if ($this->routeIs('api.student.profile.update')) {
                return true;
            }
            // Dla route /students/{id} sprawdzamy czy id = user id
            return $this->route('id') == $this->user()->id;
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $studentId = $this->route('id') ?? $this->route('student');

        return [
            // Dane podstawowe - OPCJONALNE przy update
            'name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\pL\s\-\.]+$/u'
            ],
            'email' => [
                'sometimes',
                'required',
                'email:rfc,dns',
                'max:255',
                Rule::unique('users', 'email')->ignore($studentId)
            ],
            'password' => [
                'sometimes',
                'nullable',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->uncompromised()
            ],
            'password_confirmation' => 'required_with:password|string|same:password',

            // Status - tylko dla admin/moderator
            'status' => [
                'sometimes',
                'string',
                Rule::in(['active', 'inactive', 'blocked']),
                Rule::requiredIf(fn() => $this->user()->hasAnyRole(['admin', 'moderator']))
            ],

            // Dane kontaktowe
            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'regex:/^[\+]?[0-9\s\-\(\)]+$/',
                'min:9',
                'max:20'
            ],
            'birth_date' => [
                'sometimes',
                'nullable',
                'date',
                'before:today',
                'after:' . now()->subYears(100)->format('Y-m-d')
            ],
            'city' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                'regex:/^[\pL\s\-]+$/u'
            ],
            'country' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                'in:Polska,Poland,Niemcy,Germany,Francja,France,Hiszpania,Spain,Włochy,Italy'
            ],

            // Dane edukacyjne
            'learning_languages' => [
                'sometimes',
                'nullable',
                'array',
                'max:5'
            ],
            'learning_languages.*' => [
                'string',
                'distinct',
                'in:english,german,french,spanish,italian,portuguese,russian,chinese,japanese,polish'
            ],
            'current_levels' => [
                'sometimes',
                'nullable',
                'array'
            ],
            'current_levels.*' => [
                'string',
                'in:A1,A2,B1,B2,C1,C2'
            ],
            'learning_goals' => [
                'sometimes',
                'nullable',
                'array',
                'max:8'  // Allow all 8 available options
            ],
            'learning_goals.*' => [
                'string',
                'distinct',
                'in:conversation,business,exam,travel,academic,hobby,culture,career'
            ],
            'preferred_schedule' => [
                'sometimes',
                'nullable',
                'array'
            ],
            'preferred_schedule.*.day' => [
                'required_with:preferred_schedule.*',
                'string',
                'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'
            ],
            'preferred_schedule.*.from' => [
                'required_with:preferred_schedule.*',
                'date_format:H:i'
            ],
            'preferred_schedule.*.to' => [
                'required_with:preferred_schedule.*',
                'date_format:H:i',
                'after:preferred_schedule.*.from'
            ],

            // Dodatkowe
            'notes' => [
                'sometimes',
                'nullable',
                'string',
                'max:500'
            ],
            'bio' => [
                'sometimes',
                'nullable',
                'string',
                'max:1000'
            ],
            
            // Profile picture
            'profile_picture' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpeg,png,jpg,gif',
                'max:5120' // 5MB max
            ],

            // Package assignment
            'package_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:packages,id'
            ]
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            // Używamy tych samych komunikatów co w CreateStudentRequest
            'name.required' => 'Imię i nazwisko jest wymagane.',
            'name.min' => 'Imię i nazwisko musi mieć minimum :min znaki.',
            'name.max' => 'Imię i nazwisko może mieć maksymalnie :max znaków.',
            'name.regex' => 'Imię i nazwisko może zawierać tylko litery, spacje, myślniki i kropki.',

            'email.required' => 'Adres email jest wymagany.',
            'email.email' => 'Adres email musi być prawidłowy.',
            'email.unique' => 'Ten adres email jest już zajęty.',

            'password.min' => 'Hasło musi mieć minimum :min znaków.',
            'password.mixed' => 'Hasło musi zawierać małe i duże litery.',
            'password.numbers' => 'Hasło musi zawierać przynajmniej jedną cyfrę.',
            'password.uncompromised' => 'To hasło zostało wykryte w wyciekach danych. Wybierz inne.',

            'password_confirmation.required_with' => 'Potwierdzenie hasła jest wymagane przy zmianie hasła.',
            'password_confirmation.same' => 'Hasła muszą być identyczne.',

            'status.in' => 'Nieprawidłowy status. Dozwolone: aktywny, nieaktywny, zablokowany.',
            'status.required' => 'Status jest wymagany.',

            // Reszta komunikatów jak w CreateStudentRequest
            'phone.regex' => 'Numer telefonu może zawierać tylko cyfry, spacje, myślniki i nawiasy.',
            'birth_date.before' => 'Data urodzenia musi być z przeszłości.',
            'city.regex' => 'Nazwa miasta może zawierać tylko litery, spacje i myślniki.',
            'learning_languages.*.in' => 'Nieprawidłowy język nauki.',
            'current_levels.*.in' => 'Nieprawidłowy poziom języka.',
            'learning_goals.*.in' => 'Nieprawidłowy cel nauki.',
            'notes.max' => 'Notatki mogą mieć maksymalnie :max znaków.',
            'bio.max' => 'Opis może mieć maksymalnie :max znaków.',
        ];
    }

    /**
     * Get custom attribute names.
     */
    public function attributes(): array
    {
        return [
            'name' => 'imię i nazwisko',
            'email' => 'adres email',
            'password' => 'hasło',
            'password_confirmation' => 'potwierdzenie hasła',
            'status' => 'status',
            'phone' => 'numer telefonu',
            'birth_date' => 'data urodzenia',
            'city' => 'miasto',
            'country' => 'kraj',
            'learning_languages' => 'języki nauki',
            'current_levels' => 'poziomy językowe',
            'learning_goals' => 'cele nauki',
            'preferred_schedule' => 'preferowany harmonogram',
            'notes' => 'notatki',
            'bio' => 'opis',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Usuń puste wartości (przy update wysyłamy tylko zmienione pola)
        $data = array_filter($this->all(), function ($value) {
            return $value !== null && $value !== '';
        });

        $this->replace($data);

        // Trim whitespace and fix encoding
        $fieldsToTrim = ['name', 'email', 'phone', 'city', 'country', 'notes', 'bio'];

        foreach ($fieldsToTrim as $field) {
            if ($this->has($field)) {
                $value = $this->input($field);
                // Fix UTF-8 encoding if needed
                if (!mb_check_encoding($value, 'UTF-8')) {
                    $value = mb_convert_encoding($value, 'UTF-8', 'auto');
                }
                $this->merge([
                    $field => trim($value)
                ]);
            }
        }

        // Normalizuj numer telefonu
        if ($this->has('phone') && $this->input('phone')) {
            $phone = preg_replace('/\s+/', '', $this->input('phone'));
            $this->merge(['phone' => $phone]);
        }
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Dodatkowa walidacja dla statusu
            if ($this->has('status') && !$this->user()->hasAnyRole(['admin', 'moderator'])) {
                $validator->errors()->add('status', 'Nie masz uprawnień do zmiany statusu.');
            }

            // Sprawdź czy student nie próbuje zmienić swojego emaila na zajęty
            if ($this->has('email') && $this->user()->hasRole('student')) {
                $existingUser = \App\Models\User::where('email', $this->email)
                    ->where('id', '!=', $this->route('id'))
                    ->first();

                if ($existingUser) {
                    $validator->errors()->add('email', 'Ten adres email jest już zajęty.');
                }
            }
        });
    }
}