<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StudentFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|min:2|max:50',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|regex:/^[0-9+\-\s()]+$/',
            'birth_date' => 'nullable|date|after:-90 years',
            'city' => 'nullable|string|max:100',
            'learning_languages' => 'nullable|array|max:5',
            'package_hours' => 'required|numeric|min:1|max:100',
            'package_expires' => 'nullable|date|after:today'
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Imię jest wymagane',
            'email.required' => 'Email jest wymagany',
            'email.unique' => 'Ten email jest już zajęty',
            'password.min' => 'Hasło musi mieć minimum 8 znaków',
        ];
    }
}