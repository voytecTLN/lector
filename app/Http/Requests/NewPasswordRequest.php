<?php
// app/Http/Requests/NewPasswordRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NewPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed'
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Email jest wymagany',
            'email.email' => 'Email musi być poprawny',
            'email.exists' => 'Nie znaleziono konta z tym adresem email',
            'token.required' => 'Token resetowania jest wymagany',
            'password.required' => 'Nowe hasło jest wymagane',
            'password.min' => 'Hasło musi mieć minimum 8 znaków',
            'password.confirmed' => 'Hasła muszą być identyczne'
        ];
    }
}
