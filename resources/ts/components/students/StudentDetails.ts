// resources/ts/components/students/StudentDetails.ts
import { StudentService, HourPackage, StudentStats } from '@services/StudentService'
import type { User, StudentProfile } from '@/types/models'
import type { RouteComponent } from '@router/routes'

export class StudentDetails implements RouteComponent {
    private studentService: StudentService
    private studentId: number | null = null
    private student: (User & {
        studentProfile: StudentProfile;
        hour_package: HourPackage;
        upcoming_lessons: any[];
        stats: StudentStats;
    }) | null = null

    // UI Elements
    private studentContainer: HTMLElement | null = null
    private deleteButton: HTMLElement | null = null
    private tabElements: NodeListOf<HTMLElement> | null = null

    private container: HTMLElement | null = null

    constructor() {
        this.studentService = new StudentService()
        this.init()
    }

    async render(): Promise<HTMLElement> {
        const match = window.location.pathname.match(/admin\/students\/(\d+)/)
        if (match) {
            this.studentId = parseInt(match[1], 10)
        }

        this.container = document.createElement('div')
        this.container.className = 'student-details-container'
        if (this.studentId) {
            this.container.dataset.studentId = String(this.studentId)
        }

        this.container.innerHTML = `
            <h1 class="student-name mb-3"></h1>
            <ul class="nav nav-tabs" role="tablist">
                <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" data-bs-target="#profile-tab-pane" role="tab">Profil</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" data-bs-target="#package-tab-pane" role="tab">Pakiet</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" data-bs-target="#lessons-tab-pane" role="tab">Lekcje</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" data-bs-target="#stats-tab-pane" role="tab">Statystyki</a></li>
            </ul>
            <div class="tab-content mt-3">
                <div class="tab-pane fade show active" id="profile-tab-pane"></div>
                <div class="tab-pane fade" id="package-tab-pane"></div>
                <div class="tab-pane fade" id="lessons-tab-pane"></div>
                <div class="tab-pane fade" id="stats-tab-pane"></div>
            </div>
            <button class="btn btn-danger mt-3 student-delete-btn">Usuń studenta</button>
        `

        return this.container
    }

    mount(): void {
        this.init()
    }

    unmount(): void {
        if (this.deleteButton) {
            this.deleteButton.removeEventListener('click', this.handleDeleteClick.bind(this))
        }
        if (this.tabElements) {
            this.tabElements.forEach(tab => {
                tab.removeEventListener('shown.bs.tab', this.handleTabChange.bind(this))
            })
        }
    }

    private async init(): Promise<void> {
        this.studentContainer = this.container

        if (!this.studentContainer) return

        // Get student ID from data attribute
        const studentIdAttr = this.studentContainer.dataset.studentId
        if (studentIdAttr) {
            this.studentId = parseInt(studentIdAttr, 10)
        }

        // Initialize delete button
        this.deleteButton = this.studentContainer.querySelector('.student-delete-btn')
        if (this.deleteButton) {
            this.deleteButton.addEventListener('click', this.handleDeleteClick.bind(this))
        }

        // Initialize tabs
        this.tabElements = this.studentContainer.querySelectorAll('[data-bs-toggle="tab"]')
        this.tabElements.forEach(tab => {
            tab.addEventListener('shown.bs.tab', this.handleTabChange.bind(this))
        })

        // Load student data
        await this.loadStudentData()
    }

    private async loadStudentData(): Promise<void> {
        if (!this.studentId) return
        this.student = await this.studentService.getStudentById(this.studentId)
    }

    private showLoading(): void {
        if (!this.studentContainer) return

        this.studentContainer.classList.add('loading')
        this.studentContainer.innerHTML = `
            <div class="d-flex justify-content-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Ładowanie...</span>
                </div>
            </div>
        `
    }

    private hideLoading(): void {
        if (!this.studentContainer) return

        this.studentContainer.classList.remove('loading')
    }

