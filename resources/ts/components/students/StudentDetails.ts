// resources/ts/components/students/StudentDetails.ts
import type { RouteComponent } from '@router/routes'
import { StudentService, HourPackage, StudentStats } from '@services/StudentService'
import type { User, StudentProfile } from '@/types/models'

export class StudentDetails implements RouteComponent {
    private studentService: StudentService
    private studentId: number | null = null
    private student: (User & {
        studentProfile: StudentProfile;
        hour_package: HourPackage;
        upcoming_lessons: any[];
        stats: StudentStats;
    }) | null = null
    private container: HTMLElement | null = null

    constructor() {
        this.studentService = new StudentService()
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'student-details-page'

        // Get student ID from URL path
        const pathMatch = window.location.pathname.match(/\/students\/(\d+)/)
        const hashMatch = window.location.hash.match(/\/students\/(\d+)/)
        this.studentId = parseInt(pathMatch?.[1] || hashMatch?.[1] || '0', 10)

        el.innerHTML = `
            <div class="container mt-4">
                <div class="student-details-container" data-student-id="${this.studentId}">
                    <!-- Loading state -->
                    <div class="d-flex justify-content-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Ładowanie...</span>
                        </div>
                    </div>
                </div>
            </div>
        `

        return el
    }

    async mount(container: HTMLElement): Promise<void> {
        this.container = container

        if (!this.studentId || this.studentId === 0) {
            this.showError('Nieprawidłowy identyfikator studenta')
            return
        }

        await this.loadStudentData()
    }

    unmount(): void {
        // Cleanup if needed
        this.container = null
        this.student = null
        this.studentId = null
    }

    private async loadStudentData(): Promise<void> {
        if (!this.studentId) return

        try {
            this.showLoading()
            this.student = await this.studentService.getStudentById(this.studentId)
            this.renderStudentData()
        } catch (error) {
            console.error('Failed to load student data:', error)
            this.showError('Wystąpił błąd podczas ładowania danych studenta')
        }
    }

    private showLoading(): void {
        const detailsContainer = this.container?.querySelector('.student-details-container')
        if (!detailsContainer) return

        detailsContainer.innerHTML = `
            <div class="d-flex justify-content-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Ładowanie...</span>
                </div>
            </div>
        `
    }

