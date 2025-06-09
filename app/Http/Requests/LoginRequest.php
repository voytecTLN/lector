<?php
// app/Http/Requests/LoginRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:1',
            'remember' => 'boolean'
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Email jest wymagany',
            'email.email' => 'Email musi być poprawny',
            'password.required' => 'Hasło jest wymagane'
        ];
    }
}
