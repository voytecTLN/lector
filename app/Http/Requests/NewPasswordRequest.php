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
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed'
        ];
    }

    public function messages(): array
    {
        return [
            'token.required' => 'Token resetowania jest wymagany',
            'password.required' => 'Nowe hasło jest wymagane',
            'password.min' => 'Hasło musi mieć minimum 8 znaków',
            'password.confirmed' => 'Hasła muszą być identyczne'
        ];
    }
}