    private showError(message: string = 'Wystąpił błąd'): void {
        const detailsContainer = this.container?.querySelector('.student-details-container')
        if (!detailsContainer) return

        detailsContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${message}
                <a href="/#/admin/students" class="alert-link ms-2">Wróć do listy studentów</a>
            </div>
        `
    }

    private renderStudentData(): void {
        const detailsContainer = this.container?.querySelector('.student-details-container')
        if (!detailsContainer || !this.student) return

        // Update page title
        document.title = `${this.student.name} - Profil studenta`

        detailsContainer.innerHTML = `
            <!-- Header -->
            <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <a href="/#/admin/students" class="text-muted text-decoration-none mb-2 d-inline-block">
                            <i class="bi bi-arrow-left me-1"></i> Powrót do listy
                        </a>
                        <h1 class="student-name">${this.student.name}</h1>
                        <p class="text-muted mb-0">${this.student.email}</p>
                    </div>
                    <div class="d-flex gap-2">
                        <a href="/#/admin/students/${this.student.id}/edit" class="btn btn-primary">
                            <i class="bi bi-pencil me-1"></i> Edytuj
                        </a>
                        <button class="btn btn-danger student-delete-btn">
                            <i class="bi bi-trash me-1"></i> Usuń
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <ul class="nav nav-tabs mb-4" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#profile-tab-pane">
                        <i class="bi bi-person me-1"></i> Profil
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#package-tab-pane">
                        <i class="bi bi-clock me-1"></i> Pakiet godzin
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#lessons-tab-pane">
                        <i class="bi bi-calendar me-1"></i> Lekcje
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#stats-tab-pane">
                        <i class="bi bi-graph-up me-1"></i> Statystyki
                    </button>
                </li>
            </ul>

            <!-- Tab Content -->
            <div class="tab-content">
                <div class="tab-pane fade show active" id="profile-tab-pane" role="tabpanel">
                    ${this.generateProfileHTML()}
                </div>
                <div class="tab-pane fade" id="package-tab-pane" role="tabpanel">
                    ${this.generatePackageHTML()}
                </div>
                <div class="tab-pane fade" id="lessons-tab-pane" role="tabpanel">
                    ${this.generateLessonsHTML()}
                </div>
                <div class="tab-pane fade" id="stats-tab-pane" role="tabpanel">
                    ${this.generateStatsHTML()}
                </div>
            </div>
        `

        // Setup event listeners
        this.setupEventListeners()
    }

    private setupEventListeners(): void {
        // Delete button
        const deleteBtn = this.container?.querySelector('.student-delete-btn')
        deleteBtn?.addEventListener('click', this.handleDeleteClick.bind(this))

        // Tab change events
        const tabElements = this.container?.querySelectorAll('[data-bs-toggle="tab"]')
        tabElements?.forEach(tab => {
            tab.addEventListener('shown.bs.tab', this.handleTabChange.bind(this))
        })
    }

    private generateProfileHTML(): string {
        if (!this.student) return ''

        const profile = this.student.studentProfile

        const learningLanguagesHTML = profile.learning_languages.map(lang => {
            const level = profile.current_levels?.[lang] || 'A1'
            return `<span class="badge bg-primary me-2">${lang.toUpperCase()} ${level}</span>`
        }).join('')

        const learningGoalsHTML = profile.learning_goals.map(goal => {
            return `<li class="mb-1">${this.getGoalLabel(goal)}</li>`
        }).join('')

        return `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Dane osobowe</h5>
                    <a href="/#/admin/students/${this.student.id}/edit" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-pencil me-1"></i> Edytuj
                    </a>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label text-muted">Imię i nazwisko</label>
                                <p class="mb-0">${this.student.name}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted">E-mail</label>
                                <p class="mb-0">${this.student.email}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted">Telefon</label>
                                <p class="mb-0">${this.student.phone || '-'}</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label text-muted">Data urodzenia</label>
                                <p class="mb-0">${this.formatDate(this.student.birth_date) || '-'}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted">Miasto</label>
                                <p class="mb-0">${this.student.city || '-'}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted">Status</label>
                                <p class="mb-0">
                                    <span class="badge ${this.getStatusBadgeClass(this.student.status || 'inactive')}">
                                        ${this.getStatusLabel(this.student.status || 'inactive')}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Języki i cele</h5>
                </div>
                <div class="card-body">
                    <div class="mb-4">
                        <label class="form-label text-muted">Języki do nauki i poziomy</label>
                        <div>${learningLanguagesHTML || '<span class="text-muted">Brak wybranych języków</span>'}</div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="form-label text-muted">Cele nauki</label>
                        ${learningGoalsHTML ? `<ul class="mb-0">${learningGoalsHTML}</ul>` : '<p class="text-muted mb-0">Brak określonych celów</p>'}
                    </div>
                    
                    <div>
                        <label class="form-label text-muted">Preferowany harmonogram</label>
                        <p class="text-muted mb-0">🔧 Funkcja harmonogramu będzie dostępna wkrótce</p>
                    </div>
                </div>
            </div>
        `
    }

    private generatePackageHTML(): string {
        if (!this.student) return ''

        const packageInfo = this.student.hour_package

        if (!packageInfo || packageInfo.is_placeholder) {
            return `
                <div class="text-center py-5">
                    <div class="mb-3">
                        <i class="bi bi-box text-muted" style="font-size: 3rem;"></i>
                    </div>
                    <h5>Pakiet godzin (wkrótce)</h5>
                    <p class="text-muted">System pakietów godzinowych będzie dostępny w następnej wersji.</p>
                    <button class="btn btn-primary mt-3" disabled>
                        <i class="bi bi-plus-circle me-1"></i> Dodaj pakiet godzin
                    </button>
                    <p class="text-muted mt-2"><small>🔧 Funkcja w przygotowaniu</small></p>
                </div>
            `
        }

        return `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Aktualny pakiet (demo)</h5>
                    <span class="badge bg-info">Dane demonstracyjne</span>
                </div>
                <div class="card-body">
                    <div class="row align-items-center mb-4">
                        <div class="col-md-6">
                            <h6>Pakiet ${packageInfo.total_hours} godzin</h6>
                            <p class="text-muted mb-0">Ważny do: ${this.formatDate(packageInfo.expires_at)}</p>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <h3 class="mb-0">
                                <span class="text-primary">${packageInfo.remaining_hours}</span>
                                <small class="text-muted">/ ${packageInfo.total_hours} h</small>
                            </h3>
                        </div>
                    </div>
                    
                    <div class="progress" style="height: 10px;">
                        <div class="progress-bar bg-primary" role="progressbar" 
                            style="width: ${packageInfo.percentage}%;">
                        </div>
                    </div>
                    
                    <div class="mt-3 d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary" disabled>
                            <i class="bi bi-pencil me-1"></i> Edytuj
                        </button>
                        <button class="btn btn-sm btn-outline-success" disabled>
                            <i class="bi bi-plus-circle me-1"></i> Dodaj godziny
                        </button>
                        <span class="text-muted ms-2">
                            <small>🔧 Funkcje będą dostępne wkrótce</small>
                        </span>
                    </div>
                </div>
            </div>
        `
    }

    private generateLessonsHTML(): string {
        return `
            <div class="text-center py-5">
                <div class="mb-3">
                    <i class="bi bi-calendar-x text-muted" style="font-size: 3rem;"></i>
                </div>
                <h5>System lekcji (wkrótce)</h5>
                <p class="text-muted">Moduł zarządzania lekcjami będzie dostępny w następnej wersji.</p>
                <button class="btn btn-primary mt-3" disabled>
                    <i class="bi bi-calendar-plus me-1"></i> Zaplanuj lekcję
                </button>
                <p class="text-muted mt-2"><small>🔧 Funkcja w przygotowaniu</small></p>
            </div>
        `
    }

    private generateStatsHTML(): string {
        if (!this.student) return ''

        const stats = this.student.stats

        return `
            <div class="row">
                <div class="col-md-6 col-lg-3 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h2 class="mb-1">${stats.total_lessons}</h2>
                            <p class="text-muted mb-0">Wszystkie lekcje</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-3 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h2 class="mb-1">${stats.total_hours}</h2>
                            <p class="text-muted mb-0">Godziny łącznie</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-3 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h2 class="mb-1">${stats.completed_lessons}</h2>
                            <p class="text-muted mb-0">Ukończone lekcje</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-3 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h2 class="mb-1">${stats.cancelled_lessons}</h2>
                            <p class="text-muted mb-0">Anulowane lekcje</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Wykresy i analizy (wkrótce)</h5>
                </div>
                <div class="card-body text-center py-5">
                    <i class="bi bi-graph-up text-muted" style="font-size: 3rem;"></i>
                    <p class="text-muted mt-3">Szczegółowe analizy postępów będą dostępne w przyszłej wersji</p>
                    <p class="text-muted"><small>🔧 Funkcja w przygotowaniu</small></p>
                </div>
            </div>
        `
    }

    private async handleDeleteClick(e: Event): Promise<void> {
        e.preventDefault()

        if (!this.studentId || !this.student) return

        if (!confirm(`Czy na pewno chcesz usunąć studenta ${this.student.name}? Tej operacji nie można cofnąć.`)) {
            return
        }

        try {
            await this.studentService.deleteStudent(this.studentId)

            // Show success notification
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Student został usunięty'
                }
            }))

            // Redirect to students list
            window.location.href = '/#/admin/students'
        } catch (error) {
            console.error('Failed to delete student:', error)

            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Wystąpił błąd podczas usuwania studenta'
                }
            }))
        }
    }

    private handleTabChange(e: Event): void {
        const target = e.target as HTMLElement
        const tabId = target.getAttribute('data-bs-target')
        console.log('Tab changed to:', tabId)
    }

    // Helper methods
    private formatDate(date: string | null | undefined): string {
        if (!date) return ''
        return new Date(date).toLocaleDateString('pl-PL')
    }

    private getStatusBadgeClass(status: string): string {
        const classes: Record<string, string> = {
            active: 'bg-success',
            inactive: 'bg-warning',
            blocked: 'bg-danger'
        }
        return classes[status] || 'bg-secondary'
    }

    private getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            active: 'Aktywny',
            inactive: 'Nieaktywny',
            blocked: 'Zablokowany'
        }
        return labels[status] || 'Nieznany'
    }

    private getGoalLabel(goal: string): string {
        const labels: Record<string, string> = {
            conversation: 'Konwersacje',
            business: 'Język biznesowy',
            exam: 'Przygotowanie do egzaminów',
            travel: 'Podróże',
            academic: 'Język akademicki',
            hobby: 'Hobby',
            culture: 'Kultura'
        }
        return labels[goal] || goal
    }
}