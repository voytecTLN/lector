// resources/ts/components/tutors/TutorDetails.ts
import type { RouteComponent } from '@router/routes'
import { TutorService } from '@services/TutorService'
import type { User } from '@/types/models'
import { navigate } from '@/utils/navigation'
import { AvailabilityCalendarReadonly } from '@components/tutor/AvailabilityCalendarReadonly'
import { TutorStudents } from '@components/dashboard/tutor/TutorStudents'
import { TutorLessons } from '@components/dashboard/tutor/TutorLessons'

export class TutorDetails implements RouteComponent {
    private tutorService: TutorService
    private container: HTMLElement | null = null
    private tutorId: number | null = null
    private tutor: User | null = null
    private activeTab: string = 'profile'
    private availabilityCalendar: AvailabilityCalendarReadonly | null = null
    private tutorStudents: TutorStudents | null = null
    private tutorLessons: TutorLessons | null = null

    constructor() {
        this.tutorService = new TutorService()
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'tutor-details-page'

        // Get tutor ID from URL
        const urlParams = new URLSearchParams(window.location.search)
        const tutorId = urlParams.get('tutor_id')

        if (!tutorId) {
            el.innerHTML = '<div class="alert alert-danger">Brak ID lektora</div>'
            return el
        }

        this.tutorId = parseInt(tutorId, 10)

        el.innerHTML = `
            <div class="container-fluid">
                <style>
                    .nav-tabs .nav-link {
                        border: none;
                        background: none;
                        cursor: pointer;
                    }
                    .nav-tabs .nav-link:hover {
                        border-color: transparent;
                    }
                    .verification-card {
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                    }
                    .verification-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }
                </style>
                
                <!-- Loading -->
                <div id="loading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Ładowanie...</span>
                    </div>
                    <p class="mt-2 text-muted">Ładowanie danych lektora...</p>
                </div>

                <!-- Content (hidden initially) -->
                <div id="content" class="d-none">
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-center mb-4" id="header">
                        <!-- Will be populated -->
                    </div>

                    <!-- Info Cards -->
                    <div class="row mb-4" id="info-cards">
                        <!-- Will be populated -->
                    </div>

                    <!-- Tabs -->
                    <div class="card">
                        <div class="card-header">
                            <ul class="nav nav-tabs card-header-tabs" id="tutor-tabs">
                                <li class="nav-item">
                                    <button class="nav-link active" type="button" data-tab="profile">
                                        <i class="bi bi-person me-1"></i> Profil
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link" type="button" data-tab="availability">
                                        <i class="bi bi-calendar-week me-1"></i> Dostępność
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link" type="button" data-tab="students">
                                        <i class="bi bi-people me-1"></i> Uczniowie
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link" type="button" data-tab="lessons">
                                        <i class="bi bi-book me-1"></i> Lekcje
                                    </button>
                                </li>
                                <!--
                                <li class="nav-item">
                                    <button class="nav-link" type="button" data-tab="statistics">
                                        <i class="bi bi-graph-up me-1"></i> Statystyki
                                    </button>
                                </li>
                                -->
                            </ul>
                        </div>
                        <div class="card-body" id="tab-content">
                            <!-- Tab content will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `

        return el
    }

    async mount(container: HTMLElement): Promise<void> {
        this.container = container
        // Set global instance for onclick handlers
        ;(window as any).currentTutorDetailsInstance = this
        await this.loadTutorData()
    }

    unmount(): void {
        this.container = null
        this.tutor = null
        // Clear global instance
        if ((window as any).currentTutorDetailsInstance === this) {
            ;(window as any).currentTutorDetailsInstance = null
        }
        if (this.availabilityCalendar) {
            this.availabilityCalendar.unmount()
            this.availabilityCalendar = null
        }
        if (this.tutorStudents) {
            this.tutorStudents = null
        }
        if (this.tutorLessons) {
            this.tutorLessons = null
        }
    }

    private async loadTutorData(): Promise<void> {
        if (!this.tutorId) return

        try {
            this.tutor = await this.tutorService.getTutorById(this.tutorId)
            this.renderContent()
            this.showContent()
        } catch (error) {
            console.error('Failed to load tutor:', error)
            this.showError('Nie udało się załadować danych lektora')
            navigate.to('/admin/dashboard?section=lektorzy')
        }
    }

    private renderContent(): void {
        if (!this.tutor) return

        // Render header
        this.renderHeader()

        // Render info cards
        this.renderInfoCards()

        // Render active tab
        this.renderTabContent(this.activeTab)
    }

