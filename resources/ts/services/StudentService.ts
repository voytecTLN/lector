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

// Dodatkowe interfejsy dla nowych danych
export interface StudentStats {
    total_lessons: number;
    total_hours: number;
    completed_lessons: number;
    cancelled_lessons: number;
}

export interface HourPackage {
    id: number;
    name: string;
    hours: number;
    remaining_hours: number;
    status: string;
    expiry_date?: string;
    // Inne pola mogą być dodane w przyszłości
}

// Laravel response formats
interface LaravelStudentResponse {
    success: boolean
    data: User & { studentProfile?: StudentProfile }
    message?: string
}

interface LaravelStudentDetailsResponse {
    success: boolean
    data: User & {
        studentProfile: StudentProfile;
        hour_package: HourPackage;
        upcoming_lessons: any[]; // można zdefiniować dokładniejszy typ później
        stats: StudentStats;
    }
}

interface LaravelStudentsResponse {
    success: boolean
    data: (User & { hour_package: HourPackage })[]
    meta: {
        total: number
        per_page: number
        current_page: number
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
                preferred_schedule: data.preferred_schedule || {},
                status: data.status || 'active'
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
    async getStudents(filters?: StudentFilters): Promise<PaginatedResponse<(User & { hour_package: HourPackage })[]>> {
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
    async getStudentById(id: number): Promise<User & {
        studentProfile: StudentProfile;
        hour_package: HourPackage;
        upcoming_lessons: any[];
        stats: StudentStats;
    }> {
        try {
            console.log('👤 StudentService: Getting student by ID:', id)

            const response = await api.get<LaravelStudentDetailsResponse>(`/students/${id}`)

            if (!response.success || !response.data) {
                throw new Error('Student nie został znaleziony')
            }

            return response.data

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

            // Show success notification
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || 'Profil studenta został zaktualizowany'
                }
            }))

            return response.data

        } catch (error) {
            console.error('❌ Update student error:', error)

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
     * Delete student - zgodny z StudentController::destroy
     */
    async deleteStudent(id: number): Promise<void> {
        try {
            console.log('🗑️ StudentService: Deleting student:', id)

            const response = await api.delete<{ success: boolean, message: string }>(`/students/${id}`)

            // Show success notification
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || 'Student został usunięty'
                }
            }))

        } catch (error) {
            console.error('❌ Delete student error:', error)
            throw error
        }
    }

    /**
     * Get student statistics - zgodny z StudentController::getStats
     */
    async getStats(): Promise<LaravelStatsResponse['data']> {
        try {
            console.log('📊 StudentService: Getting stats')

            const response = await api.get<LaravelStatsResponse>('/students/stats')

            return response.data

        } catch (error) {
            console.error('❌ Get stats error:', error)
            throw error
        }
    }

    // Dodaj do StudentService.ts:

    /**
     * Update learning goals - zgodny z StudentController::updateLearningGoals
     */
    async updateLearningGoals(id: number, goals: string[]): Promise<User> {
        try {
            console.log('🎯 StudentService: Updating learning goals:', id)

            const response = await api.put<LaravelStudentResponse>(`/students/${id}/learning-goals`, { goals })

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message || 'Cele nauki zostały zaktualizowane'
                }
            }))

            return response.data
        } catch (error) {
            console.error('❌ Update learning goals error:', error)
            throw error
        }
    }

    /**
     * Search students - zgodny z StudentController::search
     */
    async searchStudents(query: string): Promise<User[]> {
        try {
            console.log('🔍 StudentService: Searching students:', query)

            const response = await api.get<LaravelStudentsResponse>(`/students/search?q=${encodeURIComponent(query)}`)

            return response.data || []
        } catch (error) {
            console.error('❌ Search students error:', error)
            throw error
        }
    }

    /**
     * Bulk update status - zgodny z StudentController::bulkUpdateStatus
     */
    async bulkUpdateStatus(studentIds: number[], status: string): Promise<void> {
        try {
            console.log('📋 StudentService: Bulk updating status')

            const response = await api.post<{ success: boolean, message: string }>('/students/bulk-status', {
                student_ids: studentIds,
                status
            })

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: response.message
                }
            }))
        } catch (error) {
            console.error('❌ Bulk update error:', error)
            throw error
        }
    }
}