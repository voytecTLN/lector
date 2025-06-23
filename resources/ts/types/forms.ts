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