    private renderHeader(): void {
        const header = this.container?.querySelector('#header')
        if (!header || !this.tutor) return

        const profile = this.tutor.tutor_profile

        header.innerHTML = `
            <div>
                <h2 class="mb-1">${this.tutor.name}</h2>
                <p class="text-muted mb-0">
                    <i class="bi bi-envelope me-1"></i> ${this.tutor.email}
                    ${this.tutor.phone ? `<i class="bi bi-phone ms-3 me-1"></i> ${this.tutor.phone}` : ''}
                    ${this.tutor.city ? `<i class="bi bi-geo-alt ms-3 me-1"></i> ${this.tutor.city}` : ''}
                </p>
            </div>
            <div class="d-flex gap-2">
                <a href="/admin/dashboard?section=edytuj-lektora&tutor_id=${this.tutor.id}" 
                   class="btn btn-outline-primary">
                    <i class="bi bi-pencil me-1"></i> Edytuj
                </a>
                ${profile?.verification_status === 'pending' ? `
                    <button class="btn btn-outline-success" id="verify-btn">
                        <i class="bi bi-check-circle me-1"></i> Weryfikuj
                    </button>
                ` : ''}
                <a href="/admin/dashboard?section=lektorzy" class="btn btn-outline-secondary">
                    <i class="bi bi-arrow-left me-1"></i> Powrót
                </a>
            </div>
        `

        // Add verify button listener if needed
        if (profile?.verification_status === 'pending') {
            const verifyBtn = this.container?.querySelector('#verify-btn')
            verifyBtn?.addEventListener('click', () => this.showVerificationModal())
        }
    }

