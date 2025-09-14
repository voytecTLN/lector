// resources/ts/components/tutors/TutorList.ts
import type { RouteComponent } from '@router/routes'
import { TutorService } from '@services/TutorService'
import type { User, PaginatedResponse, TutorFilters } from '@/types/models'
import { navigate } from '@/utils/navigation'
import { AvatarHelper } from '@/utils/AvatarHelper'

export class TutorList implements RouteComponent {
    private tutorService: TutorService
    private container: HTMLElement | null = null
    private tutors: User[] = []
    private currentPage: number = 1
    private totalPages: number = 1
    private isLoading: boolean = false
    private searchTimeout: number | null = null
    private filters: TutorFilters = {
        search: '',
        status: undefined,
        city: '',
        language: '',
        specialization: '',
        verification_status: undefined,
        is_verified: undefined,
        is_accepting_students: undefined,
        page: 1,
        per_page: 100
    }

    constructor() {
        this.tutorService = new TutorService()
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'tutor-list-page'
        el.innerHTML = `
            <div class="container-fluid">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 class="mb-1">Zarządzanie Lektorami</h2>
                        <p class="text-muted mb-0">Lista wszystkich lektorów w systemie</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-primary" id="add-tutor-btn">
                            <i class="bi bi-plus-circle me-1"></i> Dodaj Lektora
                        </button>
                    </div>
                </div>

                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <form id="tutor-filters" class="row g-3">
                            <div class="col-md-2">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="status-filter">
                                    <option value="">Wszystkie</option>
                                    <option value="active">Aktywni</option>
                                    <option value="inactive">Nieaktywni</option>
                                    <option value="blocked">Zablokowani</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Weryfikacja</label>
                                <select class="form-select" id="verification-filter">
                                    <option value="">Wszystkie</option>
                                    <option value="pending">Oczekująca</option>
                                    <option value="approved">Zatwierdzona</option>
                                    <option value="rejected">Odrzucona</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Język</label>
                                <select class="form-select" id="language-filter">
                                    <option value="">Wszystkie</option>
                                    <option value="english">Angielski</option>
                                    <option value="german">Niemiecki</option>
                                    <option value="french">Francuski</option>
                                    <option value="spanish">Hiszpański</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Miasto</label>
                                <input type="text" class="form-control" id="city-input" placeholder="np. Warszawa">
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Na stronie</label>
                                <select class="form-select" id="per-page-select">
                                    <option value="15">15</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Szukaj</label>
                                <input type="text" class="form-control" id="search-input" 
                                       placeholder="Imię, nazwisko lub email">
                            </div>
                            <div class="col-12">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-funnel me-1"></i> Filtruj
                                </button>
                                <button type="button" class="btn btn-outline-secondary reset-filters ms-2" id="clear-filters-btn">
                                    <i class="bi bi-x-circle me-1"></i> Resetuj
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="row mb-4" id="stats-cards">
                    <div class="col-md-3">
                        <div class="card border-primary">
                            <div class="card-body text-center">
                                <div class="display-6 text-primary" id="total-tutors">0</div>
                                <small class="text-muted">Łącznie lektorów</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-success">
                            <div class="card-body text-center">
                                <div class="display-6 text-success" id="active-tutors">0</div>
                                <small class="text-muted">Aktywni</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-info">
                            <div class="card-body text-center">
                                <div class="display-6 text-info" id="verified-tutors">0</div>
                                <small class="text-muted">Zweryfikowani</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-warning">
                            <div class="card-body text-center">
                                <div class="display-6 text-warning" id="accepting-tutors">0</div>
                                <small class="text-muted">Przyjmują studentów</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <div class="card">
                    <div class="card-body">
                        <!-- Loading -->
                        <div id="loading" class="text-center py-4 d-none">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Ładowanie...</span>
                            </div>
                            <p class="mt-2 text-muted">Ładowanie lektorów...</p>
                        </div>

                        <!-- Table -->
                        <div id="tutors-table-container">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Imię i nazwisko</th>
                                            <th>Email</th>
                                            <th>Języki</th>
                                            <th>Status</th>
                                            <th>Weryfikacja</th>
                                            <th>Przyjmuje studentów</th>
                                            <th class="text-end">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tutors-table-body">
                                        <!-- Tutors will be populated here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Pagination -->
                        <div id="pagination-container" class="d-flex justify-content-between align-items-center mt-4">
                            <div class="text-muted" id="pagination-info">
                                Wyświetlanie 0-0 z 0 lektorów
                            </div>
                            <nav aria-label="Nawigacja lektorów">
                                <ul class="pagination mb-0" id="pagination">
                                    <!-- Pagination will be populated here -->
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        `
        return el
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.setupEventListeners()
        this.loadTutors()
        this.loadStats()
    }

