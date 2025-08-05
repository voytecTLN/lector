import { api } from './ApiService'

export interface HourlySlot {
    id?: number
    date: string
    start_hour: number
    end_hour: number
    is_available: boolean
    hours_booked: number
}

export interface AvailabilitySlotsResponse {
    slots: HourlySlot[]
}

export interface SaveAvailabilityResponse {
    success: boolean
    message: string
    slots: HourlySlot[]
}

class TutorAvailabilityService {
    /**
     * Get availability slots for a date range
     */
    async getAvailabilitySlots(startDate: string, endDate: string): Promise<AvailabilitySlotsResponse> {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate
        })
        
        return api.get<AvailabilitySlotsResponse>(`/tutor/availability-slots?${params.toString()}`)
    }

    /**
     * Save availability slots
     */
    async saveAvailabilitySlots(slots: Partial<HourlySlot>[]): Promise<SaveAvailabilityResponse> {
        return api.post<SaveAvailabilityResponse>('/tutor/availability-slots', { slots })
    }

    /**
     * Get specific tutor's availability (for viewing by students/admin)
     */
    async getTutorAvailability(tutorId: number, startDate: string, endDate: string): Promise<AvailabilitySlotsResponse> {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate
        })
        
        return api.get<AvailabilitySlotsResponse>(`/tutors/${tutorId}/availability-slots?${params.toString()}`)
    }

    /**
     * Remove availability slot
     */
    async removeAvailabilitySlot(slotId: number): Promise<{success: boolean; message: string}> {
        return api.delete(`/tutor/availability-slots/${slotId}`)
    }
}

export const tutorAvailabilityService = new TutorAvailabilityService()