    private renderInfoCards(): void {
        const infoCards = this.container?.querySelector('#info-cards')
        if (!infoCards || !this.tutor) return

        const profile = this.tutor.tutor_profile

        infoCards.innerHTML = `
            <div class="col-md-3">
                <div class="card border-primary">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Status</h6>
                        <div class="d-flex align-items-center">
                            ${this.getStatusBadge(this.tutor.status)}
                            <span class="ms-2">${this.getStatusLabel(this.tutor.status)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-info verification-card" onclick="window.currentTutorDetailsInstance?.showVerificationDetailsModal()">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Weryfikacja</h6>
                        <div class="d-flex align-items-center">
                            ${this.getVerificationBadge(profile?.verification_status, profile?.is_verified)}
                        </div>
                        ${profile?.verification_notes ? '<small class="text-muted mt-1"><i class="bi bi-chat-left-text"></i> Kliknij aby zobaczyć komentarz</small>' : ''}
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-success">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Doświadczenie</h6>
                        <div class="h5 mb-0">${profile?.years_experience || 0} lat</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-warning">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Przyjmuje studentów</h6>
                        <div class="d-flex align-items-center">
                            ${profile?.is_accepting_students ? 
                                '<i class="bi bi-check-circle text-success fs-4"></i> <span class="ms-2">Tak</span>' : 
                                '<i class="bi bi-x-circle text-danger fs-4"></i> <span class="ms-2">Nie</span>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private renderTabContent(tab: string): void {
        const tabContent = this.container?.querySelector('#tab-content')
        if (!tabContent) return

        // Clean up previous components if they exist
        if (this.availabilityCalendar) {
            this.availabilityCalendar.unmount()
            this.availabilityCalendar = null
        }
        if (this.tutorStudents) {
            this.tutorStudents = null
        }
        if (this.tutorLessons) {
            this.tutorLessons = null
        }

        switch (tab) {
            case 'profile':
                tabContent.innerHTML = this.getProfileContent()
                break
            case 'availability':
                tabContent.innerHTML = this.getAvailabilityContent()
                // Initialize the availability calendar after content is rendered
                setTimeout(() => {
                    const calendarContainer = this.container?.querySelector('#availability-calendar-readonly')
                    if (calendarContainer && this.tutorId) {
                        const weeklyLimit = this.tutor?.tutor_profile?.weekly_contract_limit || 40
                        this.availabilityCalendar = new AvailabilityCalendarReadonly(this.tutorId, weeklyLimit)
                        this.availabilityCalendar.mount(calendarContainer as HTMLElement)
                    }
                }, 0)
                break
            case 'students':
                tabContent.innerHTML = this.getStudentsContent()
                break
            case 'lessons':
                tabContent.innerHTML = this.getLessonsContent()
                break
            case 'statistics':
                tabContent.innerHTML = this.getStatisticsContent()
                break
        }
    }

    private getProfileContent(): string {
        if (!this.tutor || !this.tutor.tutor_profile) {
            return '<p class="text-muted">Brak danych profilu</p>'
        }

        const profile = this.tutor.tutor_profile

        return `
            <div class="row">
                <div class="col-lg-6">
                    <h5 class="mb-3">Informacje podstawowe</h5>
                    <table class="table table-borderless">
                        <tr>
                            <td class="text-muted">Imię i nazwisko:</td>
                            <td>${this.tutor.name}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Email:</td>
                            <td>${this.tutor.email}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Telefon:</td>
                            <td>${this.tutor.phone || '-'}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Miasto:</td>
                            <td>${this.tutor.city || '-'}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Data urodzenia:</td>
                            <td>${this.tutor.birth_date || '-'}</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Dołączył:</td>
                            <td>${new Date(this.tutor.created_at || '').toLocaleDateString('pl-PL')}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-lg-6">
                    <h5 class="mb-3">Kompetencje</h5>
                    <div class="mb-3">
                        <h6 class="text-muted">Języki:</h6>
                        <div>
                            ${profile.languages && profile.languages.length > 0 
                                ? profile.languages.map(lang => `<span class="badge bg-primary me-1">${this.tutorService.formatLanguageNames([lang])}</span>`).join('')
                                : '<span class="text-muted">Brak</span>'
                            }
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6 class="text-muted">Specjalizacje:</h6>
                        <div>
                            ${profile.specializations && profile.specializations.length > 0
                                ? profile.specializations.map(spec => `<span class="badge bg-info me-1">${this.tutorService.formatSpecializationNames([spec])}</span>`).join('')
                                : '<span class="text-muted">Brak</span>'
                            }
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6 class="text-muted">Typy lekcji:</h6>
                        <div>
                            ${profile.lesson_types && profile.lesson_types.length > 0
                                ? profile.lesson_types.map(type => `<span class="badge bg-secondary me-1">${this.tutorService.formatLessonTypeNames([type])}</span>`).join('')
                                : '<span class="text-muted">Brak</span>'
                            }
                        </div>
                    </div>
                </div>
            </div>

            ${profile.description ? `
                <hr>
                <h5 class="mb-3">Opis</h5>
                <p>${profile.description}</p>
            ` : ''}

            ${profile.certifications && profile.certifications.length > 0 ? `
                <hr>
                <h5 class="mb-3">Certyfikaty</h5>
                <ul>
                    ${profile.certifications.map(cert => `<li>${cert}</li>`).join('')}
                </ul>
            ` : ''}

            ${profile.education && this.hasEducationData(profile.education) ? `
                <hr>
                <h5 class="mb-3">Wykształcenie</h5>
                <ul>
                    ${this.renderEducationList(profile.education)}
                </ul>
            ` : ''}
        `
    }

    private hasEducationData(education: any): boolean {
        if (Array.isArray(education)) {
            return education.length > 0
        }
        if (typeof education === 'string') {
            return education.trim().length > 0
        }
        return false
    }

    private renderEducationList(education: any): string {
        if (Array.isArray(education)) {
            return education.map(edu => `<li>${edu}</li>`).join('')
        }
        if (typeof education === 'string' && education.trim().length > 0) {
            return `<li>${education}</li>`
        }
        return ''
    }

    private getAvailabilityContent(): string {
        const profile = this.tutor?.tutor_profile
        const weeklyLimit = profile?.weekly_contract_limit || 40
        
        return `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="bi bi-clock me-2"></i>
                                Limit godzin tygodniowo
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="display-4 text-primary me-3">${weeklyLimit}</div>
                                <div>
                                    <div class="text-muted">godzin tygodniowo</div>
                                    <small class="text-muted">Limit kontraktowy</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="bi bi-calendar-check me-2"></i>
                                Status dostępności
                            </h5>
                        </div>
                        <div class="card-body">
                            <p class="mb-0">
                                ${profile?.is_accepting_students 
                                    ? '<span class="badge bg-success">Przyjmuje nowych uczniów</span>' 
                                    : '<span class="badge bg-secondary">Nie przyjmuje nowych uczniów</span>'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-4">
                <div id="availability-calendar-readonly"></div>
            </div>
        `
    }

    private getStudentsContent(): string {
        if (!this.tutorStudents) {
            this.tutorStudents = new TutorStudents(this.tutorId || undefined)
        }
        
        // Return the students content from TutorStudents component
        return this.tutorStudents.getStudentsContent()
    }

    private getLessonsContent(): string {
        if (!this.tutorLessons) {
            this.tutorLessons = new TutorLessons(this.tutorId || undefined)
        }
        
        // Set global instance for static methods
        ;(window as any).currentTutorLessonsInstance = this.tutorLessons
        
        // Return the lessons content from TutorLessons component
        return this.tutorLessons.getCalendarContent()
    }

    private getStatisticsContent(): string {
        const profile = this.tutor?.tutor_profile
        return `
            <div class="row">
                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-body">
                            <div class="display-4 text-primary">${profile?.total_lessons || 0}</div>
                            <p class="text-muted mb-0">Przeprowadzone lekcje</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-body">
                            <div class="display-4 text-success">${profile?.total_students || 0}</div>
                            <p class="text-muted mb-0">Unikalnych studentów</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-body">
                            <div class="display-4 text-warning">${profile?.average_rating || 0}/5</div>
                            <p class="text-muted mb-0">Średnia ocena</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-4 text-center">
                <p class="text-muted">Szczegółowe statystyki będą dostępne wkrótce</p>
            </div>
        `
    }

    private setupEventListeners(): void {
        if (!this.container) return

        // Tab navigation
        const tabs = this.container.querySelectorAll('[data-tab]')
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = (e.currentTarget as HTMLElement).getAttribute('data-tab')
                if (tabName && tabName !== this.activeTab) {
                    this.switchTab(tabName)
                }
            })
        })
    }

    private switchTab(tabName: string): void {
        // Update active tab
        this.activeTab = tabName

        // Update tab UI
        const tabs = this.container?.querySelectorAll('[data-tab]')
        tabs?.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active')
            } else {
                tab.classList.remove('active')
            }
        })

        // Render new content
        this.renderTabContent(tabName)
    }

    private showContent(): void {
        const loading = this.container?.querySelector('#loading')
        const content = this.container?.querySelector('#content')

        loading?.classList.add('d-none')
        content?.classList.remove('d-none')
        
        // Setup event listeners after content is visible
        this.setupEventListeners()
    }

    private getStatusBadge(status: string | undefined): string {
        switch (status) {
            case 'active':
                return '<span class="badge bg-success">Aktywny</span>'
            case 'inactive':
                return '<span class="badge bg-warning">Nieaktywny</span>'
            case 'blocked':
                return '<span class="badge bg-danger">Zablokowany</span>'
            default:
                return '<span class="badge bg-secondary">Nieznany</span>'
        }
    }

    private getStatusLabel(status: string | undefined): string {
        switch (status) {
            case 'active': return 'Aktywny'
            case 'inactive': return 'Nieaktywny'
            case 'blocked': return 'Zablokowany'
            default: return 'Nieznany'
        }
    }

    private getVerificationBadge(status: string | undefined, isVerified: boolean | undefined): string {
        if (isVerified) {
            return '<span class="badge bg-success">Zweryfikowany</span>'
        }
        
        switch (status) {
            case 'pending':
                return '<span class="badge bg-warning">Oczekująca</span>'
            case 'approved':
                return '<span class="badge bg-success">Zatwierdzona</span>'
            case 'rejected':
                return '<span class="badge bg-danger">Odrzucona</span>'
            default:
                return '<span class="badge bg-secondary">Nieznany</span>'
        }
    }

    showVerificationDetailsModal(): void {
        // Show modal with verification details
        if (!this.tutor || !this.tutor.tutor_profile) return

        const profile = this.tutor.tutor_profile
        const verifiedAt = profile.verified_at ? new Date(profile.verified_at).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : null

        const modalHtml = `
            <div class="modal fade" id="verificationDetailsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-shield-check me-2"></i>
                                Szczegóły weryfikacji
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="text-muted small">Status weryfikacji</label>
                                <div class="d-flex align-items-center mt-1">
                                    ${this.getVerificationBadge(profile.verification_status, profile.is_verified)}
                                    ${verifiedAt ? `<span class="text-muted ms-2 small">${verifiedAt}</span>` : ''}
                                </div>
                            </div>

                            ${profile.verification_notes ? `
                                <div class="mb-3">
                                    <label class="text-muted small">Komentarz weryfikacji</label>
                                    <div class="card mt-1">
                                        <div class="card-body">
                                            <p class="mb-0">${profile.verification_notes}</p>
                                        </div>
                                    </div>
                                </div>
                            ` : `
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    Brak komentarza weryfikacji
                                </div>
                            `}

                            <div class="mb-3">
                                <label class="text-muted small">Informacje dodatkowe</label>
                                <table class="table table-sm table-borderless mt-1">
                                    <tr>
                                        <td class="text-muted">Lektor:</td>
                                        <td>${this.tutor.name}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-muted">Email:</td>
                                        <td>${this.tutor.email}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-muted">Doświadczenie:</td>
                                        <td>${profile.years_experience || 0} lat</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>
                                Zamknij
                            </button>
                            ${profile.verification_status === 'pending' ? `
                                <button type="button" class="btn btn-primary" onclick="window.currentTutorDetailsInstance?.closeVerificationDetailsAndOpenVerification()">
                                    <i class="bi bi-check-circle me-1"></i>
                                    Weryfikuj lektora
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `

        // Remove existing modal if any
        const existingModal = document.getElementById('verificationDetailsModal')
        if (existingModal) {
            existingModal.remove()
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml)

        // Get modal element
        const modalElement = document.getElementById('verificationDetailsModal') as HTMLElement

        // Initialize Bootstrap modal
        const modal = new (window as any).bootstrap.Modal(modalElement)

        // Clean up when modal is hidden
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove()
        })

        // Show modal
        modal.show()
    }

