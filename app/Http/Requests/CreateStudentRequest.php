<?php
// app/Http/Requests/CreateStudentRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add proper authorization logic
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date|before:today',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'learning_languages' => 'nullable|array',
            'learning_languages.*' => 'string|in:english,german,french,spanish,italian,portuguese,russian,chinese,japanese',
            'current_levels' => 'nullable|array',
            'current_levels.*' => 'string|in:A1,A2,B1,B2,C1,C2',
            'learning_goals' => 'nullable|array',
            'learning_goals.*' => 'string|in:conversation,business,exam,travel,academic',
            'preferred_schedule' => 'nullable|array'
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Imię jest wymagane',
            'name.max' => 'Imię może mieć maksymalnie 100 znaków',
            'email.required' => 'Email jest wymagany',
            'email.email' => 'Email musi być poprawny',
            'email.unique' => 'Ten email jest już zajęty',
            'password.min' => 'Hasło musi mieć minimum 8 znaków',
            'birth_date.before' => 'Data urodzenia musi być z przeszłości',
            'learning_languages.*.in' => 'Nieprawidłowy język nauki',
            'current_levels.*.in' => 'Nieprawidłowy poziom (A1-C2)',
        ];
    }
}
