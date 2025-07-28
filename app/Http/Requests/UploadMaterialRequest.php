<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadMaterialRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === 'tutor';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'student_id' => [
                'required', 
                'integer', 
                Rule::exists('users', 'id')->where(function ($query) {
                    $query->where('role', 'student');
                })
            ],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'file' => [
                'required',
                'file',
                'max:10240', // 10MB in KB
                'mimes:jpg,jpeg,png,pdf,doc,docx'
            ]
        ];
    }

    /**
     * Get custom error messages
     */
    public function messages(): array
    {
        return [
            'file.max' => 'The file size must not exceed 10MB.',
            'file.mimes' => 'Only JPG, JPEG, PNG, PDF, DOC, and DOCX files are allowed.',
            'student_id.exists' => 'The selected student does not exist.',
            'lesson_id.exists' => 'The selected lesson does not exist.',
        ];
    }
}