<?php
// app/Http/Requests/CreateStudentRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class CreateStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Sprawdź czy użytkownik ma odpowiednią rolę
        return $this->user() && $this->user()->hasAnyRole(['admin', 'moderator']);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // Dane podstawowe - WYMAGANE
            'name' => [
                'required',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\pL\s\-\.]+$/u' // Tylko litery, spacje, myślniki i kropki
            ],
            'email' => [
                'required',
                'email:rfc,dns',
                'max:255',
                'unique:users,email'
            ],
            'password' => [
                'required',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->uncompromised()
            ],
            'password_confirmation' => 'required|string|same:password',
            
            // Dane kontaktowe - OPCJONALNE
            'phone' => [
                'nullable',
                'string',
                'regex:/^[\+]?[0-9\s\-\(\)]+$/',
                'min:9',
                'max:20'
            ],
            'birth_date' => [
                'nullable',
                'date',
                'before:today',
                'after:' . now()->subYears(100)->format('Y-m-d') // Max 100 lat
            ],
            'city' => [
                'nullable',
                'string',
                'max:100',
                'regex:/^[\pL\s\-]+$/u'
            ],
            'country' => [
                'nullable',
                'string',
                'max:100',
                'in:Polska,Poland,Niemcy,Germany,Francja,France,Hiszpania,Spain,Włochy,Italy'
            ],
            
            // Dane edukacyjne - OPCJONALNE
            'learning_languages' => [
                'nullable',
                'array',
                'max:5' // Maksymalnie 5 języków
            ],
            'learning_languages.*' => [
                'string',
                'distinct',
                'in:english,german,french,spanish,italian,portuguese,russian,chinese,japanese,polish'
            ],
            'current_levels' => [
                'nullable',
                'array'
            ],
            'current_levels.*' => [
                'string',
                'in:A1,A2,B1,B2,C1,C2'
            ],
            'learning_goals' => [
                'nullable',
                'array',
                'max:5'
            ],
            'learning_goals.*' => [
                'string',
                'distinct',
                'in:conversation,business,exam,travel,academic,hobby,culture'
            ],
            'preferred_schedule' => [
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
            
            // MVP Placeholder - na razie ignorujemy
            'initial_package' => [
                'nullable',
                'array'
            ],
            'initial_package.hours' => [
                'nullable',
                'integer',
                'min:1',
                'max:100'
            ],
            'initial_package.expires_at' => [
                'nullable',
                'date',
                'after:today'
            ],
            
            // Dodatkowe
            'notes' => [
                'nullable',
                'string',
                'max:500'
            ],
            'source' => [
                'nullable',
                'string',
                'in:website,referral,social_media,advertisement,other'
            ]
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            // Dane podstawowe
            'name.required' => 'Imię i nazwisko jest wymagane.',
            'name.min' => 'Imię i nazwisko musi mieć minimum :min znaki.',
            'name.max' => 'Imię i nazwisko może mieć maksymalnie :max znaków.',
            'name.regex' => 'Imię i nazwisko może zawierać tylko litery, spacje, myślniki i kropki.',
            
            'email.required' => 'Adres email jest wymagany.',
            'email.email' => 'Adres email musi być prawidłowy.',
            'email.unique' => 'Ten adres email jest już zajęty.',
            'email.max' => 'Adres email może mieć maksymalnie :max znaków.',
            
            'password.required' => 'Hasło jest wymagane.',
            'password.min' => 'Hasło musi mieć minimum :min znaków.',
            'password.mixed' => 'Hasło musi zawierać małe i duże litery.',
            'password.numbers' => 'Hasło musi zawierać przynajmniej jedną cyfrę.',
            'password.uncompromised' => 'To hasło zostało wykryte w wyciekach danych. Wybierz inne.',
            
            'password_confirmation.required' => 'Potwierdzenie hasła jest wymagane.',
            'password_confirmation.same' => 'Hasła muszą być identyczne.',
            
            // Dane kontaktowe
            'phone.regex' => 'Numer telefonu może zawierać tylko cyfry, spacje, myślniki i nawiasy.',
            'phone.min' => 'Numer telefonu musi mieć minimum :min znaków.',
            'phone.max' => 'Numer telefonu może mieć maksymalnie :max znaków.',
            
            'birth_date.date' => 'Data urodzenia musi być prawidłową datą.',
            'birth_date.before' => 'Data urodzenia musi być z przeszłości.',
            'birth_date.after' => 'Data urodzenia nie może być starsza niż 100 lat.',
            
            'city.max' => 'Nazwa miasta może mieć maksymalnie :max znaków.',
            'city.regex' => 'Nazwa miasta może zawierać tylko litery, spacje i myślniki.',
            
            'country.in' => 'Wybierz kraj z dostępnej listy.',
            
            // Dane edukacyjne
            'learning_languages.array' => 'Języki nauki muszą być tablicą.',
            'learning_languages.max' => 'Możesz wybrać maksymalnie :max języków.',
            'learning_languages.*.in' => 'Nieprawidłowy język nauki.',
            'learning_languages.*.distinct' => 'Każdy język może być wybrany tylko raz.',
            
            'current_levels.*.in' => 'Nieprawidłowy poziom języka. Dozwolone: A1, A2, B1, B2, C1, C2.',
            
            'learning_goals.max' => 'Możesz wybrać maksymalnie :max celów nauki.',
            'learning_goals.*.in' => 'Nieprawidłowy cel nauki.',
            'learning_goals.*.distinct' => 'Każdy cel może być wybrany tylko raz.',
            
            'preferred_schedule.*.day.in' => 'Nieprawidłowy dzień tygodnia.',
            'preferred_schedule.*.from.date_format' => 'Godzina początkowa musi być w formacie HH:MM.',
            'preferred_schedule.*.to.date_format' => 'Godzina końcowa musi być w formacie HH:MM.',
            'preferred_schedule.*.to.after' => 'Godzina końcowa musi być późniejsza niż początkowa.',
            
            // Dodatkowe
            'notes.max' => 'Notatki mogą mieć maksymalnie :max znaków.',
            'source.in' => 'Nieprawidłowe źródło pozyskania.',
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
            'phone' => 'numer telefonu',
            'birth_date' => 'data urodzenia',
            'city' => 'miasto',
            'country' => 'kraj',
            'learning_languages' => 'języki nauki',
            'current_levels' => 'poziomy językowe',
            'learning_goals' => 'cele nauki',
            'preferred_schedule' => 'preferowany harmonogram',
            'notes' => 'notatki',
            'source' => 'źródło',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Usuń białe znaki z początku i końca
        $fieldsToTrim = ['name', 'email', 'phone', 'city', 'country', 'notes'];
        
        foreach ($fieldsToTrim as $field) {
            if ($this->has($field)) {
                $this->merge([
                    $field => trim($this->input($field))
                ]);
            }
        }

        // Normalizuj numer telefonu
        if ($this->has('phone') && $this->input('phone')) {
            $phone = preg_replace('/\s+/', '', $this->input('phone'));
            $this->merge(['phone' => $phone]);
        }

        // Ustaw domyślny kraj jeśli nie podano
        if (!$this->has('country') || !$this->input('country')) {
            $this->merge(['country' => 'Polska']);
        }
    }
}