<?php
// app/Http/Requests/RegisterRequest.php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => ['required', Rule::in([User::ROLE_STUDENT, User::ROLE_TUTOR])],
            'phone' => 'nullable|string|max:20',
            'city' => 'nullable|string|max:100',
            'terms_accepted' => 'required|accepted'
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Imię jest wymagane',
            'name.min' => 'Imię musi mieć minimum 2 znaki',
            'email.required' => 'Email jest wymagany',
            'email.unique' => 'Ten email jest już zajęty',
            'password.required' => 'Hasło jest wymagane',
            'password.min' => 'Hasło musi mieć minimum 8 znaków',
            'password.confirmed' => 'Hasła muszą być identyczne',
            'role.required' => 'Rola jest wymagana',
            'role.in' => 'Nieprawidłowa rola',
            'terms_accepted.accepted' => 'Musisz zaakceptować regulamin'
        ];
    }
}
