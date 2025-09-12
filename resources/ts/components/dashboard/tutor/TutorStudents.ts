import { tutorService } from '@services/TutorService'
import { MaterialService } from '@services/MaterialService'
import { AvatarHelper } from '@/utils/AvatarHelper'

interface TutorStudent {
    id: number
    name: string
    email: string
    phone?: string
    city?: string
    status: string
    avatar?: string
    created_at: string
    last_lesson_date?: string
    next_lesson_date?: string
    total_lessons: number
    completed_lessons: number
    active_package?: {
        id: number
        name: string
        hours_remaining: number
        hours_total: number
        expires_at: string
    }
    student_profile?: {
        learning_languages: string[]
        learning_goals: string[]
        current_levels?: Record<string, string>
    }
}

export class TutorStudents {
    private tutorId?: number // For admin view - when viewing specific tutor's students
    private currentFilter = {
        status: 'all',
        search: '',
        language: ''
    }
    
    constructor(tutorId?: number) {
        // Defensive check - in case tutorId is passed as function by mistake
        if (typeof tutorId === 'function') {
            console.error('TutorStudents constructor received function instead of number:', tutorId)
            this.tutorId = undefined
        } else {
            this.tutorId = tutorId
        }
        // Set as global instance for static methods
        (window as any).currentTutorStudentsInstance = this
    }
    
    public getStudentsContent(): string {
        // Trigger async loading
        this.loadStudents()
        
        return `
            <style>
                /* Ensure dropdown menus appear above other content */
                .tutor-content-area .dropdown-menu {
                    z-index: 1050 !important;
                }
                
                /* Alternative: Make dropdowns open upward when near bottom */
                .table-responsive {
                    overflow: visible !important;
                }
                
                /* For last rows in table, open dropdown upward */
                .table tbody tr:nth-last-child(-n+3) .dropdown-menu {
                    bottom: 100%;
                    top: auto !important;
                    margin-bottom: 0.125rem;
                }
            </style>
            <div class="tutor-content-area">
                ${this.renderStats()}
                ${this.renderFilters()}
                
                <div id="students-container">
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Ładowanie...</span>
                        </div>
                        <p class="mt-2">Ładowanie studentów...</p>
                    </div>
                </div>
            </div>
        `
    }
    
