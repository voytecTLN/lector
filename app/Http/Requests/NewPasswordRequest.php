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
            'password' => [
                'required',
                'string',
                'min:12',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~`]).+$/'
            ]
        ];
    }

    public function messages(): array
    {
        return [
            'token.required' => 'Token resetowania jest wymagany',
            'password.required' => 'Nowe hasło jest wymagane',
            'password.min' => 'Hasło musi mieć co najmniej 12 znaków',
            'password.confirmed' => 'Hasła muszą być identyczne',
            'password.regex' => 'Hasło musi zawierać co najmniej: jedną małą literę, jedną wielką literę, jedną cyfrę i jeden znak specjalny'
        ];
    }
}