    unmount(): void {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout)
        }
        this.container = null
    }

    private setupEventListeners(): void {
        if (!this.container) return

        // Form submission for filters
        const filtersForm = this.container.querySelector('#tutor-filters') as HTMLFormElement
        filtersForm?.addEventListener('submit', (e) => {
            e.preventDefault()
            this.applyFilters()
        })

        // Search input with debounce
        const searchInput = this.container.querySelector('#search-input') as HTMLInputElement
        searchInput?.addEventListener('input', (e) => {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout)
            }
            this.searchTimeout = window.setTimeout(() => {
                this.filters.search = (e.target as HTMLInputElement).value
                this.filters.page = 1
                this.loadTutors()
            }, 500)
        })

        // Clear filters
        const clearFiltersBtn = this.container.querySelector('#clear-filters-btn')
        clearFiltersBtn?.addEventListener('click', () => {
            this.clearFilters()
        })

        // Add tutor button
        const addTutorBtn = this.container.querySelector('#add-tutor-btn')
        addTutorBtn?.addEventListener('click', () => {
            navigate.to('/admin/dashboard?section=dodaj-lektora')
        })

        // Event delegation for action buttons and pagination
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            const button = target.closest('button')
            
            if (!button) return

            // Handle action buttons
            const action = button.getAttribute('data-action')
            const tutorId = button.getAttribute('data-tutor-id')
            
            if (action && tutorId) {
                e.preventDefault()
                this.handleAction(action, parseInt(tutorId))
                return
            }

            // Handle pagination
            const page = button.getAttribute('data-page')
            if (page) {
                e.preventDefault()
                this.goToPage(parseInt(page))
                return
            }
        })
    }

    private async loadTutors(): Promise<void> {
        if (this.isLoading) return

        this.isLoading = true
        this.showLoading(true)

        try {
            const response = await this.tutorService.getTutors(this.filters)
            this.tutors = response.data
            this.currentPage = response.current_page
            this.totalPages = response.last_page

            this.renderTutorsTable()
            this.renderPagination(response)

        } catch (error) {
            console.error('Failed to load tutors:', error)
            this.showError('Nie udało się załadować listy lektorów')
        } finally {
            this.isLoading = false
            this.showLoading(false)
        }
    }

    private async loadStats(): Promise<void> {
        try {
            const stats = await this.tutorService.getTutorStats()
            this.updateStatsCards(stats)
        } catch (error) {
            console.error('Failed to load tutor stats:', error)
        }
    }

    private updateStatsCards(stats: any): void {
        const updateStat = (id: string, value: number) => {
            const el = this.container?.querySelector(`#${id}`)
            if (el) el.textContent = value.toString()
        }

        updateStat('total-tutors', stats.total || 0)
        updateStat('active-tutors', stats.active || 0)
        updateStat('verified-tutors', stats.verified || 0)
        updateStat('accepting-tutors', stats.accepting_students || 0)
    }

    private renderTutorsTable(): void {
        const tbody = this.container?.querySelector('#tutors-table-body')
        if (!tbody) return

        if (this.tutors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-inbox display-4 d-block mb-2"></i>
                        Brak lektorów do wyświetlenia
                    </td>
                </tr>
            `
            return
        }

        tbody.innerHTML = this.tutors.map(tutor => {
            const profile = tutor.tutor_profile
            const avatarHtml = AvatarHelper.render({
                name: tutor.name,
                avatar: tutor.avatar,
                size: 'md',
                userId: tutor.id
            })
            
            return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="me-2">
                            ${avatarHtml}
                        </div>
                        <div>
                            <div class="fw-semibold">${tutor.name}</div>
                            <small class="text-muted">${tutor.city || ''}</small>
                        </div>
                    </div>
                </td>
                <td>${tutor.email}</td>
                <td>
                    ${profile ? this.tutorService.formatLanguageNames(profile.languages || []) : '-'}
                </td>
                <td>${this.getStatusBadge(tutor.status)}</td>
                <td>${this.getVerificationBadge(profile?.verification_status, profile?.is_verified)}</td>
                <td>
                    ${profile?.is_accepting_students ? 
                        '<span class="badge bg-success">Tak</span>' : 
                        '<span class="badge bg-secondary">Nie</span>'
                    }
                </td>
                <td class="text-end">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-primary" 
                                data-action="view" data-tutor-id="${tutor.id}"
                                title="Zobacz szczegóły">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" 
                                data-action="edit" data-tutor-id="${tutor.id}"
                                title="Edytuj">
                            <i class="bi bi-pencil"></i>
                        </button>
                        ${profile?.verification_status === 'pending' ? `
                        <button type="button" class="btn btn-sm btn-outline-success" 
                                data-action="verify" data-tutor-id="${tutor.id}"
                                title="Zweryfikuj">
                            <i class="bi bi-check-circle"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `}).join('')
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

    private renderPagination(response: PaginatedResponse<User[]>): void {
        const paginationInfo = this.container?.querySelector('#pagination-info')
        const pagination = this.container?.querySelector('#pagination')

        if (!paginationInfo || !pagination) return

        const start = ((response.current_page - 1) * response.per_page) + 1
        const end = Math.min(start + response.per_page - 1, response.total)

        paginationInfo.textContent = `Wyświetlanie ${start}-${end} z ${response.total} lektorów`

        if (response.last_page <= 1) {
            pagination.innerHTML = ''
            return
        }

        let paginationHTML = ''

        // Previous button
        if (response.current_page > 1) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" data-page="${response.current_page - 1}">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                </li>
            `
        }

        // Page numbers
        const startPage = Math.max(1, response.current_page - 2)
        const endPage = Math.min(response.last_page, response.current_page + 2)

        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" data-page="1">1</button>
                </li>
            `
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>'
            }
        }

        for (let page = startPage; page <= endPage; page++) {
            paginationHTML += `
                <li class="page-item ${page === response.current_page ? 'active' : ''}">
                    <button class="page-link" data-page="${page}">${page}</button>
                </li>
            `
        }

        if (endPage < response.last_page) {
            if (endPage < response.last_page - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>'
            }
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" data-page="${response.last_page}">${response.last_page}</button>
                </li>
            `
        }

        // Next button
        if (response.current_page < response.last_page) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" data-page="${response.current_page + 1}">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </li>
            `
        }

        pagination.innerHTML = paginationHTML
    }

    private applyFilters(): void {
        const statusValue = (this.container?.querySelector('#status-filter') as HTMLSelectElement)?.value
        const verificationValue = (this.container?.querySelector('#verification-filter') as HTMLSelectElement)?.value
        const languageValue = (this.container?.querySelector('#language-filter') as HTMLSelectElement)?.value
        const cityValue = (this.container?.querySelector('#city-input') as HTMLInputElement)?.value
        const searchValue = (this.container?.querySelector('#search-input') as HTMLInputElement)?.value
        const perPageValue = (this.container?.querySelector('#per-page-select') as HTMLSelectElement)?.value

        // Update filters
        this.filters.status = statusValue === '' ? undefined : statusValue as 'active' | 'inactive' | 'blocked'
        this.filters.verification_status = verificationValue === '' ? undefined : verificationValue as 'pending' | 'approved' | 'rejected'
        this.filters.language = languageValue || ''
        this.filters.city = cityValue || ''
        this.filters.search = searchValue || ''
        this.filters.per_page = parseInt(perPageValue) || 15
        this.filters.page = 1

        this.loadTutors()
    }

    private clearFilters(): void {
        this.filters = {
            search: '',
            status: undefined,
            city: '',
            language: '',
            specialization: '',
            verification_status: undefined,
            is_verified: undefined,
            is_accepting_students: undefined,
            page: 1,
            per_page: 100
        }

        // Reset form elements
        const searchInput = this.container?.querySelector('#search-input') as HTMLInputElement
        const statusFilter = this.container?.querySelector('#status-filter') as HTMLSelectElement
        const verificationFilter = this.container?.querySelector('#verification-filter') as HTMLSelectElement
        const languageFilter = this.container?.querySelector('#language-filter') as HTMLSelectElement
        const cityInput = this.container?.querySelector('#city-input') as HTMLInputElement
        const perPageSelect = this.container?.querySelector('#per-page-select') as HTMLSelectElement

        if (searchInput) searchInput.value = ''
        if (statusFilter) statusFilter.value = ''
        if (verificationFilter) verificationFilter.value = ''
        if (languageFilter) languageFilter.value = ''
        if (cityInput) cityInput.value = ''
        if (perPageSelect) perPageSelect.value = '15'

        this.loadTutors()
    }

    private showLoading(show: boolean): void {
        const loading = this.container?.querySelector('#loading')
        const tableContainer = this.container?.querySelector('#tutors-table-container')

        if (show) {
            loading?.classList.remove('d-none')
            tableContainer?.classList.add('d-none')
        } else {
            loading?.classList.add('d-none')
            tableContainer?.classList.remove('d-none')
        }
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

    private handleAction(action: string, tutorId: number): void {
        switch (action) {
            case 'view':
                navigate.to(`/admin/dashboard?section=tutor-details&tutor_id=${tutorId}`)
                break
            case 'edit':
                navigate.to(`/admin/dashboard?section=edytuj-lektora&tutor_id=${tutorId}`)
                break
            case 'verify':
                this.showVerificationModal(tutorId)
                break
        }
    }

    private showVerificationModal(tutorId: number): void {
        const tutor = this.tutors.find(t => t.id === tutorId)
        if (!tutor) return

        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="verificationModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Weryfikacja lektora</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <p><strong>Lektor:</strong> ${tutor.name}</p>
                                <p><strong>Email:</strong> ${tutor.email}</p>
                                <p><strong>Doświadczenie:</strong> ${tutor.tutor_profile?.years_experience || 0} lat</p>
                                <p><strong>Języki:</strong> ${tutor.tutor_profile ? this.tutorService.formatLanguageNames(tutor.tutor_profile.languages || []) : '-'}</p>
                                <p><strong>Specjalizacje:</strong> ${tutor.tutor_profile ? this.tutorService.formatSpecializationNames(tutor.tutor_profile.specializations || []) : '-'}</p>
                            </div>
                            
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
                await this.tutorService.verifyTutor(tutorId, approved, notes)
                
                this.showSuccess(approved ? 'Lektor został zweryfikowany' : 'Weryfikacja została odrzucona')
                
                // Close modal
                modal.hide()
                
                // Refresh list
                await this.loadTutors()
                
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

    private goToPage(page: number): void {
        this.filters.page = page
        this.loadTutors()
    }

    // Static instance for global access (kept for compatibility)
    static instance: TutorList | null = null
}