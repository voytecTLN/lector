// resources/ts/types/student.ts

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'tutor' | 'student'
  phone?: string
  birth_date?: string
  city?: string
  country?: string
  status?: 'active' | 'inactive' | 'blocked'
  avatar?: string
  created_at?: string
  updated_at?: string
}

// Add missing interfaces
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

export interface CreateStudentRequest {
  name: string
  email: string
  password?: string
  phone?: string
  birth_date?: string
  city?: string
  country?: string
  learning_languages?: string[]
  current_levels?: Record<string, string>
  learning_goals?: string[]
  preferred_schedule?: Record<string, any>
}

export interface UpdateStudentRequest {
  name?: string
  email?: string
  phone?: string
  birth_date?: string
  city?: string
  country?: string
  learning_languages?: string[]
  current_levels?: Record<string, string>
  learning_goals?: string[]
  preferred_schedule?: Record<string, any>
}

export interface StudentFilters {
  status?: 'active' | 'inactive' | 'blocked'
  city?: string
  learning_language?: string
  search?: string
  per_page?: number
  page?: number
}

export interface LearningGoal {
  type: 'conversation' | 'business' | 'exam' | 'travel' | 'academic'
  level: 'beginner' | 'intermediate' | 'advanced'
  priority: 'high' | 'medium' | 'low'
  deadline?: string
}

export interface PaginatedResponse<T> {
  data: T
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export class ValidationError extends Error {
  public errors: Record<string, string[]>

  constructor(errors: Record<string, string[]>, message: string = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
  }

  // Helper method to get first error for a field
  getFirstError(field: string): string | null {
    if (this.errors[field] && this.errors[field].length > 0) {
      return this.errors[field][0]
    }
    return null
  }

  // Helper method to get all errors as flat array
  getAllErrors(): string[] {
    return Object.values(this.errors).flat()
  }

  // Helper method to check if field has error
  hasError(field: string): boolean {
    return !!(this.errors[field] && this.errors[field].length > 0)
  }
}

// API Response types
export interface ApiErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
}

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}