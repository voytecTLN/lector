// resources/ts/services/StudentService.ts
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

export class StudentService {

    async createStudent(data: CreateStudentRequest): Promise<User> {
        try {
            const response = await api.post<{ data: User }>('/students', data)

            // Show success notification
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: `Student ${response.data.name} został utworzony pomyślnie`
                }
            }))

            return response.data
        } catch (error) {
            if (error instanceof ValidationError) {
                // Handle validation errors
                document.dispatchEvent(new CustomEvent('form:validationError', {
                    detail: { errors: error.errors }
                }))
            }
            throw error
        }
    }

    async getStudents(filters?: StudentFilters): Promise<PaginatedResponse<User[]>> {
        const params = new URLSearchParams()

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    params.append(key, String(value))
                }
            })
        }

        const response = await api.get<PaginatedResponse<User[]>>(`/students?${params}`)
        return response
    }

    async getStudentById(id: number): Promise<User & { studentProfile: StudentProfile }> {
        const response = await api.get<{ data: User & { studentProfile: StudentProfile } }>(`/students/${id}`)
        return response.data
    }

    async updateStudent(id: number, data: UpdateStudentRequest): Promise<User> {
        try {
            const response = await api.put<{ data: User }>(`/students/${id}`, data)

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Profil studenta został zaktualizowany'
                }
            }))

            return response.data
        } catch (error) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Błąd podczas aktualizacji profilu'
                }
            }))
            throw error
        }
    }

    async updateLearningGoals(studentId: number, goals: LearningGoal[]): Promise<void> {
        try {
            await api.put(`/students/${studentId}/learning-goals`, { goals })

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Cele nauki zostały zaktualizowane'
                }
            }))
        } catch (error) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Błąd podczas aktualizacji celów nauki'
                }
            }))
            throw error
        }
    }

    async deactivateStudent(id: number): Promise<void> {
        try {
            await api.delete(`/students/${id}`)

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Student został dezaktywowany'
                }
            }))

            // Trigger students list refresh
            document.dispatchEvent(new CustomEvent('students:refresh'))

        } catch (error) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Błąd podczas dezaktywacji studenta'
                }
            }))
            throw error
        }
    }

    async searchStudents(query: string): Promise<User[]> {
        const response = await api.get<{ data: User[] }>(`/students/search?q=${encodeURIComponent(query)}`)
        return response.data
    }

    // Bulk operations
    async bulkUpdateStatus(studentIds: number[], status: 'active' | 'inactive'): Promise<void> {
        await api.post('/students/bulk-status', {
            student_ids: studentIds,
            status
        })

        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'success',
                message: `Status ${studentIds.length} studentów został zaktualizowany`
            }
        }))
    }

    // Analytics methods
    async getStudentStats(): Promise<{
        total: number
        active: number
        new_this_month: number
        by_language: Record<string, number>
    }> {
        const response = await api.get<{
            data: {
                total: number
                active: number
                new_this_month: number
                by_language: Record<string, number>
            }
        }>('/students/stats')
        return response.data
    }
}

export const studentService = new StudentService()