    closeVerificationDetailsAndOpenVerification(): void {
        // Close the details modal
        const detailsModal = document.getElementById('verificationDetailsModal')
        if (detailsModal) {
            const bsModal = (window as any).bootstrap.Modal.getInstance(detailsModal)
            if (bsModal) {
                bsModal.hide()
            }
        }
        // Wait a moment then open verification modal
        setTimeout(() => {
            this.showVerificationModal()
        }, 300)
    }

    private showVerificationModal(): void {
        // Reuse the modal from TutorList but as a method here
        if (!this.tutorId || !this.tutor) return

        const modalHtml = `
            <div class="modal fade" id="verificationModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Weryfikacja lektora</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="verificationForm">
                                <div class="mb-3">
                                    <label class="form-label">Decyzja <span class="text-danger">*</span></label>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="approved" value="true" id="approveRadio" required>
                                        <label class="form-check-label" for="approveRadio">
                                            <i class="bi bi-check-circle text-success"></i> Zatwierdź weryfikację
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="approved" value="false" id="rejectRadio" required>
                                        <label class="form-check-label" for="rejectRadio">
                                            <i class="bi bi-x-circle text-danger"></i> Odrzuć weryfikację
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Notatki (opcjonalne)</label>
                                    <textarea class="form-control" name="notes" rows="3" 
                                              placeholder="Dodaj notatki o weryfikacji..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Anuluj</button>
                            <button type="button" class="btn btn-primary" id="submitVerification">
                                <i class="bi bi-check-circle me-1"></i> Potwierdź
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `

        // Remove existing modal if any
        const existingModal = document.getElementById('verificationModal')
        if (existingModal) {
            existingModal.remove()
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml)

        // Get modal elements
        const modalElement = document.getElementById('verificationModal') as HTMLElement
        const form = document.getElementById('verificationForm') as HTMLFormElement
        const submitBtn = document.getElementById('submitVerification') as HTMLButtonElement

        // Initialize Bootstrap modal
        const modal = new (window as any).bootstrap.Modal(modalElement)

        // Handle submit
        submitBtn.addEventListener('click', async () => {
            if (!form.checkValidity()) {
                form.reportValidity()
                return
            }

            const formData = new FormData(form)
            const approved = formData.get('approved') === 'true'
            const notes = formData.get('notes') as string

            submitBtn.disabled = true
            submitBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-1"></i> Przetwarzanie...'

            try {
                await this.tutorService.verifyTutor(this.tutorId!, approved, notes)
                
                this.showSuccess(approved ? 'Lektor został zweryfikowany' : 'Weryfikacja została odrzucona')
                
                // Close modal
                modal.hide()
                
                // Reload tutor data
                await this.loadTutorData()
                
            } catch (error) {
                console.error('Verification error:', error)
                this.showError('Błąd podczas weryfikacji lektora')
            } finally {
                submitBtn.disabled = false
                submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Potwierdź'
            }
        })

        // Clean up when modal is hidden
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove()
        })

        // Show modal
        modal.show()
    }

    private showError(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'error',
                message: message
            }
        }))
    }

    private showSuccess(message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'success',
                message: message
            }
        }))
    }
}