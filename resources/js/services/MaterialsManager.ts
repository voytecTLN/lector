import axios from 'axios';

export interface LessonMaterial {
    id: number;
    lesson_id: number | null;
    student_id: number;
    tutor_id: number;
    file_path: string;
    original_name: string;
    file_size: number;
    mime_type: string;
    is_active: boolean;
    version: number;
    uploaded_at: string;
    created_at: string;
    updated_at: string;
    human_file_size?: string;
    is_image?: boolean;
    is_document?: boolean;
    extension?: string;
    lesson?: any;
    student?: any;
}

export interface UploadMaterialData {
    student_id: number;
    lesson_id?: number;
    file: File;
}

export interface MaterialsResponse {
    success: boolean;
    materials?: LessonMaterial[];
    material?: LessonMaterial;
    message?: string;
    error?: string;
}

class MaterialsManagerService {
    private baseURL = '/api';

    /**
     * Get materials for a student
     */
    async getMaterialsForStudent(studentId: number): Promise<LessonMaterial[]> {
        try {
            const response = await axios.get<MaterialsResponse>(
                `${this.baseURL}/tutor/students/${studentId}/materials`
            );
            return response.data.materials || [];
        } catch (error) {
            console.error('Error fetching materials:', error);
            throw error;
        }
    }

    /**
     * Get all versions of materials for a student
     */
    async getAllVersionsForStudent(studentId: number): Promise<LessonMaterial[]> {
        try {
            const response = await axios.get<MaterialsResponse>(
                `${this.baseURL}/tutor/students/${studentId}/materials/versions`
            );
            return response.data.materials || [];
        } catch (error) {
            console.error('Error fetching material versions:', error);
            throw error;
        }
    }

    /**
     * Upload a material
     */
    async uploadMaterial(data: UploadMaterialData): Promise<LessonMaterial> {
        try {
            const formData = new FormData();
            formData.append('student_id', data.student_id.toString());
            if (data.lesson_id) {
                formData.append('lesson_id', data.lesson_id.toString());
            }
            formData.append('file', data.file);

            const response = await axios.post<MaterialsResponse>(
                `${this.baseURL}/materials/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percentCompleted = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total
                            );
                            // You can emit progress events here if needed
                            console.log(`Upload progress: ${percentCompleted}%`);
                        }
                    }
                }
            );

            if (response.data.success && response.data.material) {
                return response.data.material;
            }
            
            throw new Error(response.data.error || 'Upload failed');
        } catch (error: any) {
            console.error('Error uploading material:', error);
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    }

    /**
     * Delete a material
     */
    async deleteMaterial(materialId: number): Promise<void> {
        try {
            const response = await axios.delete<MaterialsResponse>(
                `${this.baseURL}/materials/${materialId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting material:', error);
            throw error;
        }
    }

    /**
     * Toggle material active status
     */
    async toggleActive(materialId: number): Promise<boolean> {
        try {
            const response = await axios.put<{
                success: boolean;
                is_active: boolean;
                message: string;
            }>(`${this.baseURL}/materials/${materialId}/toggle-active`);

            if (response.data.success) {
                return response.data.is_active;
            }
            
            throw new Error('Failed to toggle status');
        } catch (error) {
            console.error('Error toggling material status:', error);
            throw error;
        }
    }

    /**
     * Download a material
     */
    downloadMaterial(materialId: number): void {
        const downloadUrl = `${this.baseURL}/materials/${materialId}/download`;
        window.open(downloadUrl, '_blank');
    }

    /**
     * Get materials by lesson
     */
    async getMaterialsByLesson(lessonId: number): Promise<LessonMaterial[]> {
        try {
            const response = await axios.get<MaterialsResponse>(
                `${this.baseURL}/materials/lesson/${lessonId}`
            );
            return response.data.materials || [];
        } catch (error) {
            console.error('Error fetching lesson materials:', error);
            throw error;
        }
    }

    /**
     * Validate file before upload
     */
    validateFile(file: File): { valid: boolean; error?: string } {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'File size exceeds maximum allowed size of 10MB'
            };
        }

        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'File type not allowed. Allowed types: JPG, JPEG, PNG, PDF, DOC, DOCX'
            };
        }

        return { valid: true };
    }

    /**
     * Get file icon based on mime type
     */
    getFileIcon(mimeType: string): string {
        if (mimeType.startsWith('image/')) {
            return '🖼️';
        }
        
        switch (mimeType) {
            case 'application/pdf':
                return '📄';
            case 'application/msword':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                return '📝';
            default:
                return '📎';
        }
    }

    /**
     * Format file size
     */
    formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * Group materials by original name
     */
    groupMaterialsByName(materials: LessonMaterial[]): Map<string, LessonMaterial[]> {
        const grouped = new Map<string, LessonMaterial[]>();
        
        materials.forEach(material => {
            const key = material.original_name;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(material);
        });
        
        // Sort versions within each group
        grouped.forEach(versions => {
            versions.sort((a, b) => b.version - a.version);
        });
        
        return grouped;
    }
}

export const MaterialsManager = new MaterialsManagerService();