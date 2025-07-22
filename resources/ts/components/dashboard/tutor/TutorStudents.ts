import { api } from '@services/ApiService'

interface TutorStudent {
    id: number
    name: string
    email: string
    phone?: string
    city?: string
    status: string
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
    private currentFilter = {
        status: 'all',
        search: '',
        language: ''
    }
    
    public getStudentsContent(): string {
        // Trigger async loading
        this.loadStudents()
        
        return `
            <div class="tutor-content-area">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Moi studenci</h2>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary" onclick="TutorStudents.exportStudents()">
                            <i class="bi bi-download me-2"></i>Eksportuj
                        </button>
                    </div>
                </div>
                
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
                                <option value="italian">Włoski</option>
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
            
            const response = await api.get<{success: boolean, data: {students: TutorStudent[], stats: any}, message?: string}>(`/tutor/students?${params.toString()}`)
            const students = response.data?.students || []
            const stats = response.data?.stats || {}
            
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
                        ${students.map(student => this.renderStudentRow(student)).join('')}
                    </tbody>
                </table>
            </div>
        `
        
        container.innerHTML = tableHtml
    }
    
    private renderStudentRow(student: TutorStudent): string {
        const initials = student.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)
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
        
        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-placeholder bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 45px; height: 45px; font-weight: 500;">
                            ${initials}
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
                    <div class="dropdown">
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
                            <li><a class="dropdown-item text-muted" href="#" onclick="TutorStudents.showComingSoon()">
                                <i class="bi bi-folder-plus me-2"></i>Materiały (wkrótce)
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
    static instance = new TutorStudents()
    
    static applyFilters(): void {
        const statusFilter = (document.getElementById('status-filter') as HTMLSelectElement)?.value
        const searchFilter = (document.getElementById('search-filter') as HTMLInputElement)?.value
        const languageFilter = (document.getElementById('language-filter') as HTMLSelectElement)?.value
        
        this.instance.currentFilter = {
            status: statusFilter || 'all',
            search: searchFilter || '',
            language: languageFilter || ''
        }
        
        this.instance.loadStudents()
    }
    
    static async viewStudentDetails(studentId: number): Promise<void> {
        // Open student details modal/page
        try {
            const response = await api.get<{success: boolean, data: {student: TutorStudent}}>(`/tutor/students/${studentId}`)
            const student = response.data?.student
            
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