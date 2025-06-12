// resources/ts/services/StudentService.ts - Zgodny z Laravel Backend
import { api } from '@services/ApiService'
import { ValidationError } from '@/types/models'
import type {
    User,
    StudentProfile,
    CreateStudentRequest,
    UpdateStudentRequest,
    StudentFilters,
    PaginatedResponse,
    LearningGoal
} from '@/types/models'

// Laravel response formats
interface LaravelStudentResponse {
    success: boolean
    data: User & { studentProfile?: StudentProfile }
    message?: string
}

interface LaravelStudentsResponse {
    success: boolean
    data: User[]
    meta: {
        total: number
        filters_applied: Record<string, any>
    }
}

interface LaravelStatsResponse {
    success: boolean
    data: {
        total: number
        active: number
        new_this_month: number
        by_language: Record<string, number>
    }
}

export class StudentService {

    /**
     * Create student - zgodny z StudentController::store
     */
    async createStudent(data: CreateStudentRequest): Promise<User> {
        try {
            console.log('👨‍🎓 StudentService: Creating student')

            const response = await api.post<LaravelStudentResponse>('/students', {
                name: data.name,
                email: data.email,
                password: data.password,
                phone: data.phone,
                birth_date: data.birth_date,
                city: data.city,
                country: data.country || 'Polska',
                learning_languages: data.learning_languages || [],
                current_levels: data.current_levels || {},
                learning_goals: data.learning_goals || [],
                preferred_schedule: data.preferred_schedule || {}
            })

            // Show success notification
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || `Student ${response.data.name} został utworzony pomyślnie`
                }
            }))

            return response.data

        } catch (error) {
            console.error('❌ Create student error:', error)

            if (error instanceof ValidationError) {
                // Handle validation errors
                document.dispatchEvent(new CustomEvent('form:validationError', {
                    detail: { errors: error.errors }
                }))
            }
            throw error
        }
    }

    /**
     * Get students - zgodny z StudentController::index
     */
    async getStudents(filters?: StudentFilters): Promise<PaginatedResponse<User[]>> {
        try {
            console.log('📋 StudentService: Getting students with filters:', filters)

            const params = new URLSearchParams()

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== '') {
                        params.append(key, String(value))
                    }
                })
            }

            const queryString = params.toString()
            const endpoint = queryString ? `/students?${queryString}` : '/students'

            const response = await api.get<LaravelStudentsResponse>(endpoint)

            return {
                data: response.data,
                current_page: filters?.page || 1,
                per_page: filters?.per_page || 15,
                total: response.meta.total,
                last_page: Math.ceil(response.meta.total / (filters?.per_page || 15))
            }

        } catch (error) {
            console.error('❌ Get students error:', error)
            throw error
        }
    }

    /**
     * Get student by ID - zgodny z StudentController::show
     */
    async getStudentById(id: number): Promise<User & { studentProfile: StudentProfile }> {
        try {
            console.log('👤 StudentService: Getting student by ID:', id)

            const response = await api.get<LaravelStudentResponse>(`/students/${id}`)
            return response.data as User & { studentProfile: StudentProfile }

        } catch (error) {
            console.error('❌ Get student error:', error)
            throw error
        }
    }

    /**
     * Update student - zgodny z StudentController::update
     */
    async updateStudent(id: number, data: UpdateStudentRequest): Promise<User> {
        try {
            console.log('✏️ StudentService: Updating student:', id)

            const response = await api.put<LaravelStudentResponse>(`/students/${id}`, data)

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || 'Profil studenta został zaktualizowany'
                }
            }))

            return response.data

        } catch (error) {
            console.error('❌ Update student error:', error)

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Błąd podczas aktualizacji profilu'
                }
            }))
            throw error
        }
    }

    /**
     * Update learning goals - zgodny z StudentController::updateLearningGoals
     */
    async updateLearningGoals(studentId: number, goals: LearningGoal[]): Promise<void> {
        try {
            console.log('🎯 StudentService: Updating learning goals for:', studentId)

            const response = await api.put<LaravelStudentResponse>(`/students/${studentId}/learning-goals`, {
                goals
            })

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || 'Cele nauki zostały zaktualizowane'
                }
            }))

        } catch (error) {
            console.error('❌ Update learning goals error:', error)

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Błąd podczas aktualizacji celów nauki'
                }
            }))
            throw error
        }
    }

    /**
     * Deactivate student - zgodny z StudentController::destroy
     */
    async deactivateStudent(id: number): Promise<void> {
        try {
            console.log('🗑️ StudentService: Deactivating student:', id)

            const response = await api.delete<{ success: boolean; message: string }>(`/students/${id}`)

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || 'Student został dezaktywowany'
                }
            }))

            // Trigger students list refresh
            document.dispatchEvent(new CustomEvent('students:refresh'))

        } catch (error) {
            console.error('❌ Deactivate student error:', error)

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Błąd podczas dezaktywacji studenta'
                }
            }))
            throw error
        }
    }

    /**
     * Search students - zgodny z StudentController::search
     */
    async searchStudents(query: string): Promise<User[]> {
        try {
            console.log('🔍 StudentService: Searching students:', query)

            const response = await api.get<{ success: boolean; data: User[] }>(
                `/students/search?q=${encodeURIComponent(query)}`
            )

            return response.data

        } catch (error) {
            console.error('❌ Search students error:', error)
            throw error
        }
    }

    /**
     * Bulk update status - zgodny z StudentController::bulkUpdateStatus
     */
    async bulkUpdateStatus(studentIds: number[], status: 'active' | 'inactive'): Promise<void> {
        try {
            console.log('🔄 StudentService: Bulk updating status:', { studentIds, status })

            const response = await api.post<{ success: boolean; message: string }>('/students/bulk-status', {
                student_ids: studentIds,
                status
            })

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || `Status ${studentIds.length} studentów został zaktualizowany`
                }
            }))

        } catch (error) {
            console.error('❌ Bulk update status error:', error)
            throw error
        }
    }

    /**
     * Get student stats - zgodny z StudentController::getStats
     */
    async getStudentStats(): Promise<{
        total: number
        active: number
        new_this_month: number
        by_language: Record<string, number>
    }> {
        try {
            console.log('📊 StudentService: Getting student stats')

            const response = await api.get<LaravelStatsResponse>('/students/stats')
            return response.data

        } catch (error) {
            console.error('❌ Get student stats error:', error)
            throw error
        }
    }

    /**
     * Get own profile (for student accessing their own data)
     */
    async getOwnProfile(): Promise<User & { studentProfile: StudentProfile }> {
        try {
            console.log('👤 StudentService: Getting own profile')

            const response = await api.get<LaravelStudentResponse>('/student/profile')
            return response.data as User & { studentProfile: StudentProfile }

        } catch (error) {
            console.error('❌ Get own profile error:', error)
            throw error
        }
    }

    /**
     * Update own profile (for student updating their own data)
     */
    async updateOwnProfile(data: UpdateStudentRequest): Promise<User> {
        try {
            console.log('✏️ StudentService: Updating own profile')

            const response = await api.put<LaravelStudentResponse>('/student/profile', data)

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || 'Twój profil został zaktualizowany'
                }
            }))

            return response.data

        } catch (error) {
            console.error('❌ Update own profile error:', error)

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Błąd podczas aktualizacji profilu'
                }
            }))
            throw error
        }
    }
}

export const studentService = new StudentService()