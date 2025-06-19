// resources/ts/types/auth.ts - Zgodne z Laravel backend
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

// Zgodne z Laravel User model
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
}

// Zgodne z Laravel AuthController responses
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

// Zgodne z Laravel models
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

// Re-export User type for compatibility
export type User = AuthUser

// Auth event types
export interface AuthChangeEventDetail {
    type: 'login' | 'logout' | 'register'
    user: AuthUser | null
    isAuthenticated: boolean
}

// Form validation types (unchanged)
export interface LoginFormData {
    email: string
    password: string
    remember: boolean
}

export interface RegisterFormData {
    name: string
    email: string
    password: string
    password_confirmation: string
    role: 'student' | 'tutor'
    phone: string
    city: string
    terms_accepted: boolean
}

export interface ForgotPasswordFormData {
    email: string
}

export interface ResetPasswordFormData {
    password: string
    password_confirmation: string
}

export interface ChangePasswordFormData {
    current_password: string
    new_password: string
    new_password_confirmation: string
}

// Role and permission constants (unchanged)
export const USER_ROLES = {
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    TUTOR: 'tutor',
    STUDENT: 'student'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

export const USER_PERMISSIONS = {
    MANAGE_USERS: 'manage_users',
    MANAGE_CONTENT: 'manage_content',
    MANAGE_LESSONS: 'manage_lessons',
    VIEW_ANALYTICS: 'view_analytics',
    SYSTEM_SETTINGS: 'system_settings',
    CAN_TEACH: 'can_teach',
    MANAGE_OWN_LESSONS: 'manage_own_lessons',
    VIEW_OWN_ANALYTICS: 'view_own_analytics',
    CAN_LEARN: 'can_learn',
    BOOK_LESSONS: 'book_lessons',
    VIEW_OWN_PROGRESS: 'view_own_progress',
    PROFILE_UPDATE: 'profile:update',
    USERS_READ: 'users:read',
    TUTORS_READ: 'tutors:read',
    STUDENTS_READ: 'students:read'
} as const

export type UserPermission = typeof USER_PERMISSIONS[keyof typeof USER_PERMISSIONS]

export interface RouteGuardConfig {
    requiresAuth?: boolean
    requiresVerification?: boolean
    roles?: UserRole[]
    permissions?: UserPermission[]
    redirectTo?: string
}