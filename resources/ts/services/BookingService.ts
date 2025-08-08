import { api } from './ApiService'

interface BookingSlot {
    time: string
    available: boolean
    lesson_id?: number
}

interface BookingData {
    tutor_id: number
    lesson_date: string
    start_time: string
    end_time: string
    duration_minutes: number
    lesson_type: string
    topic?: string
    notes?: string
    package_assignment_id?: number
}

interface AvailabilitySlot {
    date: string
    slots: BookingSlot[]
}

class BookingServiceClass {
    async getTutorForBooking(tutorId: string | number): Promise<any> {
        const response = await api.get<{success: boolean, data: any}>(`/student/tutor/${tutorId}`)
        return response.data || response
    }

    async getTutorPublicProfile(tutorId: string | number): Promise<any> {
        const response = await api.get<any>(`/tutors/${tutorId}/public`)
        return response
    }

    async getAvailableSlots(tutorId: string | number, date: string): Promise<BookingSlot[]> {
        const response = await api.get<{success: boolean, data: {slots: BookingSlot[]}}>(`/student/lessons/available-slots?tutor_id=${tutorId}&date=${date}`)
        return response.data?.slots || []
    }

    async bookLesson(bookingData: BookingData): Promise<any> {
        const response = await api.post<{success: boolean, message?: string, data?: any}>('/student/lessons/book', bookingData)
        return response
    }

    async getTutorAvailability(tutorId: string | number, startDate?: string, endDate?: string): Promise<AvailabilitySlot[]> {
        const params = new URLSearchParams()
        params.append('tutor_id', tutorId.toString())
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)
        
        const response = await api.get<{success: boolean, data: AvailabilitySlot[]}>(`/tutor/availability?${params.toString()}`)
        return response.data || []
    }

    async cancelBooking(lessonId: number, reason?: string): Promise<any> {
        const response = await api.put<{success: boolean, message?: string}>(`/student/lessons/${lessonId}/cancel`, {
            reason: reason || 'Anulowane przez studenta'
        })
        return response
    }

    async rescheduleLesson(lessonId: number, newDate: string, newTime: string): Promise<any> {
        const response = await api.put<{success: boolean, message?: string}>(`/student/lessons/${lessonId}/reschedule`, {
            new_date: newDate,
            new_time: newTime
        })
        return response
    }

    async getStudentPackages(studentId?: number): Promise<any> {
        const endpoint = studentId ? `/student/${studentId}/packages` : '/student/packages'
        const response = await api.get<{success: boolean, data: any}>(endpoint)
        return response.data || response
    }

    async getPackageAssignments(studentId: number): Promise<any> {
        const response = await api.get<{success: boolean, data: any}>(`/student/${studentId}/package-assignments`)
        return response.data || response
    }
}

export const BookingService = new BookingServiceClass()