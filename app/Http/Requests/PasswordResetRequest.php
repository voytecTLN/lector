<?php
// app/Http/Requests/PasswordResetRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PasswordResetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|exists:users,email'
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Email jest wymagany',
            'email.email' => 'Email musi być poprawny',
            'email.exists' => 'Nie znaleziono konta z tym adresem email'
        ];
    }
}
