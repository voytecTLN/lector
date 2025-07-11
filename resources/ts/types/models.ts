export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'tutor' | 'student'
  phone?: string
  birth_date?: string
  city?: string
  country?: string
  status?: 'active' | 'inactive' | 'blocked' | 'unverified'
  avatar?: string
  created_at?: string
  updated_at?: string
  email_verified_at?: string
  last_login_at?: string
  last_login_ip?: string
  student_profile: StudentProfile
  active_package_assignments?: PackageAssignment[]
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
  password_confirmation?: string
  phone?: string
  birth_date?: string
  city?: string
  country?: string
  learning_languages?: string[]
  current_levels?: Record<string, string>
  learning_goals?: string[]
  preferred_schedule?: Record<string, any>
  status: 'active' | 'inactive' | 'blocked' | 'unverified'
  package_id?: number
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
  status: 'active' | 'inactive' | 'blocked' | 'unverified'
  package_id?: number
}

export interface StudentFilters {
  status?: 'active' | 'inactive' | 'blocked' | 'unverified'
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

export interface Package {
  id: number
  name: string
  is_active: boolean
  price: number
  hours_count: number
  validity_days: number
  description?: string
  sort_order?: number
  color?: string
  formatted_price: string
  display_name: string
  created_at: string
  updated_at: string
  deleted_at?: string
  assignments?: PackageAssignment[]
}

export interface PackageAssignment {
  id: number
  student_id: number
  package_id: number
  assigned_at: string
  expires_at: string
  hours_remaining: number
  is_active: boolean
  notes?: string
  status: 'active' | 'inactive' | 'expired' | 'exhausted'
  days_remaining: number
  student?: User
  package?: Package
  created_at: string
  updated_at: string
}

export interface PackageFilters {
  status?: 'active' | 'inactive'
  search?: string
  min_price?: number
  max_price?: number
  page?: number
  per_page?: number
}

export class ValidationError extends Error {
  public errors: Record<string, string[]>

  constructor(errors: Record<string, string[]>, message: string = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
  }
}
