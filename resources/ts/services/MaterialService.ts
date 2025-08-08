import { api } from './ApiService'
import type { Material } from '@/types/models'

interface UploadMaterialData {
    lesson_id?: number
    student_id?: number
    file: File
    description?: string
}

class MaterialServiceClass {
    async getStudentMaterials(): Promise<Material[]> {
        const response = await api.get<{materials: Material[]}>('/student/materials')
        return (response as any).materials || []
    }

    async getTutorMaterials(): Promise<Material[]> {
        const response = await api.get<{materials: Material[]}>('/tutor/materials')
        return (response as any).materials || []
    }

    async getMaterialsByLesson(lessonId: number): Promise<Material[]> {
        const response = await api.get<{materials: Material[]}>(`/lessons/${lessonId}/materials`)
        return (response as any).materials || []
    }

    async uploadMaterial(data: UploadMaterialData): Promise<any> {
        const formData = new FormData()
        formData.append('file', data.file)
        if (data.lesson_id) formData.append('lesson_id', data.lesson_id.toString())
        if (data.student_id) formData.append('student_id', data.student_id.toString())
        if (data.description) formData.append('description', data.description)
        
        const response = await api.post('/materials/upload', formData)
        return response
    }

    async downloadMaterial(materialId: number): Promise<Blob> {
        // Use fetch directly for blob response
        const response = await fetch(`/api/materials/${materialId}/download`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Accept': 'application/octet-stream',
            },
        })

        if (!response.ok) {
            throw new Error('Download failed')
        }

        return await response.blob()
    }

    async deleteMaterial(materialId: number): Promise<any> {
        const response = await api.delete(`/materials/${materialId}`)
        return response
    }

    async updateMaterial(materialId: number, data: {description?: string, is_active?: boolean}): Promise<any> {
        const response = await api.put(`/materials/${materialId}`, data)
        return response
    }

    async getMaterialPreview(materialId: number): Promise<string> {
        const response = await api.get<{preview_url: string}>(`/materials/${materialId}/preview`)
        return (response as any).preview_url || ''
    }

    async shareMaterial(materialId: number, studentIds: number[]): Promise<any> {
        const response = await api.post(`/materials/${materialId}/share`, {
            student_ids: studentIds
        })
        return response
    }

    async toggleMaterialActive(materialId: number): Promise<any> {
        const response = await api.put(`/materials/${materialId}/toggle-active`, {})
        return response
    }

    async uploadMaterialToAPI(formData: FormData): Promise<any> {
        const response = await api.post('/materials/upload', formData)
        return response
    }
}

export const MaterialService = new MaterialServiceClass()