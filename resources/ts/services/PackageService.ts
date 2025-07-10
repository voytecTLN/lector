import type { Package, PackageFilters, PaginatedResponse } from '@/types/models'
import { ApiService } from '@services/ApiService'

export interface PackageFormData {
    name: string
    is_active: boolean
    price: number
    hours_count: number
    validity_days: number
    description?: string
    sort_order?: number
    color?: string
}

export interface PackageAssignmentData {
    student_id: number
    package_id: number
    notes?: string
}

export interface PackageStats {
    total_packages: number
    active_packages: number
    inactive_packages: number
    total_assignments: number
    active_assignments: number
    expired_assignments: number
    revenue_potential: number
}

export class PackageService {
    private apiService: ApiService

    constructor() {
        this.apiService = new ApiService()
    }

    /**
     * Get paginated packages with filters
     */
    async getPackages(filters: PackageFilters = {}): Promise<PaginatedResponse<Package[]>> {
        const params = new URLSearchParams()

        if (filters.status) params.append('status', filters.status)
        if (filters.search) params.append('search', filters.search)
        if (filters.min_price) params.append('min_price', filters.min_price.toString())
        if (filters.max_price) params.append('max_price', filters.max_price.toString())
        if (filters.page) params.append('page', filters.page.toString())
        if (filters.per_page) params.append('per_page', filters.per_page.toString())

        const url = `/packages${params.toString() ? '?' + params.toString() : ''}`
        return await this.apiService.get<PaginatedResponse<Package[]>>(url)
    }

    /**
     * Get active packages for selection
     */
    async getActivePackages(): Promise<Package[]> {
        return await this.apiService.get<Package[]>('/packages/active')
    }

    /**
     * Get package by ID
     */
    async getPackage(id: number): Promise<Package> {
        return await this.apiService.get<Package>(`/packages/${id}`)
    }

    /**
     * Create new package
     */
    async createPackage(data: PackageFormData): Promise<Package> {
        const response = await this.apiService.post<{ package: Package }>('/packages', data)
        return response.package
    }

    /**
     * Update package
     */
    async updatePackage(id: number, data: Partial<PackageFormData>): Promise<Package> {
        const response = await this.apiService.put<{ package: Package }>(`/packages/${id}`, data)
        return response.package
    }

    /**
     * Delete package
     */
    async deletePackage(id: number): Promise<void> {
        await this.apiService.delete(`/packages/${id}`)
    }

    /**
     * Assign package to student
     */
    async assignPackageToStudent(data: PackageAssignmentData): Promise<any> {
        const response = await this.apiService.post<{ assignment: any }>('/packages/assign', data)
        return response.assignment
    }

    /**
     * Get package statistics
     */
    async getPackageStats(): Promise<PackageStats> {
        return await this.apiService.get<PackageStats>('/packages/stats')
    }

    /**
     * Get student's packages
     */
    async getStudentPackages(studentId: number): Promise<any[]> {
        return await this.apiService.get<any[]>(`/packages/student/${studentId}`)
    }

    /**
     * Deactivate expired assignments
     */
    async deactivateExpiredAssignments(): Promise<{ count: number }> {
        return await this.apiService.post<{ count: number }>('/packages/deactivate-expired')
    }
}