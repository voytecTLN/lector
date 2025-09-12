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
    is_placeholder?: boolean;
    total_hours?: number;
    expires_at?: string;
    percentage?: number;
    active?: boolean;
    display?: boolean;
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
        packages?: {  // Dodaj to jako obiekt, nie tablicę
            active: number
            expiring_soon: number
            expired: number
            total_hours: number
            used_hours: number
        }
    }
}

export class StudentService {

    /**
     * Create student - zgodny z StudentController::store
     */
    async createStudent(data: CreateStudentRequest): Promise<User> {
        try {

            const requestPayload = {
                name: data.name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
                phone: data.phone,
                birth_date: data.birth_date,
                city: data.city,
                country: data.country || 'Polska',
                learning_languages: data.learning_languages || [],
                current_levels: data.current_levels || {},
                learning_goals: data.learning_goals || [],
                preferred_schedule: data.preferred_schedule || {},
                status: data.status,
                package_id: data.package_id // ✅ DODANE!
            }
            

            const response = await api.post<LaravelStudentResponse>('/students', requestPayload)

            // const response = await api.post<LaravelStudentResponse>('/students', {data})

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

    /**
     * Get student profile for editing
     */
    async getProfile(): Promise<{
        id: number;
        name: string;
        email: string;
        phone?: string;
        birth_date?: string;
        city?: string;
        country?: string;
        student_profile?: {
            learning_languages?: string[];
            learning_goals?: string[];
            current_levels?: { [key: string]: string };
        };
    }> {
        try {

            const response = await api.get<{ success: boolean, data: {
                id: number;
                name: string;
                email: string;
                phone?: string;
                birth_date?: string;
                city?: string;
                country?: string;
                student_profile?: {
                    learning_languages?: string[];
                    learning_goals?: string[];
                    current_levels?: { [key: string]: string };
                };
            } }>('/student/profile')
            
            return response.data

        } catch (error) {
            console.error('❌ Get student profile error:', error)
            throw error
        }
    }

    /**
     * Update student profile
     */
    async updateProfile(data: any): Promise<any> {
        try {

            // Check if data is FormData (file upload)
            if (data instanceof FormData) {
                // Use POST with _method for file uploads
                const response = await api.post<{ success: boolean, data: any }>('/student/profile', data)
                return response.data
            } else {
                // Use PUT for regular JSON updates
                const response = await api.put<{ success: boolean, data: any }>('/student/profile', data)
                return response.data
            }

        } catch (error) {
            console.error('❌ Update student profile error:', error)
            throw error
        }
    }

    /**
     * Get dashboard statistics for student
     */
    async getDashboardStats(): Promise<any> {
        try {

            const response = await api.get<{ success: boolean, data: any }>('/student/dashboard-stats')

            return response.data || response

        } catch (error) {
            console.error('❌ Get dashboard stats error:', error)
            throw error
        }
    }

    /**
     * Get all students - alias for internal use
     */
    async getAllStudents(): Promise<any[]> {
        try {
            const response = await api.get<{ success: boolean, data: any[] }>('/students')
            return response.data || []
        } catch (error) {
            console.error('❌ Get all students error:', error)
            throw error
        }
    }

    /**
     * Get available tutors for student
     */
    async getAvailableTutors(): Promise<any[]> {
        try {
            const response = await api.get<{success: boolean, data: any[]}>('/student/tutors-available')
            return response.data || []
        } catch (error) {
            console.error('❌ Get available tutors error:', error)
            throw error
        }
    }

    /**
     * Get specific tutor profile for student view
     */
    async getTutorProfile(tutorId: number): Promise<any> {
        try {
            const response = await api.get<{success: boolean, data: any}>(`/student/tutor/${tutorId}`)
            return response.data
        } catch (error) {
            console.error('❌ Get tutor profile error:', error)
            throw error
        }
    }
}

export const studentService = new StudentService()