    private renderStats(): string {
        return `
            <div class="row mb-4" id="students-stats">
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="d-flex align-items-center justify-content-center mb-2">
                                <div class="stat-icon bg-primary bg-opacity-10 rounded-circle p-3">
                                    <i class="bi bi-people text-primary fs-4"></i>
                                </div>
                            </div>
                            <h4 class="mb-0" id="total-students">-</h4>
                            <p class="text-muted small mb-0">Łączna liczba studentów</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="d-flex align-items-center justify-content-center mb-2">
                                <div class="stat-icon bg-success bg-opacity-10 rounded-circle p-3">
                                    <i class="bi bi-person-check text-success fs-4"></i>
                                </div>
                            </div>
                            <h4 class="mb-0" id="active-students">-</h4>
                            <p class="text-muted small mb-0">Aktywni studenci</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="d-flex align-items-center justify-content-center mb-2">
                                <div class="stat-icon bg-info bg-opacity-10 rounded-circle p-3">
                                    <i class="bi bi-calendar-check text-info fs-4"></i>
                                </div>
                            </div>
                            <h4 class="mb-0" id="lessons-this-week">-</h4>
                            <p class="text-muted small mb-0">Lekcje w tym tygodniu</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="d-flex align-items-center justify-content-center mb-2">
                                <div class="stat-icon bg-warning bg-opacity-10 rounded-circle p-3">
                                    <i class="bi bi-clock text-warning fs-4"></i>
                                </div>
                            </div>
                            <h4 class="mb-0" id="upcoming-lessons">-</h4>
                            <p class="text-muted small mb-0">Nadchodzące lekcje</p>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    private renderFilters(): string {
        return `
            <div class="card mb-4">
                <div class="card-body">
                    <h5 class="card-title mb-3">Filtry</h5>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label for="status-filter" class="form-label">Status</label>
                            <select class="form-select" id="status-filter" onchange="TutorStudents.applyFilters()">
                                <option value="all">Wszyscy studenci</option>
                                <option value="active">Aktywni</option>
                                <option value="inactive">Nieaktywni</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="language-filter" class="form-label">Język nauki</label>
                            <select class="form-select" id="language-filter" onchange="TutorStudents.applyFilters()">
                                <option value="">Wszystkie języki</option>
                                <option value="english">Angielski</option>
                                <option value="german">Niemiecki</option>
                                <option value="french">Francuski</option>
                                <option value="spanish">Hiszpański</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="search-filter" class="form-label">Wyszukaj</label>
                            <input type="text" class="form-control" id="search-filter" placeholder="Imię, nazwisko, email..." oninput="TutorStudents.applyFilters()">
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    private async loadStudents(): Promise<void> {
        try {
            // Build query params
            const params = new URLSearchParams()
            if (this.currentFilter.status !== 'all') params.append('status', this.currentFilter.status)
            if (this.currentFilter.search) params.append('search', this.currentFilter.search)
            if (this.currentFilter.language) params.append('language', this.currentFilter.language)
            
            let result
            if (this.tutorId) {
                // Admin view - get students for specific tutor
                result = await tutorService.getStudentsForTutor(this.tutorId, {
                    status: this.currentFilter.status,
                    search: this.currentFilter.search,
                    language: this.currentFilter.language
                })
            } else {
                // Tutor view - get own students
                result = await tutorService.getStudents({
                    status: this.currentFilter.status,
                    search: this.currentFilter.search,
                    language: this.currentFilter.language
                })
            }
            
            // Handle nested response structure
            // The API returns { students: { students: [...], stats: {...} } }
            // We need to extract the actual arrays and objects
            let students: TutorStudent[] = []
            let stats: any = {}
            
            if (result.students && typeof result.students === 'object' && !Array.isArray(result.students)) {
                // Handle double-nested structure when students is an object
                const nestedData = result.students as any
                if ('students' in nestedData) {
                    students = Array.isArray(nestedData.students) ? nestedData.students : []
                    stats = nestedData.stats || result.stats || {}
                } else {
                    // If students is an object but doesn't have nested students, use stats from result
                    stats = result.stats || {}
                }
            } else if (Array.isArray(result.students)) {
                // Handle direct array
                students = result.students
                stats = result.stats || {}
            } else {
                // Fallback
                students = []
                stats = result.stats || {}
            }
            
            this.updateStats(stats)
            this.renderStudents(students)
        } catch (error) {
            console.error('Error loading students:', error)
            this.renderError()
        }
    }
    
    private updateStats(stats: any): void {
        const totalEl = document.getElementById('total-students')
        const activeEl = document.getElementById('active-students') 
        const lessonsEl = document.getElementById('lessons-this-week')
        const upcomingEl = document.getElementById('upcoming-lessons')
        
        if (totalEl) totalEl.textContent = stats.totalStudents || '0'
        if (activeEl) activeEl.textContent = stats.activeStudents || '0'
        if (lessonsEl) lessonsEl.textContent = stats.lessonsThisWeek || '0'
        if (upcomingEl) upcomingEl.textContent = stats.upcomingLessons || '0'
    }
    
    private renderStudents(students: TutorStudent[]): void {
        const container = document.getElementById('students-container')
        if (!container) return
        
        
        // Defensive check - ensure students is array
        if (!Array.isArray(students)) {
            console.error('❌ students is not an array:', students)
            this.renderError()
            return
        }
        
        if (students.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="mb-3">
                        <i class="bi bi-people" style="font-size: 3rem; color: #6c757d;"></i>
                    </div>
                    <h5>Brak studentów</h5>
                    <p class="text-muted">Gdy studenci zapiszą się na Twoje lekcje, zobaczysz ich tutaj.</p>
                </div>
            `
            return
        }
        
        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Student</th>
                            <th>Kontakt</th>
                            <th>Pakiet</th>
<!--                             <th>Postępy</th> -->
                            <th>Ostatnia lekcja</th>
                            <th>Następna lekcja</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((student, index) => this.renderStudentRow(student, index, students.length)).join('')}
                    </tbody>
                </table>
            </div>
        `
        
        container.innerHTML = tableHtml
    }
    
    private renderStudentRow(student: TutorStudent, index: number, totalStudents: number): string {
        // Use dropup for last 3 rows to prevent overflow
        const isLastRows = index >= totalStudents - 3
        const dropdownClass = isLastRows ? 'dropup' : 'dropdown'
        const packageInfo = student.active_package 
            ? `${student.active_package.name}<br><small class="text-muted">${student.active_package.hours_remaining}/${student.active_package.hours_total} godzin</small>`
            : '<span class="text-muted">Brak pakietu</span>'
        
        const progressPercent = student.total_lessons > 0 ? Math.round((student.completed_lessons / student.total_lessons) * 100) : 0
        
        const lastLesson = student.last_lesson_date 
            ? new Date(student.last_lesson_date).toLocaleDateString('pl-PL')
            : '<span class="text-muted">-</span>'
            
        const nextLesson = student.next_lesson_date 
            ? new Date(student.next_lesson_date).toLocaleDateString('pl-PL')
            : '<span class="text-muted">-</span>'
        
        const avatarHtml = AvatarHelper.render({
            name: student.name,
            avatar: student.avatar,
            size: 'md',
            userId: student.id
        })
        
        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            ${avatarHtml}
                        </div>
                        <div>
                            <div class="fw-semibold">${student.name}</div>
                            <div class="small text-muted">${student.city || 'Brak miasta'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="small">
                        <div><i class="bi bi-envelope me-1"></i>${student.email}</div>
                        ${student.phone ? `<div><i class="bi bi-telephone me-1"></i>${student.phone}</div>` : ''}
                    </div>
                </td>
                <td>
                    <div class="small">
                        ${packageInfo}
                    </div>
                </td>
                <!-- <td>
                    <div class="d-flex align-items-center">
                        <div class="progress me-2" style="width: 60px; height: 8px;">
                            <div class="progress-bar" role="progressbar" style="width: ${progressPercent}%"></div>
                        </div>
                        <small class="text-muted">${student.completed_lessons}/${student.total_lessons}</small>
                    </div>
                </td> -->
                <td><div class="small">${lastLesson}</div></td>
                <td><div class="small">${nextLesson}</div></td>
                <td>
                    <div class="${dropdownClass}">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            Akcje
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="TutorStudents.viewStudentDetails(${student.id})">
                                <i class="bi bi-eye me-2"></i>Szczegóły
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="TutorStudents.viewLessonsHistory(${student.id})">
                                <i class="bi bi-clock-history me-2"></i>Historia lekcji
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#" onclick="TutorStudents.showMaterialsModal(${student.id})">
                                <i class="bi bi-folder-plus me-2"></i>Materiały
                            </a></li>
                            <li><a class="dropdown-item text-muted" href="#" onclick="TutorStudents.showComingSoon()">
                                <i class="bi bi-chat-dots me-2"></i>Komunikacja (wkrótce)
                            </a></li>
                        </ul>
                    </div>
                </td>
            </tr>
        `
    }
    
    private renderError(): void {
        const container = document.getElementById('students-container')
        if (!container) return
        
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4 class="alert-heading">Błąd</h4>
                <p>Nie udało się załadować listy studentów.</p>
                <hr>
                <button class="btn btn-primary" onclick="location.reload()">Odśwież stronę</button>
            </div>
        `
    }
    
    // Static methods for global access
    static instance = new TutorStudents(undefined) // Fix: pass undefined for regular tutor view
    
    static applyFilters(): void {
        // Get the current instance from the global scope or create a new one
        const instance = (window as any).currentTutorStudentsInstance || this.instance
        
        const statusFilter = (document.getElementById('status-filter') as HTMLSelectElement)?.value
        const searchFilter = (document.getElementById('search-filter') as HTMLInputElement)?.value
        const languageFilter = (document.getElementById('language-filter') as HTMLSelectElement)?.value
        
        instance.currentFilter = {
            status: statusFilter || 'all',
            search: searchFilter || '',
            language: languageFilter || ''
        }
        
        instance.loadStudents()
    }
    
    static async viewStudentDetails(studentId: number): Promise<void> {
        // Open student details modal/page
        try {
            const student = await tutorService.getStudentById(studentId)
            
            if (student) {
                this.showStudentDetailsModal(student)
            }
        } catch (error) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Nie udało się załadować szczegółów studenta',
                    duration: 3000
                }
            }))
        }
    }
    
    static showStudentDetailsModal(student: TutorStudent): void {
        // Create and show student details modal
        const languages = student.student_profile?.learning_languages?.join(', ') || 'Brak'
        const goals = student.student_profile?.learning_goals?.join(', ') || 'Brak'
        
        const modalHtml = `
            <div class="modal fade" id="studentDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Szczegóły studenta - ${student.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Informacje podstawowe</h6>
                                    <p><strong>Email:</strong> ${student.email}</p>
                                    <p><strong>Telefon:</strong> ${student.phone || 'Brak'}</p>
                                    <p><strong>Miasto:</strong> ${student.city || 'Brak'}</p>
                                    <p><strong>Status:</strong> <span class="badge bg-${student.status === 'active' ? 'success' : 'secondary'}">${student.status}</span></p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Preferencje nauki</h6>
                                    <p><strong>Języki:</strong> ${languages}</p>
                                    <p><strong>Cele:</strong> ${goals}</p>
                                </div>
                            </div>
                            
                            ${student.active_package ? `
                            <hr>
                            <h6>Aktywny pakiet</h6>
                            <div class="card">
                                <div class="card-body">
                                    <h6 class="card-title">${student.active_package.name}</h6>
                                    <div class="progress mb-2">
                                        <div class="progress-bar" style="width: ${(student.active_package.hours_remaining / student.active_package.hours_total) * 100}%"></div>
                                    </div>
                                    <p class="small mb-0">Pozostało: ${student.active_package.hours_remaining} / ${student.active_package.hours_total} godzin</p>
                                    <p class="small text-muted">Ważny do: ${new Date(student.active_package.expires_at).toLocaleDateString('pl-PL')}</p>
                                </div>
                            </div>
                            ` : ''}
                            
                            <hr>
                            <h6>Statystyki lekcji</h6>
                            <div class="row">
                                <div class="col-md-4 text-center">
                                    <div class="h4 text-primary">${student.total_lessons}</div>
                                    <div class="small text-muted">Łączne lekcje</div>
                                </div>
                                <div class="col-md-4 text-center">
                                    <div class="h4 text-success">${student.completed_lessons}</div>
                                    <div class="small text-muted">Zakończone</div>
                                </div>
                                <div class="col-md-4 text-center">
                                    <div class="h4 text-info">${student.total_lessons - student.completed_lessons}</div>
                                    <div class="small text-muted">Zaplanowane</div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zamknij</button>
                            <button type="button" class="btn btn-primary" onclick="TutorStudents.viewLessonsHistory(${student.id})" data-bs-dismiss="modal">
                                <i class="bi bi-clock-history me-2"></i>Historia lekcji
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
        
        // Remove any existing modal
        const existingModal = document.getElementById('studentDetailsModal')
        if (existingModal) {
            existingModal.remove()
        }
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml)
        
        // Show modal
        const modal = new (window as any).bootstrap.Modal(document.getElementById('studentDetailsModal'))
        modal.show()
    }
    
    static async viewLessonsHistory(studentId: number): Promise<void> {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: 'Historia lekcji studenta - funkcja w przygotowaniu',
                duration: 3000
            }
        }))
    }
    
    static showComingSoon(): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: 'Ta funkcja będzie dostępna wkrótce!',
                duration: 3000
            }
        }))
    }
    
    static async showMaterialsModal(studentId: number): Promise<void> {
        try {
            // Get student data
            const student = await tutorService.getStudentById(studentId) || { name: 'Student' }
            
            const modalHtml = `
                <div class="modal fade" id="materialsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Materiały dla ${student.name}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-4">
                                    <div class="border-2 border-dashed border-secondary rounded p-4 text-center">
                                        <input type="file" id="materialFile" class="d-none" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx">
                                        <button class="btn btn-primary" onclick="document.getElementById('materialFile').click()">
                                            <i class="bi bi-cloud-upload me-2"></i>Wybierz plik
                                        </button>
                                        <p class="small text-muted mt-2 mb-0">
                                            Dozwolone formaty: JPG, JPEG, PNG, PDF, DOC, DOCX (max 10MB)
                                        </p>
                                        <div id="uploadProgress" class="mt-3 d-none">
                                            <div class="progress">
                                                <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div id="materialsContainer">
                                    <div class="text-center py-3">
                                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                                            <span class="visually-hidden">Ładowanie...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
            
            // Remove existing modal if any
            const existingModal = document.getElementById('materialsModal')
            if (existingModal) {
                existingModal.remove()
            }
            
            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHtml)
            
            // Show modal
            const modal = new (window as any).bootstrap.Modal(document.getElementById('materialsModal'))
            modal.show()
            
            // Load materials
            await TutorStudents.loadMaterials(studentId)
            
            // Setup file upload handler
            const fileInput = document.getElementById('materialFile') as HTMLInputElement
            fileInput.addEventListener('change', (e) => TutorStudents.handleFileUpload(e, studentId))
            
        } catch (error) {
            console.error('Error showing materials modal:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Błąd podczas ładowania materiałów',
                    duration: 3000
                }
            }))
        }
    }
    
    private static async loadMaterials(studentId: number): Promise<void> {
        try {
            const materials = await tutorService.getStudentMaterials(studentId)
            
            const container = document.getElementById('materialsContainer')
            if (!container) return
            
            if (materials.length === 0) {
                container.innerHTML = '<p class="text-center text-muted">Brak materiałów dla tego studenta</p>'
                return
            }
            
            container.innerHTML = materials.map((material: any) => `
                <div class="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
                    <div class="d-flex align-items-center">
                        <i class="bi ${TutorStudents.getFileIcon(material.mime_type)} fs-3 me-3"></i>
                        <div>
                            <div class="fw-semibold">${material.original_name}</div>
                            <div class="small text-muted">
                                ${TutorStudents.formatFileSize(material.file_size)} • 
                                Wersja ${material.version} • 
                                ${new Date(material.uploaded_at).toLocaleDateString('pl-PL')}
                            </div>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="TutorStudents.downloadMaterial(${material.id})">
                            <i class="bi bi-download"></i>
                        </button>
                        <!--
                        <button class="btn btn-sm ${material.is_active ? 'btn-success' : 'btn-outline-secondary'}" 
                                onclick="TutorStudents.toggleMaterialActive(${material.id}, ${studentId})"
                                title="${material.is_active ? 'Materiał aktywny' : 'Materiał nieaktywny'}">
                            <i class="bi bi-check-circle"></i>
                        </button>
                        -->
                        <button class="btn btn-sm btn-outline-danger" onclick="TutorStudents.deleteMaterial(${material.id}, ${studentId})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')
            
        } catch (error) {
            console.error('Error loading materials:', error)
        }
    }
    
    private static async handleFileUpload(event: Event, studentId: number): Promise<void> {
        const input = event.target as HTMLInputElement
        const file = input.files?.[0]
        if (!file) return
        
        // Validate file
        const maxSize = 10 * 1024 * 1024 // 10MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 
                              'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        
        if (file.size > maxSize) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: { type: 'error', message: 'Plik jest za duży (max 10MB)', duration: 3000 }
            }))
            return
        }
        
        if (!allowedTypes.includes(file.type)) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: { type: 'error', message: 'Niedozwolony typ pliku', duration: 3000 }
            }))
            return
        }
        
        // Show progress
        const progressDiv = document.getElementById('uploadProgress')
        const progressBar = progressDiv?.querySelector('.progress-bar') as HTMLElement
        if (progressDiv && progressBar) {
            progressDiv.classList.remove('d-none')
            progressBar.style.width = '0%'
        }
        
        // Upload file
        const formData = new FormData()
        formData.append('student_id', studentId.toString())
        formData.append('file', file)
        
        try {
            // Upload with simulated progress
            const uploadPromise = MaterialService.uploadMaterialToAPI(formData)
            
            // Simulate progress for better UX
            let currentProgress = 0
            const progressInterval = setInterval(() => {
                if (progressBar && currentProgress < 90) {
                    currentProgress += 10
                    progressBar.style.width = currentProgress + '%'
                }
            }, 200)
            
            await uploadPromise
            
            clearInterval(progressInterval)
            if (progressBar) progressBar.style.width = '100%'
            
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: { type: 'success', message: 'Plik został przesłany pomyślnie', duration: 3000 }
            }))
            
            // Reset form first
            setTimeout(() => {
                input.value = ''
                if (progressDiv) {
                    progressDiv.classList.add('d-none')
                    const progressBar = progressDiv.querySelector('.progress-bar') as HTMLElement
                    if (progressBar) progressBar.style.width = '0%'
                }
            }, 1000)
            
            // Reload materials
            await TutorStudents.loadMaterials(studentId)
            
        } catch (error: any) {
            console.error('Upload error:', error)
            const message = error.response?.data?.error || 'Błąd podczas przesyłania pliku'
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: { type: 'error', message, duration: 3000 }
            }))
            
            if (progressDiv) progressDiv.classList.add('d-none')
        }
    }
    
    private static downloadMaterial(materialId: number): void {
        window.open(`/api/materials/${materialId}/download`, '_blank')
    }
    
    private static async toggleMaterialActive(materialId: number, studentId: number): Promise<void> {
        try {
            await MaterialService.toggleMaterialActive(materialId)
            await TutorStudents.loadMaterials(studentId)
        } catch (error) {
            console.error('Error toggling material:', error)
        }
    }
    
    private static async deleteMaterial(materialId: number, studentId: number): Promise<void> {
        if (!confirm('Czy na pewno chcesz usunąć ten materiał?')) return
        
        try {
            await MaterialService.deleteMaterial(materialId)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: { type: 'success', message: 'Materiał został usunięty', duration: 3000 }
            }))
            await TutorStudents.loadMaterials(studentId)
        } catch (error) {
            console.error('Error deleting material:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: { type: 'error', message: 'Błąd podczas usuwania materiału', duration: 3000 }
            }))
        }
    }
    
    private static getFileIcon(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'bi-file-image'
        if (mimeType === 'application/pdf') return 'bi-file-pdf'
        if (mimeType.includes('word')) return 'bi-file-word'
        return 'bi-file-earmark'
    }
    
    private static formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB']
        let size = bytes
        let unitIndex = 0
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024
            unitIndex++
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`
    }
    
    static async exportStudents(): Promise<void> {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: 'Eksport studentów - funkcja w przygotowaniu',
                duration: 3000
            }
        }))
    }
}

// Export to global scope
;(window as any).TutorStudents = TutorStudents