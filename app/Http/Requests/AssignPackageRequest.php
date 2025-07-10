<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignPackageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'student_id' => 'required|integer|exists:users,id',
            'package_id' => 'required|integer|exists:packages,id',
            'notes' => 'nullable|string|max:1000'
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'student_id.required' => 'Identyfikator studenta jest wymagany',
            'student_id.integer' => 'Identyfikator studenta musi być liczbą',
            'student_id.exists' => 'Wybrany student nie istnieje',
            
            'package_id.required' => 'Identyfikator pakietu jest wymagany',
            'package_id.integer' => 'Identyfikator pakietu musi być liczbą',
            'package_id.exists' => 'Wybrany pakiet nie istnieje',
            
            'notes.string' => 'Notatki muszą być tekstem',
            'notes.max' => 'Notatki nie mogą być dłuższe niż 1000 znaków'
        ];
    }
}