<?php
// app/Http/Requests/CreateAdminRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class CreateAdminRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive,blocked'],
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
            'password.confirmed' => 'Potwierdzenie hasła się nie zgadza.',
            'phone.max' => 'Numer telefonu nie może być dłuższy niż 20 znaków.',
            'birth_date.date' => 'Data urodzenia musi być prawidłową datą.',
            'birth_date.before' => 'Data urodzenia musi być z przeszłości.',
            'city.max' => 'Miasto nie może być dłuższe niż 255 znaków.',
            'country.max' => 'Kraj nie może być dłuższy niż 255 znaków.',
            'status.required' => 'Status jest wymagany.',
            'status.in' => 'Status musi być jednym z: aktywny, nieaktywny, zablokowany.',
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
        ];
    }
}