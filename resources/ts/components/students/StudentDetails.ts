// resources/ts/components/students/StudentDetails.ts
import type { RouteComponent } from '@router/routes'
import { StudentService, HourPackage, StudentStats } from '@services/StudentService'
import type { User, StudentProfile, PackageAssignment } from '@/types/models'
import { navigate, routeChecker, urlBuilder } from '@/utils/navigation'
import { ROUTES } from '@/config/routing'
import { LinkTemplates } from '@/components/common/Link'
import { LessonStatusManager } from '@/components/lessons/LessonStatusManager'

declare global {
    interface Window {
        bootstrap: any
        studentDetails?: StudentDetails
    }
}

export class StudentDetails implements RouteComponent {
    private studentService: StudentService
    private studentId: number | null = null
    private student: (User & {
        studentProfile?: StudentProfile;
        hour_package?: HourPackage;
        upcoming_lessons?: any[];
        stats?: StudentStats;
        active_package_assignments?: PackageAssignment[];
        package_assignments?: PackageAssignment[];
        studentLessons?: any[];
        student_lessons?: any[]; // Laravel returns snake_case
    }) | null = null
    private container: HTMLElement | null = null

    constructor() {
        this.studentService = new StudentService()
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'student-details-page'

        // Get student ID from URL params (dashboard integration)
        const urlParams = new URLSearchParams(window.location.search)
        this.studentId = parseInt(urlParams.get('student_id') || '0', 10)

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
        window.studentDetails = this
        StudentDetails.instance = this
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
        StudentDetails.instance = null
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
                <a href="/admin/dashboard?section=uczniowie" class="alert-link ms-2">Wróć do listy studentów</a>
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
                        <a href="/admin/dashboard?section=uczniowie" class="text-muted text-decoration-none mb-2 d-inline-block">
                            <i class="bi bi-arrow-left me-1"></i> Powrót do listy
                        </a>
                        <h1 class="student-name">${this.student.name}</h1>
                        <p class="text-muted mb-0">${this.student.email}</p>
                    </div>
                    <div class="d-flex gap-2">
                        <a href="/admin/dashboard?section=edytuj-studenta&student_id=${this.student.id}" class="btn btn-primary">
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
                <!--
                <li class="nav-item" role="presentation">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#stats-tab-pane">
                        <i class="bi bi-graph-up me-1"></i> Statystyki
                    </button>
                </li>
                -->
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

        // Package assignment buttons
        const assignBtn = this.container?.querySelector('#assign-package-btn')
        const assignBtnAlt = this.container?.querySelector('#assign-package-btn-alt')
        
        assignBtn?.addEventListener('click', () => this.showAssignPackageModal())
        assignBtnAlt?.addEventListener('click', () => this.showAssignPackageModal())

        if (window.bootstrap) {
            const tabElements = this.container?.querySelectorAll('[data-bs-toggle="tab"]')
            tabElements?.forEach(tabEl => {
                new window.bootstrap.Tab(tabEl)
            })
        }

        // Tab change events
        const tabElements = this.container?.querySelectorAll('[data-bs-toggle="tab"]')
        tabElements?.forEach(tab => {
            tab.addEventListener('shown.bs.tab', this.handleTabChange.bind(this))
        })
    }

    private generateProfileHTML(): string {
        if (!this.student) {
            return `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    Profil studenta nie został jeszcze utworzony.
                </div>
            `
        }

        const profile = this.student.student_profile

        // Teraz bezpiecznie używamy z wartościami domyślnymi
        const learningLanguages = profile?.learning_languages || []
        const currentLevels = profile?.current_levels || {}
        const learningGoals = profile?.learning_goals || []

        const learningLanguagesHTML = learningLanguages.length > 0
            ? learningLanguages.map(lang => {
                const level = currentLevels[lang] || 'A1'
                return `<span class="badge bg-primary me-2">${lang.toUpperCase()} ${level}</span>`
            }).join('')
            : '<span class="text-muted">Brak wybranych języków</span>'

        const learningGoalsHTML = learningGoals.length > 0
            ? learningGoals.map(goal => {
                return `<li class="mb-1">${this.getGoalLabel(goal)}</li>`
            }).join('')
            : ''

        return `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Dane osobowe</h5>
                <a href="/admin/dashboard?section=edytuj-studenta&student_id=${this.student.id}" class="btn btn-sm btn-outline-primary">
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
                                <span class="badge ${this.getStatusBadgeClass(this.getActualStatus(this.student))}">
                                    ${this.getStatusLabel(this.getActualStatus(this.student))}
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
                    <div>${learningLanguagesHTML}</div>
                </div>
                
                <div class="mb-4">
                    <label class="form-label text-muted">Cele nauki</label>
                    ${learningGoals.length > 0
            ? `<ul class="mb-0">${learningGoalsHTML}</ul>`
            : '<p class="text-muted mb-0">Brak określonych celów</p>'
        }
                </div>
                
                <div>
                    <label class="form-label text-muted">Opis/Bio</label>
                    ${profile?.bio 
                        ? `<div class="bg-light p-3 rounded">${profile.bio.replace(/\n/g, '<br>')}</div>`
                        : '<p class="text-muted mb-0">Brak opisu</p>'
                    }
                </div>
            </div>
        </div>
    `
    }

