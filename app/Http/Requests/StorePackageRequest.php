<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePackageRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'price' => 'required|numeric|min:0',
            'hours_count' => 'required|integer|min:1',
            'validity_days' => 'required|integer|min:1',
            'description' => 'nullable|string|max:1000',
            'sort_order' => 'nullable|integer|min:0',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/'
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
            'name.required' => 'Nazwa pakietu jest wymagana',
            'name.string' => 'Nazwa pakietu musi być tekstem',
            'name.max' => 'Nazwa pakietu nie może być dłuższa niż 255 znaków',
            
            'is_active.boolean' => 'Status aktywności musi być wartością logiczną',
            
            'price.required' => 'Cena pakietu jest wymagana',
            'price.numeric' => 'Cena musi być liczbą',
            'price.min' => 'Cena nie może być ujemna',
            
            'hours_count.required' => 'Liczba godzin jest wymagana',
            'hours_count.integer' => 'Liczba godzin musi być liczbą całkowitą',
            'hours_count.min' => 'Liczba godzin musi być większa niż 0',
            
            'validity_days.required' => 'Okres ważności jest wymagany',
            'validity_days.integer' => 'Okres ważności musi być liczbą całkowitą',
            'validity_days.min' => 'Okres ważności musi być większy niż 0',
            
            'description.string' => 'Opis musi być tekstem',
            'description.max' => 'Opis nie może być dłuższy niż 1000 znaków',
            
            'sort_order.integer' => 'Kolejność sortowania musi być liczbą całkowitą',
            'sort_order.min' => 'Kolejność sortowania nie może być ujemna',
            
            'color.string' => 'Kolor musi być tekstem',
            'color.max' => 'Kolor nie może być dłuższy niż 7 znaków',
            'color.regex' => 'Kolor musi być w formacie HEX (np. #FF5733)'
        ];
    }
}