// resources/ts/types/auth.ts - Zgodne z Laravel backend

// Podstawowe interfejsy do logowania/rejestracji
export interface LoginCredentials {
    email: string
    password: string
    remember?: boolean
}

export interface RegisterData {
    name: string
    email: string
    password: string
    password_confirmation: string
    role: 'student' | 'tutor'
    phone?: string
    city?: string
    terms_accepted: boolean
}

export interface PasswordResetData {
    email: string
}

export interface NewPasswordData {
    token: string
    password: string
    password_confirmation: string
}

// Model użytkownika - zgodny z Laravel
export interface AuthUser {
    id: number
    name: string
    email: string
    role: 'admin' | 'moderator' | 'tutor' | 'student'
    phone?: string
    birth_date?: string
    city?: string
    country?: string
    status: 'active' | 'inactive' | 'blocked'
    avatar?: string
    email_verified_at: string | null
    created_at: string
    updated_at: string
    studentProfile?: StudentProfile
    tutor_profile?: TutorProfile
}

// Typy odpowiedzi z API
export interface AuthResponse {
    success: boolean
    message?: string
    data: {
        user: AuthUser
        token: string
        permissions: string[]
        requires_verification?: boolean
    }
}

export interface ApiResponse<T = any> {
    success: boolean
    message?: string
    data: T
}

export interface CurrentUserResponse {
    success: boolean
    data: {
        user: AuthUser
        permissions: string[]
    }
}

export interface AuthError {
    success: false
    message: string
    errors?: Record<string, string[]>
}

// Profile
export interface StudentProfile {
    id: number
    user_id: number
    learning_languages: string[]
    current_levels: Record<string, string>
    learning_goals: string[]
    preferred_schedule: Record<string, any>
    created_at: string
    updated_at: string
}

export interface TutorProfile {
    id: number
    user_id: number
    description?: string
    years_experience?: number
    hourly_rate?: number
    weekly_contract_limit?: number
    languages?: string[]
    specializations?: string[]
    lesson_types?: string[]
    certifications?: string[]
    education?: string[]
    is_accepting_students?: boolean
    max_students_per_week?: number
    created_at: string
    updated_at: string
}

// Re-export dla kompatybilności
export type User = AuthUser

// Event types
export interface AuthChangeEventDetail {
    type: 'login' | 'logout' | 'register'
    user: AuthUser | null
    isAuthenticated: boolean
}

// Tylko używane role constants
export const USER_ROLES = {
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    TUTOR: 'tutor',
    STUDENT: 'student'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
