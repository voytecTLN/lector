<?php
// app/Http/Requests/UpdateStudentRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Adjust authorization logic as needed
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'sometimes|string|min:8|confirmed',
            'phone' => 'sometimes|string|max:20',
            'birth_date' => 'sometimes|date|before:today',
            'city' => 'sometimes|string|max:100',
            'country' => 'sometimes|string|max:100',
            'learning_languages' => 'sometimes|array',
            'learning_languages.*' => 'string|in:english,german,french,spanish,italian,portuguese,russian,chinese,japanese',
            'current_levels' => 'sometimes|array',
            'current_levels.*' => 'string|in:A1,A2,B1,B2,C1,C2',
            'learning_goals' => 'sometimes|array',
            'learning_goals.*' => 'string|in:conversation,business,exam,travel,academic',
            'preferred_schedule' => 'sometimes|array',
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
