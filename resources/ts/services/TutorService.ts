// resources/ts/services/TutorService.ts
import { api } from './ApiService'
import type { 
    User, 
    PaginatedResponse, 
    CreateTutorRequest, 
    UpdateTutorRequest, 
    TutorFilters 
} from '@/types/models'

export class TutorService {
    async getTutors(filters: TutorFilters = {}): Promise<PaginatedResponse<User[]>> {
        const params = new URLSearchParams()
        
        if (filters.status) params.append('status', filters.status)
        if (filters.city) params.append('city', filters.city)
        if (filters.language) params.append('language', filters.language)
        if (filters.specialization) params.append('specialization', filters.specialization)
        if (filters.verification_status) params.append('verification_status', filters.verification_status)
        if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified.toString())
        if (filters.is_accepting_students !== undefined) params.append('is_accepting_students', filters.is_accepting_students.toString())
        if (filters.search) params.append('search', filters.search)
        if (filters.per_page) params.append('per_page', filters.per_page.toString())
        if (filters.page) params.append('page', filters.page.toString())

        const queryString = params.toString()
        const url = queryString ? `/tutors?${queryString}` : '/tutors'
        
        return await api.get(url)
    }

    async getTutorById(tutorId: number): Promise<User> {
        return await api.get(`/tutors/${tutorId}`)
    }

    async createTutor(data: CreateTutorRequest): Promise<User> {
        return await api.post('/tutors', data)
    }

    async updateTutor(tutorId: number, data: UpdateTutorRequest): Promise<User> {
        return await api.put(`/tutors/${tutorId}`, data)
    }

    async deleteTutor(tutorId: number): Promise<void> {
        return await api.delete(`/tutors/${tutorId}`)
    }

    async deactivateTutor(tutorId: number): Promise<User> {
        return await api.put(`/tutors/${tutorId}/deactivate`, {})
    }

    async verifyTutor(tutorId: number, approved: boolean, notes?: string): Promise<User> {
        return await api.put(`/tutors/${tutorId}/verify`, {
            approved,
            notes
        })
    }

    async updateAvailability(tutorId: number, availability: Record<string, any>): Promise<User> {
        return await api.put(`/tutors/${tutorId}/availability`, {
            availability
        })
    }

    async searchTutors(query: string): Promise<User[]> {
        const params = new URLSearchParams({ search: query })
        return await api.get(`/tutors/search?${params.toString()}`)
    }

    async bulkUpdateStatus(tutorIds: number[], status: string): Promise<void> {
        return await api.post('/tutors/bulk-update-status', {
            ids: tutorIds,
            status: status
        })
    }

    async getTutorStats(): Promise<{
        total: number
        active: number
        verified: number
        accepting_students: number
        new_this_month: number
    }> {
        return await api.get('/tutors/stats')
    }


    async getAvailableTutors(criteria: { language?: string, specialization?: string } = {}): Promise<User[]> {
        const params = new URLSearchParams()
        if (criteria.language) params.append('language', criteria.language)
        if (criteria.specialization) params.append('specialization', criteria.specialization)
        
        const queryString = params.toString()
        const url = queryString ? `/tutors/available?${queryString}` : '/tutors/available'
        
        return await api.get(url)
    }

    /**
     * Export tutors data
     */
    async exportTutors(format: 'csv' | 'xlsx' = 'csv', filters: TutorFilters = {}): Promise<Blob> {
        const params = new URLSearchParams()
        
        if (filters.status) params.append('status', filters.status)
        if (filters.city) params.append('city', filters.city)
        if (filters.language) params.append('language', filters.language)
        if (filters.specialization) params.append('specialization', filters.specialization)
        if (filters.verification_status) params.append('verification_status', filters.verification_status)
        if (filters.search) params.append('search', filters.search)
        params.append('format', format)

        const response = await fetch(`/api/tutors/export?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Accept': 'application/octet-stream',
            },
        })

        if (!response.ok) {
            throw new Error('Export failed')
        }

        return await response.blob()
    }

    /**
     * Get language options for dropdowns
     */
    getLanguageOptions(): Array<{ value: string, label: string }> {
        return [
            { value: 'english', label: 'Angielski' },
            { value: 'german', label: 'Niemiecki' },
            { value: 'french', label: 'Francuski' },
            { value: 'spanish', label: 'Hiszpański' }
        ]
    }

    /**
     * Get specialization options for dropdowns
     */
    getSpecializationOptions(): Array<{ value: string, label: string }> {
        return [
            { value: 'business', label: 'Język biznesowy' },
            { value: 'conversation', label: 'Konwersacje' },
            { value: 'exam', label: 'Przygotowanie do egzaminów' },
            { value: 'grammar', label: 'Gramatyka' },
            { value: 'pronunciation', label: 'Wymowa' },
            { value: 'academic', label: 'Język akademicki' },
            { value: 'travel', label: 'Język w podróży' },
            { value: 'kids', label: 'Zajęcia dla dzieci' }
        ]
    }

    /**
     * Get lesson type options for dropdowns
     */
    getLessonTypeOptions(): Array<{ value: string, label: string }> {
        return [
            { value: 'individual', label: 'Lekcje indywidualne' },
            { value: 'group', label: 'Lekcje grupowe' },
            { value: 'intensive', label: 'Kursy intensywne' },
            { value: 'conversation', label: 'Kluby konwersacyjne' }
        ]
    }

    /**
     * Get verification status options
     */
    getVerificationStatusOptions(): Array<{ value: string, label: string }> {
        return [
            { value: 'pending', label: 'Oczekująca' },
            { value: 'approved', label: 'Zatwierdzona' },
            { value: 'rejected', label: 'Odrzucona' }
        ]
    }

    /**
     * Helper method to format language names
     */
    formatLanguageNames(languages: string[]): string {
        const languageMap = this.getLanguageOptions().reduce((acc, lang) => {
            acc[lang.value] = lang.label
            return acc
        }, {} as Record<string, string>)

        return languages.map(lang => languageMap[lang] || lang).join(', ')
    }

    /**
     * Helper method to format specialization names
     */
    formatSpecializationNames(specializations: string[]): string {
        const specializationMap = this.getSpecializationOptions().reduce((acc, spec) => {
            acc[spec.value] = spec.label
            return acc
        }, {} as Record<string, string>)

        return specializations.map(spec => specializationMap[spec] || spec).join(', ')
    }

    /**
     * Helper method to format lesson type names
     */
    formatLessonTypeNames(lessonTypes: string[]): string {
        const lessonTypeMap = this.getLessonTypeOptions().reduce((acc, type) => {
            acc[type.value] = type.label
            return acc
        }, {} as Record<string, string>)

        return lessonTypes.map(type => lessonTypeMap[type] || type).join(', ')
    }

    /**
     * Get tutor profile for editing
     */
    async getProfile(): Promise<User> {
        try {
            console.log('👤 TutorService: Getting tutor profile')
            
            // Backend returns the user object directly
            const response = await api.get<User>('/tutor/profile')
            console.log('Profile response:', response)
            
            return response

        } catch (error) {
            console.error('❌ Get tutor profile error:', error)
            throw error
        }
    }

    /**
     * Update tutor profile
     */
    async updateProfile(data: FormData | any): Promise<any> {
        try {
            console.log('✏️ TutorService: Updating tutor profile', data)

            // If it's FormData (with file upload), use POST
            if (data instanceof FormData) {
                const response = await api.post<{ success: boolean, data: User }>('/tutor/profile', data)
                return response.data
            }
            
            // Otherwise use PUT for JSON
            const response = await api.put<{ success: boolean, data: User }>('/tutor/profile', data)
            return response.data

        } catch (error) {
            console.error('❌ Update tutor profile error:', error)
            throw error
        }
    }

    /**
     * Get all tutors - for admin use
     */
    async getAllTutors(): Promise<any[]> {
        try {
            const response = await api.get<{ success: boolean, data: any[] }>('/tutors')
            return response.data || []
        } catch (error) {
            console.error('❌ Get all tutors error:', error)
            throw error
        }
    }

    /**
     * Get tutor's students with filters and stats
     */
    async getStudents(filters?: {
        status?: string
        search?: string
        language?: string
    }): Promise<{students: any[], stats: any}> {
        try {
            const params = new URLSearchParams()
            if (filters?.status && filters.status !== 'all') params.append('status', filters.status)
            if (filters?.search) params.append('search', filters.search)
            if (filters?.language) params.append('language', filters.language)
            
            const response = await api.get<{success: boolean, data: {students: any[], stats: any}}>(`/tutor/students?${params.toString()}`)
            return response.data || {students: [], stats: {}}
        } catch (error) {
            console.error('❌ Get tutor students error:', error)
            throw error
        }
    }

    /**
     * Get students for a specific tutor (admin view)
     */
    async getStudentsForTutor(tutorId: number, filters?: {
        status?: string
        search?: string
        language?: string
    }): Promise<{students: any[], stats: any}> {
        try {
            const params = new URLSearchParams()
            if (filters?.status && filters.status !== 'all') params.append('status', filters.status)
            if (filters?.search) params.append('search', filters.search)
            if (filters?.language) params.append('language', filters.language)
            
            const response = await api.get<{success: boolean, data: {students: any[], stats: any}}>(`/admin/tutors/${tutorId}/students?${params.toString()}`)
            return response.data || {students: [], stats: {}}
        } catch (error) {
            console.error('❌ Get tutor students for admin error:', error)
            throw error
        }
    }

    /**
     * Get single student details for tutor
     */
    async getStudentById(studentId: number): Promise<any> {
        try {
            const response = await api.get<{success: boolean, data: {student: any}}>(`/tutor/students/${studentId}`)
            return response.data?.student || response
        } catch (error) {
            console.error('❌ Get student by ID error:', error)
            throw error
        }
    }

    /**
     * Get materials for specific student
     */
    async getStudentMaterials(studentId: number): Promise<any[]> {
        try {
            const response = await api.get(`/tutor/students/${studentId}/materials`)
            const responseData = response as any
            return responseData.materials || responseData.data?.materials || []
        } catch (error) {
            console.error('❌ Get student materials error:', error)
            throw error
        }
    }

    /**
     * Get public tutor profile (for students)
     */
    async getPublicTutorProfile(tutorId: number): Promise<any> {
        try {
            const response = await api.get<any>(`/tutors/${tutorId}/public`)
            return response
        } catch (error) {
            console.error('❌ Get public tutor profile error:', error)
            throw error
        }
    }
}

export const tutorService = new TutorService()