import { api } from './ApiService'

export class AvailabilityLogsService {
    async getLogs(params: any) {
        return api.get('/availability-logs', params)
    }

    async getStats() {
        return api.get('/availability-logs/stats')
    }

    async getTutorLogs(tutorId: number, params?: any) {
        return api.get(`/availability-logs/tutor/${tutorId}`, params)
    }

    async exportToCSV(filters: any): Promise<Blob> {
        const params: any = {}
        
        if (filters.tutorId) {
            params.tutor_id = filters.tutorId
        }
        if (filters.action) {
            params.action = filters.action
        }
        if (filters.dateFrom) {
            params.date_from = filters.dateFrom
        }
        if (filters.dateTo) {
            params.date_to = filters.dateTo
        }
        if (filters.search) {
            params.search = filters.search
        }

        
        return api.get('/availability-logs/export', params, { responseType: 'blob' })
    }
}

export const availabilityLogsService = new AvailabilityLogsService()