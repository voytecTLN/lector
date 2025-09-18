<?php
// app/Http/Requests/CreateTutorRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use App\Models\TutorProfile;

class CreateTutorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'moderator']) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // User basic data
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => [
                'required',
                'string',
                'min:12',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~`]).+$/'
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive,blocked'],
            'account_source' => ['nullable', 'in:rejestracja,admin,import,api'],

            // Tutor profile data
            'languages' => ['required', 'array', 'min:1'],
            'languages.*' => ['required', 'string', 'in:' . implode(',', array_keys(TutorProfile::LANGUAGES))],
            'specializations' => ['required', 'array', 'min:1'],
            'specializations.*' => ['required', 'string', 'in:' . implode(',', array_keys(TutorProfile::SPECIALIZATIONS))],
            'description' => ['nullable', 'string', 'max:2000'],
            'years_experience' => ['required', 'integer', 'min:0', 'max:50'],
            'certifications' => ['nullable', 'array'],
            'certifications.*' => ['string', 'max:255'],
            'education' => ['nullable', 'array'],
            'education.*' => ['string', 'max:255'],
            'lesson_types' => ['nullable', 'array'],
            'lesson_types.*' => ['string', 'in:' . implode(',', array_keys(TutorProfile::LESSON_TYPES))],
            'weekly_availability' => ['nullable', 'array'],
            'is_accepting_students' => ['boolean'],
            'max_students_per_week' => ['nullable', 'integer', 'min:1', 'max:100'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'weekly_contract_limit' => ['required', 'integer', 'in:8,16,24,32,40'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Imię i nazwisko jest wymagane.',
            'name.max' => 'Imię i nazwisko nie może być dłuższe niż 255 znaków.',
            'email.required' => 'Email jest wymagany.',
            'email.email' => 'Email musi być prawidłowym adresem email.',
            'email.unique' => 'Ten adres email jest już zajęty.',
            'password.required' => 'Hasło jest wymagane.',
            'password.min' => 'Hasło musi mieć minimum 12 znaków.',
            'password.regex' => 'Hasło musi zawierać co najmniej: jedną małą literę, jedną wielką literę, jedną cyfrę i jeden znak specjalny.',
            'password.confirmed' => 'Potwierdzenie hasła się nie zgadza.',
            'phone.max' => 'Numer telefonu nie może być dłuższy niż 20 znaków.',
            'birth_date.date' => 'Data urodzenia musi być prawidłową datą.',
            'birth_date.before' => 'Data urodzenia musi być z przeszłości.',
            'city.max' => 'Miasto nie może być dłuższe niż 255 znaków.',
            'country.max' => 'Kraj nie może być dłuższy niż 255 znaków.',
            'status.required' => 'Status jest wymagany.',
            'status.in' => 'Status musi być jednym z: aktywny, nieaktywny, zablokowany.',
            
            'languages.required' => 'Należy wybrać co najmniej jeden język.',
            'languages.min' => 'Należy wybrać co najmniej jeden język.',
            'languages.*.in' => 'Wybrany język jest nieprawidłowy.',
            'specializations.required' => 'Należy wybrać co najmniej jedną specjalizację.',
            'specializations.min' => 'Należy wybrać co najmniej jedną specjalizację.',
            'specializations.*.in' => 'Wybrana specjalizacja jest nieprawidłowa.',
            'description.max' => 'Opis nie może być dłuższy niż 2000 znaków.',
            'years_experience.required' => 'Doświadczenie jest wymagane.',
            'years_experience.integer' => 'Doświadczenie musi być liczbą.',
            'years_experience.min' => 'Doświadczenie nie może być ujemne.',
            'years_experience.max' => 'Doświadczenie nie może być większe niż 50 lat.',
            'certifications.*.max' => 'Nazwa certyfikatu nie może być dłuższa niż 255 znaków.',
            'education.*.max' => 'Nazwa wykształcenia nie może być dłuższa niż 255 znaków.',
            'lesson_types.*.in' => 'Wybrany typ lekcji jest nieprawidłowy.',
            'max_students_per_week.integer' => 'Maksymalna liczba studentów musi być liczbą.',
            'max_students_per_week.min' => 'Maksymalna liczba studentów musi być większa niż 0.',
            'max_students_per_week.max' => 'Maksymalna liczba studentów nie może być większa niż 100.',
//             'hourly_rate.numeric' => 'Stawka godzinowa musi być liczbą.',
//             'hourly_rate.min' => 'Stawka godzinowa nie może być ujemna.',
//             'hourly_rate.max' => 'Stawka godzinowa nie może być większa niż 1000 zł.',
            'weekly_contract_limit.required' => 'Tygodniowy limit godzin jest wymagany.',
            'weekly_contract_limit.integer' => 'Tygodniowy limit godzin musi być liczbą.',
            'weekly_contract_limit.in' => 'Tygodniowy limit godzin musi być jednym z: 8, 16, 24, 32, 40.',
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'imię i nazwisko',
            'email' => 'email',
            'password' => 'hasło',
            'phone' => 'telefon',
            'birth_date' => 'data urodzenia',
            'city' => 'miasto',
            'country' => 'kraj',
            'status' => 'status',
            'languages' => 'języki',
            'specializations' => 'specjalizacje',
            'description' => 'opis',
            'years_experience' => 'doświadczenie',
            'certifications' => 'certyfikaty',
            'education' => 'wykształcenie',
            'lesson_types' => 'typy lekcji',
            'is_accepting_students' => 'przyjmowanie studentów',
            'max_students_per_week' => 'maksymalna liczba studentów tygodniowo',
            'hourly_rate' => 'stawka godzinowa',
            'weekly_contract_limit' => 'tygodniowy limit godzin',
        ];
    }
}