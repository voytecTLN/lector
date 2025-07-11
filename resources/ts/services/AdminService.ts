// resources/ts/services/AdminService.ts
import { api } from './ApiService'
import type { 
    User, 
    PaginatedResponse, 
    CreateAdminRequest, 
    UpdateAdminRequest, 
    AdminFilters 
} from '@/types/models'

export class AdminService {
    async getAdmins(filters: AdminFilters = {}): Promise<PaginatedResponse<User[]>> {
        const params = new URLSearchParams()
        
        if (filters.status) params.append('status', filters.status)
        if (filters.city) params.append('city', filters.city)
        if (filters.search) params.append('search', filters.search)
        if (filters.per_page) params.append('per_page', filters.per_page.toString())
        if (filters.page) params.append('page', filters.page.toString())

        const queryString = params.toString()
        const url = queryString ? `/admins?${queryString}` : '/admins'
        
        return await api.get(url)
    }

    async getAdminById(adminId: number): Promise<User> {
        return await api.get(`/admins/${adminId}`)
    }

    async createAdmin(data: CreateAdminRequest): Promise<User> {
        return await api.post('/admins', data)
    }

    async updateAdmin(adminId: number, data: UpdateAdminRequest): Promise<User> {
        return await api.put(`/admins/${adminId}`, data)
    }

    async deleteAdmin(adminId: number): Promise<void> {
        return await api.delete(`/admins/${adminId}`)
    }

    async deactivateAdmin(adminId: number): Promise<User> {
        return await api.put(`/admins/${adminId}/deactivate`, {})
    }

    async searchAdmins(query: string): Promise<User[]> {
        const params = new URLSearchParams({ search: query })
        return await api.get(`/admins/search?${params.toString()}`)
    }

    async bulkUpdateStatus(adminIds: number[], status: string): Promise<void> {
        return await api.post('/admins/bulk-update-status', {
            ids: adminIds,
            status: status
        })
    }

    async getAdminStats(): Promise<{
        total: number
        active: number
        inactive: number
        new_this_month: number
    }> {
        return await api.get('/admins/stats')
    }

    /**
     * Export admins data
     */
    async exportAdmins(format: 'csv' | 'xlsx' = 'csv', filters: AdminFilters = {}): Promise<Blob> {
        const params = new URLSearchParams()
        
        if (filters.status) params.append('status', filters.status)
        if (filters.city) params.append('city', filters.city)
        if (filters.search) params.append('search', filters.search)
        params.append('format', format)

        const response = await fetch(`/api/admins/export?${params.toString()}`, {
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