    private generatePackageHTML(): string {
        if (!this.student) return ''

        const activeAssignments = this.student.active_package_assignments || []
        const allAssignments = this.student.package_assignments || []
        // Find truly active assignment (status = 'active' and not expired/exhausted)
        const activeAssignment = activeAssignments.find(a => {
            const calculatedStatus = this.calculateAssignmentStatus(a)
            return calculatedStatus === 'active'
        })

        // Debug logging to help troubleshoot
        console.log('Student data:', this.student)
        console.log('Active assignments:', activeAssignments)
        console.log('All assignments:', allAssignments)
        console.log('Active assignment found:', activeAssignment)
        
        // Log calculated statuses for debugging
        activeAssignments.forEach((assignment, index) => {
            console.log(`Assignment ${index + 1} status:`, {
                id: assignment.id,
                serverStatus: assignment.status,
                calculatedStatus: this.calculateAssignmentStatus(assignment),
                isActive: assignment.is_active,
                expiresAt: assignment.expires_at,
                hoursRemaining: assignment.hours_remaining
            })
        })

        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="mb-0">Pakiety godzin</h5>
                <button class="btn btn-primary" id="assign-package-btn">
                    <i class="bi bi-plus-circle me-1"></i> Przypisz pakiet
                </button>
            </div>

            ${activeAssignment ? this.renderActivePackageCard(activeAssignment) : this.renderNoActivePackage()}
            
            ${allAssignments.length > 0 ? this.renderPackageAssignmentsList(allAssignments) : ''}
        `
    }

    private renderActivePackageCard(assignment: PackageAssignment): string {
        const statusInfo = this.getAssignmentStatusInfo(assignment.status)
        const progressPercentage = this.calculateHoursProgress(assignment)
        const assignedDate = new Date(assignment.assigned_at).toLocaleDateString('pl-PL')
        const expiresDate = new Date(assignment.expires_at).toLocaleDateString('pl-PL')

        return `
            <div class="card mb-4 border-success">
                <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="bi bi-check-circle me-2"></i>
                        Aktywny pakiet: ${assignment.package?.name || 'Nieznany pakiet'}
                    </h6>
                    <span class="badge bg-light text-success">${statusInfo.label}</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="text-center">
                                <div class="h3 mb-0 text-success">${assignment.hours_remaining || 0}h</div>
                                <div class="text-muted small">Pozostało godzin</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <div class="h3 mb-0 text-primary">${assignment.package?.hours_count || 0}h</div>
                                <div class="text-muted small">Łącznie godzin</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <div class="h3 mb-0 text-warning">${assignment.days_remaining || 0}</div>
                                <div class="text-muted small">Dni do wygaśnięcia</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <label class="form-label mb-0">Postęp wykorzystania</label>
                            <span class="text-muted">${progressPercentage}%</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar ${progressPercentage >= 80 ? 'bg-warning' : 'bg-success'}" 
                                 role="progressbar" 
                                 style="width: ${progressPercentage}%">
                            </div>
                        </div>
                    </div>

                    <div class="row mt-3 text-center">
                        <div class="col-md-6">
                            <div class="text-muted small">Data przypisania</div>
                            <div class="fw-medium">${assignedDate}</div>
                        </div>
                        <div class="col-md-6">
                            <div class="text-muted small">Data wygaśnięcia</div>
                            <div class="fw-medium">${expiresDate}</div>
                        </div>
                    </div>

                    ${assignment.notes ? `
                        <div class="mt-3">
                            <div class="text-muted small">Notatki</div>
                            <div class="bg-light p-2 rounded">${assignment.notes}</div>
                        </div>
                    ` : ''}

                    <div class="mt-3 d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="studentDetails.viewAssignmentDetails(${assignment.id})">
                            <i class="bi bi-eye me-1"></i> Szczegóły
                        </button>
                    </div>
                </div>
            </div>
        `
    }

    private renderNoActivePackage(): string {
        return `
            <div class="card mb-4 border-warning">
                <div class="card-body text-center py-4">
                    <div class="mb-3">
                        <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                    </div>
                    <h5 class="text-warning">Brak aktywnego pakietu</h5>
                    <p class="text-muted">Student nie ma przypisanego żadnego aktywnego pakietu godzin.</p>
                    <button class="btn btn-warning" id="assign-package-btn-alt">
                        <i class="bi bi-plus-circle me-1"></i> Przypisz pakiet
                    </button>
                </div>
            </div>
        `
    }

    private renderPackageAssignmentsList(assignments: PackageAssignment[]): string {
        return `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">Historia pakietów</h6>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Pakiet</th>
                                    <th>Godziny</th>
                                    <th>Status</th>
                                    <th>Data przypisania</th>
                                    <th>Wygasa</th>
                                    <th>Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${assignments.map(assignment => this.renderAssignmentRow(assignment)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `
    }

    private renderAssignmentRow(assignment: PackageAssignment): string {
        const statusInfo = this.getAssignmentStatusInfo(assignment.status)
        const assignedDate = new Date(assignment.assigned_at).toLocaleDateString('pl-PL')
        const expiresDate = new Date(assignment.expires_at).toLocaleDateString('pl-PL')

        return `
            <tr>
                <td>
                    <div class="fw-medium">${assignment.package?.name || 'Nieznany pakiet'}</div>
                    <div class="text-muted small">${assignment.package?.hours_count || 0}h całkowicie</div>
                </td>
                <td>
                    <div class="fw-medium">${assignment.hours_remaining || 0}h</div>
                    <div class="text-muted small">pozostało</div>
                </td>
                <td>
                    <span class="badge ${statusInfo.class}">${statusInfo.label}</span>
                </td>
                <td>${assignedDate}</td>
                <td>${expiresDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="studentDetails.viewAssignmentDetails(${assignment.id})"
                            title="Zobacz szczegóły">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `
    }

    private getAssignmentStatusInfo(status: string): { label: string; class: string } {
        switch (status) {
            case 'active':
                return { label: 'Aktywny', class: 'bg-success' }
            case 'expired':
                return { label: 'Wygasł', class: 'bg-danger' }
            case 'exhausted':
                return { label: 'Wykorzystany', class: 'bg-warning' }
            case 'inactive':
                return { label: 'Nieaktywny', class: 'bg-secondary' }
            default:
                return { label: 'Nieznany', class: 'bg-secondary' }
        }
    }

    private calculateHoursProgress(assignment: PackageAssignment): number {
        const totalHours = assignment.package?.hours_count || 0
        const remainingHours = assignment.hours_remaining || 0
        
        if (totalHours === 0) return 0
        
        const usedHours = totalHours - remainingHours
        const percentage = Math.round((usedHours / totalHours) * 100)
        return Math.max(0, Math.min(100, percentage))
    }

    private calculateAssignmentStatus(assignment: PackageAssignment): string {
        if (!assignment.is_active) {
            return 'inactive'
        }
        
        // Check if expired
        const expiresAt = new Date(assignment.expires_at)
        const now = new Date()
        if (expiresAt < now) {
            return 'expired'
        }
        
        // Check if hours exhausted
        if ((assignment.hours_remaining || 0) <= 0) {
            return 'exhausted'
        }
        
        return 'active'
    }

    private generateLessonsHTML(): string {
        // Laravel returns snake_case, so check both
        const lessons = this.student?.student_lessons || this.student?.studentLessons
        
        if (!lessons) {
            return `
                <div class="text-center py-5">
                    <div class="mb-3">
                        <i class="bi bi-calendar-x text-muted" style="font-size: 3rem;"></i>
                    </div>
                    <h5>Brak danych o lekcjach</h5>
                    <p class="text-muted">Nie udało się załadować lekcji studenta.</p>
                </div>
            `
        }
        
        if (lessons.length === 0) {
            return `
                <div class="text-center py-5">
                    <div class="mb-3">
                        <i class="bi bi-calendar-plus text-muted" style="font-size: 3rem;"></i>
                    </div>
                    <h5>Brak lekcji</h5>
                    <p class="text-muted">Student nie ma jeszcze żadnych zaplanowanych lekcji.</p>
                </div>
            `
        }

        // Group lessons by status
        const upcoming = lessons.filter(l => l.status === 'scheduled' && new Date(l.lesson_date) >= new Date())
        const completed = lessons.filter(l => l.status === 'completed')
        const cancelled = lessons.filter(l => l.status === 'cancelled')
        const past = lessons.filter(l => l.status === 'scheduled' && new Date(l.lesson_date) < new Date())

        return `
            <div class="lessons-container">
                <!-- Stats Row -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-primary">${lessons.length}</h3>
                                <p class="text-muted mb-0">Łączna liczba</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-success">${upcoming.length}</h3>
                                <p class="text-muted mb-0">Nadchodzące</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-info">${completed.length}</h3>
                                <p class="text-muted mb-0">Ukończone</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h3 class="text-warning">${cancelled.length}</h3>
                                <p class="text-muted mb-0">Anulowane</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Lessons List -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Lista lekcji</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th>Data</th>
                                        <th>Godzina</th>
                                        <th>Lektor</th>
                                        <th>Typ</th>
                                        <th>Status</th>
                                        <th>Pakiet</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${lessons.map(lesson => this.renderLessonRow(lesson)).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private renderLessonRow(lesson: any): string {
        const lessonDate = new Date(lesson.lesson_date)
        const startTime = lesson.start_time || 'N/A'
        const endTime = lesson.end_time || 'N/A'
        const tutorName = lesson.tutor?.name || 'Nieznany lektor'
        const lessonType = lesson.lesson_type || 'Standardowa'
        const packageName = lesson.package_assignment?.package?.name || lesson.packageAssignment?.package?.name || 'Brak pakietu'
        
        // Status badge
        const statusLabel = LessonStatusManager.getStatusLabel(lesson.status)
        const badgeClass = LessonStatusManager.getStatusBadgeClass(lesson.status)
        
        // Special handling for scheduled lessons
        let statusBadge = ''
        if (lesson.status === 'scheduled' && lessonDate < new Date()) {
            statusBadge = `<span class="badge bg-secondary">Przeterminowana</span>`
        } else {
            statusBadge = `<span class="badge ${badgeClass}">${statusLabel}</span>`
        }

        return `
            <tr>
                <td>${lessonDate.toLocaleDateString('pl-PL')}</td>
                <td>${startTime} - ${endTime}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-placeholder bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-size: 14px;">
                            ${tutorName.charAt(0)}
                        </div>
                        ${tutorName}
                    </div>
                </td>
                <td>${lessonType}</td>
                <td>${statusBadge}</td>
                <td>
                    <small class="text-muted">${packageName}</small>
                </td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li>
                                <a class="dropdown-item" href="#" onclick="StudentDetails.changeStatus(${lesson.id}, '${lesson.status}'); return false;">
                                    <i class="bi bi-arrow-repeat me-2"></i>Zmień status
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" onclick="StudentDetails.viewStatusHistory(${lesson.id}); return false;">
                                    <i class="bi bi-clock-history me-2"></i>Historia statusów
                                </a>
                            </li>
                        </ul>
                    </div>
                </td>
            </tr>
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
                            <h2 class="mb-1">${stats?.total_lessons}</h2>
                            <p class="text-muted mb-0">Wszystkie lekcje</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-3 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h2 class="mb-1">${stats?.total_hours}</h2>
                            <p class="text-muted mb-0">Godziny łącznie</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-3 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h2 class="mb-1">${stats?.completed_lessons}</h2>
                            <p class="text-muted mb-0">Ukończone lekcje</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-3 mb-4">
                    <div class="card h-100">
                        <div class="card-body text-center">
                            <h2 class="mb-1">${stats?.cancelled_lessons}</h2>
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

        if (!confirm(`Czy na pewno chcesz usunąć (dev - deaktywować) studenta ${this.student.name}? Tej operacji nie można cofnąć. - można`)) {
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
            navigate.to(urlBuilder.dashboard('admin', 'uczniowie'))
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

    private async showAssignPackageModal(): Promise<void> {
        if (!this.studentId) return

        const modalHTML = `
            <div class="modal fade" id="assignPackageModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Przypisz pakiet do studenta</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="assignPackageForm">
                                <div class="mb-3">
                                    <label for="packageSearch" class="form-label">Znajdź pakiet *</label>
                                    <input type="text" class="form-control" id="packageSearch" 
                                           placeholder="Wpisz nazwę pakietu..." 
                                           autocomplete="off" required>
                                    <input type="hidden" id="selectedPackageId" name="package_id" value="">
                                    <div id="packageSearchResults" class="list-group mt-2 position-absolute w-100" style="z-index: 1050; max-height: 200px; overflow-y: auto;"></div>
                                    <div class="invalid-feedback" id="package_id-error"></div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="assignmentNotes" class="form-label">Notatki (opcjonalne)</label>
                                    <textarea class="form-control" id="assignmentNotes" name="notes" rows="3" 
                                        placeholder="Dodatkowe informacje o przypisaniu pakietu..."></textarea>
                                </div>
                                
                                <div class="alert alert-info">
                                    <strong>Student:</strong> ${this.student?.name}<br>
                                    <strong>Email:</strong> ${this.student?.email}
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Anuluj</button>
                            <button type="submit" form="assignPackageForm" class="btn btn-primary" id="assignBtn">
                                <span class="spinner-border spinner-border-sm me-2 d-none" id="assignSpinner"></span>
                                Przypisz pakiet
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `

        // Remove existing modal if present
        const existingModal = document.getElementById('assignPackageModal')
        if (existingModal) {
            existingModal.remove()
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML)

        // Setup search functionality
        this.setupPackageSearch()

        // Setup form submission
        const form = document.getElementById('assignPackageForm') as HTMLFormElement
        form?.addEventListener('submit', (e) => this.handlePackageAssignment(e))

        // Show modal
        const modal = new window.bootstrap.Modal(document.getElementById('assignPackageModal'))
        modal.show()

        // Cleanup on modal close
        document.getElementById('assignPackageModal')?.addEventListener('hidden.bs.modal', () => {
            document.getElementById('assignPackageModal')?.remove()
        })
    }

    private setupPackageSearch(): void {
        const searchInput = document.getElementById('packageSearch') as HTMLInputElement
        const resultsContainer = document.getElementById('packageSearchResults') as HTMLElement
        const selectedPackageId = document.getElementById('selectedPackageId') as HTMLInputElement
        
        let searchTimeout: number
        
        if (!searchInput || !resultsContainer || !selectedPackageId) return
        
        searchInput.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value.trim()
            
            // Clear previous timeout
            if (searchTimeout) {
                window.clearTimeout(searchTimeout)
            }
            
            // Clear selection when typing
            selectedPackageId.value = ''
            
            if (query.length < 2) {
                resultsContainer.innerHTML = ''
                return
            }
            
            // Debounce search
            searchTimeout = window.setTimeout(() => {
                this.searchPackages(query)
            }, 300)
        })
        
        // Clear results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target as Node) && !resultsContainer.contains(e.target as Node)) {
                resultsContainer.innerHTML = ''
            }
        })
    }

    private async searchPackages(query: string): Promise<void> {
        const resultsContainer = document.getElementById('packageSearchResults') as HTMLElement
        
        if (!resultsContainer) return
        
        try {
            resultsContainer.innerHTML = '<div class="list-group-item text-muted">Wyszukiwanie...</div>'
            
            // Import PackageService dynamically
            const { PackageService } = await import('@services/PackageService')
            const packageService = new PackageService()
            
            const packages = await packageService.getActivePackages()
            const filteredPackages = packages.filter(pkg => 
                pkg.name.toLowerCase().includes(query.toLowerCase())
            )
            
            if (filteredPackages.length === 0) {
                resultsContainer.innerHTML = '<div class="list-group-item text-muted">Brak wyników</div>'
                return
            }
            
            resultsContainer.innerHTML = filteredPackages.map(pkg => `
                <button type="button" class="list-group-item list-group-item-action" 
                        data-package-id="${pkg.id}" 
                        data-package-name="${pkg.name}"
                        data-package-hours="${pkg.hours_count}"
                        data-package-price="${pkg.formatted_price || this.formatPrice(pkg.price)}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-medium">${pkg.name}</div>
                            <div class="small text-muted">${pkg.hours_count}h • ${pkg.validity_days} dni ważności</div>
                        </div>
                        <div class="text-end">
                            <div class="fw-medium">${pkg.formatted_price || this.formatPrice(pkg.price)}</div>
                        </div>
                    </div>
                </button>
            `).join('')
            
            // Add click handlers to results
            resultsContainer.querySelectorAll('.list-group-item-action').forEach(item => {
                item.addEventListener('click', () => {
                    const packageId = item.getAttribute('data-package-id')
                    const packageName = item.getAttribute('data-package-name')
                    const packageHours = item.getAttribute('data-package-hours')
                    const packagePrice = item.getAttribute('data-package-price')
                    
                    if (packageId && packageName) {
                        this.selectPackage(packageId, packageName, packageHours || '0', packagePrice || '0')
                    }
                })
            })
            
        } catch (error) {
            console.error('Error searching packages:', error)
            resultsContainer.innerHTML = '<div class="list-group-item text-danger">Błąd wyszukiwania</div>'
        }
    }

    private selectPackage(packageId: string, packageName: string, packageHours: string, packagePrice: string): void {
        const searchInput = document.getElementById('packageSearch') as HTMLInputElement
        const selectedPackageId = document.getElementById('selectedPackageId') as HTMLInputElement
        const resultsContainer = document.getElementById('packageSearchResults') as HTMLElement
        
        if (searchInput && selectedPackageId && resultsContainer) {
            searchInput.value = `${packageName} (${packageHours}h - ${packagePrice})`
            selectedPackageId.value = packageId
            resultsContainer.innerHTML = ''
        }
    }

    private async handlePackageAssignment(e: Event): Promise<void> {
        e.preventDefault()
        
        const form = e.target as HTMLFormElement
        const formData = new FormData(form)
        const assignBtn = document.getElementById('assignBtn') as HTMLButtonElement
        const spinner = document.getElementById('assignSpinner')

        // Clear previous errors
        this.clearAssignmentErrors()

        try {
            assignBtn.disabled = true
            spinner?.classList.remove('d-none')

            const packageId = formData.get('package_id') as string
            if (!packageId) {
                this.showAssignmentErrors({ 'package_id': ['Proszę wybrać pakiet'] })
                assignBtn.disabled = false
                spinner?.classList.add('d-none')
                return
            }

            const assignmentData = {
                student_id: this.studentId!,
                package_id: parseInt(packageId),
                notes: formData.get('notes') as string || undefined
            }

            // Import PackageService dynamically
            const { PackageService } = await import('@services/PackageService')
            const packageService = new PackageService()
            
            await packageService.assignPackageToStudent(assignmentData)

            // Hide modal
            const modal = window.bootstrap.Modal.getInstance(document.getElementById('assignPackageModal'))
            modal?.hide()

            // Show success notification
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'success',
                    message: 'Pakiet został pomyślnie przypisany do studenta'
                }
            }))

            // Reload student data to show new assignment
            await this.loadStudentData()

        } catch (error: any) {
            console.error('Error assigning package:', error)
            
            if (error.errors) {
                this.showAssignmentErrors(error.errors)
            } else {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'error',
                        message: 'Nie udało się przypisać pakietu. Spróbuj ponownie.'
                    }
                }))
            }
        } finally {
            assignBtn.disabled = false
            spinner?.classList.add('d-none')
        }
    }

    private clearAssignmentErrors(): void {
        const errorElements = document.querySelectorAll('.modal .invalid-feedback')
        errorElements.forEach(el => el.textContent = '')
        
        const inputElements = document.querySelectorAll('.modal .form-control, .modal .form-select')
        inputElements.forEach(el => el.classList.remove('is-invalid'))
    }

    private showAssignmentErrors(errors: Record<string, string[]>): void {
        for (const [field, messages] of Object.entries(errors)) {
            const input = document.querySelector(`.modal [name="${field}"]`) as HTMLElement
            const errorDiv = document.getElementById(`${field}-error`)
            
            if (input && errorDiv) {
                input.classList.add('is-invalid')
                errorDiv.textContent = messages[0]
            }
        }
    }

    public async detachPackage(assignmentId: number): Promise<void> {
        try {
            // Find assignment in current data
            const assignment = this.student?.active_package_assignments?.find(a => a.id === assignmentId)
            
            if (!assignment) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'error',
                        message: 'Nie znaleziono aktywnego przypisania pakietu'
                    }
                }))
                return
            }

            // Import SweetAlert2 for confirmation dialog
            const { default: Swal } = await import('sweetalert2')

            const result = await Swal.fire({
                title: 'Czy na pewno chcesz odpiąć pakiet?',
                html: `
                    <p>Pakiet <strong>${assignment.package?.name || 'Nieznany'}</strong> zostanie odpięty od studenta.</p>
                    <p class="text-muted">Student: <strong>${this.student?.name}</strong></p>
                    <p class="text-warning"><i class="bi bi-exclamation-triangle me-1"></i> Ta operacja nie może być cofnięta.</p>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Tak, odepnij',
                cancelButtonText: 'Anuluj'
            })

            if (!result.isConfirmed) return

            // Call API to detach package
            const { api } = await import('@services/ApiService')
            await api.delete(`/packages/assignments/${assignmentId}`)

            await Swal.fire({
                title: 'Sukces!',
                text: 'Pakiet został odpięty od studenta.',
                icon: 'success',
                confirmButtonColor: '#28a745'
            })

            // Reload student data
            await this.loadStudentData()

        } catch (error: any) {
            console.error('Error detaching package:', error)
            const message = error.response?.data?.message || 'Wystąpił błąd podczas odpinania pakietu'
            
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message
                }
            }))
        }
    }

    public async viewAssignmentDetails(assignmentId: number): Promise<void> {
        try {
            // Find assignment in current data (search in all assignments, not just active ones)
            const assignment = this.student?.package_assignments?.find(a => a.id === assignmentId)
            
            if (!assignment) {
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'error',
                        message: 'Nie znaleziono szczegółów przypisania'
                    }
                }))
                return
            }

            await this.showAssignmentDetailsModal(assignment)
        } catch (error) {
            console.error('Error viewing assignment:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Błąd podczas ładowania szczegółów przypisania'
                }
            }))
        }
    }

    private async showAssignmentDetailsModal(assignment: PackageAssignment): Promise<void> {
        // This is the same implementation as in PackageDetails, but simpler since we have the student data
        const assignedDate = new Date(assignment.assigned_at).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        const expiresDate = new Date(assignment.expires_at).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        const statusInfo = this.getAssignmentStatusInfo(assignment.status)
        const progressPercentage = this.calculateHoursProgress(assignment)

        const modalHTML = `
            <div class="modal fade" id="assignmentDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Szczegóły przypisania pakietu</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card mb-3">
                                        <div class="card-header">
                                            <h6 class="mb-0">Informacje o studencie</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-2">
                                                <div class="avatar avatar-md me-3">
                                                    <span class="avatar-text rounded-circle bg-primary text-white">
                                                        ${this.getInitials(this.student?.name || 'N/A')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div class="fw-bold">${this.student?.name || 'N/A'}</div>
                                                    <div class="text-muted small">${this.student?.email || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card mb-3">
                                        <div class="card-header">
                                            <h6 class="mb-0">Informacje o pakiecie</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="mb-2">
                                                <strong>Nazwa:</strong> ${assignment.package?.name || 'N/A'}
                                            </div>
                                            <div class="mb-2">
                                                <strong>Godziny:</strong> ${assignment.package?.hours_count || 0}h
                                            </div>
                                            <div class="mb-2">
                                                <strong>Ważność:</strong> ${assignment.package?.validity_days || 0} dni
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="mb-0">Status przypisania</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row text-center">
                                        <div class="col-md-3">
                                            <span class="badge ${statusInfo.class} fs-6">${statusInfo.label}</span>
                                            <div class="text-muted small mt-1">Status</div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="h5 mb-0">${assignment.hours_remaining || 0}h</div>
                                            <div class="text-muted small">Pozostało</div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="h5 mb-0">${assignment.days_remaining || 0}</div>
                                            <div class="text-muted small">Dni do wygaśnięcia</div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="h5 mb-0">${progressPercentage}%</div>
                                            <div class="text-muted small">Wykorzystano</div>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-3">
                                        <div class="progress" style="height: 8px;">
                                            <div class="progress-bar ${progressPercentage >= 80 ? 'bg-warning' : 'bg-primary'}" 
                                                 role="progressbar" 
                                                 style="width: ${progressPercentage}%">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Szczegóły</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-2"><strong>Przypisano:</strong> ${assignedDate}</div>
                                            <div class="mb-2"><strong>Wygasa:</strong> ${expiresDate}</div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-2"><strong>ID:</strong> #${assignment.id}</div>
                                            <div class="mb-2"><strong>Aktywne:</strong> ${assignment.is_active ? 'Tak' : 'Nie'}</div>
                                        </div>
                                    </div>
                                    ${assignment.notes ? `
                                        <div class="mt-3">
                                            <strong>Notatki:</strong>
                                            <div class="bg-light p-2 rounded mt-1">${assignment.notes}</div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger" id="detachPackageBtn" data-assignment-id="${assignment.id}">
                                <i class="bi bi-x-circle me-1"></i> Odepnij pakiet
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zamknij</button>
                        </div>
                    </div>
                </div>
            </div>
        `

        // Remove existing modal if present
        const existingModal = document.getElementById('assignmentDetailsModal')
        if (existingModal) {
            existingModal.remove()
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML)

        // Show modal
        const modal = new window.bootstrap.Modal(document.getElementById('assignmentDetailsModal'))
        modal.show()

        // Add event listener for detach button
        const detachBtn = document.getElementById('detachPackageBtn')
        detachBtn?.addEventListener('click', async () => {
            modal.hide()  // Close the modal first
            await this.detachPackage(assignment.id)
        })

        // Cleanup on modal close
        document.getElementById('assignmentDetailsModal')?.addEventListener('hidden.bs.modal', () => {
            document.getElementById('assignmentDetailsModal')?.remove()
        })
    }

    private getInitials(name: string): string {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    private formatPrice(priceInCents: number): string {
        const price = priceInCents / 100
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN'
        }).format(price)
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
            blocked: 'bg-danger',
            unverified: 'bg-info'
        }
        return classes[status] || 'bg-secondary'
    }

    private getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            active: 'Aktywny',
            inactive: 'Nieaktywny',
            blocked: 'Zablokowany',
            unverified: 'Niezweryfikowany'
        }
        return labels[status] || 'Nieznany'
    }

    private getActualStatus(student: User & {
        studentProfile?: StudentProfile;
        hour_package?: HourPackage;
        upcoming_lessons?: any[];
        stats?: StudentStats;
    }): string {
        if (!student.email_verified_at) {
            return 'unverified'
        }
        return student.status || 'inactive'
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

    // Static methods for global access
    static instance: StudentDetails | null = null

    static async changeStatus(lessonId: number, currentStatus: string): Promise<void> {
        try {
            console.log('StudentDetails.changeStatus called with:', { lessonId, currentStatus })
            console.log('LessonStatusManager available:', !!LessonStatusManager)
            
            const statusManager = new LessonStatusManager(lessonId, currentStatus, (newStatus: string) => {
                console.log('Status update callback triggered:', newStatus)
                // Reload lessons after status update
                if (StudentDetails.instance) {
                    console.log('Reloading student data...')
                    StudentDetails.instance.loadStudentData()
                } else {
                    console.error('StudentDetails.instance is null!')
                }
            })

            console.log('Showing status modal...')
            await statusManager.showModal()
            console.log('Status modal shown successfully')
        } catch (error) {
            console.error('Error in changeStatus:', error)
            console.error('Error stack:', (error as Error).stack)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Wystąpił błąd podczas zmiany statusu: ' + (error as Error).message,
                    duration: 5000
                }
            }))
        }
    }

    static async viewStatusHistory(lessonId: number): Promise<void> {
        try {
            console.log('StudentDetails.viewStatusHistory called with lessonId:', lessonId)
            const { api } = await import('@services/ApiService')
            console.log('API service imported successfully')
            const response = await api.get<{ success: boolean, data: any[] }>(`/lessons/${lessonId}/status-history`)
            console.log('Status history response:', response)
            const history = response.data || []

            const modalHtml = `
                <div class="modal fade" id="statusHistoryModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Historia statusów lekcji</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                ${history.length === 0 ? `
                                    <p class="text-muted text-center">Brak historii zmian statusu</p>
                                ` : `
                                    <div class="timeline">
                                        ${history.map(entry => `
                                            <div class="timeline-item mb-3">
                                                <div class="d-flex align-items-start">
                                                    <div class="timeline-icon bg-primary text-white rounded-circle p-2 me-3">
                                                        <i class="bi bi-clock-history"></i>
                                                    </div>
                                                    <div class="flex-grow-1">
                                                        <div class="d-flex justify-content-between">
                                                            <h6 class="mb-1">${entry.status}</h6>
                                                            <small class="text-muted">${new Date(entry.changed_at).toLocaleString('pl-PL')}</small>
                                                        </div>
                                                        <p class="mb-1 text-muted">Zmienione przez: ${entry.changed_by}</p>
                                                        ${entry.reason ? `<p class="mb-0"><small>Powód: ${entry.reason}</small></p>` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                `}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zamknij</button>
                            </div>
                        </div>
                    </div>
                </div>
            `

            // Remove existing modal if any
            const existingModal = document.getElementById('statusHistoryModal')
            if (existingModal) {
                existingModal.remove()
            }

            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHtml)
            
            // Show modal
            const modal = new (window as any).bootstrap.Modal(document.getElementById('statusHistoryModal'))
            modal.show()

        } catch (error) {
            console.error('Error loading status history:', error)
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: 'Nie udało się załadować historii statusów',
                    duration: 3000
                }
            }))
        }
    }
}

// Export to global scope
(window as any).StudentDetails = StudentDetails