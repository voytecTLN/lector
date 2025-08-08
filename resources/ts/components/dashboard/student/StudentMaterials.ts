import { MaterialService } from '@services/MaterialService'
import type { Material } from '@/types/models'

export class StudentMaterials {
    private materials: Material[] = []
    private filteredMaterials: Material[] = []
    private currentFilter: string = 'all'
    private searchQuery: string = ''
    
    public getMaterialsContent(): string {
        // Trigger async loading
        this.loadMaterials()
        
        return `
            <div class="student-content-area">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Moje materiały</h2>
                    <div class="d-flex gap-2">
                        <span class="badge bg-primary">
                            <i class="bi bi-files me-1"></i>
                            <span id="materials-count">0</span> materiałów
                        </span>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <label class="form-label">Filtruj według lektora</label>
                                <select id="tutor-filter" class="form-select">
                                    <option value="all">Wszyscy lektorzy</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Typ pliku</label>
                                <select id="type-filter" class="form-select">
                                    <option value="all">Wszystkie typy</option>
                                    <option value="image">Obrazy</option>
                                    <option value="document">Dokumenty</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Szukaj</label>
                                <input type="text" id="search-materials" class="form-control" placeholder="Nazwa pliku...">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Materials Grid -->
                <div id="materials-container">
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Ładowanie...</span>
                        </div>
                        <p class="mt-2">Ładowanie materiałów...</p>
                    </div>
                </div>
            </div>
        `
    }
    
    private async loadMaterials(): Promise<void> {
        try {
            this.materials = await MaterialService.getStudentMaterials()
            this.filteredMaterials = [...this.materials]
            
            this.renderMaterials()
            this.updateCount()
            this.populateTutorFilter()
            this.attachEventListeners()
            
        } catch (error) {
            console.error('Error loading materials:', error)
            this.renderError()
        }
    }
    