    private showError(): void {
        if (!this.studentContainer) return

        this.studentContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Wystąpił błąd podczas ładowania danych studenta.
                <a href="/admin/students" class="alert-link">Wróć do listy studentów</a>
            </div>
        `
    }

    private renderStudentData(): void {
        if (!this.studentContainer || !this.student) return

        // Update page title
        document.title = `${this.student.name} - Profil studenta`

        // Update student name in header
        const nameElement = this.studentContainer.querySelector('.student-name')
        if (nameElement) {
            nameElement.textContent = this.student.name
        }

        // Render profile information
        const profileTab = this.studentContainer.querySelector('#profile-tab-pane')
        if (profileTab) {
            profileTab.innerHTML = this.generateProfileHTML()
        }

        // Render hour package information
        const packageTab = this.studentContainer.querySelector('#package-tab-pane')
        if (packageTab) {
            packageTab.innerHTML = this.generatePackageHTML()
        }

        // Render upcoming lessons (if any)
        const lessonsTab = this.studentContainer.querySelector('#lessons-tab-pane')
        if (lessonsTab) {
            lessonsTab.innerHTML = this.generateLessonsHTML()
        }

        // Render statistics
        const statsTab = this.studentContainer.querySelector('#stats-tab-pane')
        if (statsTab) {
            statsTab.innerHTML = this.generateStatsHTML()
        }
    }

    private generateProfileHTML(): string {
        if (!this.student) return ''

        const profile = this.student.studentProfile

        const learningLanguagesHTML = profile.learning_languages.map(lang => {
            const level = profile.current_levels?.[lang] || 'A1'
            return `<span class="badge bg-primary me-2">${lang.toUpperCase()} ${level}</span>`
        }).join('')

        const learningGoalsHTML = profile.learning_goals.map(goal => {
            return `<li class="mb-1">${goal}</li>`
        }).join('')

        // Format preferred schedule
        const schedule = profile.preferred_schedule
        const daysMapping: Record<string, string> = {
            'monday': 'Poniedziałek',
            'tuesday': 'Wtorek',
            'wednesday': 'Środa',
            'thursday': 'Czwartek',
            'friday': 'Piątek',
            'saturday': 'Sobota',
            'sunday': 'Niedziela'
        }

        const timesMapping: Record<string, string> = {
            'morning': 'Rano (8-12)',
            'afternoon': 'Popołudnie (12-17)',
            'evening': 'Wieczór (17-21)'
        }

        const frequencyMapping: Record<string, string> = {
            'once_weekly': 'Raz w tygodniu',
            'twice_weekly': 'Dwa razy w tygodniu',
            'three_times_weekly': 'Trzy razy w tygodniu',
            'intensive': 'Intensywnie (codziennie)'
        }

        const preferredDays = schedule.days.map((day: string) => daysMapping[day] || day).join(', ')
        const preferredTimes = schedule.times.map((time: string) => timesMapping[time] || time).join(', ')
        const preferredFrequency = frequencyMapping[schedule.frequency] || schedule.frequency

        return `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Dane osobowe</h5>
                    <a href="/admin/students/${this.student.id}/edit" class="btn btn-sm btn-outline-primary">
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
                                <p class="mb-0">${this.student.birth_date || '-'}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted">Miasto</label>
                                <p class="mb-0">${this.student.city || '-'}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted">Kraj</label>
                                <p class="mb-0">${this.student.country || 'Polska'}</p>
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
                        <div>${learningLanguagesHTML || '-'}</div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="form-label text-muted">Cele nauki</label>
                        <ul class="mb-0">
                            ${learningGoalsHTML || '<li>Brak określonych celów</li>'}
                        </ul>
                    </div>
                    
                    <div>
                        <label class="form-label text-muted">Preferowany harmonogram</label>
                        <ul class="mb-0">
                            <li>Dni: ${preferredDays || 'Brak preferencji'}</li>
                            <li>Pory dnia: ${preferredTimes || 'Brak preferencji'}</li>
                            <li>Częstotliwość: ${preferredFrequency || 'Brak preferencji'}</li>
                        </ul>
                    </div>
                </div>
            </div>
        `
    }

    private generatePackageHTML(): string {
        if (!this.student) return ''

        const packageInfo = this.student.hour_package

        if (!packageInfo || !packageInfo.id) {
            return `
                <div class="text-center py-5">
                    <div class="mb-3">
                        <i class="bi bi-box text-muted" style="font-size: 3rem;"></i>
                    </div>
                    <h5>Brak aktywnego pakietu godzin</h5>
                    <p class="text-muted">Student nie posiada aktualnie żadnego pakietu godzin.</p>
                    <button class="btn btn-primary mt-3" id="add-package-btn">
                        <i class="bi bi-plus-circle me-1"></i> Dodaj pakiet godzin
                    </button>
                </div>
            `
        }

        // Format expiry date
        const expiryDate = packageInfo.expiry_date
            ? new Date(packageInfo.expiry_date).toLocaleDateString('pl-PL')
            : 'Brak daty wygaśnięcia'

        // Calculate progress percentage
        const progressPercentage = Math.round((packageInfo.remaining_hours / packageInfo.hours) * 100)

        return `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Pakiet godzin</h5>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2" id="edit-package-btn">
                            <i class="bi bi-pencil me-1"></i> Edytuj
                        </button>
                        <button class="btn btn-sm btn-outline-success" id="add-hours-btn">
                            <i class="bi bi-plus-circle me-1"></i> Dodaj godziny
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row align-items-center mb-4">
                        <div class="col-md-6">
                            <h6>${packageInfo.name}</h6>
                            <p class="text-muted mb-0">Data wygaśnięcia: ${expiryDate}</p>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <h3 class="mb-0">
                                <span class="text-primary">${packageInfo.remaining_hours}</span>
                                <small class="text-muted">/ ${packageInfo.hours} godzin</small>
                            </h3>
                        </div>
                    </div>
                    
                    <div class="progress" style="height: 10px;">
                        <div class="progress-bar bg-primary" role="progressbar" 
                            style="width: ${progressPercentage}%;" 
                            aria-valuenow="${progressPercentage}" 
                            aria-valuemin="0" 
                            aria-valuemax="100">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Historia pakietów</h5>
                </div>
                <div class="card-body">
                    <p class="text-muted text-center py-3">Historia pakietów będzie dostępna w przyszłych wersjach.</p>
                </div>
            </div>
        `
    }

    private generateLessonsHTML(): string {
        if (!this.student) return ''

        const upcomingLessons = this.student.upcoming_lessons

        if (!upcomingLessons || upcomingLessons.length === 0) {
            return `
                <div class="text-center py-5">
                    <div class="mb-3">
                        <i class="bi bi-calendar-x text-muted" style="font-size: 3rem;"></i>
                    </div>
                    <h5>Brak nadchodzących lekcji</h5>
                    <p class="text-muted">Student nie ma zaplanowanych żadnych lekcji.</p>
                    <button class="btn btn-primary mt-3" id="schedule-lesson-btn">
                        <i class="bi bi-calendar-plus me-1"></i> Zaplanuj lekcję
                    </button>
                </div>
            `
        }

        // This will be implemented when lessons functionality is available
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Nadchodzące lekcje</h5>
                    <button class="btn btn-sm btn-outline-primary" id="schedule-lesson-btn">
                        <i class="bi bi-calendar-plus me-1"></i> Zaplanuj lekcję
                    </button>
                </div>
                <div class="card-body">
                    <p class="text-muted text-center py-3">Lista nadchodzących lekcji będzie dostępna w przyszłych wersjach.</p>
                </div>
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
                    <h5 class="mb-0">Historia lekcji</h5>
                </div>
                <div class="card-body">
                    <p class="text-muted text-center py-3">Historia lekcji będzie dostępna w przyszłych wersjach.</p>
                </div>
            </div>
        `
    }

    private async handleDeleteClick(e: Event): Promise<void> {
        e.preventDefault()

        if (!this.studentId) return

        if (!confirm('Czy na pewno chcesz usunąć tego studenta? Tej operacji nie można cofnąć.')) {
            return
        }

        try {
            await this.studentService.deleteStudent(this.studentId)

            // Redirect to students list
            window.location.href = '/admin/students'
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
        // This can be used to load additional data when switching tabs
        const target = e.target as HTMLElement
        const tabId = target.getAttribute('data-bs-target')

        if (tabId === '#lessons-tab-pane') {
            // Load lessons data if needed
            console.log('Lessons tab activated')
        } else if (tabId === '#stats-tab-pane') {
            // Load stats data if needed
            console.log('Stats tab activated')
        }
    }
}

// Initialize on document load
