export interface StudentFormData {
    name: string
    email: string
    password?: string
    password_confirmation?: string
    phone?: string
    birth_date?: string
    city?: string
    country?: string
    learning_languages?: string[]
    current_levels?: Record<string, string>
    learning_goals?: string[]
    preferred_schedule?: Record<string, any>
}

export interface TutorFormData {
    name: string
    email: string
    password?: string
    password_confirmation?: string
    phone?: string
    city?: string
    languages?: string[]
    specializations?: string[]
    weekly_availability?: Record<string, any>
    description?: string
    hourly_rate?: number
}

export interface LessonFormData {
    student_id: number
    tutor_id: number
    date: string
    time_start: string
    time_end: string
    language: string
    level: string
    topic?: string
    notes?: string
}

export interface FormValidationRules {
    [fieldName: string]: string // Laravel-style validation rules
}

export interface FormErrors {
    [fieldName: string]: string[]
}

// Common validation rules
export const STUDENT_VALIDATION_RULES: FormValidationRules = {
    name: 'required|min:2',
    email: 'required|email',
    password: 'required|min:8',
    phone: 'phone',
    birth_date: 'birth_date'
}

export const TUTOR_VALIDATION_RULES: FormValidationRules = {
    name: 'required|min:2',
    email: 'required|email',
    password: 'required|min:8',
    phone: 'phone',
    hourly_rate: 'required'
}

export const LESSON_VALIDATION_RULES: FormValidationRules = {
    student_id: 'required',
    tutor_id: 'required',
    date: 'required',
    time_start: 'required',
    time_end: 'required',
    language: 'required'
}