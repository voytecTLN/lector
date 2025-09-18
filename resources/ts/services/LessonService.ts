import { api } from './ApiService'
import { authService } from './AuthService'

interface LessonResponse {
    success: boolean
    data?: any
    lessons?: any[]
    message?: string
}

interface LessonFeedback {
    rating: number
    feedback: string
}

interface LessonStatusUpdate {
    status: string
    reason?: string
}

class LessonServiceClass {
    async getStudentLessons(type: 'upcoming' | 'past', limit?: number): Promise<any> {
        const params = new URLSearchParams({ type })
        if (limit) params.append('limit', limit.toString())
        
        const response = await api.get<any>(`/student/lessons/my-lessons?${params.toString()}`)
        return response.data || response
    }

    async getTutorUpcomingLessons(): Promise<any> {
        // Use same pattern as student lessons - my-lessons with type parameter
        const response = await api.get<LessonResponse>('/tutor/lessons/my-lessons?type=upcoming')
        return response.data || response
    }

    async getTutorLessons(params?: {
        date_from?: string
        date_to?: string
        student_id?: string
        status?: string
    }): Promise<any> {
        const queryParams = new URLSearchParams()
        queryParams.append('type', 'all') // Get all lessons for calendar view
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value) queryParams.append(key, value)
            })
        }
        
        const response = await api.get<LessonResponse>(`/tutor/lessons/my-lessons?${queryParams.toString()}`)
        return response.data || response
    }

    async getAdminLessons(filters?: {
        status?: string
        tutor_id?: string
        student_id?: string
        date_from?: string
        date_to?: string
    }): Promise<any> {
        const params = new URLSearchParams()
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all') params.append(key, value)
            })
        }
        
        const response = await api.get<LessonResponse>(`/lessons?${params.toString()}`)
        return response.data || response
    }

    async updateLessonStatus(lessonId: number, statusUpdate: LessonStatusUpdate): Promise<any> {
        // Get user role to determine correct endpoint
        const { authService } = await import('@services/AuthService')
        const user = await authService.getCurrentUser()
        const userRole = user?.role || 'student'
        
        let endpoint = `/lessons/${lessonId}/status` // fallback
        
        if (userRole === 'tutor') {
            endpoint = `/tutor/lessons/${lessonId}/status`
        } else if (userRole === 'admin' || userRole === 'moderator') {
            endpoint = `/admin/lessons/${lessonId}/status`
        }
        
        const response = await api.put<LessonResponse>(endpoint, statusUpdate)
        return response
    }

    async cancelStudentLesson(lessonId: number, reason: string): Promise<any> {
        const response = await api.put<LessonResponse>(`/student/lessons/${lessonId}/cancel`, { reason })
        return response
    }

    async cancelTutorLesson(lessonId: number, reason: string): Promise<any> {
        const response = await api.put<LessonResponse>(`/tutor/lessons/${lessonId}/cancel`, { reason })
        return response
    }

    async addStudentFeedback(lessonId: number, feedback: LessonFeedback): Promise<any> {
        const response = await api.post<LessonResponse>(`/student/lessons/${lessonId}/feedback`, feedback)
        return response
    }

    async getLessonDetails(lessonId: number): Promise<any> {
        // Get current user to determine correct endpoint
        const user = authService.getUser()
        let endpoint = `/lessons/${lessonId}` // Default fallback
        
        // Use role-specific endpoints based on user role
        if (user?.role === 'admin' || user?.role === 'moderator') {
            endpoint = `/lessons/${lessonId}` // Admin/moderator endpoint
        } else if (user?.role === 'tutor') {
            endpoint = `/tutor/lessons/${lessonId}` // Tutor endpoint
        } else if (user?.role === 'student') {
            endpoint = `/student/lessons/${lessonId}` // Student endpoint
        }
        
        const response = await api.get<LessonResponse>(endpoint)
        return response.data || response
    }

    async endTutorMeeting(lessonId: number): Promise<any> {
        const response = await api.post(`/tutor/lessons/${lessonId}/meeting/end`)
        return response
    }

    async getLessonStatistics(params?: {
        tutor_id?: string
        student_id?: string
        date_from?: string
        date_to?: string
    }): Promise<any> {
        const queryParams = new URLSearchParams()
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value) queryParams.append(key, value)
            })
        }
        
        const response = await api.get<LessonResponse>(`/lessons/statistics?${queryParams.toString()}`)
        return response.data || response
    }

    async getStatusHistory(lessonId: number): Promise<any> {
        const url = `/lessons/${lessonId}/status-history`
        
        try {
            const response = await api.get<LessonResponse>(url)
            return response.data || response
        } catch (error) {
            console.error('Error fetching status history:', error)
            throw error
        }
    }

    async exportLessons(format: 'csv' | 'pdf' = 'csv', filters?: any): Promise<Blob> {
        const params = new URLSearchParams({ format })
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value as string)
            })
        }
        
        // Use fetch directly for blob response
        const response = await fetch(`/api/lessons/export?${params.toString()}`, {
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
}

export const LessonService = new LessonServiceClass()