    private renderMaterials(): void {
        const container = document.getElementById('materials-container')
        if (!container) return
        
        if (this.filteredMaterials.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-folder2-open text-muted" style="font-size: 4rem;"></i>
                    <h5 class="mt-3">Brak materiałów</h5>
                    <p class="text-muted">Twoi lektorzy mogą przesyłać dla Ciebie materiały do nauki.</p>
                </div>
            `
            return
        }
        
        const groupedMaterials = this.groupMaterialsByTutor()
        
        container.innerHTML = Object.entries(groupedMaterials).map(([tutorName, materials]) => `
            <div class="mb-4">
                <h5 class="mb-3">
                    <i class="bi bi-person-circle me-2"></i>${tutorName}
                </h5>
                <div class="row g-3">
                    ${materials.map(material => this.renderMaterialCard(material)).join('')}
                </div>
            </div>
        `).join('')
    }
    
    private renderMaterialCard(material: Material): string {
        const icon = this.getFileIcon(material.mime_type)
        const size = this.formatFileSize(material.file_size)
        const date = new Date(material.uploaded_at).toLocaleDateString('pl-PL')
        const lessonInfo = material.lesson ? 
            `<small class="text-muted d-block">Lekcja: ${material.lesson.topic}</small>` : ''
        
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 material-card">
                    <div class="card-body">
                        <div class="d-flex align-items-start">
                            <div class="file-icon me-3">
                                <i class="bi ${icon} fs-1"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="card-title mb-1">${material.original_name}</h6>
                                ${lessonInfo}
                                <div class="text-muted small">
                                    ${size} • ${date}
                                    ${material.version > 1 ? `• Wersja ${material.version}` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-sm btn-primary" data-action="download" data-material-id="${material.id}">
                                <i class="bi bi-download me-1"></i>Pobierz
                            </button>
                            ${material.is_image ? `
                                <button class="btn btn-sm btn-outline-secondary" data-action="preview" data-material-id="${material.id}">
                                    <i class="bi bi-eye me-1"></i>Podgląd
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    private groupMaterialsByTutor(): Record<string, Material[]> {
        const grouped: Record<string, Material[]> = {}
        
        this.filteredMaterials.forEach(material => {
            const tutorName = material.tutor?.name || 'Nieznany lektor'
            if (!grouped[tutorName]) {
                grouped[tutorName] = []
            }
            grouped[tutorName].push(material)
        })
        
        return grouped
    }
    
    private populateTutorFilter(): void {
        const tutorFilter = document.getElementById('tutor-filter') as HTMLSelectElement
        if (!tutorFilter) return
        
        const tutors = new Set(this.materials.map(m => m.tutor?.name || 'Nieznany lektor'))
        
        tutorFilter.innerHTML = '<option value="all">Wszyscy lektorzy</option>'
        tutors.forEach(tutor => {
            tutorFilter.innerHTML += `<option value="${tutor}">${tutor}</option>`
        })
    }
    
    private attachEventListeners(): void {
        // Tutor filter
        const tutorFilter = document.getElementById('tutor-filter')
        tutorFilter?.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value
            this.filterMaterials('tutor', value)
        })
        
        // Type filter
        const typeFilter = document.getElementById('type-filter')
        typeFilter?.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value
            this.filterMaterials('type', value)
        })
        
        // Search
        const searchInput = document.getElementById('search-materials')
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase()
            this.applyFilters()
        })
        
        // Download and preview buttons
        document.getElementById('materials-container')?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            const button = target.closest('button[data-action]') as HTMLButtonElement
            
            if (button) {
                e.preventDefault()
                e.stopPropagation()
                
                const action = button.getAttribute('data-action')
                const materialId = button.getAttribute('data-material-id')
                
                if (action === 'download' && materialId) {
                    StudentMaterials.downloadMaterial(parseInt(materialId))
                } else if (action === 'preview' && materialId) {
                    StudentMaterials.previewMaterial(parseInt(materialId))
                }
            }
        })
    }
    
    private filterMaterials(filterType: string, value: string): void {
        this.currentFilter = value
        this.applyFilters()
    }
    
    private applyFilters(): void {
        this.filteredMaterials = this.materials.filter(material => {
            // Tutor filter
            const tutorFilter = (document.getElementById('tutor-filter') as HTMLSelectElement)?.value || 'all'
            if (tutorFilter !== 'all' && material.tutor?.name !== tutorFilter) {
                return false
            }
            
            // Type filter
            const typeFilter = (document.getElementById('type-filter') as HTMLSelectElement)?.value || 'all'
            if (typeFilter !== 'all') {
                if (typeFilter === 'image' && !material.mime_type.startsWith('image/')) {
                    return false
                }
                if (typeFilter === 'document' && material.mime_type.startsWith('image/')) {
                    return false
                }
            }
            
            // Search query
            if (this.searchQuery && !material.original_name.toLowerCase().includes(this.searchQuery)) {
                return false
            }
            
            return true
        })
        
        this.renderMaterials()
        this.updateCount()
    }
    
    private updateCount(): void {
        const countEl = document.getElementById('materials-count')
        if (countEl) {
            countEl.textContent = this.filteredMaterials.length.toString()
        }
    }
    
    private renderError(): void {
        const container = document.getElementById('materials-container')
        if (!container) return
        
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Błąd podczas ładowania materiałów. Spróbuj ponownie później.
            </div>
        `
    }
    
    private getFileIcon(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'bi-file-image'
        if (mimeType === 'application/pdf') return 'bi-file-pdf'
        if (mimeType.includes('word')) return 'bi-file-word'
        return 'bi-file-earmark'
    }
    
    private formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB']
        let size = bytes
        let unitIndex = 0
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024
            unitIndex++
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`
    }
    
    static async downloadMaterial(materialId: number): Promise<void> {
        try {
            // Show loading state
            const loadingEl = document.createElement('div')
            loadingEl.className = 'download-loading'
            loadingEl.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Pobieranie...'
            loadingEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #fff; padding: 10px 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 9999;'
            document.body.appendChild(loadingEl)
            
            // Get the file using Material service
            const blob = await MaterialService.downloadMaterial(materialId)
            const filename = `material_${materialId}`
            
            // Create blob URL and trigger download
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            
            // Cleanup
            setTimeout(() => {
                window.URL.revokeObjectURL(url)
                document.body.removeChild(link)
                document.body.removeChild(loadingEl)
            }, 100)
            
            // Show success notification
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Plik został pobrany pomyślnie',
                    duration: 2000
                }
            }))
            
        } catch (error: any) {
            console.error('Download error:', error)
            
            // Remove loading state if exists
            const loadingEl = document.querySelector('.download-loading')
            if (loadingEl) {
                loadingEl.remove()
            }
            
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: error.message || 'Błąd podczas pobierania pliku',
                    duration: 3000
                }
            }))
        }
    }
    
    static previewMaterial(materialId: number): void {
        // For now, just download. In future, could show in modal
        StudentMaterials.downloadMaterial(materialId)
    }
}

// Export to global scope
;(window as any).StudentMaterials = StudentMaterials